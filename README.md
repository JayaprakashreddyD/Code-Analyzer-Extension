# ⚡ Code Complexity Analyzer — Browser Extension

Analyze **Time Complexity**, **Space Complexity**, and get a clear **Explanation** of your code directly inside any coding platform.

---

## 🚀 Installation (Chrome / Edge / Brave)

1. **Download / unzip** this folder somewhere on your computer.
2. Open your browser and go to:
   - Chrome → `chrome://extensions`
   - Edge   → `edge://extensions`
   - Brave  → `brave://extensions`
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **"Load unpacked"** and select this folder.
5. The extension is now installed! Pin it from the extensions menu.

---

## 🔑 Add Your API Key

1. Click the extension icon in the toolbar.
2. Paste your **Anthropic API key** (starts with `sk-ant-...`).
   - Get one free at: https://console.anthropic.com/account/keys
3. Click **Save API Key**.

---

## 🖥️ Supported Platforms

The **Analyze** button appears automatically on:

| Platform       | URL                      |
|----------------|--------------------------|
| LeetCode       | leetcode.com             |
| HackerRank     | hackerrank.com           |
| Codeforces     | codeforces.com           |
| CodePen        | codepen.io               |
| GitHub         | github.com               |
| Replit         | replit.com               |
| CodeSandbox    | codesandbox.io           |
| **Any site**   | with Monaco / CM / Ace editor |

---

## 📊 What You Get

```
┌─────────────────────────────────────────┐
│  ⚡ Code Complexity Analysis             │
├────────────────┬────────────────────────┤
│ Time Complexity│ O(n log n)             │
│ Space Complexity│ O(n)                 │
├────────────────┴────────────────────────┤
│ Explanation                             │
│  The algorithm uses merge sort which   │
│  divides the array recursively (log n  │
│  levels) and merges in O(n) time per   │
│  level, giving O(n log n) overall...   │
└─────────────────────────────────────────┘
```

Complexity cards are **color-coded**:
- 🟢 Green  → O(1), O(log n) — Excellent
- 🔵 Blue   → O(n), O(n log n) — Good
- 🟡 Yellow → O(n²) — Acceptable
- 🔴 Red    → O(2ⁿ), O(n!) — Poor

---

## 🔒 Privacy

- Your API key is stored **only in your browser's local storage**.
- Code is sent to **Anthropic's API** for analysis (same as Claude.ai).
- Nothing is stored on any third-party server.

---

## 🛠️ Tech Stack

- Manifest V3 Chrome Extension
- Vanilla JS content script (no frameworks, fast load)
- Claude claude-sonnet-4-20250514 via Anthropic API
- Detects Monaco Editor, CodeMirror 5/6, Ace Editor, and `<textarea>`
