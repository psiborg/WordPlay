/* ========================================================
   WordPlay - Scrabble & Crossplay Helper  |  app.js
   ======================================================== */

'use strict';

/* -- SCORING TABLES --------------------------------------- */
const SCORES_CROSSPLAY = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1, J:8,
  K:5, L:1, M:3, N:1, O:1, P:3, Q:10,R:1, S:1, T:1,
  U:1, V:4, W:4, X:8, Y:4, Z:10
};

const SCORES_SCRABBLE = {
  A:1, B:4, C:4, D:3, E:1, F:5, G:4, H:5, I:1, J:8,
  K:6, L:2, M:4, N:2, O:1, P:4, Q:10,R:2, S:2, T:2,
  U:2, V:6, W:5, X:8, Y:5, Z:10
};

const SCORING_MODES = {
  scrabble:  { label: 'SCR', full: 'Scrabble',       scores: SCORES_SCRABBLE },
  crossplay: { label: 'NYT', full: 'NYT Crossplay',  scores: SCORES_CROSSPLAY }
};

const SCORING_KEY = 'wordplay-scoring';
let activeScoringMode = localStorage.getItem(SCORING_KEY) || 'scrabble';

/** Active score table — always read through this. */
function getScores() {
  return SCORING_MODES[activeScoringMode].scores;
}

/**
 * Calculate the point value for a word using the active scoring mode.
 * @param {string} word
 * @returns {number}
 */
function scoreWord(word) {
  const scores = getScores();
  return [...word.toUpperCase()].reduce((sum, ch) => sum + (scores[ch] || 0), 0);
}

/* -- SCORING TOGGLE --------------------------------------- */
/**
 * Group letters from a score table into bands by value and
 * render the footer key tiles.
 */
function renderFooter() {
  const mode    = SCORING_MODES[activeScoringMode];
  const scores  = mode.scores;
  const label   = document.getElementById('footerLabel');
  const keyEl   = document.getElementById('footerKey');
  if (label) label.textContent = `${mode.full} values · Click any word to copy`;

  if (!keyEl) return;

  // Group letters by point value
  const bands = {};
  for (const [letter, pts] of Object.entries(scores)) {
    if (!bands[pts]) bands[pts] = [];
    bands[pts].push(letter);
  }

  keyEl.innerHTML = Object.keys(bands)
    .map(Number)
    .sort((a, b) => a - b)
    .map(pts => {
      const letters = bands[pts].sort().join(',');
      return `<div class="key-tile">${letters} <span>×${pts}</span></div>`;
    })
    .join('');
}

/**
 * Apply the scoring mode: update button label, persist, refresh footer,
 * and re-render any current results so point values update in real time.
 */
function applyScoringMode(mode) {
  activeScoringMode = mode;
  localStorage.setItem(SCORING_KEY, mode);

  const menuVal = document.getElementById('menuScoringValue');
  if (menuVal) menuVal.textContent = SCORING_MODES[mode].full;

  renderFooter();

  // Re-render letter rack tiles so score badges reflect the new mode
  const lettersVal = document.getElementById('lettersInput');
  if (lettersVal && lettersVal.value) renderLetterTiles(lettersVal.value);

  // Re-render live results so all point values update immediately
  if (Object.keys(currentGroups).length > 0) {
    sortState = {};   // reset per-group sort so points re-sort correctly
    reRender();
  }
}

// Scoring toggle — wired via the menu item (see menu section below)

/* -- THEME SYSTEM ----------------------------------------- */

/**
 * Theme definitions — id must match [data-theme="..."] in app.css.
 * The palette object drives the swatch preview inside each card.
 */
