const goalInput = document.getElementById("goal");
const saveBtn = document.getElementById("save");
const completeBtn = document.getElementById("complete");

// Load saved goal on popup open
chrome.storage.local.get(["userGoal"], (data) => {
  if (data.userGoal && data.userGoal.trim() !== "") {
    goalInput.value = data.userGoal;
  } else {
    goalInput.placeholder = "Type what you're focusing on...";
  }
});

// Save task
saveBtn.addEventListener("click", () => {
  const goal = goalInput.value.trim();

  if (goal === "") {
    alert("⚠️ Please enter a task before saving.");
    return;
  }

  chrome.storage.local.set({ userGoal: goal, taskDone: false }, () => {
    alert("✅ Task saved! Stay focused.");
  });
});

// Mark task as completed
completeBtn.addEventListener("click", () => {
  chrome.storage.local.set({ taskDone: true, userGoal: "" }, () => {
    goalInput.value = ""; // Clear the textarea
    goalInput.placeholder = "Type what you're focusing on...";
    alert("🎉 Task completed! Distraction sites are now unblocked.");
  });
});
