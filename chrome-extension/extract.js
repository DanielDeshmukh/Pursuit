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

function extractFromTitle() {
  const title = document.title;
  if (!title) return {};
  const result = {};
  const parts = title.split(" | ");
  if (parts.length >= 2) {
    result.jobTitle = clean(parts[0]);
    result.companyName = clean(parts[parts.length - 1]);
  } else {
    const atParts = title.split(" at ");
    if (atParts.length === 2) {
      result.jobTitle = clean(atParts[0]);
      result.companyName = clean(atParts[1]);
    } else {
      result.jobTitle = clean(title);
    }
  }
  return result;
}

function extractFromUrl() {
  const url = window.location.href;
  const result = {};

  const workdayMatch = url.match(/myworkdayjobs\.com\/[^/]+\/([^/]+)\/job\/([^/]+)\/([^/]+)/);
  if (workdayMatch) {
    result.companyName = clean(workdayMatch[1].replace(/_/g, " "));
    const jobPart = workdayMatch[3].replace(/--/g, " - ").replace(/_/g, " ");
    const locationJob = jobPart.split("/");
    if (locationJob.length >= 2) {
      result.location = clean(locationJob[0]);
      result.jobTitle = clean(locationJob[1].replace(/_R\d+-\d+/, ""));
    } else {
      result.jobTitle = clean(locationJob[0]);
    }
    result.source = "Workday";
    return result;
  }

  const leverMatch = url.match(/lever\.co\/([^/]+)\/(.+)/);
  if (leverMatch) {
    result.companyName = clean(leverMatch[1].replace(/-/g, " "));
    const slug = leverMatch[2].split("/").pop().replace(/-/g, " ");
    result.jobTitle = clean(slug);
    result.source = "Lever";
    return result;
  }

  const greenhouseMatch = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (greenhouseMatch) {
    result.companyName = clean(greenhouseMatch[1].replace(/-/g, " "));
    result.source = "Greenhouse";
    return result;
  }

  return result;
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

  else if (host.includes("myworkdayjobs.com")) {
    const titleEl =
      document.querySelector("[data-automation-id='jobPosting-header']") ||
      document.querySelector("h1") ||
      document.querySelector("[class*='job-title']");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companyEl =
      document.querySelector("[data-automation-id='companyName']") ||
      document.querySelector("[class*='company']");
    if (companyEl) result.companyName = clean(companyEl.textContent);

    const locationEl =
      document.querySelector("[data-automation-id='location']") ||
      document.querySelector("[class*='location']");
    if (locationEl) result.location = clean(locationEl.textContent);

    result.source = "Workday";
  }

  else if (host.includes("greenhouse.io") || host.includes("boards.greenhouse")) {
    const titleEl =
      document.querySelector("#header h1") ||
      document.querySelector(".section-title h1") ||
      document.querySelector("h1");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companyEl =
      document.querySelector("#header .company-name") ||
      document.querySelector(".section-title .company-name");
    if (companyEl) result.companyName = clean(companyEl.textContent);

    const locationEl =
      document.querySelector("#header .location") ||
      document.querySelector(".section-title .location");
    if (locationEl) result.location = clean(locationEl.textContent);

    result.source = "Greenhouse";
  }

  else if (host.includes("lever.co")) {
    const titleEl =
      document.querySelector(".posting-headline h2") ||
      document.querySelector("h2") ||
      document.querySelector("h1");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companyEl =
      document.querySelector(".posting-headline .company-name") ||
      document.querySelector(".content a[href='/']");
    if (companyEl) result.companyName = clean(companyEl.textContent);

    const locationEl =
      document.querySelector(".posting-headline .sort-location") ||
      document.querySelector(".location");
    if (locationEl) result.location = clean(locationEl.textContent);

    result.source = "Lever";
  }

  else {
    const titleEl = document.querySelector("h1");
    if (titleEl) result.jobTitle = clean(titleEl.textContent);

    const companySelectors = [
      '[data-testid="jobPosting-companyName"]',
      ".company_name",
      '[class*="company"]',
      ".employer-name",
      ".company-name",
      ".organization-name",
      "header .company",
    ];
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && clean(el.textContent)) { result.companyName = clean(el.textContent); break; }
    }

    const locSelectors = [
      '[data-testid="jobPosting-location"]',
      ".company_location",
      '[class*="location"]',
      ".job-location",
      "[data-location]",
    ];
    for (const sel of locSelectors) {
      const el = document.querySelector(sel);
      if (el && clean(el.textContent)) { result.location = clean(el.textContent); break; }
    }
  }

  return result;
}

function extractJobData() {
  const jsonLd = extractFromJsonLd();
  const dom = extractFromDom();
  const title = extractFromTitle();
  const urlData = extractFromUrl();
  return { ...urlData, ...title, ...dom, ...jsonLd, url: window.location.href };
}

return extractJobData();