const THEMES = [
  {
    id: 'traditional',
    name: 'Traditional',
    desc: 'Warm parchment, classic Scrabble feel',
    fonts: 'Playfair Display · DM Sans',
    emoji: '📜',
    palette: {
      bg: '#fdf6e3', surface: '#fff9ee', border: '#d4b88a',
      accent: '#d4500a', tile: '#f5e6c8', tileBorder: '#c8a96e',
      tileText: '#3b2a0f', text: '#2a1a05', muted: '#9c7a3c'
    }
  },
  {
    id: 'modern',
    name: 'Modern / Minimal',
    desc: 'Clean, neutral, professional',
    fonts: 'Inter · JetBrains Mono',
    emoji: '⬜',
    palette: {
      bg: '#fafafa', surface: '#ffffff', border: '#e0e0e0',
      accent: '#1976d2', tile: '#f0f0f0', tileBorder: '#bdbdbd',
      tileText: '#212121', text: '#212121', muted: '#9e9e9e'
    }
  },
  {
    id: 'cyber',
    name: 'Tech / Cyber',
    desc: 'Futuristic terminal hacker vibe',
    fonts: 'Share Tech Mono',
    emoji: '💻',
    palette: {
      bg: '#020c02', surface: '#061306', border: '#1b5e20',
      accent: '#00e676', tile: '#0d1f0d', tileBorder: '#00c853',
      tileText: '#00ff41', text: '#00ff41', muted: '#2e7d32'
    }
  },
  {
    id: 'playful',
    name: 'Fun / Playful',
    desc: 'Friendly, casual, creative',
    fonts: 'Fredoka One · Nunito',
    emoji: '🎉',
    palette: {
      bg: '#fffde7', surface: '#ffffff', border: '#f9a825',
      accent: '#e91e63', tile: '#fff9c4', tileBorder: '#f9a825',
      tileText: '#4a148c', text: '#1a237e', muted: '#7b1fa2'
    }
  },
  {
    id: 'nature',
    name: 'Nature / Calm',
    desc: 'Relaxing, organic, wellness',
    fonts: 'Lora · Source Sans 3',
    emoji: '🌿',
    palette: {
      bg: '#f1f8e9', surface: '#f9fbe7', border: '#a5d6a7',
      accent: '#2e7d32', tile: '#dcedc8', tileBorder: '#8bc34a',
      tileText: '#1b5e20', text: '#1b5e20', muted: '#558b2f'
    }
  },
  {
    id: 'saas',
    name: 'SaaS Dashboard',
    desc: 'Data-focused, efficient, dark',
    fonts: 'IBM Plex Sans · IBM Plex Mono',
    emoji: '📊',
    palette: {
      bg: '#0f1923', surface: '#162030', border: '#2c3e50',
      accent: '#4dabf7', tile: '#1e2a3a', tileBorder: '#3d5a80',
      tileText: '#e0e8f0', text: '#e0e8f0', muted: '#4a6fa5'
    }
  },
  {
    id: 'gaming',
    name: 'Gaming / Immersive',
    desc: 'Dramatic, high-contrast, cinematic',
    fonts: 'Orbitron · Rajdhani',
    emoji: '🎮',
    palette: {
      bg: '#0a0015', surface: '#130025', border: '#3b0764',
      accent: '#a855f7', tile: '#1a0533', tileBorder: '#7c3aed',
      tileText: '#e9d5ff', text: '#f3e8ff', muted: '#7c3aed'
    }
  },
  {
    id: 'reading',
    name: 'Reading / Content',
    desc: 'Comfortable, warm, readable',
    fonts: 'Libre Baskerville · Crimson Pro',
    emoji: '📖',
    palette: {
      bg: '#f8f2e8', surface: '#fdf8f2', border: '#c8b090',
      accent: '#8b4513', tile: '#e8dcc8', tileBorder: '#b8a080',
      tileText: '#2c1e12', text: '#2c1e12', muted: '#9a7a58'
    }
  },
  {
    id: 'solarized',
    name: 'Solarized',
    desc: 'Balanced palette, easy on eyes',
    fonts: 'Fira Sans · Fira Code',
    emoji: '☀️',
    palette: {
      bg: '#002b36', surface: '#073642', border: '#073642',
      accent: '#268bd2', tile: '#073642', tileBorder: '#586e75',
      tileText: '#93a1a1', text: '#eee8d5', muted: '#586e75'
    }
  },
  {
    id: 'highcontrast',
    name: 'High Contrast',
    desc: 'WCAG AAA accessibility theme',
    fonts: 'Atkinson Hyperlegible · Overpass Mono',
    emoji: '♿',
    palette: {
      bg: '#000000', surface: '#000000', border: '#ffffff',
      accent: '#ffff00', tile: '#000000', tileBorder: '#ffffff',
      tileText: '#ffffff', text: '#ffffff', muted: '#aaaaaa'
    }
  },
  {
    id: 'amoled',
    name: 'AMOLED',
    desc: 'True black, power-saving variant',
    fonts: 'Exo 2 · Roboto Mono',
    emoji: '🔋',
    palette: {
      bg: '#000000', surface: '#000000', border: '#1a1a1a',
      accent: '#ff6b00', tile: '#0a0a0a', tileBorder: '#ff6b00',
      tileText: '#ffffff', text: '#ffffff', muted: '#666666'
    }
  }
];

