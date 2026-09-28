// popup.js — handles API key storage in chrome.storage.local

const input     = document.getElementById("api-key-input");
const saveBtn   = document.getElementById("save-btn");
const statusMsg = document.getElementById("status-msg");
const badge     = document.getElementById("key-saved-badge");
const toggle    = document.getElementById("toggle-visibility");

// ── SVG paths for eye open / eye closed ──────────────────────────────────────
const SVG_NS = "http://www.w3.org/2000/svg";

function buildEyeOpen() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("id", "eye-svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z");
  const c = document.createElementNS(SVG_NS, "circle");
  c.setAttribute("cx", "12"); c.setAttribute("cy", "12"); c.setAttribute("r", "3");
  svg.appendChild(p); svg.appendChild(c);
  return svg;
}

function buildEyeClosed() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("id", "eye-svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  const p1 = document.createElementNS(SVG_NS, "path");
  p1.setAttribute("d", "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94");
  const p2 = document.createElementNS(SVG_NS, "path");
  p2.setAttribute("d", "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19");
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1","1"); line.setAttribute("y1","1");
  line.setAttribute("x2","23"); line.setAttribute("y2","23");
  svg.appendChild(p1); svg.appendChild(p2); svg.appendChild(line);
  return svg;
}

// ── Inject initial eye icon ───────────────────────────────────────────────────
toggle.appendChild(buildEyeOpen());

// ── Load saved key on open ───────────────────────────────────────────────────
chrome.storage.local.get("cca_api_key", (result) => {
  const key = result && result.cca_api_key;
  if (key) {
    input.value = key;
    badge.classList.add("visible");
    showStatus("API key loaded ✓", true);
  }
});

// ── Toggle show / hide ───────────────────────────────────────────────────────
let visible = false;
toggle.addEventListener("click", () => {
  visible = !visible;
  input.type = visible ? "text" : "password";

  // Replace the SVG icon inside the button
  const old = toggle.querySelector("svg");
  if (old) old.remove();
  toggle.appendChild(visible ? buildEyeClosed() : buildEyeOpen());
});

// ── Save key ─────────────────────────────────────────────────────────────────
saveBtn.addEventListener("click", () => {
  const key = input.value.trim();

  if (!key) {
    showStatus("⚠ Please enter an API key.", false);
    return;
  }

  if (!key.startsWith("sk-or-")) {
    showStatus("⚠ OpenRouter keys start with 'sk-or-…'", false);
    return;
  }

  // Disable button while saving
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  chrome.storage.local.set({ cca_api_key: key }, () => {
    if (chrome.runtime.lastError) {
      showStatus("✗ Save failed: " + chrome.runtime.lastError.message, false);
      saveBtn.disabled = false;
      saveBtn.textContent = "Save API Key";
      return;
    }
    badge.classList.add("visible");
    showStatus("✓ API key saved successfully!", true);
    saveBtn.disabled = false;
    saveBtn.textContent = "✓ Saved!";
    setTimeout(() => { saveBtn.textContent = "Save API Key"; }, 2500);
  });
});

// ── Enter shortcut ───────────────────────────────────────────────────────────
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveBtn.click();
});

// ── Helper ───────────────────────────────────────────────────────────────────
function showStatus(msg, ok) {
  statusMsg.textContent = msg;
  statusMsg.style.color = ok ? "#34d399" : "#f87171";
  statusMsg.style.fontWeight = "500";
}
