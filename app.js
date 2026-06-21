'use strict';

/* ══════════════════════════════════════════════════════════
   PASSWORD GATE  —  PBKDF2-SHA-256
   ══════════════════════════════════════════════════════════ */
const SITE_PASS_SALT = 'gcjnCkgvHiGPnBFUi6cf7g==';
const SITE_PASS_HASH = '0uv8hI1/CdSj4ZCO7OTGQksXenisjmOx2Uk2A3U0P3I=';
const PBKDF2_ITERS   = 200_000;
const AUTH_KEY       = 'jeopardy_auth';

async function deriveKey(password, saltB64) {
  const enc    = new TextEncoder();
  const salt   = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const rawKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits   = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERS },
    rawKey, 256,
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

async function checkAuth() {
  const remembered = localStorage.getItem(AUTH_KEY)   === SITE_PASS_HASH;
  const session    = sessionStorage.getItem(AUTH_KEY) === '1';
  if (remembered || session) showScreen('home');
  else showScreen('password');
}

async function handlePasswordSubmit() {
  const btn = document.getElementById('btn-pw-submit');
  const raw = document.getElementById('pw-input').value;
  if (!raw) return;

  btn.disabled    = true;
  btn.textContent = 'CHECKING…';
  try {
    const derived = await deriveKey(raw, SITE_PASS_SALT);
    if (derived === SITE_PASS_HASH) {
      sessionStorage.setItem(AUTH_KEY, '1');
      if (document.getElementById('pw-remember').checked) {
        localStorage.setItem(AUTH_KEY, SITE_PASS_HASH);
      }
      document.getElementById('pw-error').classList.add('hidden');
      showScreen('home');
    } else {
      document.getElementById('pw-error').classList.remove('hidden');
      document.getElementById('pw-input').value = '';
      document.getElementById('pw-input').focus();
    }
  } finally {
    btn.disabled    = false;
    btn.textContent = 'ENTER';
  }
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const SV = [200, 400, 600, 800, 1000];    // Single Jeopardy dollar values
const DV = [400, 800, 1200, 1600, 2000];  // Double Jeopardy dollar values
const NC = 6;  // categories per round
const NQ = 5;  // clues per category

/* ═══════════════════════════════════════════════════════════
   SAMPLE GAME  (grid[col][row] — col = category 0-5, row = clue 0-4)
   ═══════════════════════════════════════════════════════════ */
const SAMPLE = {
  single: {
    categories: ['SCIENCE', 'HISTORY', 'POP CULTURE', 'GEOGRAPHY', 'FOOD & DRINK', 'SPORTS'],
    grid: [
      /* SCIENCE */
      [
        { clue: 'The planet closest to the Sun.',                                          answer: 'Mercury',                value: 200,  dd: false },
        { clue: 'The chemical symbol for gold.',                                           answer: 'Au',                    value: 400,  dd: false },
        { clue: 'Plants make food using sunlight through this process.',                   answer: 'Photosynthesis',        value: 600,  dd: true  },
        { clue: "In Einstein's E = mc², what does 'c' stand for?",                        answer: 'The speed of light',    value: 800,  dd: false },
        { clue: 'The branch of science that studies heredity and genes.',                  answer: 'Genetics',             value: 1000, dd: false },
      ],
      /* HISTORY */
      [
        { clue: 'The year World War II ended.',                                            answer: '1945',                  value: 200,  dd: false },
        { clue: 'She was the first woman to win a Nobel Prize.',                           answer: 'Marie Curie',           value: 400,  dd: false },
        { clue: 'This ancient wonder stood at the harbour of Rhodes.',                     answer: 'The Colossus of Rhodes',value: 600,  dd: false },
        { clue: 'Napoleon was exiled to this remote South Atlantic island after Waterloo.',answer: 'Saint Helena',          value: 800,  dd: false },
        { clue: 'The year the Magna Carta was signed.',                                   answer: '1215',                  value: 1000, dd: false },
      ],
      /* POP CULTURE */
      [
        { clue: "The Stark family's home castle in Game of Thrones.",                     answer: 'Winterfell',            value: 200,  dd: false },
        { clue: "Taylor Swift's 2023–2024 global concert tour.",                          answer: 'The Eras Tour',         value: 400,  dd: false },
        { clue: 'The fictional African nation in the Marvel film Black Panther.',          answer: 'Wakanda',               value: 600,  dd: false },
        { clue: 'Rami Malek played this rock legend in a 2018 biopic.',                   answer: 'Freddie Mercury',       value: 800,  dd: false },
        { clue: 'This Pixar film features a rat who dreams of becoming a Parisian chef.',  answer: 'Ratatouille',           value: 1000, dd: false },
      ],
      /* GEOGRAPHY */
      [
        { clue: 'The capital city of Australia.',                                          answer: 'Canberra',              value: 200,  dd: false },
        { clue: "The world's largest ocean by area.",                                      answer: 'The Pacific Ocean',     value: 400,  dd: false },
        { clue: 'This African country actually has more ancient pyramids than Egypt.',     answer: 'Sudan',                 value: 600,  dd: false },
        { clue: 'The river that flows through the heart of the Amazon rainforest.',        answer: 'The Amazon River',      value: 800,  dd: false },
        { clue: "The world's smallest country by area.",                                   answer: 'Vatican City',          value: 1000, dd: false },
      ],
      /* FOOD & DRINK */
      [
        { clue: 'The main ingredient in guacamole.',                                      answer: 'Avocado',               value: 200,  dd: false },
        { clue: 'This hard Italian cheese is traditionally grated over Caesar salad.',    answer: 'Parmesan',              value: 400,  dd: false },
        { clue: 'Pizza was invented in this country.',                                     answer: 'Italy',                 value: 600,  dd: false },
        { clue: 'Sushi is traditionally made with this variety of rice.',                  answer: 'Short-grain sticky rice',value: 800, dd: false },
        { clue: 'Made from fermented honey, this is considered the oldest alcoholic drink.',answer: 'Mead',                value: 1000, dd: false },
      ],
      /* SPORTS */
      [
        { clue: 'Number of players per team on a basketball court at one time.',           answer: '5',                    value: 200,  dd: false },
        { clue: 'The country where the modern Olympic Games were revived in 1896.',        answer: 'Greece',               value: 400,  dd: false },
        { clue: 'Tiger Woods is famous for this sport.',                                   answer: 'Golf',                 value: 600,  dd: false },
        { clue: 'The perfect score in a single game of bowling.',                          answer: '300',                  value: 800,  dd: false },
        { clue: 'The first country to win the FIFA World Cup.',                            answer: 'Uruguay',              value: 1000, dd: false },
      ],
    ],
  },
  double: {
    categories: ['LITERATURE', 'MATH', 'MOVIES', 'ANIMALS', 'TECHNOLOGY', 'MUSIC'],
    grid: [
      /* LITERATURE */
      [
        { clue: "The author of 'To Kill a Mockingbird'.",                                  answer: 'Harper Lee',           value: 400,  dd: false },
        { clue: 'Frodo Baggins must carry this object to Mount Doom.',                     answer: 'The One Ring',         value: 800,  dd: false },
        { clue: "Shakespeare's play featuring the soliloquy 'To be, or not to be'.",      answer: 'Hamlet',               value: 1200, dd: true  },
        { clue: "George Orwell's dystopian novel is named after this year.",               answer: 'Nineteen Eighty-Four', value: 1600, dd: false },
        { clue: "The Russian author of 'War and Peace'.",                                  answer: 'Leo Tolstoy',          value: 2000, dd: false },
      ],
      /* MATH */
      [
        { clue: 'The value of π rounded to two decimal places.',                           answer: '3.14',                 value: 400,  dd: false },
        { clue: 'The square root of 144.',                                                 answer: '12',                   value: 800,  dd: false },
        { clue: 'A polygon with twelve sides.',                                            answer: 'Dodecagon',            value: 1200, dd: false },
        { clue: "This mathematician's 'last theorem' was finally proved in 1995.",         answer: 'Fermat',               value: 1600, dd: false },
        { clue: 'A triangle with all three sides equal in length.',                        answer: 'Equilateral triangle', value: 2000, dd: false },
      ],
      /* MOVIES */
      [
        { clue: 'The animation studio behind the Toy Story franchise.',                    answer: 'Pixar',                value: 400,  dd: false },
        { clue: 'He played Forrest Gump.',                                                 answer: 'Tom Hanks',            value: 800,  dd: false },
        { clue: 'This 1993 Spielberg film was the first to gross $1 billion worldwide.',   answer: 'Jurassic Park',        value: 1200, dd: false },
        { clue: "Stanley Kubrick's 1968 space odyssey film.",                              answer: '2001: A Space Odyssey',value: 1600, dd: true  },
        { clue: "Christopher Nolan's 2010 dream-heist thriller.",                          answer: 'Inception',            value: 2000, dd: false },
      ],
      /* ANIMALS */
      [
        { clue: 'The fastest land animal.',                                                answer: 'Cheetah',              value: 400,  dd: false },
        { clue: 'A group of lions is called this.',                                        answer: 'A pride',              value: 800,  dd: false },
        { clue: 'The tallest living bird.',                                                answer: 'Ostrich',              value: 1200, dd: false },
        { clue: 'The only mammal capable of true sustained flight.',                       answer: 'Bat',                  value: 1600, dd: false },
        { clue: 'With a lifespan exceeding 400 years, the longest-lived vertebrate.',      answer: 'Greenland shark',      value: 2000, dd: false },
      ],
      /* TECHNOLOGY */
      [
        { clue: 'Co-founded by Jobs, Wozniak, and Wayne in 1976.',                         answer: 'Apple',                value: 400,  dd: false },
        { clue: 'HTML stands for this.',                                                   answer: 'HyperText Markup Language', value: 800, dd: false },
        { clue: 'Despite its name, this language is unrelated to Java.',                   answer: 'JavaScript',           value: 1200, dd: false },
        { clue: 'This protocol assigns unique addresses to devices on a network.',          answer: 'IP (Internet Protocol)',value: 1600, dd: false },
        { clue: "Motorola's 1983 DynaTAC was the world's first commercial one of these.",  answer: 'Mobile phone',         value: 2000, dd: false },
      ],
      /* MUSIC */
      [
        { clue: 'The number of strings on a standard guitar.',                             answer: '6',                    value: 400,  dd: false },
        { clue: 'The number of symphonies Beethoven composed.',                            answer: '9',                    value: 800,  dd: false },
        { clue: 'The Beatles came from this English city.',                                answer: 'Liverpool',            value: 1200, dd: false },
        { clue: 'The best-selling album of all time, by Michael Jackson.',                 answer: 'Thriller',             value: 1600, dd: false },
        { clue: 'Music written in 3/4 time is typically this kind of dance.',             answer: 'A waltz',              value: 2000, dd: false },
      ],
    ],
  },
  final: {
    category: 'WORLD CAPITALS',
    clue:     'Built on an artificial island in a man-made lake, this city became the capital of Brazil in 1960.',
    answer:   'Brasília',
  },
};

/* ═══════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════ */
let players      = [];              // [{ name: string, score: number }]
let gameData     = null;            // loaded questions (same structure as SAMPLE)
let currentRound = 'single';        // 'single' | 'double' | 'final' | 'done'
let usedCells    = { single: {}, double: {} };  // key = "col-row"

// Active clue (set when a cell is opened)
let activeClue    = null;   // { col, row, clue, answer, value, dd }
let clueMarks     = {};     // playerIdx -> 'correct' | 'wrong' | null
let scoreSnapshot = [];     // player scores at the moment the clue opened

// Daily Double extras
let ddFinderIdx = 0;
let ddWager     = 0;

// Final Jeopardy
let finalPhase   = 'category'; // 'category' | 'wagers' | 'clue' | 'answer' | 'mark'
let finalWagers  = {};          // playerIdx -> number
let finalCorrect = {};          // playerIdx -> true | false | null

/* ═══════════════════════════════════════════════════════════
   DOM CACHE
   ═══════════════════════════════════════════════════════════ */
let dom = {};

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  cacheDOM();
  attachListeners();
  loadState();
  checkAuth();
});

