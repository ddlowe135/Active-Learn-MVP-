import { saveCard, getCard } from './db.js';

const REVIEW_HOURS = [1, 6, 24, 72];

/**
 * Retrieve the OpenAI API key from chrome.storage.
 */
async function getOpenAIKey() {
  return new Promise(resolve => {
    chrome.storage.local.get('openaiKey', data => {
      resolve(data.openaiKey);
    });
  });
}

/**
 * Send the selected text to OpenAI and parse out three flashcards.
 */
async function createCardsFromText(text) {
  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    console.error('OpenAI API key not set. Please enter it on the options page.');
    return [];
  }

  const prompt = `Create three flashcards (Q&A pairs) from the text below. ` +
                 `Respond ONLY with a JSON array in this exact format:\n` +
                 `[{"q":"Question 1","a":"Answer 1"}, {"q":"Question 2","a":"Answer 2"}, {"q":"Question 3","a":"Answer 3"}]\n\n` +
                 `Here’s the text:\n${text}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!res.ok) {
    console.error('OpenAI API request failed:', await res.text());
    return [];
  }

  const data = await res.json();
  try {
    const list = JSON.parse(data.choices[0].message.content);
    return list.map(card => ({
      id: crypto.randomUUID(),
      q: card.q,
      a: card.a
    }));
  } catch (e) {
    console.error('Failed to parse flashcards:', e, data);
    return [];
  }
}

/**
 * Schedule Chrome alarms for spaced repetition.
 */
function scheduleReviews(cardId) {
  for (const hours of REVIEW_HOURS) {
    chrome.alarms.create(`${cardId}_${hours}`, {
      when: Date.now() + hours * 3600 * 1000
    });
  }
}

/**
 * Create the right-click menu item on install.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'learnIt',
    title: 'Learn It',
    contexts: ['page', 'selection']
  });
});

/**
 * Handle right-click → “Learn It”
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'learnIt') return;
  const text = info.selectionText;
  if (!text) {
    console.warn('No text selected—aborting flashcard generation.');
    return;
  }
  const cards = await createCardsFromText(text);
  for (const card of cards) {
    await saveCard(card);
    scheduleReviews(card.id);
  }
});

/**
 * When an alarm fires, show a notification with the card’s question.
 */
chrome.alarms.onAlarm.addListener(async alarm => {
  const [cardId] = alarm.name.split('_');
  const card = await getCard(cardId);
  if (!card) return;
  chrome.notifications.create(alarm.name, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: card.q,
    message: 'Tap to review'
  });
});

/**
 * When the user clicks the notification, open the review popup.
 */
chrome.notifications.onClicked.addListener(notificationId => {
  const [cardId] = notificationId.split('_');
  chrome.notifications.clear(notificationId);
  chrome.windows.create({
    url: chrome.runtime.getURL(`review.html?id=${cardId}`),
    type: 'popup',
    width: 400,
    height: 500
  });
});
