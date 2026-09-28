// ─── Code Complexity Analyzer – Content Script ───────────────────────────────
(function () {
  "use strict";

  if (window.__codeAnalyzerInjected) return;
  window.__codeAnalyzerInjected = true;

  // ─── Platform definitions ──────────────────────────────────────────────────
  const PLATFORMS = [
    {
      name: "leetcode",
      match: () => location.hostname.includes("leetcode.com"),
      getCode: () => extractCode(),
      anchorSelector: ".editor-wrapper, .monaco-editor, [data-cy='code-editor']",
    },
    {
      name: "hackerrank",
      match: () => location.hostname.includes("hackerrank.com"),
      getCode: () => extractCode(),
      anchorSelector: ".editor-container, .CodeMirror, .ace_editor",
    },
    {
      name: "codeforces",
      match: () => location.hostname.includes("codeforces.com"),
      getCode: () => extractCode(),
      anchorSelector: ".ace_editor, #editor, textarea[name='source']",
    },
    {
      name: "codepen",
      match: () => location.hostname.includes("codepen.io"),
      getCode: () => extractCode(),
      anchorSelector: ".CodeMirror",
    },
    {
      name: "github",
      match: () => location.hostname.includes("github.com"),
      getCode: () => extractCode(),
      anchorSelector: ".monaco-editor, .CodeMirror, .highlight pre",
    },
    {
      name: "replit",
      match: () => location.hostname.includes("replit.com"),
      getCode: () => extractCode(),
      anchorSelector: ".cm-editor, .monaco-editor",
    },
    {
      name: "codesandbox",
      match: () => location.hostname.includes("codesandbox.io"),
      getCode: () => extractCode(),
      anchorSelector: ".monaco-editor",
    },
    {
      name: "generic",
      match: () => true,
      getCode: () => extractCode(),
      anchorSelector: ".monaco-editor, .CodeMirror, .cm-editor, .ace_editor, pre code",
    },
  ];

  // ─── Code extraction ───────────────────────────────────────────────────────

  // Method 1: Monaco JS model (window.monaco global)
  function getMonacoModel() {
    try {
      if (window.monaco && window.monaco.editor) {
        const models = window.monaco.editor.getModels();
        for (var i = 0; i < models.length; i++) {
          var v = models[i].getValue();
          if (v && v.trim().length > 0) return v;
        }
      }
    } catch (e) {}
    return null;
  }

  // Method 2: Monaco DOM node internal model
  function getMonacoDomModel() {
    try {
      var editors = document.querySelectorAll(".monaco-editor");
      for (var i = 0; i < editors.length; i++) {
        var el = editors[i];
        var v = (el._modelData && el._modelData.model && el._modelData.model.getValue && el._modelData.model.getValue()) ||
                (el.__vue__ && el.__vue__.editor && el.__vue__.editor.getModel && el.__vue__.editor.getModel() && el.__vue__.editor.getModel().getValue && el.__vue__.editor.getModel().getValue());
        if (v && v.trim().length > 0) return v;
      }
    } catch (e) {}
    return null;
  }

  // Method 3: Read rendered view-lines from Monaco DOM (LeetCode fallback)
  function getMonacoViewLines() {
    try {
      var containers = document.querySelectorAll(".monaco-editor");
      for (var c = 0; c < containers.length; c++) {
        var lineEls = containers[c].querySelectorAll(".view-lines .view-line");
        if (!lineEls.length) continue;
        var lines = [];
        for (var i = 0; i < lineEls.length; i++) {
          var el = lineEls[i];
          var top = parseInt(el.style.top || "0", 10);
          lines.push({ top: top, text: el.innerText || el.textContent || "" });
        }
        lines.sort(function (a, b) { return a.top - b.top; });
        var code = lines.map(function (l) { return l.text; }).join("\n");
        if (code.trim().length > 0) return code;
      }
    } catch (e) {}
    return null;
  }

  // Method 4: LeetCode stores code in React fiber / Redux state
  function getLeetCodeReactCode() {
    try {
      // Try to find the code editor textarea that LeetCode sometimes uses
      var textareas = document.querySelectorAll("textarea");
      for (var i = 0; i < textareas.length; i++) {
        var val = textareas[i].value;
        if (val && val.trim().length > 10) return val;
      }
    } catch (e) {}
    return null;
  }

  // Method 5: CodeMirror 5 & 6
  function getCodeMirrorCode() {
    try {
      var cm5 = document.querySelector(".CodeMirror");
      if (cm5 && cm5.CodeMirror) {
        var v = cm5.CodeMirror.getValue();
        if (v && v.trim()) return v;
      }
      var cm6all = document.querySelectorAll(".cm-editor");
      for (var i = 0; i < cm6all.length; i++) {
        var el = cm6all[i];
        if (el.view && el.view.state) {
          var v2 = el.view.state.doc.toString();
          if (v2 && v2.trim()) return v2;
        }
      }
    } catch (e) {}
    return null;
  }

  // Method 6: Ace editor
  function getAceCode() {
    try {
      var el = document.querySelector(".ace_editor");
      if (el && el.env && el.env.editor) return el.env.editor.getValue();
    } catch (e) {}
    return null;
  }

  // Method 7: plain textarea
  function getTextareaCode() {
    try {
      var selectors = ['textarea[name="source"]', 'textarea.code-input', '#code-editor', 'textarea[class*="code"]', 'textarea[id*="editor"]'];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.value && el.value.trim().length > 0) return el.value;
      }
    } catch (e) {}
    return null;
  }

  // Method 8: pre>code (GitHub file view)
  function getPreCode() {
    try {
      var el = document.querySelector("pre code, .highlight pre");
      var v = el && (el.innerText || el.textContent);
      return (v && v.trim()) ? v : null;
    } catch (e) {}
    return null;
  }

  // Master extractor
  function extractCode() {
    return getMonacoModel()
      || getMonacoDomModel()
      || getMonacoViewLines()
      || getLeetCodeReactCode()
      || getCodeMirrorCode()
      || getAceCode()
      || getTextareaCode()
      || getPreCode();
  }

  // ─── Button injection ──────────────────────────────────────────────────────
  var analyzeBtn = null;
  var modalOverlay = null;

  function injectButton(platform) {
    if (document.getElementById("cca-analyze-btn")) return;

    // For LeetCode, just append to body as fixed button (editor is in iframe/shadow)
    analyzeBtn = document.createElement("button");
    analyzeBtn.id = "cca-analyze-btn";

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16"); svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "2.5");
    var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("points", "22 12 18 12 15 21 9 3 6 12 2 12");
    svg.appendChild(poly);

    var span = document.createElement("span");
    span.textContent = "Analyze";

    analyzeBtn.appendChild(svg);
    analyzeBtn.appendChild(span);
    analyzeBtn.title = "Analyze code complexity";
    analyzeBtn.addEventListener("click", function () { handleAnalyze(platform); });
    document.body.appendChild(analyzeBtn);
  }

  // ─── Modal ─────────────────────────────────────────────────────────────────
  function createModal() {
    if (document.getElementById("cca-modal-overlay")) return;
    modalOverlay = document.createElement("div");
    modalOverlay.id = "cca-modal-overlay";
    modalOverlay.innerHTML = [
      '<div id="cca-modal">',
        '<div id="cca-modal-header">',
          '<div id="cca-modal-title">',
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
            'Code Complexity Analysis',
          '</div>',
          '<button id="cca-modal-close" title="Close">\u2715</button>',
        '</div>',
        '<div id="cca-modal-body">',
          '<div id="cca-loading" class="cca-hidden">',
            '<div class="cca-spinner"></div>',
            '<p>Analyzing your code\u2026</p>',
          '</div>',
          '<div id="cca-result" class="cca-hidden">',
            '<div class="cca-metric-row">',
              '<div class="cca-metric-card" id="cca-time-card">',
                '<div class="cca-metric-label">',
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                  'Time Complexity',
                '</div>',
                '<div class="cca-metric-value" id="cca-time-value">\u2014</div>',
              '</div>',
              '<div class="cca-metric-card" id="cca-space-card">',
                '<div class="cca-metric-label">',
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
                  'Space Complexity',
                '</div>',
                '<div class="cca-metric-value" id="cca-space-value">\u2014</div>',
              '</div>',
            '</div>',
            '<div class="cca-section">',
              '<div class="cca-section-label">',
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
                'Explanation',
              '</div>',
              '<div class="cca-explanation" id="cca-explanation">\u2014</div>',
            '</div>',
          '</div>',
          '<div id="cca-error" class="cca-hidden">',
            '<div class="cca-error-icon">\u26a0</div>',
            '<p id="cca-error-msg">Something went wrong.</p>',
            '<button id="cca-retry-btn">Try Again</button>',
          '</div>',
          '<div id="cca-no-code" class="cca-hidden">',
            '<div class="cca-error-icon">\uD83D\uDD0D</div>',
            '<p>No code detected on this page.<br>Make sure an editor is open and contains code.</p>',
          '</div>',
        '</div>',
        '<div id="cca-modal-footer">',
          '<span id="cca-platform-badge"></span>',
          '<span id="cca-status-text"></span>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(modalOverlay);

    document.getElementById("cca-modal-close").addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function openModal() {
    if (!modalOverlay) createModal();
    modalOverlay.classList.add("cca-visible");
    showSection("loading");
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove("cca-visible");
  }

  function showSection(section) {
    ["cca-loading", "cca-result", "cca-error", "cca-no-code"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add("cca-hidden");
    });
    var show = document.getElementById("cca-" + section);
    if (show) show.classList.remove("cca-hidden");
  }

  // ─── Analyze ───────────────────────────────────────────────────────────────
  async function handleAnalyze(platform) {
    openModal();

    var badge = document.getElementById("cca-platform-badge");
    if (badge) badge.textContent = platform.name.toUpperCase();

    var code = platform.getCode();
    if (!code || !code.trim()) {
      showSection("no-code");
      return;
    }

    var stored = await chrome.storage.local.get("cca_api_key");
    var apiKey = stored.cca_api_key;
    if (!apiKey) {
      document.getElementById("cca-error-msg").textContent =
        "No API key found. Click the extension icon and enter your OpenRouter API key first.";
      showSection("error");
      return;
    }

    try {
      var result = await callOpenRouter(apiKey, code);
      renderResult(result);
    } catch (err) {
      document.getElementById("cca-error-msg").textContent = err.message;
      showSection("error");
      var retryBtn = document.getElementById("cca-retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", function () { handleAnalyze(platform); }, { once: true });
      }
    }
  }

  async function callOpenRouter(apiKey, code) {
    var response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "HTTP-Referer": "https://code-analyzer-extension",
        "X-Title": "Code Complexity Analyzer",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: 'You are an expert algorithm analyst. Analyze the provided code and respond ONLY with a valid JSON object (no markdown, no backticks) in this exact format:\n{\n  "time_complexity": "O(...) \u2013 brief label",\n  "space_complexity": "O(...) \u2013 brief label",\n  "explanation": "Clear, concise explanation of why these complexities apply, covering the key loops, recursion, or data structures involved. 3-5 sentences."\n}',
          },
          {
            role: "user",
            content: "Analyze this code:\n\n" + code.slice(0, 8000),
          },
        ],
      }),
    });

    if (!response.ok) {
      var err = await response.json().catch(function () { return {}; });
      throw new Error((err && err.error && err.error.message) || ("API error " + response.status + ": " + response.statusText));
    }

    var data = await response.json();
    var text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";

    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (_) {
      throw new Error("Could not parse AI response. Raw: " + text.slice(0, 200));
    }
  }

  function renderResult(data) {
    document.getElementById("cca-time-value").textContent = data.time_complexity || "\u2014";
    document.getElementById("cca-space-value").textContent = data.space_complexity || "\u2014";
    document.getElementById("cca-explanation").textContent = data.explanation || "\u2014";
    colorCard("cca-time-card", data.time_complexity);
    colorCard("cca-space-card", data.space_complexity);
    showSection("result");
    var st = document.getElementById("cca-status-text");
    if (st) st.textContent = "Analysis complete";
  }

  function colorCard(id, str) {
    var card = document.getElementById(id);
    if (!card || !str) return;
    var s = str.toLowerCase();
    card.classList.remove("cca-good", "cca-ok", "cca-warn", "cca-bad");
    if (s.includes("o(1)") || s.includes("o(log")) card.classList.add("cca-good");
    else if (s.includes("o(n log") || s.includes("o(nlog")) card.classList.add("cca-ok");
    else if (s.includes("o(n)")) card.classList.add("cca-ok");
    else if (s.includes("o(n^2)") || s.includes("o(n2)") || s.includes("o(n\u00b2)")) card.classList.add("cca-warn");
    else if (s.includes("o(2^n)") || s.includes("o(n!)") || s.includes("o(n^3)")) card.classList.add("cca-bad");
    else card.classList.add("cca-ok");
  }

  // ─── Observer: re-inject on SPA navigation ────────────────────────────────
  function watchAndInject() {
    var platform = detectPlatform();

    function tryInject() {
      if (!document.getElementById("cca-analyze-btn")) {
        injectButton(platform);
      }
    }

    tryInject();
    var observer = new MutationObserver(tryInject);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function detectPlatform() {
    for (var i = 0; i < PLATFORMS.length; i++) {
      if (PLATFORMS[i].match()) return PLATFORMS[i];
    }
    return PLATFORMS[PLATFORMS.length - 1];
  }

  // ─── Boot ──────────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchAndInject);
  } else {
    watchAndInject();
  }
})();
