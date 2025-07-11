// Simple background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  // console.log('Extension installed');
});

// Keep service worker active
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // console.log('Message received:', message);
  sendResponse({ status: 'ok' });
  return true;
});

export {}; 