const STORAGE_KEY = 'wordplay-theme';
let activeThemeId = localStorage.getItem(STORAGE_KEY) || 'traditional';

/** Apply a theme id to the document and persist it. */
function applyTheme(id) {
  activeThemeId = id;
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem(STORAGE_KEY, id);
  // Update selected state on any rendered cards
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.themeId === id);
  });
}

/* -- THEME DIALOG ----------------------------------------- */
const themeDialogBackdrop  = document.getElementById('themeDialogBackdrop');
const themeDialogClose     = document.getElementById('themeDialogClose');
const themeGrid            = document.getElementById('themeGrid');

/** Build a mini swatch preview element for a theme. */
function buildSwatch(palette) {
  const swatch = document.createElement('div');
  swatch.className = 'theme-swatch';
  swatch.innerHTML = `
    <div class="swatch-header">
      <div class="swatch-dot"></div>
      <div class="swatch-dot"></div>
    </div>
    <div class="swatch-body">
      <div class="swatch-tile">W</div>
      <div class="swatch-bar"></div>
    </div>`;

  // Apply palette as custom properties directly on the swatch
  // so it renders its own colors regardless of the active theme
  const s = swatch.style;
  s.setProperty('--tc-bg',         palette.bg);
  s.setProperty('--tc-surface',    palette.surface);
  s.setProperty('--tc-border',     palette.border);
  s.setProperty('--tc-accent',     palette.accent);
  s.setProperty('--tc-tile',       palette.tile);
  s.setProperty('--tc-tileborder', palette.tileBorder);
  s.setProperty('--tc-tiletext',   palette.tileText);

  // Wire up child elements that use those vars
  swatch.querySelector('.swatch-header').style.cssText =
    `background:${palette.surface};border-color:${palette.border}`;
  swatch.querySelectorAll('.swatch-dot').forEach(d => d.style.background = palette.accent);
  swatch.querySelector('.swatch-body').style.background = palette.bg;
  const tile = swatch.querySelector('.swatch-tile');
  tile.style.cssText =
    `background:${palette.tile};border-color:${palette.tileBorder};color:${palette.tileText}`;
  swatch.querySelector('.swatch-bar').style.background = palette.accent;

  return swatch;
}

/** Render all theme cards into the grid. */
function buildThemeGrid() {
  themeGrid.innerHTML = '';
  THEMES.forEach(theme => {
    const card = document.createElement('div');
    card.className   = 'theme-card' + (theme.id === activeThemeId ? ' selected' : '');
    card.dataset.themeId = theme.id;
    card.title       = theme.name;

    // Set per-card CSS vars so card chrome uses theme's own colors
    const p = theme.palette;
    card.style.cssText = [
      `background:${p.surface}`,
      `--tc-accent:${p.accent}`,
      `--tc-bg:${p.bg}`,
      `--tc-text:${p.text}`,
      `--tc-muted:${p.muted}`
    ].join(';');

    const info = document.createElement('div');
    info.className = 'theme-card-info';
    info.innerHTML = `
      <div class="theme-card-name" style="color:${p.text}">${theme.emoji} ${theme.name}</div>
      <div class="theme-card-desc" style="color:${p.muted}">${theme.desc}</div>
      <div class="theme-card-fonts" style="color:${p.accent}">${theme.fonts}</div>`;

    card.appendChild(buildSwatch(p));
    card.appendChild(info);

    card.addEventListener('click', () => {
      applyTheme(theme.id);
      // Brief delay so the user sees the check before dialog closes
      setTimeout(closeThemeDialog, 180);
    });

    themeGrid.appendChild(card);
  });
}

function openThemeDialog() {
  buildThemeGrid();
  themeDialogBackdrop.classList.add('open');
  themeDialogBackdrop.setAttribute('aria-hidden', 'false');
  themeDialogClose.focus();
}

function closeThemeDialog() {
  themeDialogBackdrop.classList.remove('open');
  themeDialogBackdrop.setAttribute('aria-hidden', 'true');
  document.getElementById('menuBtn').focus();
  // Update menu theme value label
  const menuThemeVal = document.getElementById('menuThemeValue');
  if (menuThemeVal) {
    const t = THEMES.find(t => t.id === activeThemeId);
    if (t) menuThemeVal.textContent = t.name;
  }
}

