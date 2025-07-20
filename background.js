import { saveCard, getCard } from './db.js';

const REVIEW_HOURS = [1, 6, 24, 72];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'learnIt',
    title: 'Learn It',
    contexts: ['page', 'selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'learnIt') return;
  let text = info.selectionText;
  if (!text) {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.slice(0, 4000)
    });
    text = result;
  }
  const cards = await createCards(text);
  for (const card of cards) {
    await saveCard(card);
    scheduleReviews(card.id);
  }
});

async function createCards(text) {
  const { openaiKey } = await chrome.storage.local.get('openaiKey');
  if (!openaiKey) {
    console.error('OpenAI key not set.');
    return [];
  }
  const prompt = `Make 3 flashcards from the following text. Respond with a JSON array of objects with 'q' and 'a' keys.\n\n${text}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  try {
    const list = JSON.parse(data.choices[0].message.content);
    return list.map(card => ({
      id: crypto.randomUUID(),
      q: card.q,
      a: card.a
    }));
  } catch (e) {
    console.error('Failed to parse cards', e, data);
    return [];
  }
}

function scheduleReviews(id) {
  const now = Date.now();
  REVIEW_HOURS.forEach((h, i) => {
    chrome.alarms.create(`${id}-${i}`, { when: now + h * 60 * 60 * 1000 });
  });
}

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

chrome.alarms.onAlarm.addListener(async alarm => {
  const [id] = alarm.name.split('-');
  const card = await getCard(id);
  if (!card) return;
  const { quietStart, quietEnd } = await chrome.storage.local.get(['quietStart','quietEnd']);
  if (inQuietHours(quietStart, quietEnd)) {
    const [ , idx ] = alarm.name.split('-');
    const next = new Date();
    const [eh, em] = quietEnd.split(':').map(Number);
    next.setHours(eh, em, 0, 0);
    if (next < Date.now()) next.setDate(next.getDate() + 1);
    chrome.alarms.create(alarm.name, { when: next.getTime() });
    return;
  }
  chrome.notifications.create(alarm.name, {
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Review',
    message: card.q
  });
});

chrome.notifications.onClicked.addListener(id => {
  const cardId = id.split('-')[0];
  chrome.windows.create({
    url: `review.html?card=${cardId}`,
    type: 'popup',
    width: 350,
    height: 400
  });
});
