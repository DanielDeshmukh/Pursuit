chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EXTRACTED_JOB") {
    chrome.storage.local.set({ lastJob: msg.data });
    chrome.action.setBadgeText({ text: "✓", tabId: sender.tab?.id });
    chrome.action.setBadgeBackgroundColor({ color: "#024ad8" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "", tabId: sender.tab?.id });
    }, 3000);
  }

  if (msg.type === "SAVE_TO_PURSUIT") {
    const { pursuitUrl, jobData } = msg;
    fetch(`${pursuitUrl}/api/extension/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    })
      .then((r) => r.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
