// ============================
// 🔧 CONSTANTS AND CONFIG
// ============================

const GRID_CLASS = "motus-grille";
const KEYBOARD_SELECTOR = "#keyboard .touche";
const SPECIAL_KEYS = { enter: "13", backspace: "46" };
const INVALID_WORDS_KEY = "motus_invalid_words";
const VALID_WORDS_KEY = "motus_valid_words";
const WORD_SOURCE_URL =
  "https://raw.githubusercontent.com/lorenbrichter/Words/refs/heads/master/Words/fr.txt";

// ============================
// ⚙️ BOT CONFIGURATION & UI
// ============================

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
  initialDelay: 5, // Default delay of 5 seconds
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

    /* Styles for the draggable handle */
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
      <h3 style="margin: 0; font-size: 16px; color: #212529;">🤖 Configuration du Bot</h3>
    </div>
    
    <div style="padding: 20px;">
      <!-- Real-time Status Display -->
      <div class="motus-bot-status-box">
        <strong style="color: #495057;">Statut :</strong><br>
        <span id="bot-status-text" style="font-weight: bold; color: #0d6efd; font-size: 14px; display: inline-block; margin-top: 4px;">Initialisation...</span>
      </div>
      
      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Mettre en pause</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-pause" ${config.isPaused ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <div class="motus-bot-desc">Stoppe temporairement le bot. Prend effet immédiatement, même en plein milieu d'une partie.</div>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Délai initial</strong>
        </div>
        <div class="motus-bot-desc">Temps d'attente avant de jouer le premier mot (0 pour désactiver).</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="bot-initial-delay" class="motus-bot-input" value="${config.initialDelay}" min="0" style="width: 100px;">
          <span style="font-size: 11px; color: #6c757d; line-height: 1.1;">secondes</span>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
      
      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Dépasser un joueur</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-enable-player" ${config.enableTargetPlayer ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <div class="motus-bot-desc">Arrête de jouer automatiquement une fois que le score de ce joueur est dépassé.</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" id="bot-target-name" class="motus-bot-input" value="${config.targetPlayerName}" placeholder="Pseudo du joueur ciblé">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="number" id="bot-target-margin" class="motus-bot-input" value="${config.targetScoreMargin}" placeholder="10000" style="width: 100px;">
            <span style="font-size: 11px; color: #6c757d; line-height: 1.1;">points d'avance requis</span>
          </div>
        </div>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
      
      <div class="motus-bot-row" style="margin-bottom: 0;">
        <div class="motus-bot-header">
          <strong>Limite de score max</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-enable-max" ${config.enableMaxScore ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <div class="motus-bot-desc">Arrête le bot définitivement si votre propre score atteint ce palier.</div>
        <input type="number" id="bot-max-score" class="motus-bot-input" value="${config.maxScoreValue}" placeholder="Score maximum">
      </div>
      
      <!-- Warning shown only on hover -->
      <div class="motus-bot-hover-alert">
        ⚠️ Le rechargement de la page est suspendu tant que votre souris est sur ce menu.
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
    const isPlayerEnabled =
      document.getElementById("bot-enable-player").checked;
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
    
    // Validate the initial delay input
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

  const blockReload = () => {
    window.isEditingBotConfig = true;
  };
  const allowReload = () => {
    window.isEditingBotConfig = false;
  };

  container.addEventListener("mouseenter", blockReload);
  container.addEventListener("mouseleave", allowReload);
  container.addEventListener("focusin", blockReload);
  container.addEventListener("focusout", allowReload);
}

async function triggerSafeReload() {
  if (window.isEditingBotConfig) {
    updateBotStatus("Attente de la fermeture du menu...", "#fd7e14");
  }

  while (window.isEditingBotConfig) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  updateBotStatus("Rechargement de la page...", "#0d6efd");
  location.reload();
}

// ============================
// 💾 LOCALSTORAGE MANAGEMENT
// ============================

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

// ============================
// 🎹 VIRTUAL KEYBOARD
// ============================

function buildKeyboardMap() {
  const map = {};

  document.querySelectorAll(KEYBOARD_SELECTOR).forEach((btn) => {
    const label = btn.textContent.trim().toLowerCase();
    if (/^[a-z]$/.test(label)) {
      map[label] = btn;
    }
  });

  for (const [name, id] of Object.entries(SPECIAL_KEYS)) {
    const btn = document.getElementById(id);
    if (btn) map[name] = btn;
  }

  return Object.freeze(map);
}

