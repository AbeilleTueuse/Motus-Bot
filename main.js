// ============================================================================
// 🔧 CONSTANTS AND SELECTORS (UPDATED FOR NEW HTML)
// ============================================================================

const GRID_SELECTOR = "#mc-grille, .mc-grille";
const ROW_SELECTOR = ".mc-ligne";
const CELL_SELECTOR = ".mc-case";
const KEYBOARD_CONTAINER_SELECTOR = "#mc-clavier";
const KEY_BUTTON_SELECTOR = "#mc-clavier button[data-touche], .mc-touche";

const INVALID_WORDS_KEY = "motus_invalid_words";
const VALID_WORDS_KEY = "motus_valid_words";
const WORD_SOURCE_URL =
  "https://raw.githubusercontent.com/lorenbrichter/Words/refs/heads/master/Words/fr.txt";

// ============================================================================
// ⚙️ BOT CONFIGURATION & UI
// ============================================================================

const CONFIG_KEY = "motus_bot_config";

const DEFAULT_CONFIG = {
  isPaused: false,
  enableTargetPlayer: true,
  targetPlayerName: "nathalie",
  targetScoreMargin: 10000,
  enableMaxScore: false,
  maxScoreValue: 450000,
  panelTop: "10px",
  panelLeft: "10px",
  initialDelay: 5,
};

function loadConfig() {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function updateBotStatus(message, color = "#0d6efd") {
  const statusEl = document.getElementById("bot-status-text");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.style.color = color;
  }
}

