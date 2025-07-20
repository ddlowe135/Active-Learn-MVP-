// storage.js - helper functions for managing flashcards using chrome.storage.local

const KEY = 'cards';

// Retrieve all saved cards
export async function getCards() {
  const data = await chrome.storage.local.get(KEY);
  return data[KEY] || [];
}

// Save a new card
export async function saveCard(card) {
  const cards = await getCards();
  cards.push(card);
  await chrome.storage.local.set({ [KEY]: cards });
}

// Update an existing card
export async function updateCard(updated) {
  const cards = await getCards();
  const idx = cards.findIndex(c => c.id === updated.id);
  if (idx !== -1) {
    cards[idx] = updated;
    await chrome.storage.local.set({ [KEY]: cards });
  }
}

// Delete a card by id
export async function deleteCard(id) {
  const cards = await getCards();
  await chrome.storage.local.set({ [KEY]: cards.filter(c => c.id !== id) });
}

