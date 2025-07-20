import { getCards, saveCard, updateCard } from './storage.js';

const intervals = [1, 6, 24, 72]; // hours

const addMode = document.getElementById('addMode');
const reviewMode = document.getElementById('reviewMode');
const reviewQuestion = document.getElementById('reviewQuestion');
const answerDiv = document.getElementById('answer');

let dueCards = [];
let current = null;

// Populate form if question passed in URL
const params = new URLSearchParams(location.search);
const qParam = params.get('question');
if (qParam) {
  document.getElementById('question').value = qParam;
}

async function showReview() {
  const cards = await getCards();
  const now = Date.now();
  dueCards = cards.filter(c => c.nextReview <= now);
  if (dueCards.length === 0) {
    addMode.style.display = 'block';
    reviewMode.style.display = 'none';
    return;
  }
  addMode.style.display = 'none';
  reviewMode.style.display = 'block';
  nextCard();
}

function nextCard() {
  current = dueCards.shift();
  if (!current) {
    reviewQuestion.textContent = 'No cards due.';
    document.getElementById('showAnswer').style.display = 'none';
    document.getElementById('good').style.display = 'none';
    document.getElementById('again').style.display = 'none';
    answerDiv.style.display = 'none';
    return;
  }
  reviewQuestion.textContent = current.question;
  answerDiv.textContent = current.answer;
  answerDiv.style.display = 'none';
  document.getElementById('showAnswer').style.display = 'inline-block';
  document.getElementById('good').style.display = 'inline-block';
  document.getElementById('again').style.display = 'inline-block';
}

document.getElementById('showAnswer').addEventListener('click', () => {
  answerDiv.style.display = 'block';
});

document.getElementById('good').addEventListener('click', async () => {
  if (!current) return;
  current.intervalIndex = Math.min(current.intervalIndex + 1, intervals.length - 1);
  current.nextReview = Date.now() + intervals[current.intervalIndex] * 60 * 60 * 1000;
  await updateCard(current);
  nextCard();
});

document.getElementById('again').addEventListener('click', async () => {
  if (!current) return;
  current.intervalIndex = 0;
  current.nextReview = Date.now() + intervals[0] * 60 * 60 * 1000;
  await updateCard(current);
  nextCard();
});

document.getElementById('saveCard').addEventListener('click', async () => {
  const question = document.getElementById('question').value.trim();
  const answer = document.getElementById('answerInput').value.trim();
  if (!question || !answer) {
    alert('Please fill in both question and answer');
    return;
  }
  await saveCard({
    id: crypto.randomUUID(),
    question,
    answer,
    intervalIndex: 0,
    nextReview: Date.now()
  });
  document.getElementById('question').value = '';
  document.getElementById('answerInput').value = '';
  window.close();
});

// Determine mode based on URL parameter "mode"
if (params.get('mode') === 'review') {
  showReview();
}