function injectSettingsUI() {
  if (document.getElementById("motus-bot-container")) return;

  const config = loadConfig();

  const container = document.createElement("div");
  container.id = "motus-bot-container";
  container.style.position = "fixed";
  container.style.top = config.panelTop;
  container.style.left = config.panelLeft;
  container.style.zIndex = "99999";
  container.style.backgroundColor = "#ffffff";
  container.style.border = "1px solid #ced4da";
  container.style.borderRadius = "12px";
  container.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "13px";
  container.style.color = "#333";
  container.style.width = "290px";
  container.style.display = "flex";
  container.style.flexDirection = "column";

  const style = document.createElement("style");
  style.textContent = `
    .motus-bot-toggle {
      position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0;
    }
    .motus-bot-toggle input { opacity: 0; width: 0; height: 0; }
    .motus-bot-slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background-color: #ccc; transition: .3s; border-radius: 20px;
    }
    .motus-bot-slider:before {
      position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px;
      background-color: white; transition: .3s; border-radius: 50%;
    }
    .motus-bot-toggle input:checked + .motus-bot-slider { background-color: #198754; }
    .motus-bot-toggle input:checked + .motus-bot-slider:before { transform: translateX(16px); }
    
    .motus-bot-input {
      width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; transition: .3s;
    }
    .motus-bot-input:focus { border-color: #0d6efd; outline: none; }
    .motus-bot-row { margin-bottom: 15px; }
    .motus-bot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .motus-bot-desc { font-size: 11px; color: #6c757d; margin-bottom: 8px; line-height: 1.3; }
    
    .motus-bot-status-box {
      background: #f8f9fa; padding: 10px; border-radius: 8px; text-align: center; 
      margin-bottom: 15px; border: 1px solid #dee2e6;
    }
    
    .motus-bot-hover-alert {
      display: none; font-size: 11px; color: #d63384; margin-top: 15px; 
      text-align: center; font-style: italic; background: #fff0f6; 
      padding: 8px; border-radius: 6px; border: 1px solid #ffcce0;
    }
    #motus-bot-container:hover .motus-bot-hover-alert {
      display: block;
    }

    .motus-bot-drag-handle {
      cursor: grab;
      background-color: #f1f3f5;
      padding: 12px;
      border-radius: 12px 12px 0 0;
      border-bottom: 1px solid #ced4da;
      display: flex;
      justify-content: center;
      align-items: center;
      user-select: none;
    }
    .motus-bot-drag-handle:active {
      cursor: grabbing;
    }
  `;
  document.head.appendChild(style);

  container.innerHTML = `
    <div id="motus-bot-drag-handle" class="motus-bot-drag-handle">
      <h3 style="margin: 0; font-size: 16px; color: #212529;">🤖 Bot Configuration</h3>
    </div>
    
    <div style="padding: 20px;">
      <div class="motus-bot-status-box">
        <strong style="color: #495057;">Status:</strong><br>
        <span id="bot-status-text" style="font-weight: bold; color: #0d6efd; font-size: 14px; display: inline-block; margin-top: 4px;">Initializing...</span>
      </div>
      
      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Pause Bot</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-pause" ${config.isPaused ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <div class="motus-bot-desc">Temporarily pauses bot execution.</div>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Initial Delay</strong>
        </div>
        <div class="motus-bot-desc">Seconds to wait before typing the first word.</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="bot-initial-delay" class="motus-bot-input" value="${config.initialDelay}" min="0" style="width: 100px;">
          <span style="font-size: 11px; color: #6c757d; line-height: 1.1;">seconds</span>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
      
      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Overtake Player</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-enable-player" ${config.enableTargetPlayer ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <div class="motus-bot-desc">Stops automatically once targeted player score is overtaken.</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" id="bot-target-name" class="motus-bot-input" value="${config.targetPlayerName}" placeholder="Target username">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="number" id="bot-target-margin" class="motus-bot-input" value="${config.targetScoreMargin}" placeholder="10000" style="width: 100px;">
            <span style="font-size: 11px; color: #6c757d; line-height: 1.1;">margin points</span>
          </div>
        </div>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
      
      <div class="motus-bot-row" style="margin-bottom: 0;">
        <div class="motus-bot-header">
          <strong>Max Score Cap</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-enable-max" ${config.enableMaxScore ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <div class="motus-bot-desc">Stops the bot once this score threshold is reached.</div>
        <input type="number" id="bot-max-score" class="motus-bot-input" value="${config.maxScoreValue}" placeholder="Maximum score">
      </div>
      
      <div class="motus-bot-hover-alert">
        ⚠️ Page reload is paused while your cursor is inside this menu.
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const dragHandle = document.getElementById("motus-bot-drag-handle");
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  dragHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    const rect = container.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;

    const maxLeft = window.innerWidth - container.offsetWidth;
    const maxTop = window.innerHeight - container.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    container.style.left = `${newLeft}px`;
    container.style.top = `${newTop}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      const currentConfig = loadConfig();
      currentConfig.panelLeft = container.style.left;
      currentConfig.panelTop = container.style.top;
      saveConfig(currentConfig);
    }
  });

  const applyUIState = () => {
    const isPlayerEnabled = document.getElementById("bot-enable-player").checked;
    const nameInput = document.getElementById("bot-target-name");
    const marginInput = document.getElementById("bot-target-margin");

    nameInput.disabled = !isPlayerEnabled;
    marginInput.disabled = !isPlayerEnabled;
    nameInput.style.opacity = isPlayerEnabled ? "1" : "0.5";
    marginInput.style.opacity = isPlayerEnabled ? "1" : "0.5";
    nameInput.parentElement.style.opacity = isPlayerEnabled ? "1" : "0.5";

    const isMaxEnabled = document.getElementById("bot-enable-max").checked;
    const maxInput = document.getElementById("bot-max-score");

    maxInput.disabled = !isMaxEnabled;
    maxInput.style.opacity = isMaxEnabled ? "1" : "0.5";
  };

  applyUIState();

  container.addEventListener("input", (e) => {
    if (e.target.id === "motus-bot-drag-handle") return;

    const currentConfig = loadConfig();
    let parsedDelay = parseInt(document.getElementById("bot-initial-delay").value, 10);
    if (isNaN(parsedDelay) || parsedDelay < 0) parsedDelay = 0;

    const newConfig = {
      ...currentConfig,
      isPaused: document.getElementById("bot-pause").checked,
      initialDelay: parsedDelay,
      enableTargetPlayer: document.getElementById("bot-enable-player").checked,
      targetPlayerName: document.getElementById("bot-target-name").value.trim(),
      targetScoreMargin:
        parseInt(document.getElementById("bot-target-margin").value, 10) || 0,
      enableMaxScore: document.getElementById("bot-enable-max").checked,
      maxScoreValue:
        parseInt(document.getElementById("bot-max-score").value, 10) || 0,
    };
    saveConfig(newConfig);
    applyUIState();
  });

  const blockReload = () => { window.isEditingBotConfig = true; };
  const allowReload = () => { window.isEditingBotConfig = false; };

  container.addEventListener("mouseenter", blockReload);
  container.addEventListener("mouseleave", allowReload);
  container.addEventListener("focusin", blockReload);
  container.addEventListener("focusout", allowReload);
}

