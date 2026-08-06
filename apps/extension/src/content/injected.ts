// LeetCoach Main World Injected Script
// Executes inside LeetCode's page window context (MAIN world) to access Monaco Editor API safely without violating CSP.

(function() {
  window.addEventListener('LeetCoach:RequestPageData', () => {
    try {
      let code = '';
      let language = 'javascript';

      // 1. Try Monaco Editor API
      if ((window as any).monaco && (window as any).monaco.editor) {
        const models = (window as any).monaco.editor.getModels();
        if (models && models.length > 0) {
          let bestModel = models[0];
          for (const model of models) {
            if (model.getValue().length > bestModel.getValue().length) {
              bestModel = model;
            }
          }
          code = bestModel.getValue();
        }
      }

      // 2. Try language detection
      const langBtn = document.querySelector('button[id*="lang-select"], [class*="lang"]');
      if (langBtn) {
        language = langBtn.textContent?.trim().toLowerCase() || language;
      }

      window.dispatchEvent(new CustomEvent('LeetCoach:ResponsePageData', {
        detail: { code, language }
      }));
    } catch (e) {
      console.error('LeetCoach: Error extracting code in page context', e);
      window.dispatchEvent(new CustomEvent('LeetCoach:ResponsePageData', {
        detail: { code: '', language: 'javascript' }
      }));
    }
  });
})();