function cacheDOM() {
  dom = {
    screens: {
      password: document.getElementById('screen-password'),
      home:     document.getElementById('screen-home'),
      game:     document.getElementById('screen-game'),
      final:    document.getElementById('screen-final'),
      winner:   document.getElementById('screen-winner'),
    },
    overlayClue: document.getElementById('overlay-clue'),
    overlayDD:   document.getElementById('overlay-dd'),
    // Home
    fileUpload:     document.getElementById('file-upload'),
    btnTemplate:    document.getElementById('btn-template'),
    btnSample:      document.getElementById('btn-sample'),
    loadStatus:     document.getElementById('load-status'),
    playerList:     document.getElementById('player-list'),
    newPlayerInput: document.getElementById('new-player-input'),
    btnAddPlayer:   document.getElementById('btn-add-player'),
    btnStart:       document.getElementById('btn-start'),
    resumeBanner:   document.getElementById('resume-banner'),
    btnResume:      document.getElementById('btn-resume'),
    // Scoreboard
    roundLabel:   document.getElementById('round-label'),
    scorePlayers: document.getElementById('score-players'),
    btnNextRound: document.getElementById('btn-next-round'),
    // Board
    board: document.getElementById('board'),
    // Clue overlay
    clueMeta:      document.getElementById('clue-meta'),
    clueText:      document.getElementById('clue-text'),
    clueActions:   document.getElementById('clue-actions'),
    btnReveal:     document.getElementById('btn-reveal-answer'),
    answerSection: document.getElementById('answer-section'),
    answerText:    document.getElementById('answer-text'),
    playerButtons: document.getElementById('player-buttons'),
    btnCloseClue:  document.getElementById('btn-close-clue'),
    // Daily Double
    ddForm:         document.getElementById('dd-form'),
    ddPlayerSelect: document.getElementById('dd-player-select'),
    ddWagerInput:   document.getElementById('dd-wager-input'),
    ddWagerHint:    document.getElementById('dd-wager-hint'),
    btnDDConfirm:   document.getElementById('btn-dd-confirm'),
    // Final
    finalContent: document.getElementById('final-content'),
    // Winner
    confettiCanvas: document.getElementById('confetti-canvas'),
    winnerList:     document.getElementById('winner-list'),
    btnNewGame:     document.getElementById('btn-new-game'),
  };
}

