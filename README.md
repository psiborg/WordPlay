# WordPlay — Scrabble & Crossplay Helper

A fast, fully offline-capable Progressive Web App for finding valid words from a set of available letters, with Scrabble and NYT Crossplay scoring, crossword pattern matching, and 11 built-in themes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

### Word Search
- **Rack search** — enter up to 20 available letters; every valid word that can be formed from those tiles is returned
- **Wildcard tiles** — use `?` as a blank tile matching any letter; wildcard-filled letters are highlighted in a distinct colour with a split score display (e.g. `NERDY: 9 | 5 pts` where the blank-filled letter and its zero-value score are shown in the wildcard colour)
- **Pattern filters** — narrow results with three independent fields that can be combined freely:
  - **Starts With** — word must begin with the given letters (e.g. `PRE`)
  - **Contains** — word must include the given substring (e.g. `ING`)
  - **Ends With** — word must end with the given letters (e.g. `TION`)
- Pattern letters are treated as **board tiles** (free) and do not consume letters from the rack — enabling correct crossword-style lookups

### Results
- **Grouped by word length** — longest words shown first, each group collapsible
- **Sort per group** — toggle between **A–Z** alphabetical and **Pts ↓** (highest score first) independently per length group; defaults to highest points
- **Length filter chips** — filter the visible groups down to a specific word length with one click
- **Score range** — each group header shows the min–max point range across its words
- **Click to copy** — tap any word card to copy it to the clipboard; a brief green flash confirms the action

### Scoring
- **Scrabble** — standard international tile values
- **NYT Crossplay** — New York Times Crossplay tile values
- Toggle between modes via the ☰ menu; the active mode is persisted to `localStorage` and all visible scores update immediately, including the tile rack badges and footer reference key

### Themes
11 built-in themes, each with a matched font pairing, selectable from the ☰ menu → **Theme**:

| # | Theme | Vibe | Fonts |
|---|-------|------|-------|
| 1 | Traditional | Warm parchment, classic Scrabble | Playfair Display · DM Sans |
| 2 | Modern / Minimal | Clean, neutral, professional | Inter · JetBrains Mono |
| 3 | Tech / Cyber | Terminal hacker vibe | Share Tech Mono |
| 4 | Fun / Playful | Friendly, casual, creative | Fredoka One · Nunito |
| 5 | Nature / Calm | Relaxing, organic | Lora · Source Sans 3 |
| 6 | SaaS Dashboard | Data-focused, dark | IBM Plex Sans · IBM Plex Mono |
| 7 | Gaming / Immersive | Cinematic, high-contrast | Orbitron · Rajdhani |
| 8 | Reading / Content | Comfortable, warm, readable | Libre Baskerville · Crimson Pro |
| 9 | Solarized | Balanced, easy on eyes | Fira Sans · Fira Code |
| 10 | High Contrast | WCAG AAA accessibility | Atkinson Hyperlegible · Overpass Mono |
| 11 | AMOLED | True black, power-saving | Exo 2 · Roboto Mono |

Theme selection is persisted to `localStorage` and applied instantly with live-preview swatches in the picker dialog.

### PWA & Offline
- **Installable** — add to home screen on iOS, Android, and desktop browsers via `manifest.json`
- **Full offline support** — service worker (`sw.js`) pre-caches all assets on first load using a three-tier strategy:
  - *Cache-first* for `dawg.json` and all 64 font files
  - *Stale-while-revalidate* for the app shell (`index.html`, `app.css`, `app.js`, `fonts.css`)
  - *Network-first with cache fallback* for everything else
- Bump `CACHE_VERSION` in `sw.js` to invalidate and refresh the cache on new deployments

---

## Dictionary

The app uses the **SOWPODS** tournament word list — the international competitive Scrabble standard:

- **267,751 valid words**, lengths 2–15
- Stored as a **Directed Acyclic Word Graph (DAWG)** in `dawg.json` for fast, memory-efficient searching
- The DAWG reduces 589,315 trie nodes to 77,808 nodes (**86.8% reduction**) via bottom-up suffix merging
- Rack searches are **10–700× faster** than scanning a flat word list, with early subtree pruning at every branch

### Performance vs flat array (SOWPODS, 267k words)

| Structure | Memory | Rack search | startsWith |
|-----------|--------|-------------|------------|
| Flat array | ~19 MB | ~21 ms | ~2.6 ms |
| DAWG | ~5.3 MB | ~0.07–2 ms | ~0.3 ms |

### Rebuilding the dictionary

To use a different word list, regenerate `dawg.json` from any newline-separated plain-text file:

```bash
python3 build_dawg.py words.txt dawg.json
```

`build_dawg.py` builds the trie, minimizes it to a DAWG, verifies all words round-trip correctly, then writes the compact JSON. It requires no third-party Python packages.

---

## Scoring Tables

