document.addEventListener('DOMContentLoaded', async () => {
  const { quietStart, quietEnd } = await chrome.storage.local.get(['quietStart', 'quietEnd']);
  if (quietStart) document.getElementById('quietStart').value = quietStart;
  if (quietEnd) document.getElementById('quietEnd').value = quietEnd;
});

document.getElementById('save').addEventListener('click', async () => {
  const quietStart = document.getElementById('quietStart').value;
  const quietEnd = document.getElementById('quietEnd').value;
  await chrome.storage.local.set({ quietStart, quietEnd });
  alert('Saved');
});
