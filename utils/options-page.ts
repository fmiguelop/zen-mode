import {
  getPreferences,
  setPreferences,
  type ColumnWidth,
  type FontSize,
  type Theme,
} from '~/utils/preferences';

type PreferenceField = 'theme' | 'fontSize' | 'columnWidth';

function bindRadioGroup(name: PreferenceField): void {
  const inputs = document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);

  for (const input of inputs) {
    input.addEventListener('change', async () => {
      if (!input.checked) {
        return;
      }

      await setPreferences({ [name]: input.value } as Partial<{
        theme: Theme;
        fontSize: FontSize;
        columnWidth: ColumnWidth;
      }>);
    });
  }
}

async function init(): Promise<void> {
  const prefs = await getPreferences();

  for (const field of ['theme', 'fontSize', 'columnWidth'] as const) {
    const inputs = document.querySelectorAll<HTMLInputElement>(`input[name="${field}"]`);

    for (const input of inputs) {
      input.checked = input.value === prefs[field];
    }
  }
}

bindRadioGroup('theme');
bindRadioGroup('fontSize');
bindRadioGroup('columnWidth');

void init();
