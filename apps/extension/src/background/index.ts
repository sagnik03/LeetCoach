// LeetCoach background service worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetCoach Extension successfully installed!');
  // Set default state
  chrome.storage.local.set({
    token: null,
    user: null,
    settings: {
      primaryModel: 'Gemini 1.5 Flash',
    }
  });
});

// Configure side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error configuring side panel behavior:', error));

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message, 'from sender:', sender);

  if (message.type === 'SUBMISSION_ACCEPTED') {
    handleSubmissionAccepted(message.data)
      .then((result) => {
        // Broadcast event to sidepanel
        chrome.runtime.sendMessage({ type: 'PROBLEM_SYNCED', data: result }).catch(() => {});
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        console.error('Error syncing submission:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message port open for async response
  }

  if (message.type === 'SYNC_PENDING_QUEUE') {
    syncPendingQueue()
      .then((res) => sendResponse({ success: true, res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function syncPendingQueue() {
  const storage = await chrome.storage.local.get(['token', 'submissionsQueue']);
  const { token, submissionsQueue } = storage;
  if (!token || !submissionsQueue || submissionsQueue.length === 0) return;

  console.log(`Syncing ${submissionsQueue.length} pending submissions from local queue...`);
  const remainingQueue = [];

  for (const item of submissionsQueue) {
    try {
      const response = await fetch('http://localhost:3000/api/problems/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(item)
      });
      if (!response.ok) {
        remainingQueue.push(item);
      }
    } catch (e) {
      remainingQueue.push(item);
    }
  }

  await chrome.storage.local.set({ submissionsQueue: remainingQueue });
  chrome.runtime.sendMessage({ type: 'PROBLEM_SYNCED' }).catch(() => {});
}

async function handleSubmissionAccepted(data: any) {
  console.log('Scraped submission accepted data:', data);
  
  // Retrieve token
  const storage = await chrome.storage.local.get(['token', 'submissionsQueue']);
  const token = storage.token;

  // Store in local backup queue in case backend is offline or unauthenticated
  const submissionsQueue = storage.submissionsQueue || [];
  submissionsQueue.push({ ...data, timestamp: Date.now() });
  await chrome.storage.local.set({ submissionsQueue });

  if (!token) {
    console.warn('User not authenticated. Saved to local sync queue.');
    return { status: 'queued_locally' };
  }

  // If backend is configured, sync to it
  try {
    const API_URL = 'http://localhost:3000/api/problems/sync'; // local dev default
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Sync API returned ${response.status}`);
    }

    const result = await response.json();
    console.log('Submission successfully synced with backend:', result);

    // Remove from local queue if successful
    const updatedQueue = (await chrome.storage.local.get('submissionsQueue')).submissionsQueue || [];
    const index = updatedQueue.findIndex((item: any) => item.leetcodeId === data.leetcodeId && item.code === data.code);
    if (index > -1) {
      updatedQueue.splice(index, 1);
      await chrome.storage.local.set({ submissionsQueue: updatedQueue });
    }

    return { status: 'synced', result };
  } catch (error: any) {
    console.error('Failed to sync submission with backend. Kept in queue.', error);
    return { status: 'sync_failed', error: error.message };
  }
}