function attachListeners() {
  // Password gate
  document.getElementById('btn-pw-submit').addEventListener('click', handlePasswordSubmit);
  document.getElementById('pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') handlePasswordSubmit(); });
  // Home / game
  dom.fileUpload.addEventListener('change', handleFileUpload);
  dom.btnTemplate.addEventListener('click', downloadTemplate);
  dom.btnSample.addEventListener('click', loadSampleGame);
  dom.btnAddPlayer.addEventListener('click', handleAddPlayer);
  dom.newPlayerInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleAddPlayer(); });
  dom.btnStart.addEventListener('click', startNewGame);
  dom.btnResume.addEventListener('click', resumeGame);
  dom.btnNextRound.addEventListener('click', advanceRound);
  dom.btnReveal.addEventListener('click', revealAnswer);
  dom.btnCloseClue.addEventListener('click', closeClue);
  dom.btnDDConfirm.addEventListener('click', confirmDD);
  dom.ddPlayerSelect.addEventListener('change', updateDDHint);
  dom.ddWagerInput.addEventListener('input', updateDDHint);
  dom.btnNewGame.addEventListener('click', resetToHome);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !dom.overlayClue.hidden) closeClue();
  });
}

/* ═══════════════════════════════════════════════════════════
   SCREEN NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function showScreen(name) {
  Object.values(dom.screens).forEach(s => s.classList.remove('active'));
  dom.screens[name]?.classList.add('active');
}

/* ═══════════════════════════════════════════════════════════
   LOCAL STORAGE
   ═══════════════════════════════════════════════════════════ */