const KEYBOARD_MAP = buildKeyboardMap();

// ============================
// 📚 FRENCH WORD LIST
// ============================

async function fetchFrenchWordList() {
  const response = await fetch(WORD_SOURCE_URL);

  if (!response.ok)
    throw new Error(`Erreur de téléchargement : ${response.status}`);

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

// ============================
// 🧩 GRID UTILITIES
// ============================

function getGrid() {
  const grid = document.querySelector(`.${GRID_CLASS}`);
  if (!grid) throw new Error(`Grid not found: ${GRID_CLASS}`);
  return grid;
}

function getNumberOfLetters() {
  const firstRow = getGrid().firstElementChild;
  if (!firstRow) throw new Error("First row is missing.");
  return firstRow.children.length;
}

function getMaxAttempts() {
  return getGrid().children.length;
}

function getRowData(row) {
  if (!row) throw new Error("Row element not found.");

  return Array.from(row.children).map((cell) => {
    const letter = cell.textContent.trim().toLowerCase();
    const classList = cell.firstElementChild.classList;

    let status = "absent";
    if (classList.contains("green")) status = "wellPlaced";
    else if (classList.contains("orange")) status = "misplaced";

    return { letter, status };
  });
}

// ============================
// 🧠 GAME LOGIC
// ============================

function initializeGameStateFromGrid() {
  const firstRow = getGrid().firstElementChild;
  if (!firstRow) throw new Error("First row not found.");

  const gameState = {
    wellPlaced: {},
    misplaced: new Set(),
    absent: new Set(),
    excludedPositions: {},
  };

  Array.from(firstRow.children).forEach((cell, i) => {
    const letter = cell.textContent.trim().toLowerCase();
    if (letter && letter !== ".") gameState.wellPlaced[i] = letter;
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
        gameState.excludedPositions[letter] ||= [];
        gameState.excludedPositions[letter].push(i);
        break;
      case "absent":
        if (!counts[letter]) {
          gameState.absent.add(letter);
        } else {
          gameState.maxOccurrences ||= {};
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

// ============================
// ⌨️ KEYBOARD INTERACTION
// ============================

async function typeWord(word, delay = 50) {
  if (typeof word !== "string") throw new TypeError("Word must be a string.");

  const letters = word.toLowerCase().split("");
  const expectedLength = getNumberOfLetters();

  if (letters.length !== expectedLength) {
    console.warn(`⚠️ "${word}" ne fait pas ${expectedLength} lettres.`);
  }

  for (const letter of letters) {
    const key = KEYBOARD_MAP[letter];
    if (key) key.click();
    else console.warn(`⚠️ Lettre inconnue : "${letter}"`);
    await new Promise((r) => setTimeout(r, delay));
  }

  KEYBOARD_MAP.enter?.click();
  await new Promise((r) => setTimeout(r, 4000));
}

// ============================
// ✅ VALIDATION & ENDGAME
// ============================

async function waitForWordValidation(timeoutMs = 500) {
  return new Promise((resolve) => {
    const alertBox = document.getElementById("alert");
    if (!alertBox) return resolve(true);

    const start = performance.now();
    (function check() {
      const invalid = alertBox.children.length > 0;
      const elapsed = performance.now() - start;
      if (invalid) return resolve(false);
      if (elapsed > timeoutMs) return resolve(true);
      requestAnimationFrame(check);
    })();
  });
}

function isGameWon() {
  const keyboard = document.getElementById("keyboard");
  return (
    keyboard?.firstElementChild?.classList.contains("alert-success") ?? false
  );
}

function isGameLost() {
  const keyboard = document.getElementById("keyboard");
  return (
    keyboard?.firstElementChild?.classList.contains("alert-danger") ?? false
  );
}

function getSolutionWord() {
  const keyboard = document.getElementById("keyboard");
  return keyboard?.getElementsByTagName("STRONG")[0].textContent ?? null;
}

function getTotalScore() {
  const scoreElem = document.getElementsByClassName("score_total")[0];

  if (!scoreElem) {
    console.warn("Élément de score non trouvé.");
    return 0;
  }
  return parseInt(scoreElem.textContent.replace(/\s+/g, ""), 10);
}

function getPlayerScore(playerName) {
  const nameContainers = document.querySelectorAll(".flex-grow-1.text-start");

  for (let i = 0; i < nameContainers.length; i++) {
    const container = nameContainers[i];
    const currentPlayer = container.childNodes[0].textContent.trim();

    if (currentPlayer.toLowerCase() === playerName.toLowerCase()) {
      const scoreContainer = container.nextElementSibling;

      if (scoreContainer && scoreContainer.classList.contains("text-end")) {
        const scoreElement = scoreContainer.firstElementChild;

        if (scoreElement) {
          let rawScoreText = scoreElement.textContent;
          let cleanScore = rawScoreText.replace(/pts/gi, "").replace(/\s/g, "");
          return parseInt(cleanScore, 10);
        }
      }
    }
  }

  return null;
}

// ============================
// 🚀 MAIN GAME LOOP
// ============================

async function startGame() {
  injectSettingsUI();
  
  // Handle initial countdown delay
  let delayLeft = loadConfig().initialDelay;
  while (delayLeft > 0) {
    while (loadConfig().isPaused) {
      updateBotStatus("⏸️ Bot en pause", "#dc3545");
      await new Promise((r) => setTimeout(r, 1000));
    }
    updateBotStatus(`Démarrage dans ${delayLeft} seconde(s)...`, "#fd7e14");
    await new Promise((r) => setTimeout(r, 1000));
    delayLeft--;
  }

  updateBotStatus("Téléchargement du dictionnaire...", "#0d6efd");

  const allWords = await fetchFrenchWordList();
  const invalidWords = loadInvalidWords();
  const lettersCount = getNumberOfLetters();
  const maxAttempts = getMaxAttempts();
  const validAnswers = [];

  const wordPool = allWords
    .filter((w) => w.length === lettersCount)
    .filter((w) => !invalidWords.includes(w));

  const gameState = initializeGameStateFromGrid();
  let attempt = 0;

  while (attempt < maxAttempts) {
    let wasPaused = false;

    while (loadConfig().isPaused) {
      updateBotStatus("⏸️ Bot en pause", "#dc3545");
      wasPaused = true;
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (wasPaused) updateBotStatus("Reprise de la partie...", "#198754");

    const config = loadConfig();
    const currentScore = getTotalScore();

    if (config.enableTargetPlayer) {
      const targetScore = getPlayerScore(config.targetPlayerName);
      if (
        targetScore !== null &&
        currentScore >= targetScore + config.targetScoreMargin
      ) {
        updateBotStatus(
          `🎯 Cible dépassée (${config.targetPlayerName})`,
          "#6f42c1",
        );
        return;
      }
    }

    if (config.enableMaxScore && currentScore >= config.maxScoreValue) {
      updateBotStatus(`🏆 Score limite atteint`, "#6f42c1");
      return;
    }

    if (attempt > 0) {
      const prevRow = getGrid().children[attempt - 1];
      const data = getRowData(prevRow);
      updateGameState(gameState, data);
    }

    updateBotStatus("Recherche du meilleur mot...", "#0d6efd");
    let word = findNextCandidate(wordPool, gameState, validAnswers);

    if (!word) {
      console.warn(
        "Aucun mot valide trouvé ! Réessai avec des mots déjà validés.",
      );
      if (validAnswers.length > 0) {
        word = validAnswers[0];
      } else {
        updateBotStatus("❌ Dictionnaire épuisé", "#dc3545");
        break;
      }
    }

    updateBotStatus(`Saisie du mot : ${word.toUpperCase()}`, "#fd7e14");
    await typeWord(word);

    updateBotStatus("Vérification du résultat...", "#0d6efd");
    const valid = await waitForWordValidation();
    if (!valid) {
      console.warn(`❌ "${word}" invalide.`);
      addInvalidWord(word);
      wordPool.splice(wordPool.indexOf(word), 1);
      continue;
    }

    validAnswers.push(word);

    if (isGameWon()) {
      updateBotStatus(
        `🎉 Mot trouvé ! (${attempt + 1}/${maxAttempts})`,
        "#198754",
      );
      addValidWord(word);
      break;
    }

    attempt++;
  }

  if (isGameLost()) {
    const solution = getSolutionWord();
    updateBotStatus(`😞 Perdu. Solution : ${solution}`, "#dc3545");
    if (solution) addValidWord(solution);
  }

  await triggerSafeReload();
}

console.clear();
startGame();