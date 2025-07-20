
-87

import { getCards } from './storage.js';

// Create context menu entry when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addFlashcard',
    title: 'Add Flashcard',
    contexts: ['selection']
  });
  // check for reviews every 5 minutes
  chrome.alarms.create('reviewCheck', { periodInMinutes: 5 });
});

// Open the popup to add a card when the menu is clicked
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'addFlashcard') {
    const q = encodeURIComponent(info.selectionText || '');
    chrome.windows.create({
      url: `popup.html?question=${q}`,
      type: 'popup',
      width: 350,
      height: 400
    });
