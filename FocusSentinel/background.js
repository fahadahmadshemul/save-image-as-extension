chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  chrome.storage.local.get(["blockedSites"], (data) => {
    const now = new Date();
    const blockedSites = data.blockedSites || [];

    const matched = blockedSites.find(site => tab.url.includes(site.url));

    if (matched) {
      if (matched.unblockTime && new Date(matched.unblockTime) <= now) return;

      chrome.scripting.executeScript({
        target: { tabId },
        func: renderBlockPage,
        args: [matched.url, !!matched.password]
      });
    }
  });
});

function renderBlockPage(site, hasPassword) {
  const container = document.createElement("div");
  container.style = `
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:#f8d7da;color:#721c24;display:flex;
    align-items:center;justify-content:center;flex-direction:column;
    font-family:sans-serif;z-index:999999;
  `;
  container.innerHTML = `
    <h2>🚫 ${site} is blocked!</h2>
    ${hasPassword ? `
      <p>Enter password to unlock:</p>
      <input type="password" id="unlock-pass" style="padding:5px;margin-bottom:10px;" />
      <button id="unlock-btn">Unlock</button>
    ` : `
    `}
  `;
  document.body.innerHTML = '';
  document.body.appendChild(container);

  if (hasPassword) {
    document.getElementById("unlock-btn").onclick = () => {
      const input = document.getElementById("unlock-pass").value;
      chrome.runtime.sendMessage({ type: "checkPassword", site, input });
    };
  } else {
    document.getElementById("unblock-now").onclick = () => {
      chrome.runtime.sendMessage({ type: "unblockSite", site });
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "unblockSite" || message.type === "checkPassword") {
    chrome.storage.local.get(["blockedSites"], (data) => {
      const blockedSites = data.blockedSites || [];
      const newList = blockedSites.filter(site => {
        if (site.url !== message.site) return true;
        if (message.type === "checkPassword" && site.password !== message.input) return true;
        return false;
      });

      chrome.storage.local.set({ blockedSites: newList }, () => {
        chrome.tabs.reload(sender.tab.id);
      });
    });
  }
});