| Tile | Scrabble | Crossplay |
|------|----------|-----------|
| A | 1 | 1 |
| B | 3 | 4 |
| C | 3 | 3 |
| D | 2 | 2 |
| E | 1 | 1 |
| F | 4 | 4 |
| G | 2 | 4 |
| H | 4 | 3 |
| I | 1 | 1 |
| J | 8 | 10 |
| K | 5 | 6 |
| L | 1 | 2 |
| M | 3 | 3 |
| N | 1 | 1 |
| O | 1 | 1 |
| P | 3 | 3 |
| Q | 10 | 10 |
| R | 1 | 1 |
| S | 1 | 1 |
| T | 1 | 1 |
| U | 1 | 2 |
| V | 4 | 6 |
| W | 4 | 5 |
| X | 8 | 8 |
| Y | 4 | 4 |
| Z | 10 | 10 |

Blank tiles (`?`) always score 0 regardless of the letter they represent.

---

## File Structure

```
WordPlay/
├── index.html          — App shell; all markup, no inline scripts or styles
├── app.css             — All styles: 11 theme token blocks + component CSS
├── app.js              — All logic: DAWG loader, search engine, UI, themes, menu
├── fonts.css           — 64 local @font-face declarations (no Google Fonts)
├── sw.js               — Service worker; offline caching strategies
├── manifest.json       — PWA manifest for home screen installation
├── dawg.json           — Serialised DAWG (2.3 MB; 267,751 words, 77,808 nodes)
├── words.txt           — Raw SOWPODS word list (2.6 MB; source for build_dawg.py)
├── build_dawg.py       — Python script to rebuild dawg.json from any word list
└── fonts/              — 64 woff2 font files across 26 subdirectories
    ├── atkinson-hyperlegible/
    ├── courier-prime/
    ├── crimson-pro/
    ├── dm-mono/
    ├── dm-sans/
    ├── exo-2/
    ├── fira-code/
    ├── fira-sans/
    ├── fredoka-one/
    ├── ibm-plex-mono/
    ├── ibm-plex-sans/
    ├── inconsolata/
    ├── inter/
    ├── jetbrains-mono/
    ├── libre-baskerville/
    ├── lora/
    ├── nunito/
    ├── orbitron/
    ├── overpass-mono/
    ├── playfair-display/
    ├── rajdhani/
    ├── roboto-mono/
    ├── share-tech-mono/
    ├── source-code-pro/
    ├── source-sans-3/
    └── space-mono/
```

---

## Getting Started

No build step or dependencies required. Serve the files from any static HTTP server — opening `index.html` directly as a `file://` URL will block the `fetch('dawg.json')` call due to browser security policy.

### Local development

```bash
# Python (built-in, zero config)
python3 -m http.server 8080

# Node.js
npx serve .

# VS Code
# Use the "Live Server" extension → right-click index.html → Open with Live Server
```

Then open `http://localhost:8080`.

### Deploy

Drop all files (including `fonts/`, `dawg.json`, and `words.txt`) onto any static host:

| Host | Method |
|------|--------|
| **GitHub Pages** | Push to repo; enable Pages from the `main` branch root |
| **Netlify** | Drag folder to [app.netlify.com/drop](https://app.netlify.com/drop) |
| **Vercel** | `npx vercel` from the project folder |
| **Cloudflare Pages** | `wrangler pages deploy .` |

> **Note:** `words.txt` is the source used by `build_dawg.py` but is not required at runtime — the app loads `dawg.json` exclusively. You can omit it from your deployment to save ~2.6 MB.

---

## How to Use

1. **Type your rack** into *Available Letters*. Letters render as interactive tile chips showing their point value in the active scoring mode. Click any chip to remove that letter.
2. Use `?` for a blank tile. Results that used a blank highlight the wildcard letter and display a split score (`full pts | without-blank pts`).
3. Optionally fill in any combination of *Starts With*, *Contains*, and *Ends With* — all three filters are independent and can be used together.
4. Press **Find Words** or hit **Enter**.
5. Results appear grouped by word length (longest first), sorted by highest points by default.
6. Use the **length chips** above the results to filter to a specific word length.
7. Toggle **A–Z / Pts** inside any group header to re-sort that group independently.
8. Click a group header to **collapse or expand** it.
9. Click any word card to **copy it** to the clipboard.

### Menu (☰)

| Item | Action |
|------|--------|
| **Scoring Mode** | Cycles between Scrabble and NYT Crossplay; updates all scores and tile badges live |
| **Theme** | Opens the theme picker dialog with 11 themes and live-preview colour swatches |
| **About WordPlay** | Shows app version, active service worker cache key, dictionary stats, and a GitHub link |

---

## Browser Support

Requires a modern browser with ES2020+ and the Cache API:

- Chrome / Edge 90+
- Firefox 90+
- Safari 15.4+ (iOS & macOS)

The `color-mix()` CSS function used for focus rings requires Chrome 111+, Edge 111+, Firefox 113+, or Safari 16.2+. Older browsers degrade gracefully without the focus-ring glow.

---

## License

Apache 2.0 — free to use, modify, and distribute.

---

## Links

- **GitHub:** [https://github.com/psiborg/WordPlay](https://github.com/psiborg/WordPlay)
