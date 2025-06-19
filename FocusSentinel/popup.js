const goalInput = document.getElementById("goal");
const saveBtn = document.getElementById("save");
const completeBtn = document.getElementById("complete");
const blockedListEl = document.getElementById("blocked-list");

// Load saved task
chrome.storage.local.get("userGoal", (data) => {
  if (data.userGoal && data.userGoal.trim() !== "") {
    goalInput.value = data.userGoal;
  }
});

saveBtn.addEventListener("click", () => {
  const goal = goalInput.value.trim();
  if (!goal) return alert("⚠️ Please enter a task.");

  chrome.storage.local.set({ userGoal: goal, taskDone: false }, () => {
    alert("✅ Task saved! Stay focused.");
  });
});

completeBtn.addEventListener("click", () => {
  chrome.storage.local.set({ taskDone: true, userGoal: "" }, () => {
    goalInput.value = "";
    goalInput.placeholder = "Type what you're focusing on...";
    alert("🎉 Task completed! You can now access blocked sites.");
  });
});

// Add block
document.getElementById("add-block").addEventListener("click", () => {
  const url = document.getElementById("block-url").value.trim();
  const password = document.getElementById("block-password").value.trim();
  const unblockTime = document.getElementById("block-time").value;

  if (!url) return alert("⚠️ Enter a site URL to block.");

  const blockRule = {
    url,
    password: password || null,
    unblockTime: unblockTime ? new Date(unblockTime).toISOString() : null
  };

  chrome.storage.local.get(["blockedSites"], (data) => {
    const blockedSites = data.blockedSites || [];
    blockedSites.push(blockRule);

    chrome.storage.local.set({ blockedSites }, () => {
      alert(`🚫 ${url} is now blocked.`);
      document.getElementById("block-url").value = "";
      document.getElementById("block-password").value = "";
      document.getElementById("block-time").value = "";
      loadBlockedSites();
    });
  });
});

// Load and show blocked sites
function loadBlockedSites() {
  blockedListEl.innerHTML = "";

  chrome.storage.local.get(["blockedSites"], (data) => {
    const blockedSites = data.blockedSites || [];

    if (blockedSites.length === 0) {
      blockedListEl.innerHTML = "<li>No sites blocked.</li>";
      return;
    }

    blockedSites.forEach((site, index) => {
      const li = document.createElement("li");
      li.style = "padding: 8px 0; border-bottom: 1px solid #ccc;";
      li.innerHTML = `
        <strong>${site.url}</strong>
        ${site.unblockTime ? `<br><small>🕒 Until: ${new Date(site.unblockTime).toLocaleString()}</small>` : ""}
        ${site.password ? `<br><small>🔐 Password protected</small>` : ""}
        <br><button data-index="${index}" class="remove-site" style="margin-top:5px;padding:4px 10px;background:red;color:white;border:none;border-radius:4px;cursor:pointer;">Remove</button>
      `;
      blockedListEl.appendChild(li);
    });

    document.querySelectorAll(".remove-site").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.getAttribute("data-index"));
        blockedSites.splice(index, 1);
        chrome.storage.local.set({ blockedSites }, loadBlockedSites);
      });
    });
  });
}

// Initialize site list
loadBlockedSites();
