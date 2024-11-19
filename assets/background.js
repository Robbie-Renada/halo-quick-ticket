// Simple service worker to keep extension active
chrome.runtime.onInstalled.addListener(() => {
  console.log("Quick Task Creator extension installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "keepAlive") {
    sendResponse({ status: "alive" });
  }
  return true;
});
