import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Zen Mode',
    description: 'Strip distractions and focus on the article content.',
    permissions: ['activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Enter Zen Mode',
    },
  },
});
