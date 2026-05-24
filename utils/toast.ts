import toastStyles from '~/assets/toast.css?inline';

const TOAST_CLASS = 'still-toast';
const TOAST_STYLE_ID = 'still-toast-styles';

function ensureToastStyles(): void {
  if (document.getElementById(TOAST_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = TOAST_STYLE_ID;
  style.textContent = toastStyles;
  document.head.appendChild(style);
}

export function showToast(message: string, duration = 3000): void {
  ensureToastStyles();

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
