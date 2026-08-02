const form = document.getElementById("form");
const noJob = document.getElementById("noJob");
const saved = document.getElementById("saved");
const status = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");

function showStatus(msg, type) {
  status.textContent = msg;
  status.className = `status ${type}`;
}

function populateForm(data) {
  if (!data || (!data.jobTitle && !data.companyName)) {
    noJob.classList.remove("hidden");
    return;
  }
  form.classList.remove("hidden");
  document.getElementById("jobTitle").value = data.jobTitle || "";
  document.getElementById("companyName").value = data.companyName || "";
  document.getElementById("salaryMin").value = data.salaryMin || "";
  document.getElementById("salaryMax").value = data.salaryMax || "";
  document.getElementById("source").value = data.source || "";
}

async function loadData() {
  chrome.storage.local.get(["pursuitUrl"], (result) => {
    if (result.pursuitUrl) {
      document.getElementById("pursuitUrl").value = result.pursuitUrl;
    }
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.startsWith("http")) {
    noJob.classList.remove("hidden");
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" });
    if (response && (response.jobTitle || response.companyName)) {
      chrome.storage.local.set({ lastJob: response });
      populateForm(response);
    } else {
      chrome.storage.local.get(["lastJob"], (result) => {
        if (result.lastJob) {
          populateForm(result.lastJob);
        } else {
          noJob.classList.remove("hidden");
        }
      });
    }
  } catch {
    chrome.storage.local.get(["lastJob"], (result) => {
      if (result.lastJob) {
        populateForm(result.lastJob);
      } else {
        noJob.classList.remove("hidden");
      }
    });
  }
}

loadData();

saveBtn.addEventListener("click", async () => {
  const pursuitUrl = document.getElementById("pursuitUrl").value.replace(/\/+$/, "");
  if (!pursuitUrl) {
    showStatus("Enter your Pursuit app URL.", "error");
    return;
  }

  const jobData = {
    jobTitle: document.getElementById("jobTitle").value,
    companyName: document.getElementById("companyName").value,
    salaryMin: document.getElementById("salaryMin").value || undefined,
    salaryMax: document.getElementById("salaryMax").value || undefined,
    source: document.getElementById("source").value || undefined,
  };

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_TO_PURSUIT",
      pursuitUrl,
      jobData,
    });

    if (response?.success) {
      chrome.storage.local.set({ pursuitUrl });
      form.classList.add("hidden");
      saved.classList.remove("hidden");
    } else {
      showStatus(`Error: ${response?.error || "Connection failed"}`, "error");
      saveBtn.disabled = false;
      saveBtn.textContent = "Save to Pursuit";
    }
  } catch {
    showStatus("Could not connect. Is Pursuit running?", "error");
    saveBtn.disabled = false;
    saveBtn.textContent = "Save to Pursuit";
  }
});

copyBtn.addEventListener("click", () => {
  const jobData = {
    jobTitle: document.getElementById("jobTitle").value,
    companyName: document.getElementById("companyName").value,
    salaryMin: document.getElementById("salaryMin").value || undefined,
    salaryMax: document.getElementById("salaryMax").value || undefined,
    source: document.getElementById("source").value || undefined,
  };

  const text = [
    jobData.jobTitle && `Title: ${jobData.jobTitle}`,
    jobData.companyName && `Company: ${jobData.companyName}`,
    jobData.salaryMin && `Salary Min: ${jobData.salaryMin}`,
    jobData.salaryMax && `Salary Max: ${jobData.salaryMax}`,
    jobData.source && `Source: ${jobData.source}`,
  ].filter(Boolean).join("\n");

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy to Clipboard"; }, 2000);
  });
});
