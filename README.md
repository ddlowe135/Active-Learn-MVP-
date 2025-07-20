# Active Learn

This Chrome extension lets you quickly turn any web page into study flashcards. Use the **Learn It** option from the right-click menu to send the current selection (or entire page text) to the OpenAI API. The response is stored as three question/answer cards in IndexedDB.

Each card is scheduled for spaced review at 1 hour, 6 hours, 24 hours and 3 days. When a card is due you will see a Chrome notification. Clicking the notification opens a small popup where you can reveal the answer and mark it Known, New or Flag.

Configure your OpenAI API key and quiet-hours window on the extension's options page. If you try to create cards without a key set, the options page will open automatically so you can enter it.
