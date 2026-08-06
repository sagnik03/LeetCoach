// LeetCoach Content Script

console.log('LeetCoach Content Script loaded.');

function extractCodeFromDOM(): { code: string; language: string } {
  let code = '';
  let language = 'javascript';

  // Extract from visible view lines in Monaco editor DOM
  const viewLines = document.querySelectorAll('.monaco-editor .view-line');
  if (viewLines && viewLines.length > 0) {
    const lines: string[] = [];
    viewLines.forEach((el) => {
      lines.push(el.textContent || '');
    });
    code = lines.join('\n');
  }

  if (!code) {
    const textarea = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
    if (textarea && textarea.value) {
      code = textarea.value;
    }
  }

  const langBtn = document.querySelector('button[id*="lang-select"], [class*="lang"]');
  if (langBtn) {
    language = langBtn.textContent?.trim().toLowerCase() || language;
  }

  return { code, language };
}

// Monitor DOM for submission result
let isChecking = false;

const observer = new MutationObserver(() => {
  if (isChecking) return;

  // Search for common LeetCode success indicators in DOM
  const successIndicator = findSuccessIndicator();
  if (successIndicator) {
    isChecking = true;
    handleSuccessState();
    
    // Cool down to prevent double triggers on fast page modifications
    setTimeout(() => {
      isChecking = false;
    }, 5000);
  }
});

// Start observing the body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

function findSuccessIndicator(): boolean {
  // 1. New LeetCode Layout: Look for dynamic attributes or success text
  const submissionResult = document.querySelector('[data-e2e-locator="submission-result"]');
  if (submissionResult) {
    const text = submissionResult.textContent?.trim();
    if (text === 'Accepted') return true;
  }

  // Fallback: search for elements with "Accepted" style or status
  const acceptedBadges = document.querySelectorAll('.text-green-500, .text-green-s, [class*="success"]');
  for (const badge of Array.from(acceptedBadges)) {
    if (badge.textContent?.trim() === 'Accepted') {
      return true;
    }
  }

  return false;
}

function handleSuccessState() {
  console.log('LeetCoach: Detected successful LeetCode submission!');

  let responded = false;

  const onResponse = (event: any) => {
    if (responded) return;
    responded = true;
    const { code, language } = event.detail;
    
    const finalData = (code && code.trim()) ? { code, language } : extractCodeFromDOM();
    sendSyncMessage(finalData);
  };

  window.addEventListener('LeetCoach:ResponsePageData', onResponse, { once: true });

  // Dispatch request event to MAIN world script
  window.dispatchEvent(new CustomEvent('LeetCoach:RequestPageData'));

  // Timeout fallback to DOM extraction if MAIN world event doesn't respond
  setTimeout(() => {
    if (!responded) {
      responded = true;
      console.log('LeetCoach: Falling back to DOM code extraction...');
      sendSyncMessage(extractCodeFromDOM());
    }
  }, 300);
}

function sendSyncMessage(extracted: { code: string; language: string }) {
  const problemMetadata = extractProblemMetadata();
  const syncData = {
    ...problemMetadata,
    code: extracted.code,
    language: extracted.language,
    status: 'Accepted'
  };

  chrome.runtime.sendMessage({
    type: 'SUBMISSION_ACCEPTED',
    data: syncData
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('LeetCoach background communication error:', chrome.runtime.lastError);
    } else {
      console.log('LeetCoach sync outcome:', response);
    }
  });
}

function extractProblemMetadata() {
  const url = window.location.href;
  const pathParts = window.location.pathname.split('/');
  
  // URL structure: https://leetcode.com/problems/two-sum/submissions/
  const problemIndex = pathParts.indexOf('problems');
  const titleSlug = problemIndex !== -1 && pathParts[problemIndex + 1]
    ? pathParts[problemIndex + 1]
    : 'unknown';

  // Extract Title from DOM
  const titleEl = document.querySelector('.text-title-large, h4, [data-cy="question-title"]');
  let title = titleEl?.textContent?.trim() || '';
  if (title) {
    // Strip problem number if prefix exists (e.g. "1. Two Sum" -> "Two Sum")
    title = title.replace(/^\d+\.\s*/, '');
  } else {
    title = titleSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Extract Difficulty from DOM
  let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'; // default fallback
  const difficultyEl = document.querySelector('.text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard, [class*="bg-yellow-"], [class*="bg-green-"], [class*="bg-red-"]');
  if (difficultyEl) {
    const text = difficultyEl.textContent?.trim().toLowerCase();
    if (text?.includes('easy')) difficulty = 'Easy';
    else if (text?.includes('medium')) difficulty = 'Medium';
    else if (text?.includes('hard')) difficulty = 'Hard';
  }

  // Extract Topic Tags from DOM
  const topicTags: string[] = [];
  const tagElements = document.querySelectorAll('a[href*="/tag/"]');
  tagElements.forEach(el => {
    const tagText = el.textContent?.trim();
    if (tagText && !topicTags.includes(tagText)) {
      topicTags.push(tagText);
    }
  });

  // Extract LeetCode ID from title element or URL (fallback)
  let leetcodeId = 0;
  const idEl = document.querySelector('.text-title-large, [data-cy="question-title"]');
  const idText = idEl?.textContent?.trim().split('.')[0];
  if (idText && !isNaN(Number(idText))) {
    leetcodeId = Number(idText);
  }

  return {
    leetcodeId,
    title,
    titleSlug,
    difficulty,
    url,
    topicTags
  };
}
