const FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "location",
  "linkedin",
  "website",
  "jobwardUrl",
];

const $ = (id) => document.getElementById(id);
const setStatus = (t) => ($("status").textContent = t);

// Load saved profile into the form.
chrome.storage.local.get("jobwardProfile", (d) => {
  const p = d.jobwardProfile || {};
  FIELDS.forEach((f) => {
    if ($(f)) $(f).value = p[f] || (f === "jobwardUrl" ? "http://localhost:3000" : "");
  });
});

$("saveProfile").onclick = () => {
  const p = {};
  FIELDS.forEach((f) => (p[f] = $(f).value.trim()));
  chrome.storage.local.set({ jobwardProfile: p }, () => setStatus("Profile saved."));
};

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

$("autofill").onclick = async () => {
  const d = await chrome.storage.local.get("jobwardProfile");
  const p = d.jobwardProfile || {};
  if (!p.email) return setStatus("Add your profile first ↓");
  const tab = await activeTab();
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillForm,
      args: [p],
    });
    const r = res.result || { filled: 0, missed: 0 };
    setStatus(
      `Filled ${r.filled} field(s)` +
        (r.missed ? `, ${r.missed} still need you (highlighted).` : ".")
    );
  } catch (e) {
    setStatus("Can't autofill on this page.");
  }
};

$("save").onclick = async () => {
  const d = await chrome.storage.local.get("jobwardProfile");
  const p = d.jobwardProfile || {};
  const base = (p.jobwardUrl || "http://localhost:3000").replace(/\/$/, "");
  const tab = await activeTab();
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeJob,
    });
    const payload = encodeURIComponent(JSON.stringify(res.result));
    chrome.tabs.create({ url: `${base}/jobs#prefill=${payload}` });
    setStatus("Opening Jobward…");
  } catch (e) {
    setStatus("Couldn't read this page.");
  }
};

// --- Injected into the page (must be self-contained, no outer references) ---

function fillForm(profile) {
  const map = [
    [/first.?name|given.?name|\bfname\b/, profile.firstName],
    [/last.?name|surname|family.?name|\blname\b/, profile.lastName],
    [/full.?name|^\s*name|your name|legal name/, `${profile.firstName || ""} ${profile.lastName || ""}`.trim()],
    [/e-?mail/, profile.email],
    [/phone|mobile|\btel\b/, profile.phone],
    [/city|location|based|address/, profile.location],
    [/linkedin/, profile.linkedin],
    [/website|portfolio|personal site|github/, profile.website],
  ];

  const labelText = (el) => {
    let t = `${el.name || ""} ${el.id || ""} ${el.placeholder || ""} ${el.getAttribute("aria-label") || ""}`;
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l) t += " " + l.textContent;
    }
    const wrap = el.closest("label");
    if (wrap) t += " " + wrap.textContent;
    return t.toLowerCase();
  };

  const setValue = (el, val) => {
    const proto =
      el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  let filled = 0;
  let missed = 0;
  document.querySelectorAll("input, textarea").forEach((el) => {
    const type = (el.type || "").toLowerCase();
    if (["hidden", "password", "file", "submit", "button", "checkbox", "radio"].includes(type)) return;
    if (el.value && el.value.trim()) return;
    const text = labelText(el);
    for (const [re, val] of map) {
      if (val && re.test(text)) {
        try {
          setValue(el, val);
          filled++;
        } catch (e) {}
        return;
      }
    }
    if (el.required) {
      el.style.outline = "2px solid #FBBF24";
      missed++;
    }
  });
  return { filled, missed };
}

function scrapeJob() {
  const pick = (sels) => {
    for (const s of sels) {
      const e = document.querySelector(s);
      if (e && e.textContent && e.textContent.trim()) return e.textContent.trim();
    }
    return "";
  };
  const title =
    pick(["h1", '[class*="posting-headline"]', ".app-title", '[data-testid*="title"]']) ||
    document.title;
  let company = pick(['[class*="company-name"]', "[data-company]"]);
  if (!company) {
    const og = document.querySelector('meta[property="og:site_name"]');
    company = og ? og.content : "";
  }
  if (!company) company = location.hostname.replace(/^www\./, "").split(".")[0];
  const desc =
    pick(['[class*="job-description"]', '[class*="description"]', "#content", "main", "article"]) ||
    document.body.innerText;
  return {
    title: (title || "").slice(0, 200),
    company: (company || "").slice(0, 120),
    url: location.href,
    description: (desc || "").slice(0, 8000),
  };
}
