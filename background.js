// background.js

// On install, create the Learn It menu entry
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "learnIt",
    title: "Learn It",
    contexts: ["page", "selection"]
  });
  console.log("✅ Learn It menu created");
});

// On click, log info to the background console
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "learnIt") {
    console.log("👉 Learn It clicked!", {
      selection: info.selectionText,
      pageTitle: tab.title,
      pageUrl: tab.url
    });
  }
});