async function triggerSafeReload() {
  if (window.isEditingBotConfig) {
    updateBotStatus("Waiting for menu to close before reloading...", "#fd7e14");
  }

  while (window.isEditingBotConfig) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  updateBotStatus("Reloading page for next word...", "#0d6efd");
  location.reload();
}

// ============================================================================
// 💾 LOCALSTORAGE MANAGEMENT
// ============================================================================

function loadInvalidWords() {
  try {
    const data = localStorage.getItem(INVALID_WORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveInvalidWords(words) {
  const uniqueWords = Array.from(new Set(words));
  localStorage.setItem(INVALID_WORDS_KEY, JSON.stringify(uniqueWords));
}

function addInvalidWord(word) {
  const words = loadInvalidWords();
  if (!words.includes(word)) {
    words.push(word);
    saveInvalidWords(words);
  }
}

function loadValidWords() {
  try {
    const data = localStorage.getItem(VALID_WORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveValidWords(words) {
  const uniqueWords = Array.from(new Set(words));
  localStorage.setItem(VALID_WORDS_KEY, JSON.stringify(uniqueWords));
}

function addValidWord(word) {
  const words = loadValidWords();
  if (!words.includes(word) && word !== null) {
    words.push(word);
    saveValidWords(words);
  }
}

// ============================================================================
// 🎹 VIRTUAL KEYBOARD INTEGRATION
// ============================================================================

function buildKeyboardMap() {
  const map = {};
  const buttons = document.querySelectorAll(KEY_BUTTON_SELECTOR);

  buttons.forEach((btn) => {
    const keyAttr = (btn.getAttribute("data-touche") || btn.textContent).trim().toUpperCase();

    if (keyAttr === "VALIDER" || keyAttr === "ENTER") {
      map["enter"] = btn;
    } else if (keyAttr === "EFFACER" || keyAttr === "BACKSPACE" || keyAttr === "SUPPR") {
      map["backspace"] = btn;
    } else if (/^[A-Z]$/.test(keyAttr)) {
      map[keyAttr.toLowerCase()] = btn;
    }
  });

  return Object.freeze(map);
}

// ============================================================================
// 📚 FRENCH WORD LIST DOWNLOADER & NORMALIZER
// ============================================================================

async function fetchFrenchWordList() {
  const response = await fetch(WORD_SOURCE_URL);

  if (!response.ok) {
    throw new Error(`Download failed with status: ${response.status}`);
  }

  const text = await response.text();
  const validWords = loadValidWords();

  const allWords = validWords
    .concat(text.split(/\r?\n/))
    .map((w) =>
      w
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/œ/g, "oe")
        .replace(/æ/g, "ae"),
    )
    .filter((w) => w && /^[a-z]+$/.test(w));

  return Array.from(new Set(allWords));
}

// ============================================================================
// 🧩 GRID & DOM UTILITIES
// ============================================================================

function getGrid() {
  const grid = document.querySelector(GRID_SELECTOR);
  if (!grid) throw new Error(`Grid not found with selector: ${GRID_SELECTOR}`);
  return grid;
}

function getNumberOfLetters() {
  const grid = getGrid();
  const firstRow = grid.querySelector(ROW_SELECTOR) || grid.firstElementChild;
  if (firstRow && firstRow.children.length > 0) {
    return firstRow.children.length;
  }
  const cols = parseInt(grid.style.getPropertyValue("--mc-cols"), 10);
  return isNaN(cols) ? 9 : cols;
}

function getMaxAttempts() {
  const grid = getGrid();
  const rows = grid.querySelectorAll(ROW_SELECTOR);
  return rows.length > 0 ? rows.length : grid.children.length;
}

function getRowData(row) {
  if (!row) throw new Error("Row element not found.");

  return Array.from(row.children).map((cell) => {
    const letter = cell.textContent.trim().toLowerCase();
    const classListStr = `${cell.className} ${cell.firstElementChild?.className || ""}`.toLowerCase();

    let status = "absent";
    if (
      classListStr.includes("bien-place") ||
      classListStr.includes("correct") ||
      classListStr.includes("green") ||
      classListStr.includes("vert") ||
      classListStr.includes("bg-success")
    ) {
      status = "wellPlaced";
    } else if (
      classListStr.includes("mal-place") ||
      classListStr.includes("misplaced") ||
      classListStr.includes("present") ||
      classListStr.includes("orange") ||
      classListStr.includes("jaune") ||
      classListStr.includes("yellow") ||
      classListStr.includes("cercle") ||
      classListStr.includes("bg-warning")
    ) {
      status = "misplaced";
    }

    return { letter, status };
  });
}

// ============================================================================
// 🧠 SOLVER LOGIC
// ============================================================================

function initializeGameStateFromGrid() {
  const grid = getGrid();
  const firstRow = grid.querySelector(ROW_SELECTOR) || grid.firstElementChild;
  if (!firstRow) throw new Error("First row not found.");

  const gameState = {
    wellPlaced: {},
    misplaced: new Set(),
    absent: new Set(),
    excludedPositions: {},
  };

  Array.from(firstRow.children).forEach((cell, i) => {
    const letter = cell.textContent.trim().toLowerCase();
    if (letter && /^[a-z]$/.test(letter)) {
      gameState.wellPlaced[i] = letter;
    }
  });

  return gameState;
}

function updateGameState(gameState, rowData) {
  const counts = {};

  rowData.forEach(({ letter, status }) => {
    if (status === "wellPlaced" || status === "misplaced") {
      counts[letter] = (counts[letter] || 0) + 1;
    }
  });

  rowData.forEach(({ letter, status }, i) => {
    switch (status) {
      case "wellPlaced":
        gameState.wellPlaced[i] = letter;
        gameState.absent.delete(letter);
        break;
      case "misplaced":
        gameState.misplaced.add(letter);
        gameState.absent.delete(letter);
        gameState.excludedPositions[letter] = gameState.excludedPositions[letter] || [];
        gameState.excludedPositions[letter].push(i);
        break;
      case "absent":
        if (!counts[letter]) {
          gameState.absent.add(letter);
        } else {
          gameState.maxOccurrences = gameState.maxOccurrences || {};
          gameState.maxOccurrences[letter] = counts[letter];
        }
        break;
    }
  });
}

function findNextCandidate(wordList, gameState, validAnswers) {
  return (
    wordList.find((word) => {
      const letters = word.split("");

      for (const [i, l] of Object.entries(gameState.wellPlaced)) {
        if (letters[i] !== l) return false;
      }

      for (const l of gameState.misplaced) {
        if (!letters.includes(l)) return false;
        const excluded = gameState.excludedPositions[l] || [];
        if (excluded.some((pos) => letters[pos] === l)) return false;
      }

      for (const l of gameState.absent) {
        if (letters.includes(l)) return false;
      }

      if (gameState.maxOccurrences) {
        for (const [l, max] of Object.entries(gameState.maxOccurrences)) {
          const count = letters.filter((x) => x === l).length;
          if (count > max) return false;
        }
      }

      if (validAnswers.includes(word)) return false;

      return true;
    }) || null
  );
}

// ============================================================================
// ⌨️ TYPING ENGINE
// ============================================================================

async function typeWord(word, keyboardMap, delay = 60) {
  if (typeof word !== "string") throw new TypeError("Word must be a string.");

  const letters = word.toLowerCase().split("");

  for (const letter of letters) {
    const key = keyboardMap[letter];
    if (key) key.click();
    await new Promise((r) => setTimeout(r, delay));
  }

  if (keyboardMap["enter"]) {
    keyboardMap["enter"].click();
  }
  // Wait for letter flip animations to finish
  await new Promise((r) => setTimeout(r, 2500));
}

// ============================================================================
// 📊 SCORE & LEADERBOARD PARSER
// ============================================================================

function getTotalScore() {
  const scoreElem = document.querySelector("#mc-score-total, .score_total, .mc-total-score");
  if (scoreElem) {
    return parseInt(scoreElem.textContent.replace(/pts/gi, "").replace(/[\s\u00a0]/g, ""), 10) || 0;
  }
  return 0;
}

function getPlayerScore(playerName) {
  const scoreCards = document.querySelectorAll("#mc-classement-jour .mc-score, .mc-classement-liste li");

  for (const card of scoreCards) {
    const nameEl = card.querySelector(".text-truncate, .mc-joueur-nom");
    if (!nameEl) continue;

    const nameText = Array.from(nameEl.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(" ")
      .trim();

    if (nameText.toLowerCase() === playerName.toLowerCase().trim()) {
      const badge = card.querySelector(".badge, .mc-points");
      if (badge) {
        const cleanScore = badge.textContent.replace(/pts/gi, "").replace(/[\s\u00a0]/g, "");
        return parseInt(cleanScore, 10);
      }
    }
  }

  return null;
}

// ============================================================================
// 🚀 MAIN BOT LOOP
// ============================================================================

async function startGame() {
  injectSettingsUI();

  let delayLeft = loadConfig().initialDelay;
  while (delayLeft > 0) {
    while (loadConfig().isPaused) {
      updateBotStatus("⏸️ Bot paused", "#dc3545");
      await new Promise((r) => setTimeout(r, 1000));
    }
    updateBotStatus(`Starting in ${delayLeft}s...`, "#fd7e14");
    await new Promise((r) => setTimeout(r, 1000));
    delayLeft--;
  }

  updateBotStatus("Downloading French dictionary...", "#0d6efd");

  const allWords = await fetchFrenchWordList();
  const invalidWords = loadInvalidWords();
  const lettersCount = getNumberOfLetters();
  const maxAttempts = getMaxAttempts();
  const validAnswers = [];

  const wordPool = allWords
    .filter((w) => w.length === lettersCount)
    .filter((w) => !invalidWords.includes(w));

  const gameState = initializeGameStateFromGrid();
  const keyboardMap = buildKeyboardMap();
  let attempt = 0;
  let won = false;

  while (attempt < maxAttempts) {
    while (loadConfig().isPaused) {
      updateBotStatus("⏸️ Bot paused", "#dc3545");
      await new Promise((r) => setTimeout(r, 1000));
    }

    const config = loadConfig();
    const currentScore = getTotalScore();

    if (config.enableTargetPlayer) {
      const targetScore = getPlayerScore(config.targetPlayerName);
      if (targetScore !== null && currentScore >= targetScore + config.targetScoreMargin) {
        updateBotStatus(`🎯 Target overtaken (${config.targetPlayerName})`, "#6f42c1");
        return;
      }
    }

    if (config.enableMaxScore && currentScore >= config.maxScoreValue) {
      updateBotStatus(`🏆 Max score limit reached`, "#6f42c1");
      return;
    }

    if (attempt > 0) {
      const grid = getGrid();
      const rows = grid.querySelectorAll(ROW_SELECTOR);
      const prevRow = rows[attempt - 1] || grid.children[attempt - 1];
      const data = getRowData(prevRow);

      updateGameState(gameState, data);

      if (data.length > 0 && data.every((cell) => cell.status === "wellPlaced")) {
        won = true;
        break;
      }
    }

    updateBotStatus("Computing candidate word...", "#0d6efd");
    let word = findNextCandidate(wordPool, gameState, validAnswers);

    if (!word) {
      if (validAnswers.length > 0) {
        word = validAnswers[0];
      } else {
        updateBotStatus("❌ Dictionary exhausted", "#dc3545");
        break;
      }
    }

    updateBotStatus(`Submitting: ${word.toUpperCase()}`, "#fd7e14");
    await typeWord(word, keyboardMap);

    validAnswers.push(word);
    attempt++;
  }

  // Final check on the last row played
  if (!won && attempt > 0) {
    const grid = getGrid();
    const rows = grid.querySelectorAll(ROW_SELECTOR);
    const lastRow = rows[attempt - 1] || grid.children[attempt - 1];
    const data = getRowData(lastRow);
    if (data.length > 0 && data.every((cell) => cell.status === "wellPlaced")) {
      won = true;
    }
  }

  if (won) {
    updateBotStatus(`🎉 Word found in attempt ${attempt}/${maxAttempts}!`, "#198754");
    const lastWord = validAnswers[validAnswers.length - 1];
    if (lastWord) addValidWord(lastWord);
  } else {
    updateBotStatus(`😞 Word missed.`, "#dc3545");
  }

  await triggerSafeReload();
}

console.clear();
startGame();