const LS_KEY = 'jeopardy_v1';

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ players, gameData, currentRound, usedCells }));
  } catch (_) { /* storage quota exceeded — silently skip */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const s     = JSON.parse(raw);
    players      = s.players      || [];
    gameData     = s.gameData     || null;
    currentRound = s.currentRound || 'single';
    usedCells    = s.usedCells    || { single: {}, double: {} };

    renderPlayerList();
    updateStartBtn();
    if (gameData) setLoadStatus('✓ Questions loaded from previous session', 'success');

    const inProgress = gameData && players.length > 0
                    && ['single', 'double', 'final'].includes(currentRound);
    dom.resumeBanner.classList.toggle('hidden', !inProgress);
  } catch (_) { /* corrupt data — start clean */ }
}

/* ═══════════════════════════════════════════════════════════
   PLAYER MANAGEMENT
   ═══════════════════════════════════════════════════════════ */
function handleAddPlayer() {
  const name = dom.newPlayerInput.value.trim();
  if (!name) return;
  if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    flash(dom.newPlayerInput);
    return;
  }
  players.push({ name, score: 0 });
  dom.newPlayerInput.value = '';
  dom.newPlayerInput.focus();
  renderPlayerList();
  updateStartBtn();
  saveState();
}

function removePlayer(idx) {
  players.splice(idx, 1);
  renderPlayerList();
  updateStartBtn();
  saveState();
}

function renderPlayerList() {
  dom.playerList.innerHTML = '';
  players.forEach((p, i) => {
    const row = mk('div', 'player-row');
    const inp = document.createElement('input');
    inp.type = 'text'; inp.value = p.name; inp.maxLength = 20;
    inp.addEventListener('change', () => { p.name = inp.value.trim() || p.name; saveState(); });
    const del = mk('button', 'btn-remove', '×');
    del.setAttribute('aria-label', `Remove ${p.name}`);
    del.addEventListener('click', () => removePlayer(i));
    row.append(inp, del);
    dom.playerList.appendChild(row);
  });
}

function updateStartBtn() {
  dom.btnStart.disabled = !(players.length >= 1 && gameData !== null);
}

/* ═══════════════════════════════════════════════════════════
   FILE I/O
   ═══════════════════════════════════════════════════════════ */
function setLoadStatus(msg, cls = '') {
  dom.loadStatus.textContent = msg;
  dom.loadStatus.className   = cls;
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  setLoadStatus('Parsing…');
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const wb  = XLSX.read(ev.target.result, { type: 'array' });
      gameData  = parseWorkbook(wb);
      usedCells = { single: {}, double: {} };
      currentRound = 'single';
      dom.resumeBanner.classList.add('hidden');
      setLoadStatus(`✓ Loaded: ${file.name}`, 'success');
      updateStartBtn();
      saveState();
    } catch (err) {
      gameData = null;
      // Show errors as a readable list
      const lines = err.message.split('\n').filter(Boolean);
      setLoadStatus(lines.map((l, i) => (i === 0 ? '' : '• ') + l).join('\n'), 'error');
      dom.loadStatus.style.whiteSpace = 'pre-line';
      updateStartBtn();
    }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = ''; // allow re-upload of same file
}

function parseWorkbook(wb) {
  const needed  = ['Single Jeopardy', 'Double Jeopardy', 'Final Jeopardy'];
  const missing = needed.filter(n => !wb.SheetNames.includes(n));
  if (missing.length) throw new Error(`Missing sheet(s): ${missing.join(', ')}`);

  const errors = [];
  let single, double_, final;

  try { single  = parseRoundSheet(wb.Sheets['Single Jeopardy'], SV, 'Single Jeopardy'); }
  catch (e) { errors.push(...e.message.split('\n')); }

  try { double_ = parseRoundSheet(wb.Sheets['Double Jeopardy'], DV, 'Double Jeopardy'); }
  catch (e) { errors.push(...e.message.split('\n')); }

  try { final   = parseFinalSheet(wb.Sheets['Final Jeopardy']); }
  catch (e) { errors.push(...e.message.split('\n')); }

  if (errors.length) throw new Error(errors.join('\n'));
  return { single, double: double_, final };
}