themeDialogClose.addEventListener('click', closeThemeDialog);

// Close on backdrop click (outside dialog panel)
themeDialogBackdrop.addEventListener('click', e => {
  if (e.target === themeDialogBackdrop) closeThemeDialog();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && themeDialogBackdrop.classList.contains('open')) {
    closeThemeDialog();
  }
});

// Apply saved / default theme on load
applyTheme(activeThemeId);

/* -- DROPDOWN MENU ---------------------------------------- */
const menuBtn      = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');

function openMenu() {
  menuDropdown.classList.add('open');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuDropdown.querySelector('.menu-item').focus();
}

function closeMenu() {
  menuDropdown.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.focus();
}

menuBtn.addEventListener('click', e => {
  e.stopPropagation();
  menuDropdown.classList.contains('open') ? closeMenu() : openMenu();
});

// Close menu when clicking outside
document.addEventListener('click', e => {
  if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
    if (menuDropdown.classList.contains('open')) closeMenu();
  }
});

// Keyboard navigation within menu
menuDropdown.addEventListener('keydown', e => {
  const items = [...menuDropdown.querySelectorAll('.menu-item')];
  const idx   = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length].focus(); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length].focus(); }
  if (e.key === 'Escape')    { closeMenu(); }
});

// -- Menu items --
document.getElementById('menuScoringBtn').addEventListener('click', () => {
  closeMenu();
  const next = activeScoringMode === 'scrabble' ? 'crossplay' : 'scrabble';
  applyScoringMode(next);
  showToast(`Scoring: ${SCORING_MODES[next].full}`);
});

document.getElementById('menuThemeBtn').addEventListener('click', () => {
  closeMenu();
  openThemeDialog();
});

document.getElementById('menuAboutBtn').addEventListener('click', () => {
  closeMenu();
  openAboutDialog();
});

/* -- ABOUT DIALOG ----------------------------------------- */
const aboutBackdrop = document.getElementById('aboutBackdrop');
const aboutClose    = document.getElementById('aboutClose');

async function openAboutDialog() {
  // Populate cache version by asking the active service worker
  const cacheEl = document.getElementById('aboutCache');
  if (cacheEl) {
    try {
      const keys = await caches.keys();
      cacheEl.textContent = keys.length ? keys.join(', ') : 'none';
    } catch {
      cacheEl.textContent = 'unavailable';
    }
  }
  aboutBackdrop.classList.add('open');
  aboutBackdrop.setAttribute('aria-hidden', 'false');
  aboutClose.focus();
}

function closeAboutDialog() {
  aboutBackdrop.classList.remove('open');
  aboutBackdrop.setAttribute('aria-hidden', 'true');
  menuBtn.focus();
}

aboutClose.addEventListener('click', closeAboutDialog);
aboutBackdrop.addEventListener('click', e => {
  if (e.target === aboutBackdrop) closeAboutDialog();
});

// Extend Escape key handler to cover about dialog too
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && aboutBackdrop.classList.contains('open')) closeAboutDialog();
});

/* -- LETTER TILE DISPLAY ---------------------------------- */
const lettersInput   = document.getElementById('lettersInput');
const lettersDisplay = document.getElementById('lettersDisplay');

lettersInput.addEventListener('input', () => {
  const val = lettersInput.value.toUpperCase().replace(/[^A-Z?]/g, '');
  lettersInput.value = val;
  renderLetterTiles(val);
});

/**
 * Render interactive Scrabble tile chips from a letter string.
 * Clicking a chip removes that letter from the rack.
 * @param {string} str  e.g. "AEINRST?"
 */
function renderLetterTiles(str) {
  lettersDisplay.innerHTML = '';
  [...str].forEach((ch, i) => {
    const chip = document.createElement('div');
    chip.className = 'letter-chip' + (ch === '?' ? ' wildcard' : '');
    chip.title     = 'Click to remove';
    chip.textContent = ch;

    if (ch !== '?') {
      const badge = document.createElement('span');
      badge.className  = 'score-badge';
      badge.textContent = getScores()[ch] || '';
      chip.appendChild(badge);
    }

    chip.addEventListener('click', () => {
      const v = lettersInput.value;
      lettersInput.value = v.slice(0, i) + v.slice(i + 1);
      renderLetterTiles(lettersInput.value.toUpperCase());
    });

    lettersDisplay.appendChild(chip);
  });
}

