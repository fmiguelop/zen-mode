import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    permissions: ['activeTab', 'scripting', 'storage'],
    commands: {
      'toggle-still': {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'Alt+Shift+S',
        },
        description: '__MSG_cmdToggleStill__',
      },
    },
    action: {
      default_title: '__MSG_actionDefaultTitle__',
    },
    web_accessible_resources: [
      {
        resources: ['fonts/*'],
        matches: ['<all_urls>'],
        use_dynamic_url: true,
      },
    ],
  },
});