function parseRoundSheet(sheet, values, label) {
  // Expected header: Category | Value | Clue | Answer | Daily Double?
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length < 2) throw new Error(`${label}: Sheet appears empty`);

  // Strip header, remove fully blank rows, stringify all cells
  const data = rows.slice(1)
    .map(r => r.map(c => String(c ?? '').trim()))
    .filter(r => r.some(c => c !== ''));

  // Fill-down the Category column
  let lastCat = '';
  const filled = data.map(r => {
    const cat = r[0];
    if (cat) lastCat = cat;
    return { category: lastCat, clue: r[2], answer: r[3], dd: r[4].toUpperCase() === 'DAILY DOUBLE' };
  });

  // Group by category (preserving insertion order)
  const catMap = new Map();
  for (const row of filled) {
    if (!row.category) continue;
    const key = row.category.toUpperCase();
    if (!catMap.has(key)) catMap.set(key, { name: row.category.toUpperCase(), clues: [] });
    catMap.get(key).clues.push(row);
  }

  const cats   = [...catMap.values()];
  const errors = [];
  if (cats.length !== NC) errors.push(`${label}: Expected ${NC} categories, found ${cats.length}`);

  for (const cat of cats) {
    if (cat.clues.length !== NQ) {
      errors.push(`${label} → "${cat.name}": Expected ${NQ} clues, found ${cat.clues.length}`);
    }
    cat.clues.forEach((c, i) => {
      const pfx = `${label} → "${cat.name}" $${values[i] ?? '?'}`;
      if (!c.clue)   errors.push(`${pfx}: Clue is blank`);
      if (!c.answer) errors.push(`${pfx}: Answer is blank`);
    });
  }
  if (errors.length) throw new Error(errors.join('\n'));

  return {
    categories: cats.map(c => c.name),
    grid: cats.map(cat => cat.clues.map((c, i) => ({
      clue: c.clue, answer: c.answer, value: values[i], dd: c.dd,
    }))),
  };
}

function parseFinalSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const map  = {};
  rows.slice(1).forEach(r => {
    const k = String(r[0] ?? '').trim().toLowerCase();
    const v = String(r[1] ?? '').trim();
    if (k) map[k] = v;
  });
  const errors = [];
  if (!map['category']) errors.push('Final Jeopardy: Category is blank');
  if (!map['clue'])     errors.push('Final Jeopardy: Clue is blank');
  if (!map['answer'])   errors.push('Final Jeopardy: Answer is blank');
  if (errors.length) throw new Error(errors.join('\n'));
  return { category: map['category'], clue: map['clue'], answer: map['answer'] };
}

function loadSampleGame() {
  gameData     = JSON.parse(JSON.stringify(SAMPLE));
  usedCells    = { single: {}, double: {} };
  currentRound = 'single';
  dom.resumeBanner.classList.add('hidden');
  setLoadStatus('✓ Sample game loaded — add players and start!', 'success');
  updateStartBtn();
  saveState();
}

function downloadTemplate() {
  const wb   = XLSX.utils.book_new();
  const CATS = ['Category 1','Category 2','Category 3','Category 4','Category 5','Category 6'];

  // Instructions sheet
  const instrRows = [
    ['HOW TO FILL IN YOUR JEOPARDY QUESTIONS'],
    [],
    ['SHEETS IN THIS FILE'],
    ['  Single Jeopardy  ─  6 categories × 5 clues  ($200 / $400 / $600 / $800 / $1,000)'],
    ['  Double Jeopardy  ─  6 categories × 5 clues  ($400 / $800 / $1,200 / $1,600 / $2,000)'],
    ['  Final Jeopardy   ─  One category, one clue, one answer'],
    [],
    ['COLUMNS (Single & Double Jeopardy)'],
    ['  Category     Enter the category name on the FIRST row of each block of 5 clues.'],
    ['               You may fill it down all 5 rows, or leave rows 2–5 blank — both work.'],
    ['  Value        Pre-filled. Do NOT change these.'],
    ['  Clue         Write your clue here. Jeopardy clues are traditionally written as'],
    ['               statements ("This is the largest planet"), not questions — but any'],
    ['               wording works for a family game!'],
    ['  Answer       The correct answer (short is better — displayed on the TV screen).'],
    ['  Daily Double?  Type exactly: DAILY DOUBLE  on the cell(s) you want as Daily Doubles.'],
    ['               Leave all other cells blank. Recommended: 1 DD in Single, 2 in Double.'],
    [],
    ['TIPS'],
    ['  • Keep clues concise — they appear in large text on the TV.'],
    ['  • Rename "Category 1" etc. to any topics you like.'],
    ['  • Save the file as .xlsx before uploading to the website.'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrRows);
  wsInstr['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  function buildRoundSheet(values) {
    const rows = [['Category', 'Value', 'Clue', 'Answer', 'Daily Double?']];
    for (const cat of CATS) {
      for (let i = 0; i < NQ; i++) {
        rows.push([i === 0 ? cat : '', values[i], '', '', '']);
      }
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 8 }, { wch: 60 }, { wch: 40 }, { wch: 14 }];
    return ws;
  }

  XLSX.utils.book_append_sheet(wb, buildRoundSheet(SV), 'Single Jeopardy');
  XLSX.utils.book_append_sheet(wb, buildRoundSheet(DV), 'Double Jeopardy');

  const finalRows = [['Field', 'Value'], ['Category', ''], ['Clue', ''], ['Answer', '']];
  const wsFinal   = XLSX.utils.aoa_to_sheet(finalRows);
  wsFinal['!cols'] = [{ wch: 12 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsFinal, 'Final Jeopardy');

  XLSX.writeFile(wb, 'jeopardy-template.xlsx');
}

/* ═══════════════════════════════════════════════════════════
   GAME START / RESUME
   ═══════════════════════════════════════════════════════════ */
function startNewGame() {
  players.forEach(p => (p.score = 0));
  usedCells    = { single: {}, double: {} };
  currentRound = 'single';
  dom.resumeBanner.classList.add('hidden');
  saveState();
  goToRound('single');
}

function resumeGame() {
  if (currentRound === 'final') startFinal();
  else if (currentRound === 'done') showWinner();
  else goToRound(currentRound);
}

function goToRound(round) {
  currentRound = round;
  dom.roundLabel.textContent = round === 'single' ? 'SINGLE JEOPARDY' : 'DOUBLE JEOPARDY';
  renderScoreboard();
  renderBoard();
  showScreen('game');
  saveState();
}

/* ═══════════════════════════════════════════════════════════
   BOARD RENDERING
   ═══════════════════════════════════════════════════════════ */
function renderBoard() {
  const data = gameData[currentRound];
  dom.board.innerHTML = '';

  // Row 0 — category headers
  data.categories.forEach(cat => {
    dom.board.appendChild(mk('div', 'board-cell category', cat));
  });

  // Rows 1–5 — clue cells
  for (let row = 0; row < NQ; row++) {
    for (let col = 0; col < NC; col++) {
      const key  = `${col}-${row}`;
      const used = !!usedCells[currentRound][key];
      const cell = mk('div', 'board-cell clue-cell' + (used ? ' used' : ''));
      if (!used) {
        cell.textContent = '$' + data.grid[col][row].value.toLocaleString();
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('tabindex', '0');
        cell.addEventListener('click', () => openClue(col, row));
        cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openClue(col, row); });
      }
      dom.board.appendChild(cell);
    }
  }
}