/* Sanitize pattern inputs — uppercase letters only */
['startsWithInput', 'containsInput', 'endsWithInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '');
  });
});


/* -- DAWG DICTIONARY -------------------------------------- */
/**
 * The dictionary is stored as a minimal DAWG (Directed Acyclic Word Graph)
 * loaded from dawg.json, built by build_dawg.py from the SOWPODS word list.
 *
 * DAWG structure (dawg.json):
 *   { nodeCount, wordCount, nodes: Array<Array<[charCode, childId, isTerminal]>> }
 *   charCode  0-25 maps to A-Z
 *   childId   index into nodes array
 *   isTerminal  1 = a complete word ends at this child node
 *
 * Searching the DAWG prunes entire subtrees the moment a letter is not in
 * the remaining rack pool -- giving 20-700x speedup over a flat array scan.
 */
let DAWG_NODES  = null;   // nodes array from dawg.json
let WORD_COUNT  = 0;
let dictReady   = false;

function setDictStatus(state, message) {
  const btn       = document.getElementById('searchBtn');
  const indicator = document.getElementById('dictStatus');
  if (state === 'loading') {
    btn.disabled = true;
    if (indicator) { indicator.textContent = message; indicator.className = 'dict-status loading'; }
  } else if (state === 'ready') {
    btn.disabled = false;
    if (indicator) { indicator.textContent = message; indicator.className = 'dict-status ready'; }
    setTimeout(() => { if (indicator) indicator.style.opacity = '0'; }, 3000);
  } else if (state === 'error') {
    btn.disabled = false;
    if (indicator) { indicator.textContent = message; indicator.className = 'dict-status error'; }
  }
}

