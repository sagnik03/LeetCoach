// LeetCoach Content Script

console.log('LeetCoach Content Script loaded.');

// Helper to inject code into the page context (needed to access Monaco Editor API)
function injectScript() {
  const scriptContent = `
    (function() {
      // Listen for custom requests from the content script
      window.addEventListener('LeetCoach:RequestPageData', () => {
        try {
          let code = '';
          let language = 'javascript'; // default fallback

          // Retrieve code from Monaco Editor
          if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
              // Find the model containing LeetCode editor content
              // Typically, the main code editor model is the first one or contains the code
              code = models[0].getValue();
            }
          }

          // If Monaco is not accessible, attempt to find code from textareas or DOM attributes
          if (!code) {
            const editorTextarea = document.querySelector('.monaco-editor textarea');
            if (editorTextarea) {
              code = (editorTextarea as any).value || '';
            }
          }

          // Try to detect language from class list or drop-downs
          const langBtn = document.querySelector('button[id*="lang-select"]');
          if (langBtn) {
            language = langBtn.textContent?.trim().toLowerCase() || language;
          }

          // Dispatch results back to Content Script
          window.dispatchEvent(new CustomEvent('LeetCoach:ResponsePageData', {
            detail: { code, language }
          }));
        } catch (e) {
          console.error('LeetCoach: Error extracting code in page context', e);
        }
      });
    })();
  `;

  const script = document.createElement('script');
  script.textContent = scriptContent;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// Initialize injection
injectScript();

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

  // Look for the accepted element: e.g. green success checkmarks or badge classes
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

  // Request code/language from injected page context script
  window.addEventListener('LeetCoach:ResponsePageData', (event: any) => {
    const { code, language } = event.detail;
    
    const problemMetadata = extractProblemMetadata();
    
    const syncData = {
      ...problemMetadata,
      code,
      language,
      status: 'Accepted'
    };

    // Send to background service worker
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
  }, { once: true });

  // Dispatch request event
  window.dispatchEvent(new CustomEvent('LeetCoach:RequestPageData'));
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
