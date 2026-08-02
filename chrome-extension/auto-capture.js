(function () {
  if (window.__pursuitInjected) return;
  window.__pursuitInjected = true;

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

  function createButton(jobData) {
    if (!jobData || (!jobData.jobTitle && !jobData.companyName)) return;

    const existing = document.getElementById("pursuit-save-btn");
    if (existing) existing.remove();

    const btn = document.createElement("div");
    btn.id = "pursuit-save-btn";
    btn.innerHTML = `
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
          padding: 16px;
          width: 300px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.16);
          margin-bottom: 8px;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-weight:600;font-size:14px;color:#1a1a1a;">Save to Pursuit</span>
            <button id="pursuit-close" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999;padding:0;">&times;</button>
          </div>
          <div style="margin-bottom:8px;">
            <label style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Job Title</label>
            <input id="pursuit-title" value="${(jobData.jobTitle || "").replace(/"/g, "&quot;")}" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;margin-top:2px;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:8px;">
            <label style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Company</label>
            <input id="pursuit-company" value="${(jobData.companyName || "").replace(/"/g, "&quot;")}" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;margin-top:2px;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:8px;">
            <label style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Location</label>
            <input id="pursuit-location" value="${(jobData.location || "").replace(/"/g, "&quot;")}" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;margin-top:2px;box-sizing:border-box;">
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <div style="flex:1;">
              <label style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Salary Min</label>
              <input id="pursuit-salaryMin" value="${(jobData.salaryMin || "").replace(/"/g, "&quot;")}" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;margin-top:2px;box-sizing:border-box;">
            </div>
            <div style="flex:1;">
              <label style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Salary Max</label>
              <input id="pursuit-salaryMax" value="${(jobData.salaryMax || "").replace(/"/g, "&quot;")}" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;margin-top:2px;box-sizing:border-box;">
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Pursuit URL</label>
            <input id="pursuit-url" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;margin-top:2px;box-sizing:border-box;" placeholder="http://localhost:3000">
          </div>
          <div id="pursuit-msg" style="display:none;padding:8px;border-radius:6px;font-size:12px;margin-bottom:8px;"></div>
          <button id="pursuit-save" style="width:100%;padding:8px;background:#024ad8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Save to Pursuit</button>
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
          font-size: 20px;
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
    document.body.appendChild(btn);

    const toggle = document.getElementById("pursuit-toggle");
    const panel = document.getElementById("pursuit-panel");
    const close = document.getElementById("pursuit-close");
    const saveBtn = document.getElementById("pursuit-save");
    const msgEl = document.getElementById("pursuit-msg");
    const urlInput = document.getElementById("pursuit-url");

    chrome.storage.local.get(["pursuitUrl"], (r) => {
      if (r.pursuitUrl) urlInput.value = r.pursuitUrl;
    });

    toggle.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    close.addEventListener("click", () => {
      panel.style.display = "none";
    });

    saveBtn.addEventListener("click", async () => {
      const pursuitUrl = urlInput.value.replace(/\/+$/, "");
      if (!pursuitUrl) {
        msgEl.style.display = "block";
        msgEl.style.background = "#fee2e2";
        msgEl.style.color = "#991b1b";
        msgEl.textContent = "Enter your Pursuit URL first.";
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      const jobData = {
        jobTitle: document.getElementById("pursuit-title").value,
        companyName: document.getElementById("pursuit-company").value,
        location: document.getElementById("pursuit-location").value || undefined,
        salaryMin: document.getElementById("pursuit-salaryMin").value || undefined,
        salaryMax: document.getElementById("pursuit-salaryMax").value || undefined,
        source: jobData.source || undefined,
      };

      try {
        const resp = await fetch(`${pursuitUrl}/api/extension/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });
        const data = await resp.json();

        if (data.success) {
          chrome.storage.local.set({ pursuitUrl });
          msgEl.style.display = "block";
          msgEl.style.background = "#dcfce7";
          msgEl.style.color = "#166534";
          msgEl.textContent = "Saved to Pursuit!";
          saveBtn.textContent = "Saved!";
          toggle.style.background = "#16a34a";
          setTimeout(() => {
            panel.style.display = "none";
            btn.remove();
          }, 1500);
        } else {
          throw new Error(data.error || "Save failed");
        }
      } catch (err) {
        msgEl.style.display = "block";
        msgEl.style.background = "#fee2e2";
        msgEl.style.color = "#991b1b";
        msgEl.textContent = `Error: ${err.message}. Is Pursuit running?`;
        saveBtn.disabled = false;
        saveBtn.textContent = "Save to Pursuit";
      }
    });
  }

  const jobData = extract();

  if (jobData.jobTitle || jobData.companyName) {
    createButton(jobData);
  }

  const observer = new MutationObserver(() => {
    const existing = document.getElementById("pursuit-save-btn");
    if (!existing) {
      const newData = extract();
      if (newData.jobTitle || newData.companyName) {
        createButton(newData);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
