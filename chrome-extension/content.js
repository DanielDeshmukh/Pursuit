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
    result.jobTitle = clean(document.querySelector("h1.job-details-jobs-unified-top-card__job-title")?.textContent)
      || clean(document.querySelector("h1")?.textContent);
    result.companyName = clean(document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent)
      || clean(document.querySelector("a.topcard__org-name-link")?.textContent);
    result.location = clean(document.querySelector(".job-details-jobs-unified-top-card__primary-description-container .bullet")?.textContent)
      || clean(document.querySelector(".topcard__flavor--bullet")?.textContent);
    const salaryEl = document.querySelector(".job-details-jobs-unified-top-card__job-insight--salary");
    if (salaryEl) {
      const nums = salaryEl.textContent.replace(/[^0-9,\s]/g, "").match(/\d[\d,]*\d|\d+/g);
      if (nums) {
        if (nums[0]) result.salaryMin = nums[0].replace(/,/g, "");
        if (nums[1]) result.salaryMax = nums[1].replace(/,/g, "");
      }
    }
    result.source = "LinkedIn";
  }

  else if (host.includes("indeed.com")) {
    result.jobTitle = clean(document.querySelector("h1.jobsearch-JobInfoHeader-title")?.textContent)
      || clean(document.querySelector("h1")?.textContent);
    result.companyName = clean(document.querySelector("[data-testid='inlineHeader-companyName']")?.textContent)
      || clean(document.querySelector(".company_name")?.textContent);
    result.location = clean(document.querySelector("[data-testid='inlineHeader-companyLocation']")?.textContent)
      || clean(document.querySelector(".company_location")?.textContent);
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
    result.jobTitle = clean(document.querySelector("h1.jobTitle span")?.textContent)
      || clean(document.querySelector("h1")?.textContent);
    result.companyName = clean(document.querySelector(".company a")?.textContent)
      || clean(document.querySelector("a.companyName")?.textContent);
    result.location = clean(document.querySelector(".location .locWdth")?.textContent)
      || clean(document.querySelector("[class*=location]")?.textContent);
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
    result.jobTitle = clean(document.querySelector("h1")?.textContent);
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