async function loadDictionary() {
  setDictStatus('loading', '\u23f3 Loading dictionary\u2026');
  try {
    const res = await fetch('dawg.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data  = await res.json();
    DAWG_NODES  = data.nodes;
    WORD_COUNT  = data.wordCount;
    dictReady   = true;
    setDictStatus('ready', `\u2713 ${WORD_COUNT.toLocaleString()} words (DAWG)`);
  } catch (err) {
    console.warn('DAWG load failed, falling back to built-in list:', err);
    DAWG_NODES  = null;
    WORD_COUNT  = 0;
    window.FALLBACK_WORDS = buildFallbackWordList();
    dictReady   = true;
    setDictStatus('error', `\u26a0 Built-in list (${window.FALLBACK_WORDS.length.toLocaleString()} words)`);
  }
}

// Kick off dictionary load immediately
loadDictionary();


/* -- SEARCH ENGINE ---------------------------------------- */
/**
 * Main search entry point. Routes to the DAWG traversal when the
 * dictionary is loaded, or to the flat-array fallback otherwise.
 *
 * @param {string} letters    - Available rack letters (? = wildcard blank)
 * @param {string} startsWith - Word must begin with this string
 * @param {string} contains   - Word must contain this string
 * @param {string} endsWith   - Word must end with this string
 * @returns {string[]}
 */
function search(letters, startsWith, contains, endsWith) {
  const L   = letters.toUpperCase().replace(/[^A-Z?]/g, '');
  const SW  = startsWith.toUpperCase().replace(/[^A-Z?]/g, '');
  const CON = contains.toUpperCase().replace(/[^A-Z?]/g, '');
  const EW  = endsWith.toUpperCase().replace(/[^A-Z?]/g, '');

  if (!L && !SW && !CON && !EW) return [];

  // Only track wildcard positions when the rack actually contains a '?'
  const trackWilds = L.includes('?');

  return DAWG_NODES
    ? searchDAWG(L, SW, CON, EW, trackWilds)
    : searchFlat(window.FALLBACK_WORDS || [], L, SW, CON, EW, trackWilds);
}

/* -- DAWG SEARCH ------------------------------------------- */
/**
 * Traverse the DAWG with early subtree pruning.
 * Returns an array of { word: string, wilds: Set<number> } objects.
 * wilds contains the character indices that were filled by a '?' tile.
 * When trackWilds is false (no '?' in rack), wilds is always an empty Set.
 */
function searchDAWG(L, SW, CON, EW, trackWilds = false) {
  const results = [];
  const nodes   = DAWG_NODES;

  // -- Fast-navigate to startsWith prefix node --------------
  let startNodeId = 0;
  if (SW) {
    let nodeId = 0;
    for (const ch of SW) {
      const code     = ch.charCodeAt(0) - 65;
      const children = nodes[nodeId];
      let next = -1;
      for (let i = 0; i < children.length; i++) {
        if (children[i][0] === code) { next = children[i][1]; break; }
      }
      if (next === -1) return [];
      nodeId = next;
    }
    startNodeId = nodeId;
  }

  // -- Build mutable rack pool -------------------------------
  // Pattern letters (SW / CON / EW) are board tiles — FREE, not from rack.
  let pool = null;
  if (L) {
    pool = [...L];
    const freeLetters = [...SW, ...CON, ...EW].filter(c => /[A-Z]/.test(c));
    pool.push(...freeLetters);
    if (SW) {
      for (const ch of SW) {
        const idx = pool.indexOf(ch);
        if (idx !== -1) { pool.splice(idx, 1); continue; }
        const wi = pool.indexOf('?');
        if (wi !== -1) { pool.splice(wi, 1); }
      }
    }
  }

  // -- DFS from startNodeId ----------------------------------
  // wildIndices: running array of positions (0-based in full word) that used '?'
  function dfs(nodeId, word, pool, wildIndices) {
    const children = nodes[nodeId];
    for (let i = 0; i < children.length; i++) {
      const [charCode, childId, isTerminal] = children[i];
      const ch = String.fromCharCode(65 + charCode);

      let usedWild = false;
      let spliceAt = -1;
      if (pool) {
        spliceAt = pool.indexOf(ch);
        if (spliceAt === -1) {
          const wi = pool.indexOf('?');
          if (wi === -1) continue;
          pool.splice(wi, 1);
          usedWild = true;
        } else {
          pool.splice(spliceAt, 1);
        }
      }

      const newWord = word + ch;
      const newWildIndices = (trackWilds && usedWild)
        ? [...wildIndices, newWord.length - 1]
        : wildIndices;

      if (isTerminal) {
        if ((!CON || newWord.includes(CON)) &&
            (!EW  || newWord.endsWith(EW))) {
          results.push({
            word:  newWord,
            wilds: trackWilds ? new Set(newWildIndices) : new Set()
          });
        }
      }

      dfs(childId, newWord, pool, newWildIndices);

      if (pool) {
        if (usedWild) pool.push('?');
        else          pool.splice(spliceAt, 0, ch);
      }
    }
  }

  dfs(startNodeId, SW, pool, []);

  // Edge case: the SW prefix itself may be a terminal word
  if (SW && startNodeId !== 0) {
    let nodeId = 0, terminal = false;
    for (const ch of SW) {
      const code     = ch.charCodeAt(0) - 65;
      const children = nodes[nodeId];
      for (let i = 0; i < children.length; i++) {
        if (children[i][0] === code) {
          if (ch === SW[SW.length - 1]) terminal = !!children[i][2];
          nodeId = children[i][1];
          break;
        }
      }
    }
    if (terminal &&
        (!CON || SW.includes(CON)) &&
        (!EW  || SW.endsWith(EW))) {
      results.unshift({ word: SW, wilds: new Set() });
    }
  }

  return results;
}

/* -- FLAT SEARCH (fallback only) --------------------------- */
function searchFlat(wordList, L, SW, CON, EW, trackWilds = false) {
  const results = [];
  for (const word of wordList) {
    if (SW  && !word.startsWith(SW))  continue;
    if (EW  && !word.endsWith(EW))    continue;
    if (CON && !word.includes(CON))   continue;
    const wilds = new Set();
    if (L) {
      let pool = [...L];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const ch  = word[i];
        const idx = pool.indexOf(ch);
        if (idx !== -1) { pool.splice(idx, 1); }
        else {
          const wi = pool.indexOf('?');
          if (wi !== -1) { pool.splice(wi, 1); if (trackWilds) wilds.add(i); }
          else { ok = false; break; }
        }
      }
      if (!ok) continue;
    }
    results.push({ word, wilds });
  }
  return results;
}

/* -- GROUP BY WORD LENGTH --------------------------------- */
/**
 * Group an array of {word, wilds} result objects by word length.
 * @param {{ word: string, wilds: Set<number> }[]} results
 * @returns {Object.<number, {word:string, wilds:Set<number>}[]>}
 */