function advanceRound() {
  if (currentRound === 'single') goToRound('double');
  else startFinal();
}

/* ═══════════════════════════════════════════════════════════
   CLUE FLOW
   ═══════════════════════════════════════════════════════════ */
function openClue(col, row) {
  const cell   = gameData[currentRound].grid[col][row];
  activeClue   = { col, row, ...cell };
  clueMarks    = {};
  scoreSnapshot = players.map(p => p.score);

  if (cell.dd) openDailyDouble();
  else         showClueOverlay();
}

function showClueOverlay() {
  const c   = activeClue;
  const cat = gameData[currentRound].categories[c.col];
  const valLabel = c.dd
    ? `DAILY DOUBLE  —  $${ddWager.toLocaleString()}`
    : `$${c.value.toLocaleString()}`;

  dom.clueMeta.textContent   = `${cat}  |  ${valLabel}`;
  dom.clueText.textContent   = c.clue;
  dom.clueActions.hidden     = false;
  dom.answerSection.hidden   = true;
  dom.playerButtons.innerHTML = '';

  dom.overlayDD.hidden   = true;
  dom.overlayClue.hidden = false;
  dom.btnReveal.focus();
}

function revealAnswer() {
  dom.clueActions.hidden     = true;
  dom.answerText.textContent = activeClue.answer;
  dom.answerSection.hidden   = false;
  if (activeClue.dd) renderDDResponseButtons();
  else               renderAllResponseButtons();
}

function renderAllResponseButtons() {
  dom.playerButtons.innerHTML = '';
  players.forEach((p, i) => {
    const wrap = mk('div', 'player-response');
    wrap.appendChild(mk('div', 'player-response-name', p.name));
    const btns = mk('div', 'player-response-btns');
    btns.append(
      makeMarkBtn('✓', 'btn btn-small btn-correct', () => toggleMark(i, 'correct')),
      makeMarkBtn('✗', 'btn btn-small btn-wrong',   () => toggleMark(i, 'wrong')),
    );
    wrap.appendChild(btns);
    dom.playerButtons.appendChild(wrap);
  });
}

function renderDDResponseButtons() {
  dom.playerButtons.innerHTML = '';
  const p    = players[ddFinderIdx];
  const wrap = mk('div', 'player-response');
  wrap.appendChild(mk('div', 'player-response-name', `${p.name} — wagered $${ddWager.toLocaleString()}`));
  const btns = mk('div', 'player-response-btns');
  btns.append(
    makeMarkBtn('✓ Correct', 'btn btn-correct', () => toggleMark(ddFinderIdx, 'correct')),
    makeMarkBtn('✗ Wrong',   'btn btn-wrong',   () => toggleMark(ddFinderIdx, 'wrong')),
  );
  wrap.appendChild(btns);
  dom.playerButtons.appendChild(wrap);
}

function makeMarkBtn(label, cls, onClick) {
  const b = mk('button', cls, label);
  b.addEventListener('click', onClick);
  return b;
}

function toggleMark(playerIdx, mark) {
  clueMarks[playerIdx] = clueMarks[playerIdx] === mark ? null : mark;
  applyMarksFromSnapshot();
  renderScoreboard();
  refreshMarkButtonStates();
}

function applyMarksFromSnapshot() {
  const value = activeClue.dd ? ddWager : activeClue.value;
  players.forEach((p, i) => {
    p.score = scoreSnapshot[i]
      + (clueMarks[i] === 'correct' ?  value : 0)
      - (clueMarks[i] === 'wrong'   ?  value : 0);
  });
}

function refreshMarkButtonStates() {
  const wraps = dom.playerButtons.querySelectorAll('.player-response');
  wraps.forEach((wrap, idx) => {
    // DD has a single wrap representing ddFinderIdx; otherwise idx === playerIdx
    const pi = activeClue.dd ? ddFinderIdx : idx;
    wrap.querySelector('.btn-correct')?.classList.toggle('active', clueMarks[pi] === 'correct');
    wrap.querySelector('.btn-wrong')?.classList.toggle('active',   clueMarks[pi] === 'wrong');
  });
}

