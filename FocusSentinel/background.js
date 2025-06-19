chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.local.get(["userGoal", "taskDone"], (data) => {
      const taskDone = data.taskDone === true;
      const isWorkRelated = isWorkTab(tab.url);

      if (!taskDone && !isWorkRelated && isDistractionSite(tab.url)) {
        chrome.scripting.executeScript({
          target: { tabId },
          func: blockPage
        });
      }
    });
  }
});

function isDistractionSite(url) {
  const distractions = ["youtube.com", "facebook.com", "twitter.com", "reddit.com"];
  return distractions.some(site => url.includes(site));
}

function blockPage() {
  document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:24px;text-align:center;padding:20px;color:red">
    🚫 Stay Focused! Complete your task first.
  </div>`;
}

function isWorkTab(url) {
  const workKeywords = ["docs", "notion", "gmail", "stackoverflow", "github", "zoom"];
  return workKeywords.some(keyword => url.includes(keyword));
}
