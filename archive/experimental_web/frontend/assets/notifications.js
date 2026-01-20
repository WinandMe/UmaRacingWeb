// Global notification system
(function () {
  let notificationContainer = null;
  let notificationId = 0;

  function createContainer() {
    if (notificationContainer) return;
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    notificationContainer.id = 'notificationContainer';
    document.body.appendChild(notificationContainer);
  }

  function show(options = {}) {
    createContainer();

    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000,
      icon = null,
      closable = true
    } = options;

    const id = ++notificationId;
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.dataset.id = id;

    const iconMap = {
      info: '💬',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      announcement: '📢',
      'race-update': '🏇',
      'race-milestone': '🏁'
    };

    const displayIcon = icon || iconMap[type] || '💬';

    toast.innerHTML = `
      <div class="notification-icon">${displayIcon}</div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ''}
        <div class="notification-message">${message}</div>
      </div>
      ${closable ? '<button class="notification-close" aria-label="Close">×</button>' : ''}
      ${duration > 0 ? `<div class="notification-progress" style="animation-duration: ${duration}ms;"></div>` : ''}
    `;

    notificationContainer.appendChild(toast);

    if (closable) {
      const closeBtn = toast.querySelector('.notification-close');
      closeBtn.addEventListener('click', () => hide(id));
    }

    if (duration > 0) {
      setTimeout(() => hide(id), duration);
    }

    return id;
  }

  function hide(id) {
    const toast = notificationContainer?.querySelector(`[data-id="${id}"]`);
    if (!toast) return;

    toast.classList.add('hiding');
    setTimeout(() => {
      toast.remove();
      if (notificationContainer && notificationContainer.children.length === 0) {
        notificationContainer.remove();
        notificationContainer = null;
      }
    }, 300);
  }

  function showRaceAnnouncement(message, duration = 7000) {
    return show({
      type: 'announcement',
      message: message,
      duration: duration,
      closable: true
    });
  }

  function showRaceUpdate(message, duration = 5000) {
    return show({
      type: 'race-update',
      title: 'Race Update',
      message: message,
      duration: duration,
      icon: '🏇'
    });
  }

  function showRaceMilestone(message, duration = 6000) {
    return show({
      type: 'race-milestone',
      message: message,
      duration: duration,
      icon: '🏁'
    });
  }

  // Expose global API
  window.Notifications = {
    show,
    hide,
    success: (message, duration) => show({ type: 'success', message, duration }),
    error: (message, duration) => show({ type: 'error', message, duration }),
    warning: (message, duration) => show({ type: 'warning', message, duration }),
    info: (message, duration) => show({ type: 'info', message, duration }),
    announcement: showRaceAnnouncement,
    raceUpdate: showRaceUpdate,
    raceMilestone: showRaceMilestone
  };

  // Auto-create on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createContainer);
  } else {
    createContainer();
  }
})();
