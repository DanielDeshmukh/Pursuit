(function () {
  if (window.__pursuitInjected) return;
  window.__pursuitInjected = true;

  const PURSUIT_URL = localStorage.getItem("pursuit_url") || "http://localhost:3000";
  let profile = null;

  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function extract() {
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
              if (n.description) {
                const tmp = document.createElement("div");
                tmp.innerHTML = n.description;
                result.description = clean(tmp.textContent).slice(0, 2000);
              }
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
      result.source = "Workday";
    } else if (host.includes("lever.co")) {
      const m = url.match(/lever\.co\/([^/]+)/);
      if (m && !result.companyName) result.companyName = clean(m[1].replace(/-/g, " "));
      result.source = "Lever";
    } else if (host.includes("greenhouse.io")) {
      const m = url.match(/greenhouse\.io\/([^/]+)/);
      if (m && !result.companyName) result.companyName = clean(m[1].replace(/-/g, " "));
      result.source = "Greenhouse";
    }

    if (!result.jobTitle || !result.companyName) {
      const parts = document.title.split(" | ");
      if (parts.length >= 2) {
        if (!result.jobTitle) result.jobTitle = clean(parts[0]);
        if (!result.companyName) result.companyName = clean(parts[parts.length - 1]);
      } else if (document.title) {
        if (!result.jobTitle) result.jobTitle = clean(document.title);
      }
    }

    if (!result.jobTitle) {
      const el = document.querySelector("h1");
      if (el) result.jobTitle = clean(el.textContent);
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
      result.source = "LinkedIn";
    } else if (host.includes("indeed.com")) {
      if (!result.jobTitle) {
        const el = document.querySelector("h1.jobsearch-JobInfoHeader-title") || document.querySelector("h1");
        if (el) result.jobTitle = clean(el.textContent);
      }
      if (!result.companyName) {
        const el = document.querySelector("[data-testid='inlineHeader-companyName']") || document.querySelector(".company_name");
        if (el) result.companyName = clean(el.textContent);
      }
      result.source = "Indeed";
    } else if (host.includes("naukri.com")) {
      if (!result.jobTitle) {
        const el = document.querySelector("h1.jobTitle span") || document.querySelector("h1");
        if (el) result.jobTitle = clean(el.textContent);
      }
      if (!result.companyName) {
        const el = document.querySelector("a.companyName") || document.querySelector(".company a");
        if (el) result.companyName = clean(el.textContent);
      }
      result.source = "Naukri";
    }

    result.url = window.location.href;
    return result;
  }

  function matchProfileToField(label, name, id, placeholder, type) {
    if (!profile) return null;
    const l = (label + " " + name + " " + id + " " + placeholder).toLowerCase();

    if (l.match(/first.?name|given.?name/) && profile.firstName) return profile.firstName;
    if (l.match(/last.?name|family.?name|surname/) && profile.lastName) return profile.lastName;
    if (l.match(/full.?name|your.?name/) && profile.firstName && profile.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (l.match(/^e-?mail/) && profile.email) return profile.email;
    if (l.match(/phone|mobile|tel/) && profile.phone) return profile.phone;
    if (l.match(/address|street|address.?line/) && profile.address) return profile.address;
    if (l.match(/city/) && profile.city) return profile.city;
    if (l.match(/state|province/) && profile.state) return profile.state;
    if (l.match(/zip|postal/) && profile.zipCode) return profile.zipCode;
    if (l.match(/country/) && profile.country) return profile.country;
    if (l.match(/linkedin/) && profile.linkedinUrl) return profile.linkedinUrl;
    if (l.match(/portfolio|website|github|portfolio/) && profile.portfolioUrl) return profile.portfolioUrl;
    if (l.match(/current.?title|job.?title|position/) && profile.currentTitle) return profile.currentTitle;
    if (l.match(/current.?company|employer/) && profile.currentCompany) return profile.currentCompany;
    if (l.match(/year.*experience|experience/) && profile.yearsExperience) return profile.yearsExperience;
    if (l.match(/salary|compensation|pay/) && profile.salaryExpectation) return profile.salaryExpectation;
    if (l.match(/work.?auth|visa|sponsor|authorized|right.?to.?work/) && profile.workAuthorization) return profile.workAuthorization;

    if (l.match(/how.?did.?you.?hear|source|referral/)) return "LinkedIn";

    return null;
  }

  function detectFields() {
    const fields = [];
    const inputs = document.querySelectorAll("input, textarea, select");
    inputs.forEach((el) => {
      if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;
      if (el.offsetParent === null) return;
      const label = el.closest("label")?.textContent || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const labelledBy = el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent || "" : "";
      const placeholder = el.getAttribute("placeholder") || "";
      const name = el.getAttribute("name") || "";
      const fieldId = el.getAttribute("id") || "";
      const fieldLabel = clean(label || ariaLabel || labelledBy || placeholder || name || fieldId);
      if (!fieldLabel) return;
      fields.push({
        element: el,
        label: fieldLabel,
        name,
        id: fieldId,
        placeholder,
        type: el.tagName.toLowerCase() === "select" ? "select" : el.type || "text",
        suggested: matchProfileToField(label, name, fieldId, placeholder, el.type),
      });
    });
    return fields;
  }

  async function generateForField(fieldLabel, fieldContext, jobData) {
    try {
      const resp = await fetch(`${PURSUIT_URL}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldLabel,
          fieldContext,
          jobTitle: jobData.jobTitle,
          companyName: jobData.companyName,
          jobDescription: jobData.description || "",
          profile,
        }),
      });
      const data = await resp.json();
      return data.content || null;
    } catch {
      return null;
    }
  }

  function createAutoFillUI(jobData) {
    const existing = document.getElementById("pursuit-autofill");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.id = "pursuit-autofill";
    container.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div id="pursuit-panel" style="
          display: none;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 0;
          width: 380px;
          max-height: 70vh;
          box-shadow: 0 8px 32px rgba(0,0,0,0.16);
          margin-bottom: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        ">
          <div style="padding:16px 16px 12px;border-bottom:1px solid #eee;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-weight:600;font-size:14px;color:#1a1a1a;">Pursuit Auto-Fill</div>
                <div style="font-size:11px;color:#888;margin-top:2px;" id="pursuit-job-info"></div>
              </div>
              <button id="pursuit-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:#999;padding:0;">&times;</button>
            </div>
          </div>
          <div id="pursuit-fields" style="overflow-y:auto;flex:1;padding:12px 16px;"></div>
          <div style="padding:12px 16px;border-top:1px solid #eee;display:flex;gap:8px;">
            <button id="pursuit-fill-all" style="flex:1;padding:8px;background:#024ad8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Fill All Fields</button>
            <button id="pursuit-settings-btn" style="padding:8px 12px;background:#f5f5f5;color:#333;border:1px solid #ddd;border-radius:8px;font-size:13px;cursor:pointer;">Settings</button>
          </div>
        </div>
        <button id="pursuit-toggle" style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #024ad8;
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(2,74,216,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
      </div>
    `;
    document.body.appendChild(container);

    const toggle = document.getElementById("pursuit-toggle");
    const panel = document.getElementById("pursuit-panel");
    const close = document.getElementById("pursuit-close");
    const fillAllBtn = document.getElementById("pursuit-fill-all");
    const fieldsContainer = document.getElementById("pursuit-fields");
    const jobInfo = document.getElementById("pursuit-job-info");
    const settingsBtn = document.getElementById("pursuit-settings-btn");

    panel.style.display = "none";

    jobInfo.textContent = jobData.jobTitle ? `${jobData.jobTitle}${jobData.companyName ? " at " + jobData.companyName : ""}` : "No job detected";

    toggle.addEventListener("click", async () => {
      if (panel.style.display === "none") {
        panel.style.display = "flex";
        await populateFields();
      } else {
        panel.style.display = "none";
      }
    });

    close.addEventListener("click", () => {
      panel.style.display = "none";
    });

    settingsBtn.addEventListener("click", () => {
      const url = prompt("Enter your Pursuit app URL:", PURSUIT_URL);
      if (url) {
        localStorage.setItem("pursuit_url", url.replace(/\/+$/, ""));
        location.reload();
      }
    });

    async function populateFields() {
      const fields = detectFields();
      if (fields.length === 0) {
        fieldsContainer.innerHTML = '<div style="text-align:center;padding:24px;color:#888;font-size:13px;">No form fields detected on this page.</div>';
        return;
      }

      fieldsContainer.innerHTML = "";
      const aiFields = [];

      for (const field of fields) {
        const row = document.createElement("div");
        row.style.cssText = "margin-bottom:10px;";

        const label = document.createElement("label");
        label.style.cssText = "font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:3px;";
        label.textContent = field.label + (field.type === "select" ? " (select)" : "");

        let input;
        if (field.type === "select") {
          input = document.createElement("select");
          const options = field.element.querySelectorAll("option");
          options.forEach((opt) => {
            const o = document.createElement("option");
            o.value = opt.value;
            o.textContent = opt.textContent;
            input.appendChild(o);
          });
        } else if (field.type === "textarea") {
          input = document.createElement("textarea");
          input.rows = 2;
        } else {
          input = document.createElement("input");
          input.type = "text";
        }

        input.style.cssText = "width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;box-sizing:border-box;";
        input.dataset.pursuitField = "true";

        if (field.suggested) {
          input.value = field.suggested;
          input.style.borderColor = "#024ad8";
          input.style.background = "#f0f7ff";
        } else if (field.label.match(/cover|letter|about|why|describe|tell|summary|explain|motivation/i)) {
          aiFields.push({ field, input, row });
        }

        row.appendChild(label);
        row.appendChild(input);
        fieldsContainer.appendChild(row);
      }

      if (aiFields.length > 0 && profile) {
        const aiHeader = document.createElement("div");
        aiHeader.style.cssText = "padding:8px 0;margin-top:8px;border-top:1px solid #eee;";
        aiHeader.innerHTML = '<div style="font-size:11px;color:#024ad8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">AI-Generated Suggestions</div>';
        fieldsContainer.appendChild(aiHeader);

        for (const { field, input, row } of aiFields) {
          const btn = document.createElement("button");
          btn.textContent = "Generate";
          btn.style.cssText = "margin-top:4px;padding:4px 10px;background:#024ad8;color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer;";
          btn.addEventListener("click", async () => {
            btn.textContent = "Generating...";
            btn.disabled = true;
            const content = await generateForField(field.label, field.placeholder, jobData);
            if (content) {
              input.value = content;
              input.style.borderColor = "#16a34a";
              input.style.background = "#f0fdf4";
            }
            btn.textContent = "Regenerate";
            btn.disabled = false;
          });
          row.appendChild(btn);
        }
      }
    }

    fillAllBtn.addEventListener("click", () => {
      const allFields = document.querySelectorAll("[data-pursuit-field]");
      allFields.forEach((input) => {
        if (input.value) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
            || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, input.value);
          } else {
            input.value = input.value;
          }
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          input.dispatchEvent(new Event("blur", { bubbles: true }));
        }
      });
      fillAllBtn.textContent = "Filled!";
      fillAllBtn.style.background = "#16a34a";
      setTimeout(() => {
        fillAllBtn.textContent = "Fill All Fields";
        fillAllBtn.style.background = "#024ad8";
      }, 2000);
    });
  }

  function createSaveButton(jobData) {
    if (!jobData || (!jobData.jobTitle && !jobData.companyName)) return;

    const existing = document.getElementById("pursuit-save-btn");
    if (existing) existing.remove();

    const btn = document.createElement("div");
    btn.id = "pursuit-save-btn";
    btn.innerHTML = `
      <div style="
        position: fixed;
        bottom: 84px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <button id="pursuit-save-toggle" style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #16a34a;
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(22,163,74,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </button>
      </div>
    `;
    document.body.appendChild(btn);

    document.getElementById("pursuit-save-toggle").addEventListener("click", async () => {
      const saveBtn = document.getElementById("pursuit-save-toggle");
      saveBtn.style.background = "#888";
      try {
        const resp = await fetch(`${PURSUIT_URL}/api/extension/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: jobData.jobTitle,
            companyName: jobData.companyName,
            location: jobData.location,
            salaryMin: jobData.salaryMin,
            salaryMax: jobData.salaryMax,
            source: jobData.source,
            jobUrl: jobData.url,
          }),
        });
        const data = await resp.json();
        if (data.success) {
          saveBtn.style.background = "#16a34a";
          saveBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
          setTimeout(() => btn.remove(), 2000);
        } else {
          saveBtn.style.background = "#ef4444";
          setTimeout(() => { saveBtn.style.background = "#16a34a"; }, 2000);
        }
      } catch {
        saveBtn.style.background = "#ef4444";
        setTimeout(() => { saveBtn.style.background = "#16a34a"; }, 2000);
      }
    });
  }

  async function loadProfile() {
    try {
      const resp = await fetch(`${PURSUIT_URL}/api/profile`);
      if (resp.ok) profile = await resp.json();
    } catch {}
  }

  function init() {
    const jobData = extract();

    loadProfile().then(() => {
      if (jobData.jobTitle || jobData.companyName) {
        createAutoFillUI(jobData);
        createSaveButton(jobData);
      }
    });

    let debounce;
    const observer = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const existing = document.getElementById("pursuit-autofill");
        if (!existing) {
          const newData = extract();
          if (newData.jobTitle || newData.companyName) {
            createAutoFillUI(newData);
            createSaveButton(newData);
          }
        }
      }, 1000);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
