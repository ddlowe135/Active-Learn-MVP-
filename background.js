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
    chrome.runtime.openOptionsPage();
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
