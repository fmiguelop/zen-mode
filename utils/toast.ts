const TOAST_CLASS = 'still-toast';

export function showToast(message: string, duration = 3000): void {
  document.querySelector(`.${TOAST_CLASS}`)?.remove();

  const toast = document.createElement('div');
  toast.className = TOAST_CLASS;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add(`${TOAST_CLASS}--visible`);
  });

  window.setTimeout(() => {
    toast.classList.remove(`${TOAST_CLASS}--visible`);
    window.setTimeout(() => toast.remove(), 300);
  }, duration);
}
