import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Still',
    description: 'One click turns any article into calm, distraction-free reading. No account. No tracking. Everything stays on your device.',
    permissions: ['activeTab', 'scripting', 'storage'],
    commands: {
      'toggle-still': {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'Alt+Shift+S',
        },
        description: 'Toggle Still reader mode',
      },
    },
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Read with Still',
    },
    web_accessible_resources: [
      {
        resources: ['fonts/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