function closeClue() {
  if (activeClue) {
    usedCells[currentRound][`${activeClue.col}-${activeClue.row}`] = true;
    activeClue = null;
  }
  dom.overlayClue.hidden = true;
  renderBoard();
  renderScoreboard();
  saveState();
}

/* ═══════════════════════════════════════════════════════════
   DAILY DOUBLE
   ═══════════════════════════════════════════════════════════ */
function openDailyDouble() {
  // Populate player select
  dom.ddPlayerSelect.innerHTML = '';
  players.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.name;
    dom.ddPlayerSelect.appendChild(opt);
  });
  dom.ddWagerInput.value = '';
  dom.ddForm.hidden      = true;
  dom.overlayDD.hidden   = false;

  // Show "DAILY DOUBLE!" for 1.5 s before revealing the wager form
  setTimeout(() => {
    dom.ddForm.hidden = false;
    updateDDHint();
    dom.ddWagerInput.focus();
  }, 1500);
}

function ddMaxWager(playerIdx) {
  const topValue = currentRound === 'single' ? SV[SV.length - 1] : DV[DV.length - 1];
  return Math.max(players[playerIdx].score, topValue, 5);
}

function updateDDHint() {
  const idx = parseInt(dom.ddPlayerSelect.value) || 0;
  const p   = players[idx];
  if (!p) return;
  dom.ddWagerHint.textContent =
    `${p.name} currently has $${p.score.toLocaleString()}. Max wager: $${ddMaxWager(idx).toLocaleString()}`;
}

function confirmDD() {
  ddFinderIdx = parseInt(dom.ddPlayerSelect.value) || 0;
  const raw   = parseInt(dom.ddWagerInput.value)   || 0;
  const max   = ddMaxWager(ddFinderIdx);
  const min   = 5;
  ddWager     = Math.max(min, Math.min(raw, max));

  if (raw < min || raw > max) {
    dom.ddWagerInput.value = ddWager;
    flash(dom.ddWagerInput);
    return;
  }
  showClueOverlay();
}

/* ═══════════════════════════════════════════════════════════
   SCOREBOARD
   ═══════════════════════════════════════════════════════════ */
function renderScoreboard() {
  dom.scorePlayers.innerHTML = '';
  players.forEach((p, i) => {
    const chip = mk('div', 'score-chip');
    chip.appendChild(mk('div', 'score-name', p.name));
    const valEl = mk('div', p.score < 0 ? 'score-value negative' : 'score-value',
      (p.score < 0 ? '-$' : '$') + Math.abs(p.score).toLocaleString());
    chip.appendChild(valEl);

    // ± manual adjustment row
    const ctrl  = mk('div', 'score-controls');
    const minus = mk('button', 'score-adj', '−');
    const amtIn = document.createElement('input');
    amtIn.type = 'number'; amtIn.className = 'score-adj-amt';
    amtIn.value = 200; amtIn.min = 0;
    amtIn.setAttribute('aria-label', 'Adjustment amount');
    const plus  = mk('button', 'score-adj', '+');

    minus.addEventListener('click', () => adjustScore(i, -(parseInt(amtIn.value) || 0)));
    plus.addEventListener('click',  () => adjustScore(i, +(parseInt(amtIn.value) || 0)));
    ctrl.append(minus, amtIn, plus);
    chip.appendChild(ctrl);
    dom.scorePlayers.appendChild(chip);
  });
}

function adjustScore(playerIdx, delta) {
  players[playerIdx].score += delta;
  // Keep snapshot in sync so live mark toggling stays accurate
  if (scoreSnapshot.length > playerIdx) scoreSnapshot[playerIdx] += delta;
  renderScoreboard();
  saveState();
}

/* ═══════════════════════════════════════════════════════════
   FINAL JEOPARDY
   ═══════════════════════════════════════════════════════════ */
function startFinal() {
  currentRound = 'final';
  finalPhase   = 'category';
  finalWagers  = {};
  finalCorrect = {};
  showScreen('final');
  renderFinalPhase();
  saveState();
}

