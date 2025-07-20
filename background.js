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
  }
});

// Listen for alarms to see if cards are due
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'reviewCheck') return;
  const cards = await getCards();
  const { quietStart, quietEnd } = await chrome.storage.local.get(['quietStart', 'quietEnd']);
  const now = new Date();
  if (inQuietHours(quietStart, quietEnd, now)) return;
  const due = cards.filter(c => c.nextReview <= Date.now());
  if (due.length > 0) {
    chrome.notifications.create('reviewReady', {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Flashcard Review Ready',
      message: `You have ${due.length} card(s) to review`
    });
  }
});

chrome.notifications.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'popup.html?mode=review',
    type: 'popup',
    width: 350,
    height: 400
  });
});

// Utility: check quiet hours
function inQuietHours(startStr, endStr, date = new Date()) {
  if (!startStr || !endStr) return false;
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const start = new Date(date); start.setHours(sh, sm, 0, 0);
  const end = new Date(date); end.setHours(eh, em, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);
  if (date < start) start.setDate(start.getDate() - 1);
  return date >= start && date <= end;
}