function groupByLength(results) {
  return results.reduce((groups, entry) => {
    const len = entry.word.length;
    if (!groups[len]) groups[len] = [];
    groups[len].push(entry);
    return groups;
  }, {});
}

/* -- APP STATE -------------------------------------------- */
let currentGroups = {};
let sortState     = {}; // { [length]: 'alpha' | 'points' }
let collapseState = {}; // { [length]: boolean }
let activeLengths = new Set();

/* -- RENDER RESULTS --------------------------------------- */
/**
 * Render all word groups into the results area.
 * @param {Object.<number, string[]>} groups
 */
function renderResults(groups) {
  const area      = document.getElementById('resultsArea');
  const filterBar = document.getElementById('filterBar');
  const lengths   = Object.keys(groups).map(Number).sort((a, b) => b - a);

  if (lengths.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔤</div>
        <h3>No words found</h3>
        <p>Try fewer constraints or add more letters (including wildcards ?).</p>
      </div>`;
    filterBar.style.display = 'none';
    return;
  }

  // -- Filter bar chips --
  filterBar.style.display = 'flex';
  const chipsEl = document.getElementById('lengthChips');
  chipsEl.innerHTML = '';

  const allChip = document.createElement('button');
  allChip.className   = 'chip' + (activeLengths.size === 0 ? ' active' : '');
  allChip.textContent = 'All';
  allChip.addEventListener('click', () => { activeLengths.clear(); reRender(); });
  chipsEl.appendChild(allChip);

  for (const len of lengths) {
    const chip = document.createElement('button');
    chip.className   = 'chip' + (activeLengths.has(len) ? ' active' : '');
    chip.textContent = `${len}L (${groups[len].length})`;
    chip.addEventListener('click', () => {
      if (activeLengths.has(len)) activeLengths.delete(len);
      else activeLengths.add(len);
      if (activeLengths.size === lengths.length) activeLengths.clear();
      reRender();
    });
    chipsEl.appendChild(chip);
  }

  // -- Word groups --
  area.innerHTML = '';
  const visible = activeLengths.size > 0
    ? lengths.filter(l => activeLengths.has(l))
    : lengths;

  visible.forEach((len, groupIndex) => {
    const entries  = [...groups[len]];
    const sort     = sortState[len] || 'points';
    const collapsed = collapseState[len] ?? false;

    if (sort === 'alpha') {
      entries.sort((a, b) => a.word.localeCompare(b.word));
    } else {
      entries.sort((a, b) => scoreWord(b.word) - scoreWord(a.word));
    }

    const scores   = entries.map(e => scoreWord(e.word));
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    const section = document.createElement('div');
    section.className          = 'word-group' + (collapsed ? ' collapsed' : '');
    section.style.animationDelay = `${groupIndex * 40}ms`;
    section.dataset.len        = len;

    section.innerHTML = `
      <div class="group-header">
        <div class="group-length-badge">${len}</div>
        <div class="group-header-info">
          <div class="group-header-title">${len}-Letter Words</div>
          <div class="group-header-sub">${entries.length} word${entries.length !== 1 ? 's' : ''} · ${minScore}–${maxScore} pts</div>
        </div>
        <div class="group-sort" onclick="event.stopPropagation()">
          <button class="sort-btn ${sort === 'alpha'  ? 'active' : ''}" data-len="${len}" data-sort="alpha">A–Z</button>
          <button class="sort-btn ${sort === 'points' ? 'active' : ''}" data-len="${len}" data-sort="points">Pts</button>
        </div>
        <span class="chevron">${collapsed ? '›' : '⌄'}</span>
      </div>
      <div class="group-body"></div>
    `;

    // Word cards
    const body = section.querySelector('.group-body');
    for (const { word, wilds } of entries) {
      const hasWilds = wilds.size > 0;
      const fullPts  = scoreWord(word);
      // Score without counting wild-tile letters (they score 0)
      const scores   = getScores();
      const wildPts  = hasWilds
        ? [...word].reduce((s, ch, i) => wilds.has(i) ? s : s + (scores[ch] || 0), 0)
        : fullPts;

      const card = document.createElement('div');
      card.className = 'word-card' + (hasWilds ? ' has-wilds' : '');
      card.title     = `Click to copy "${word}"`;

      // Build the word text: each letter is a span, wilds get .wild-letter
      const letterSpans = [...word].map((ch, i) =>
        wilds.has(i)
          ? `<span class="wild-letter">${ch}</span>`
          : ch
      ).join('');

      // Score display
      let scoreHTML;
      if (hasWilds && wildPts !== fullPts) {
        // Show: fullPts | wildPts pts  (wild portion highlighted)
        scoreHTML = `<span class="word-points">${fullPts} <span class="pts-sep">|</span> <span class="wild-pts">${wildPts}</span> pts</span>`;
      } else {
        scoreHTML = `<span class="word-points">${fullPts} pts</span>`;
      }

      card.innerHTML = `<span class="word-text">${letterSpans}</span>${scoreHTML}`;
      card.addEventListener('click', () => copyWord(card, word));
      body.appendChild(card);
    }

    // Toggle collapse on header click
    section.querySelector('.group-header').addEventListener('click', e => {
      if (e.target.closest('.group-sort')) return;
      collapseState[len] = !collapseState[len];
      section.classList.toggle('collapsed', collapseState[len]);
      section.querySelector('.chevron').textContent = collapseState[len] ? '›' : '⌄';
    });

    // Sort button clicks
    section.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sortState[+btn.dataset.len] = btn.dataset.sort;
        reRender();
      });
    });

    area.appendChild(section);
  });
}

/** Re-render results using current state (sort/filter/collapse). */
function reRender() {
  renderResults(currentGroups);
}

/* -- COPY TO CLIPBOARD ------------------------------------ */
/**
 * Copy a word to the clipboard and briefly highlight the card.
 * @param {HTMLElement} card
 * @param {string}      word
 */
function copyWord(card, word) {
  navigator.clipboard?.writeText(word).catch(() => {});
  card.classList.add('copied');
  showToast(`Copied "${word}"`);
  setTimeout(() => card.classList.remove('copied'), 1200);
}

/* -- TOAST NOTIFICATION ----------------------------------- */
/**
 * Show a brief toast message at the bottom of the screen.
 * @param {string} msg
 */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._tid);
  toast._tid = setTimeout(() => toast.classList.remove('show'), 2000);
}

/* -- SEARCH BUTTON ---------------------------------------- */
function runSearch() {
  const letters    = document.getElementById('lettersInput').value;
  const startsWith = document.getElementById('startsWithInput').value.trim();
  const contains   = document.getElementById('containsInput').value.trim();
  const endsWith   = document.getElementById('endsWithInput').value.trim();

  if (!letters && !startsWith && !contains && !endsWith) {
    showToast('Enter letters or a pattern');
    return;
  }

  const area = document.getElementById('resultsArea');
  area.innerHTML = '<div class="shimmer">' +
    Array(12).fill('<div class="shimmer-item"></div>').join('') +
    '</div>';

  setTimeout(() => {
    const results = search(letters, startsWith, contains, endsWith);
    currentGroups = groupByLength(results);
    sortState     = {};
    collapseState = {};
    activeLengths = new Set();

    const total = results.length;
    document.getElementById('resultCount').innerHTML = total
      ? `<strong>${total}</strong> word${total !== 1 ? 's' : ''} found`
      : '';

    renderResults(currentGroups);
  }, 120);
}

document.getElementById('searchBtn').addEventListener('click', runSearch);

// Enter key triggers search
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' &&
      !e.target.closest('.theme-dialog') &&
      document.activeElement.tagName !== 'BUTTON') {
    runSearch();
  }
});

/* -- CLEAR BUTTON ----------------------------------------- */
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('lettersInput').value   = '';
  document.getElementById('startsWithInput').value = '';
  document.getElementById('containsInput').value   = '';
  document.getElementById('endsWithInput').value   = '';

  lettersDisplay.innerHTML = '';
  currentGroups = {};
  sortState     = {};
  collapseState = {};
  activeLengths = new Set();

  document.getElementById('resultCount').innerHTML = '';
  document.getElementById('filterBar').style.display = 'none';
  document.getElementById('resultsArea').innerHTML = `
    <div class="empty-state">
      <div class="icon">🎯</div>
      <h3>Ready to play</h3>
      <p>Enter your available letters (and optional pattern constraints) then hit <strong>Find Words</strong>.</p>
    </div>`;
});

// -- Initialise scoring mode (runs after all state is declared) --
applyScoringMode(activeScoringMode);
