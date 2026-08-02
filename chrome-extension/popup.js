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
  document.getElementById("location").value = data.location || "";
  document.getElementById("salaryMin").value = data.salaryMin || "";
  document.getElementById("salaryMax").value = data.salaryMax || "";
  document.getElementById("source").value = data.source || "";
}

function extractFromPage() {
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  const result = {};
  const host = window.location.hostname;
  const url = window.location.href;

  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const raw = JSON.parse(script.textContent);
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        const nodes = item["@graph"] || [item];
        for (const n of nodes) {
          if (n["@type"] === "JobPosting") {
            if (n.title) result.jobTitle = clean(n.title);
            if (n.hiringOrganization?.name) result.companyName = clean(n.hiringOrganization.name);
            if (n.jobLocation?.address) {
              const a = n.jobLocation.address;
              result.location = clean([a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", "));
            }
            if (n.estimatedSalary?.value) result.salaryMin = String(n.estimatedSalary.value);
            if (n.baseSalary?.value) result.salaryMin = String(n.baseSalary.value);
          }
        }
      }
    } catch {}
  }

  if (host.includes("myworkdayjobs.com")) {
    const m = url.match(/job\/([^/]+)\/([^/]+)/);
    if (m) {
      if (!result.location) result.location = clean(m[1].replace(/-/g, " "));
      const jobSlug = m[2].split("/")[0].replace(/--/g, " - ").replace(/_R\d+-\d+/, "").replace(/_/g, " ");
      if (!result.jobTitle) result.jobTitle = clean(jobSlug);
    }
    const cm = url.match(/en-US\/([^/]+)\//);
    if (cm && !result.companyName) result.companyName = clean(cm[1].replace(/_/g, " "));
    if (!result.source) result.source = "Workday";
  }

  else if (host.includes("lever.co")) {
    const m = url.match(/lever\.co\/([^/]+)/);
    if (m && !result.companyName) result.companyName = clean(m[1].replace(/-/g, " "));
    if (!result.source) result.source = "Lever";
  }

  else if (host.includes("greenhouse.io")) {
    const m = url.match(/greenhouse\.io\/([^/]+)/);
    if (m && !result.companyName) result.companyName = clean(m[1].replace(/-/g, " "));
    if (!result.source) result.source = "Greenhouse";
  }

  if (!result.jobTitle || !result.companyName) {
    const title = document.title;
    const parts = title.split(" | ");
    if (parts.length >= 2) {
      if (!result.jobTitle) result.jobTitle = clean(parts[0]);
      if (!result.companyName) result.companyName = clean(parts[parts.length - 1]);
    } else if (title) {
      if (!result.jobTitle) result.jobTitle = clean(title);
    }
  }

  if (!result.jobTitle) {
    const h1 = document.querySelector("h1");
    if (h1) result.jobTitle = clean(h1.textContent);
  }

  if (host.includes("linkedin.com")) {
    if (!result.jobTitle) {
      const el = document.querySelector("h1.job-details-jobs-unified-top-card__job-title span") || document.querySelector("h1");
      if (el) result.jobTitle = clean(el.textContent);
    }
    if (!result.companyName) {
      const el = document.querySelector(".job-details-jobs-unified-top-card__company-name a") || document.querySelector(".job-details-jobs-unified-top-card__company-name");
      if (el) result.companyName = clean(el.textContent);
    }
    if (!result.location) {
      const el = document.querySelector(".job-details-jobs-unified-top-card__primary-description-container .bullet") || document.querySelector(".topcard__flavor--bullet");
      if (el) result.location = clean(el.textContent);
    }
    if (!result.source) result.source = "LinkedIn";
  }

  else if (host.includes("indeed.com")) {
    if (!result.jobTitle) {
      const el = document.querySelector("h1.jobsearch-JobInfoHeader-title") || document.querySelector("h1");
      if (el) result.jobTitle = clean(el.textContent);
    }
    if (!result.companyName) {
      const el = document.querySelector("[data-testid='inlineHeader-companyName']") || document.querySelector(".company_name");
      if (el) result.companyName = clean(el.textContent);
    }
    if (!result.location) {
      const el = document.querySelector("[data-testid='inlineHeader-companyLocation']") || document.querySelector(".company_location");
      if (el) result.location = clean(el.textContent);
    }
    if (!result.source) result.source = "Indeed";
  }

  else if (host.includes("naukri.com")) {
    if (!result.jobTitle) {
      const el = document.querySelector("h1.jobTitle span") || document.querySelector("h1.jobTitle") || document.querySelector("h1");
      if (el) result.jobTitle = clean(el.textContent);
    }
    if (!result.companyName) {
      const el = document.querySelector("a.companyName") || document.querySelector(".company a");
      if (el) result.companyName = clean(el.textContent);
    }
    if (!result.location) {
      const el = document.querySelector(".location .locWdth") || document.querySelector("[class*=location]");
      if (el) result.location = clean(el.textContent);
    }
    if (!result.source) result.source = "Naukri";
  }

  result.url = window.location.href;
  return result;
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
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: extractFromPage,
    });

    if (results && results.length > 0) {
      for (const r of results) {
        if (r.result && (r.result.jobTitle || r.result.companyName)) {
          chrome.storage.local.set({ lastJob: r.result });
          populateForm(r.result);
          return;
        }
      }
    }
  } catch (err) {
    console.error("Injection failed:", err);
  }

  chrome.storage.local.get(["lastJob"], (result) => {
    if (result.lastJob) {
      populateForm(result.lastJob);
    } else {
      noJob.classList.remove("hidden");
    }
  });
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
    location: document.getElementById("location").value || undefined,
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
    location: document.getElementById("location").value || undefined,
    salaryMin: document.getElementById("salaryMin").value || undefined,
    salaryMax: document.getElementById("salaryMax").value || undefined,
    source: document.getElementById("source").value || undefined,
  };

  const text = [
    jobData.jobTitle && `Title: ${jobData.jobTitle}`,
    jobData.companyName && `Company: ${jobData.companyName}`,
    jobData.location && `Location: ${jobData.location}`,
    jobData.salaryMin && `Salary Min: ${jobData.salaryMin}`,
    jobData.salaryMax && `Salary Max: ${jobData.salaryMax}`,
    jobData.source && `Source: ${jobData.source}`,
  ].filter(Boolean).join("\n");

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy to Clipboard"; }, 2000);
  });
});
