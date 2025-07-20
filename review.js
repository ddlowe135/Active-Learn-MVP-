import { getCard, deleteCard } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('card');
  const card = await getCard(id);
  if (!card) {
    document.body.textContent = 'Card not found';
    return;
  }
  const qDiv = document.getElementById('question');
  const aDiv = document.getElementById('answer');
  qDiv.textContent = card.q;
  aDiv.textContent = card.a;

  document.getElementById('show').addEventListener('click', () => {
    aDiv.style.display = 'block';
  });

  async function done(action) {
    await deleteCard(id); // simple: remove card after final review
    window.close();
  }

  document.getElementById('known').addEventListener('click', () => done('known'));
  document.getElementById('new').addEventListener('click', () => done('new'));
  document.getElementById('flag').addEventListener('click', () => done('flag'));
});
