"use server";

import * as cheerio from "cheerio";

export interface ScrapedJob {
  jobTitle: string;
  companyName: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  source: string;
}

function detectSource(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com")) return "LinkedIn";
  if (u.includes("naukri.com")) return "Naukri";
  if (u.includes("indeed.com")) return "Indeed";
  if (u.includes("glassdoor.com")) return "Glassdoor";
  if (u.includes("wellfound.com") || u.includes("angel.co")) return "Wellfound";
  if (u.includes("greenhouse.io")) return "Greenhouse";
  if (u.includes("lever.co")) return "Lever";
  if (u.includes("workday.com") || u.includes("myworkdayjobs.com")) return "Workday";
  return "Other";
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractJsonLd($: cheerio.CheerioAPI): Partial<ScrapedJob> {
  const out: Partial<ScrapedJob> = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = JSON.parse($(el).html() || "");
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        const nodes = item["@graph"] || [item];
        for (const n of nodes) {
          if (n["@type"] !== "JobPosting") continue;
          if (n.title) out.jobTitle = clean(n.title);
          if (n.hiringOrganization?.name) out.companyName = clean(n.hiringOrganization.name);
          if (n.jobLocation?.address) {
            const a = n.jobLocation.address;
            out.location = clean([a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", "));
          }
          if (n.estimatedSalary?.value) out.salaryMin = String(n.estimatedSalary.value);
        }
      }
    } catch {}
  });
  return out;
}

function extractMeta($: cheerio.CheerioAPI): Partial<ScrapedJob> {
  const out: Partial<ScrapedJob> = {};
  const title = $('meta[property="og:title"]').attr("content");
  if (title) {
    const parts = title.split(" at ");
    if (parts.length === 2) {
      out.jobTitle = clean(parts[0]);
      out.companyName = clean(parts[1]);
    } else {
      out.jobTitle = clean(title);
    }
  }
  return out;
}

function extractDom($: cheerio.CheerioAPI): Partial<ScrapedJob> {
  const out: Partial<ScrapedJob> = {};

  const title =
    $('h1[data-testid="jobPosting-header"]').text() ||
    $("h1.jobsearch-JobInfoHeader-title").text() ||
    $(".job-title h1").text() ||
    $("[class*=job-title]").first().text() ||
    $("h1").first().text();
  if (title) out.jobTitle = clean(title);

  const company =
    $('[data-testid="jobPosting-companyName"]').text() ||
    $(".company_name").text() ||
    $("[class*=company]").first().text() ||
    $(".employer-name").text();
  if (company) out.companyName = clean(company);

  const location =
    $('[data-testid="jobPosting-location"]').text() ||
    $(".company_location").text() ||
    $("[class*=location]").first().text();
  if (location) out.location = clean(location);

  const salary =
    $(".salary-snippet-container").text() ||
    $("[class*=salary]").first().text() ||
    $('[data-testid="jobPosting-salary"]').text();
  if (salary) {
    const nums = salary.replace(/[^0-9,\-\s]/g, "").match(/\d[\d,]*\d|\d+/g);
    if (nums && nums.length >= 2) {
      out.salaryMin = nums[0].replace(/,/g, "");
      out.salaryMax = nums[1].replace(/,/g, "");
    } else if (nums && nums.length === 1) {
      out.salaryMin = nums[0].replace(/,/g, "");
    }
  }

  return out;
}

export async function scrapeJobUrl(url: string): Promise<ScrapedJob> {
  new URL(url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const base = {
    jobTitle: "",
    companyName: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    source: detectSource(url),
  };

  const jsonLd = extractJsonLd($);
  const meta = extractMeta($);
  const dom = extractDom($);

  return {
    ...base,
    ...dom,
    ...meta,
    ...jsonLd,
  };
}