function renderFinalPhase() {
  const f   = gameData.final;
  const div = dom.finalContent;
  div.innerHTML = '';

  if (finalPhase === 'category') {
    div.append(
      mk('div', 'final-category-card', f.category),
      mk('div', 'final-hint', 'Category is revealed. Ready to collect wagers?'),
      btn('Collect Wagers →', 'btn btn-gold btn-large', () => { finalPhase = 'wagers'; renderFinalPhase(); }),
    );

  } else if (finalPhase === 'wagers') {
    const grid = mk('div', 'wager-grid');
    players.forEach((p, i) => {
      const maxW  = Math.max(0, p.score);
      const item  = mk('div', 'wager-item');
      const lbl   = mk('label', '', p.name);
      lbl.htmlFor = `fw-${i}`;
      const hint  = mk('div', 'wager-score',
        `Score: $${p.score.toLocaleString()}  |  Max wager: $${maxW.toLocaleString()}`);
      const inp   = document.createElement('input');
      inp.type = 'number'; inp.id = `fw-${i}`; inp.min = 0; inp.max = maxW;
      inp.placeholder = '0'; inp.value = finalWagers[i] ?? '';
      inp.addEventListener('input', () => {
        finalWagers[i] = Math.max(0, Math.min(parseInt(inp.value) || 0, maxW));
      });
      item.append(lbl, hint, inp);
      grid.appendChild(item);
    });
    div.append(
      grid,
      btn('Show Clue →', 'btn btn-gold btn-large', () => {
        players.forEach((_, i) => { if (finalWagers[i] == null) finalWagers[i] = 0; });
        finalPhase = 'clue'; renderFinalPhase();
      }),
    );

  } else if (finalPhase === 'clue') {
    div.append(
      mk('div', 'final-clue-text', f.clue),
      mk('div', 'final-hint', 'Players — write down your answers now!'),
      btn('Reveal Answer →', 'btn btn-gold btn-large', () => { finalPhase = 'answer'; renderFinalPhase(); }),
    );

  } else if (finalPhase === 'answer') {
    div.append(
      mk('div', 'final-clue-text', f.clue),
      mk('div', 'final-answer-reveal', `Answer: ${f.answer}`),
      btn('Mark Players →', 'btn btn-gold btn-large', () => { finalPhase = 'mark'; renderFinalPhase(); }),
    );

  } else if (finalPhase === 'mark') {
    const grid = mk('div', 'mark-grid');
    players.forEach((p, i) => {
      const row    = mk('div', 'mark-row');
      const wager  = finalWagers[i] || 0;
      const cState = finalCorrect[i];
      row.append(
        mk('div', 'mark-player-name', p.name),
        mk('div', 'mark-wager', `Wagered: $${wager.toLocaleString()}`),
      );
      const btns = mk('div', 'mark-btns');
      btns.append(
        btn('✓', 'btn btn-small btn-correct' + (cState === true  ? ' active' : ''), () => { toggleFinalMark(i, true);  renderFinalPhase(); }),
        btn('✗', 'btn btn-small btn-wrong'   + (cState === false ? ' active' : ''), () => { toggleFinalMark(i, false); renderFinalPhase(); }),
      );
      row.appendChild(btns);
      grid.appendChild(row);
    });
    div.append(grid, btn('See Final Standings →', 'btn btn-gold btn-large', showWinner));
  }
}

function toggleFinalMark(playerIdx, isCorrect) {
  const prev  = finalCorrect[playerIdx];
  const wager = finalWagers[playerIdx] || 0;

  // Undo previous mark
  if (prev === true)  players[playerIdx].score -= wager;
  if (prev === false) players[playerIdx].score += wager;

  if (prev === isCorrect) {
    // Toggle off — no new mark
    finalCorrect[playerIdx] = null;
  } else {
    finalCorrect[playerIdx] = isCorrect;
    if (isCorrect) players[playerIdx].score += wager;
    else           players[playerIdx].score -= wager;
  }
  saveState();
}

/* ═══════════════════════════════════════════════════════════
   WINNER SCREEN
   ═══════════════════════════════════════════════════════════ */
function showWinner() {
  currentRound = 'done';
  saveState();

  const sorted = [...players].sort((a, b) => b.score - a.score);
  dom.winnerList.innerHTML = '';
  sorted.forEach((p, i) => {
    const rank  = i + 1;
    const row   = mk('div', 'winner-row');
    const rEl   = mk('div', `winner-rank rank-${rank}`, rank);
    const nEl   = mk('div', 'winner-name', p.name);
    const sEl   = mk('div', p.score < 0 ? 'winner-score negative' : 'winner-score',
      (p.score < 0 ? '-$' : '$') + Math.abs(p.score).toLocaleString());
    row.append(rEl, nEl, sEl);
    dom.winnerList.appendChild(row);
  });

  showScreen('winner');
  startConfetti();
}

/* ═══════════════════════════════════════════════════════════
   CONFETTI
   ═══════════════════════════════════════════════════════════ */
function startConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = dom.confettiCanvas;
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#FFD700', '#060CE9', '#ffffff', '#ff6b6b', '#6bff9e', '#c9a800', '#a0f0ff'];
  const pieces = Array.from({ length: 170 }, () => ({
    x:  Math.random() * canvas.width,
    y: -10 - Math.random() * 350,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w:  5 + Math.random() * 9,
    h:  3 + Math.random() * 6,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.14,
  }));

  let frame = 0;
  function tick() {
    if (frame++ > 450) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.angle += p.spin;
      if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    requestAnimationFrame(tick);
  }
  tick();
}

/* ═══════════════════════════════════════════════════════════
   RESET
   ═══════════════════════════════════════════════════════════ */
function resetToHome() {
  players.forEach(p => (p.score = 0));
  usedCells    = { single: {}, double: {} };
  currentRound = 'single';
  dom.resumeBanner.classList.add('hidden');
  renderPlayerList();
  updateStartBtn();
  showScreen('home');
  saveState();
}

/* ═══════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════ */

// Create a DOM element with an optional class and text content
function mk(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// Create a button with a click handler
function btn(label, className, onClick) {
  const b = mk('button', className, label);
  b.addEventListener('click', onClick);
  return b;
}

// Briefly highlight an input in red (validation feedback)
function flash(el) {
  el.style.borderColor = '#ff6b6b';
  setTimeout(() => (el.style.borderColor = ''), 1300);
}
