// Global loading overlay controller
(function () {
  let overlay = null;
  let loadingText = null;
  let subText = null;

  function createOverlay() {
    if (overlay) return;
    
    overlay = document.createElement('div');
    overlay.className = 'global-loading-overlay';
    overlay.id = 'globalLoadingOverlay';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    loadingText = document.createElement('div');
    loadingText.className = 'loading-text';
    loadingText.textContent = 'Loading...';
    
    subText = document.createElement('div');
    subText.className = 'loading-subtext';
    
    overlay.appendChild(spinner);
    overlay.appendChild(loadingText);
    overlay.appendChild(subText);
    
    document.body.appendChild(overlay);
  }

  function show(text = 'Loading...', subtitle = '') {
    createOverlay();
    loadingText.textContent = text;
    subText.textContent = subtitle;
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
  }

  function hide() {
    if (overlay) {
      overlay.classList.remove('show');
    }
  }

  // Expose global API
  window.LoadingOverlay = {
    show,
    hide
  };

  // Auto-create on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
  } else {
    createOverlay();
  }
})();

// Enhanced fetch wrapper with loading overlay
window.fetchWithLoading = async function(url, options = {}, showLoading = true, loadingText = 'Loading...') {
  if (showLoading) {
    window.LoadingOverlay.show(loadingText);
  }
  
  try {
    const response = await fetch(url, options);
    return response;
  } finally {
    if (showLoading) {
      window.LoadingOverlay.hide();
    }
  }
};
