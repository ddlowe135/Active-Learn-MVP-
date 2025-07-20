document.addEventListener('DOMContentLoaded', async () => {
  const {openaiKey, quietStart, quietEnd} = await chrome.storage.local.get([
    'openaiKey','quietStart','quietEnd'
  ]);
  if (openaiKey) document.getElementById('apiKey').value = openaiKey;
  if (quietStart) document.getElementById('quietStart').value = quietStart;
  if (quietEnd) document.getElementById('quietEnd').value = quietEnd;
});

document.getElementById('save').addEventListener('click', async () => {
  const apiKey = document.getElementById('apiKey').value;
  const quietStart = document.getElementById('quietStart').value;
  const quietEnd = document.getElementById('quietEnd').value;
  await chrome.storage.local.set({openaiKey: apiKey, quietStart, quietEnd});
  alert('Options saved');
});
