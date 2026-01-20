// Global page transition controller
(function () {
  const ENTER_DELAY = 10; // ms before activating enter transition
  const EXIT_DURATION = 250; // should match CSS exit duration

  function onDomReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function startEnter() {
    const body = document.body;
    body.classList.add('page-enter');
    requestAnimationFrame(() => {
      setTimeout(() => {
        body.classList.add('page-enter-active');
        body.classList.remove('page-enter');
        body.addEventListener(
          'transitionend',
          () => {
            body.classList.remove('page-enter-active');
          },
          { once: true }
        );
      }, ENTER_DELAY);
    });
  }

  function startExit(callback) {
    const body = document.body;
    body.classList.add('page-exit');
    requestAnimationFrame(() => {
      body.classList.add('page-exit-active');
      body.classList.remove('page-exit');
      setTimeout(() => {
        body.classList.remove('page-exit-active');
        callback && callback();
      }, EXIT_DURATION);
    });
  }

  function isSameOriginLink(el) {
    if (!el || el.tagName !== 'A') return false;
    const href = el.getAttribute('href');
    if (!href) return false;
    // Only handle intra-app HTML navigations
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin && /\.html($|\?)/.test(url.pathname);
    } catch {
      return false;
    }
  }

  function wireLinkInterception() {
    document.addEventListener('click', (e) => {
      // Find nearest anchor
      let target = e.target;
      while (target && target !== document) {
        if (target.tagName === 'A') break;
        target = target.parentElement;
      }
      if (isSameOriginLink(target)) {
        e.preventDefault();
        const href = target.getAttribute('href');
        startExit(() => {
          window.location.href = href;
        });
      }
    });
  }

  // Expose a helper for inline JS
  window.navigateTo = function (path) {
    startExit(() => {
      window.location.href = path;
    });
  };

  // Init
  onDomReady(() => {
    startEnter();
    wireLinkInterception();
  });
})();
