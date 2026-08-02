function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function extractFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const raw = JSON.parse(script.textContent);
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        const nodes = item["@graph"] || [item];
        for (const n of nodes) {
          if (n["@type"] !== "JobPosting") continue;
          const result = {};
          if (n.title) result.jobTitle = clean(n.title);
          if (n.hiringOrganization?.name) result.companyName = clean(n.hiringOrganization.name);
          if (n.jobLocation?.address) {
            const a = n.jobLocation.address;
            result.location = clean([a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", "));
          }
          if (n.estimatedSalary?.value) result.salaryMin = String(n.estimatedSalary.value);
          if (n.baseSalary?.value) result.salaryMin = String(n.baseSalary.value);
          return result;
        }
      }
    } catch {}
  }
  return null;
}

function extractFromDom() {
  const result = {};
  const host = window.location.hostname;

  if (host.includes("linkedin.com")) {
    const titleEl =
      document.querySelector("h1.job-details-jobs-unified-top-card__job-title") ||
      document.querySelector("h1.t-24.job-details-jobs-unified-top-card__job-title") ||
      document.querySelector(".job-details-jobs-unified-top-card__job-title span") ||
      document.querySelector("h1 > span") ||
      document.querySelector("h1");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companyEl =
      document.querySelector(".job-details-jobs-unified-top-card__company-name a") ||
      document.querySelector(".job-details-jobs-unified-top-card__company-name") ||
      document.querySelector("a.topcard__org-name-link") ||
      document.querySelector(".artdeco-entity-lockup__subtitle");
    if (companyEl) result.companyName = clean(companyEl.textContent);

    const locationEl =
      document.querySelector(".job-details-jobs-unified-top-card__primary-description-container .bullet") ||
      document.querySelector(".job-details-jobs-unified-top-card__bullet") ||
      document.querySelector(".topcard__flavor--bullet");
    if (locationEl) result.location = clean(locationEl.textContent);

    const salaryEls = document.querySelectorAll(".job-details-jobs-unified-top-card__job-insight");
    for (const el of salaryEls) {
      const text = el.textContent;
      if (text.match(/\$|€|£|₹|k|K|salary|compensation/i)) {
        const nums = text.replace(/[^0-9,\s]/g, "").match(/\d[\d,]*\d|\d+/g);
        if (nums) {
          if (nums[0]) result.salaryMin = nums[0].replace(/,/g, "");
          if (nums[1]) result.salaryMax = nums[1].replace(/,/g, "");
        }
        break;
      }
    }
    result.source = "LinkedIn";
  }

  else if (host.includes("indeed.com")) {
    const titleEl =
      document.querySelector("h1.jobsearch-JobInfoHeader-title") ||
      document.querySelector("h1.jobsearch-JobInfoHeader-titleContainer span") ||
      document.querySelector("h1");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companyEl =
      document.querySelector("[data-testid='inlineHeader-companyName']") ||
      document.querySelector(".company_name") ||
      document.querySelector("a[data-tn-element='companyName']");
    if (companyEl) result.companyName = clean(companyEl.textContent);

    const locationEl =
      document.querySelector("[data-testid='inlineHeader-companyLocation']") ||
      document.querySelector(".company_location");
    if (locationEl) result.location = clean(locationEl.textContent);

    const salaryEl = document.querySelector(".salary-snippet-container");
    if (salaryEl) {
      const nums = salaryEl.textContent.replace(/[^0-9,\s]/g, "").match(/\d[\d,]*\d|\d+/g);
      if (nums) {
        if (nums[0]) result.salaryMin = nums[0].replace(/,/g, "");
        if (nums[1]) result.salaryMax = nums[1].replace(/,/g, "");
      }
    }
    result.source = "Indeed";
  }

  else if (host.includes("naukri.com")) {
    const titleEl =
      document.querySelector("h1.jobTitle span") ||
      document.querySelector("h1.jobTitle") ||
      document.querySelector("h1");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companyEl =
      document.querySelector("a.companyName") ||
      document.querySelector(".company a");
    if (companyEl) result.companyName = clean(companyEl.textContent);

    const locationEl =
      document.querySelector(".location .locWdth") ||
      document.querySelector("[class*=location]");
    if (locationEl) result.location = clean(locationEl.textContent);

    const salaryEl = document.querySelector("[class*=salary]");
    if (salaryEl) {
      const nums = salaryEl.textContent.replace(/[^0-9,\s]/g, "").match(/\d[\d,]*\d|\d+/g);
      if (nums) {
        if (nums[0]) result.salaryMin = nums[0].replace(/,/g, "");
        if (nums[1]) result.salaryMax = nums[1].replace(/,/g, "");
      }
    }
    result.source = "Naukri";
  }

  else {
    const titleEl = document.querySelector("h1");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companySelectors = [
      '[data-testid="jobPosting-companyName"]',
      ".company_name",
      '[class*="company"]',
      ".employer-name",
    ];
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el) { result.companyName = clean(el.textContent); break; }
    }

    const locSelectors = [
      '[data-testid="jobPosting-location"]',
      ".company_location",
      '[class*="location"]',
    ];
    for (const sel of locSelectors) {
      const el = document.querySelector(sel);
      if (el) { result.location = clean(el.textContent); break; }
    }
  }

  return result;
}

function extractJobData() {
  const jsonLd = extractFromJsonLd();
  const dom = extractFromDom();
  return { ...dom, ...jsonLd, url: window.location.href };
}

chrome.runtime.sendMessage({ type: "EXTRACTED_JOB", data: extractJobData() });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_JOB_DATA") {
    sendResponse(extractJobData());
  }
  return true;
});
