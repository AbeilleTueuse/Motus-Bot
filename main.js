// ============================================================================
// 🔧 CONSTANTS AND SELECTORS
// ============================================================================

const GRID_SELECTOR = "#mc-grille, .mc-grille";
const ROW_SELECTOR = ".mc-ligne";
const CELL_SELECTOR = ".mc-case";
const KEYBOARD_CONTAINER_SELECTOR = "#mc-clavier";
const KEY_BUTTON_SELECTOR = "#mc-clavier button[data-touche], .mc-touche";
const DIFFICULTY_BUTTON_SELECTOR = "#mc-difficile";

const INVALID_WORDS_KEY = "motus_invalid_words";
const VALID_WORDS_KEY = "motus_valid_words_by_mode";
const WORD_SOURCE_URL =
  "https://raw.githubusercontent.com/lorenbrichter/Words/refs/heads/master/Words/fr.txt";

// ============================================================================
// ⚙️ BOT CONFIGURATION
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

function getCurrentGameMode() {
  const btn = document.querySelector(DIFFICULTY_BUTTON_SELECTOR);
  if (!btn) return "normal";
  return btn.getAttribute("aria-pressed") === "true" ||
    btn.classList.contains("btn-warning")
    ? "difficile"
    : "normal";
}

// ============================================================================
// 💾 STORAGE (MOTS VALIDES PAR MODE ET LONGUEUR)
// ============================================================================

function loadValidWordsStore() {
  try {
    const data = localStorage.getItem(VALID_WORDS_KEY);
    if (!data) return { normal: {}, difficile: {} };
    const parsed = JSON.parse(data);
    return {
      normal: parsed.normal || {},
      difficile: parsed.difficile || {},
    };
  } catch {
    return { normal: {}, difficile: {} };
  }
}

function saveValidWordsStore(store) {
  localStorage.setItem(VALID_WORDS_KEY, JSON.stringify(store));
}

function addDiscoveredWord(word, mode, length) {
  if (!word) return;
  const store = loadValidWordsStore();
  const lenKey = String(length);

  if (!store[mode]) store[mode] = {};
  if (!store[mode][lenKey]) store[mode][lenKey] = [];

  const cleanWord = word.toLowerCase().trim();
  if (!store[mode][lenKey].includes(cleanWord)) {
    store[mode][lenKey].push(cleanWord);
    store[mode][lenKey].sort();
    saveValidWordsStore(store);
  }
}

function getDiscoveredWords(mode, length) {
  const store = loadValidWordsStore();
  const lenKey = String(length);
  return store[mode] && store[mode][lenKey] ? store[mode][lenKey] : [];
}

function loadInvalidWords() {
  try {
    const data = localStorage.getItem(INVALID_WORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================================================
// 🪟 MODAL DU DICTIONNAIRE
// ============================================================================

let currentModalTab = "normal";

function injectDictionaryModal() {
  if (document.getElementById("motus-dict-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "motus-dict-modal-overlay";
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 100000;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="background: #ffffff; width: 680px; max-width: 90vw; max-height: 85vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
      
      <!-- En-tête -->
      <div style="padding: 16px 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 18px; color: #212529;">📖 Mots découverts</h3>
        <button id="motus-modal-close-btn" type="button" style="background: transparent; border: none; font-size: 20px; cursor: pointer; color: #6c757d; line-height: 1;">&times;</button>
      </div>

      <!-- Contrôles (Onglets + Recherche) -->
      <div style="padding: 12px 20px; border-bottom: 1px solid #eee; display: flex; gap: 12px; align-items: center; background: #fff;">
        <div style="display: flex; gap: 6px;">
          <button type="button" id="modal-tab-normal" class="motus-tab-btn active" style="padding: 6px 14px; border-radius: 6px;">Normal</button>
          <button type="button" id="modal-tab-difficile" class="motus-tab-btn" style="padding: 6px 14px; border-radius: 6px;">Difficile</button>
        </div>
        <input type="text" id="modal-search-input" placeholder="Filtrer un mot..." style="flex: 1; padding: 6px 10px; border: 1px solid #ced4da; border-radius: 6px; font-size: 13px;">
      </div>

      <!-- Contenu défilant -->
      <div id="modal-dict-body" style="padding: 20px; overflow-y: auto; flex: 1; font-size: 13px; background: #fafafa;"></div>

      <!-- Pied de page -->
      <div style="padding: 12px 20px; background: #f8f9fa; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
        <span id="modal-total-count" style="font-weight: 600; color: #495057;">0 mot enregistré</span>
        <div style="display: flex; gap: 8px;">
          <button type="button" id="modal-copy-json" style="padding: 7px 12px; font-size: 12px; font-weight: bold; background: #e7f1ff; border: 1px solid #0d6efd; color: #0d6efd; border-radius: 6px; cursor: pointer;">
            📋 Copier tout (JSON)
          </button>
          <button type="button" id="modal-close-footer" style="padding: 7px 12px; font-size: 12px; background: #6c757d; border: none; color: #fff; border-radius: 6px; cursor: pointer;">
            Fermer
          </button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.display = "none";
    window.isEditingBotConfig = false;
  };

  document
    .getElementById("motus-modal-close-btn")
    .addEventListener("click", close);
  document
    .getElementById("modal-close-footer")
    .addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const tabNormal = document.getElementById("modal-tab-normal");
  const tabDifficile = document.getElementById("modal-tab-difficile");
  const searchInput = document.getElementById("modal-search-input");

  tabNormal.addEventListener("click", () => {
    currentModalTab = "normal";
    tabNormal.classList.add("active");
    tabDifficile.classList.remove("active");
    renderModalWords(searchInput.value);
  });

  tabDifficile.addEventListener("click", () => {
    currentModalTab = "difficile";
    tabDifficile.classList.add("active");
    tabNormal.classList.remove("active");
    renderModalWords(searchInput.value);
  });

  searchInput.addEventListener("input", (e) => {
    renderModalWords(e.target.value);
  });

  document.getElementById("modal-copy-json").addEventListener("click", () => {
    const raw = JSON.stringify(loadValidWordsStore(), null, 2);
    navigator.clipboard.writeText(raw).then(() => {
      alert("Dictionnaire copié dans le presse-papier.");
    });
  });
}

function openDictionaryModal() {
  injectDictionaryModal();
  const overlay = document.getElementById("motus-dict-modal-overlay");
  currentModalTab = getCurrentGameMode();

  const tabNormal = document.getElementById("modal-tab-normal");
  const tabDifficile = document.getElementById("modal-tab-difficile");
  if (currentModalTab === "difficile") {
    tabDifficile.classList.add("active");
    tabNormal.classList.remove("active");
  } else {
    tabNormal.classList.add("active");
    tabDifficile.classList.remove("active");
  }

  document.getElementById("modal-search-input").value = "";
  renderModalWords();
  overlay.style.display = "flex";
  window.isEditingBotConfig = true;
}

function renderModalWords(query = "") {
  const container = document.getElementById("modal-dict-body");
  const countSpan = document.getElementById("modal-total-count");
  const store = loadValidWordsStore();
  const modeData = store[currentModalTab] || {};
  const filter = query.trim().toLowerCase();
  const hasFilter = filter.length > 0;

  const lengths = Object.keys(modeData).sort((a, b) => Number(a) - Number(b));
  let totalModeWords = 0;
  let matchesCount = 0;

  let html = "";

  lengths.forEach((len) => {
    const words = (modeData[len] || []).slice();
    totalModeWords += words.length;

    const matched = hasFilter ? words.filter((w) => w.includes(filter)) : words;
    matchesCount += matched.length;

    if (matched.length > 0) {
      const isNineLetters = Number(len) === 9;

      // Groupement : 1re & 3e lettre pour 9 lettres, sinon 1re lettre
      const groups = {};
      matched.forEach((w) => {
        let key = "";
        if (isNineLetters && w.length >= 3) {
          key = `${w[0].toUpperCase()} _ ${w[2].toUpperCase()}`;
        } else {
          key = w[0].toUpperCase();
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(w);
      });

      const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

      let groupsHtml = "";
      sortedKeys.forEach((key) => {
        const groupWords = groups[key].sort((a, b) => a.localeCompare(b));

        // Déroulant par lettre / indice (déplié automatiquement si recherche active)
        groupsHtml += `
          <details ${hasFilter ? "open" : ""} style="margin-top: 6px; border: 1px solid #e2e8f0; border-radius: 6px; background: #ffffff; overflow: hidden;">
            <summary style="cursor: pointer; padding: 7px 10px; background: #f8f9fa; font-size: 12px; font-weight: 600; color: #495057; display: flex; justify-content: space-between; align-items: center; user-select: none;">
              <span>${isNineLetters ? `Indice <strong style="color: #0d6efd;">${key}</strong>` : `Lettre <strong style="color: #0d6efd;">${key}</strong>`}</span>
              <span style="background: #e9ecef; color: #495057; padding: 1px 7px; border-radius: 10px; font-size: 11px;">${groupWords.length}</span>
            </summary>
            <div style="padding: 8px; display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 6px; font-family: monospace; font-size: 12px; color: #212529; background: #ffffff; border-top: 1px solid #f1f3f5;">
              ${groupWords.map((w) => `<span style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 3px 6px; border-radius: 4px; text-align: center;">${w}</span>`).join("")}
            </div>
          </details>
        `;
      });

      // Déroulant principal par longueur de mot
      html += `
        <details ${hasFilter ? "open" : ""} style="margin-bottom: 10px; border: 1px solid #ced4da; border-radius: 8px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <summary style="cursor: pointer; padding: 10px 14px; background: #ffffff; font-size: 13px; font-weight: bold; color: #0d6efd; display: flex; justify-content: space-between; align-items: center; user-select: none;">
            <span>📁 ${len} lettres</span>
            <span style="background: #e7f1ff; color: #0d6efd; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${matched.length} mot(s)</span>
          </summary>
          <div style="padding: 6px 10px 10px 10px; background: #fdfdfd; border-top: 1px solid #f1f3f5;">
            ${groupsHtml}
          </div>
        </details>
      `;
    }
  });

  countSpan.textContent = hasFilter
    ? `${matchesCount} résultat(s) (sur ${totalModeWords})`
    : `${totalModeWords} mot(s) enregistré(s)`;

  if (!html) {
    container.innerHTML = `
      <div style="text-align: center; color: #888; padding: 40px 0;">
        ${hasFilter ? "Aucun mot ne correspond à la recherche." : "Aucun mot enregistré dans ce mode pour l'instant."}
      </div>
    `;
    return;
  }

  container.innerHTML = html;
}
// ============================================================================
// 🖥️ UI SETTINGS (PANNEAU FLOTTANT)
// ============================================================================

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
    .motus-bot-toggle { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
    .motus-bot-toggle input { opacity: 0; width: 0; height: 0; }
    .motus-bot-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .3s; border-radius: 20px; }
    .motus-bot-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
    .motus-bot-toggle input:checked + .motus-bot-slider { background-color: #198754; }
    .motus-bot-toggle input:checked + .motus-bot-slider:before { transform: translateX(16px); }
    
    .motus-bot-input { width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; transition: .3s; }
    .motus-bot-input:focus { border-color: #0d6efd; outline: none; }
    .motus-bot-row { margin-bottom: 12px; }
    .motus-bot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .motus-bot-desc { font-size: 11px; color: #6c757d; margin-bottom: 6px; line-height: 1.3; }
    
    .motus-bot-status-box { background: #f8f9fa; padding: 8px; border-radius: 8px; text-align: center; margin-bottom: 12px; border: 1px solid #dee2e6; }
    .motus-bot-hover-alert { display: none; font-size: 11px; color: #d63384; margin-top: 10px; text-align: center; font-style: italic; background: #fff0f6; padding: 6px; border-radius: 6px; border: 1px solid #ffcce0; }
    #motus-bot-container:hover .motus-bot-hover-alert { display: block; }

    .motus-bot-drag-handle { cursor: grab; background-color: #f1f3f5; padding: 10px; border-radius: 12px 12px 0 0; border-bottom: 1px solid #ced4da; display: flex; justify-content: center; align-items: center; user-select: none; }
    .motus-bot-drag-handle:active { cursor: grabbing; }

    .motus-tab-btn { border: 1px solid #ced4da; background: #e9ecef; cursor: pointer; font-weight: bold; color: #495057; font-size: 12px; }
    .motus-tab-btn.active { background: #0d6efd; color: #fff; border-color: #0d6efd; }
  `;
  document.head.appendChild(style);

  container.innerHTML = `
    <div id="motus-bot-drag-handle" class="motus-bot-drag-handle">
      <h3 style="margin: 0; font-size: 14px; color: #212529;">🤖 Bot Configuration</h3>
    </div>
    
    <div style="padding: 14px;">
      <div class="motus-bot-status-box">
        <strong style="color: #495057;">Statut :</strong>
        <span id="bot-status-text" style="font-weight: bold; color: #0d6efd; display: block; margin-top: 2px;">Initialisation...</span>
      </div>
      
      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Mettre en pause</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-pause" ${config.isPaused ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
      </div>

      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Délai initial</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <input type="number" id="bot-initial-delay" class="motus-bot-input" value="${config.initialDelay}" min="0" style="width: 75px;">
          <span style="font-size: 11px; color: #6c757d;">secondes</span>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
      
      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Cibler un joueur</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-enable-player" ${config.enableTargetPlayer ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <input type="text" id="bot-target-name" class="motus-bot-input" value="${config.targetPlayerName}" placeholder="Pseudo">
          <div style="display: flex; align-items: center; gap: 6px;">
            <input type="number" id="bot-target-margin" class="motus-bot-input" value="${config.targetScoreMargin}" placeholder="10000" style="width: 80px;">
            <span style="font-size: 11px; color: #6c757d;">pts d'écart</span>
          </div>
        </div>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
      
      <div class="motus-bot-row">
        <div class="motus-bot-header">
          <strong>Score plafond</strong>
          <label class="motus-bot-toggle">
            <input type="checkbox" id="bot-enable-max" ${config.enableMaxScore ? "checked" : ""}>
            <span class="motus-bot-slider"></span>
          </label>
        </div>
        <input type="number" id="bot-max-score" class="motus-bot-input" value="${config.maxScoreValue}" placeholder="Score maximum">
      </div>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">

      <!-- BOUTON D'OUVERTURE DE LA MODALE -->
      <button type="button" id="bot-open-modal-btn" style="width: 100%; padding: 8px; font-size: 12px; font-weight: bold; border: 1px solid #0d6efd; background: #e7f1ff; color: #0d6efd; border-radius: 6px; cursor: pointer;">
        📖 Ouvrir le dictionnaire
      </button>

      <div class="motus-bot-hover-alert">
        ⚠️ Rechargement suspendu tant que le curseur est ici.
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Drag & drop
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
    let newLeft = Math.max(
      0,
      Math.min(
        e.clientX - dragOffsetX,
        window.innerWidth - container.offsetWidth,
      ),
    );
    let newTop = Math.max(
      0,
      Math.min(
        e.clientY - dragOffsetY,
        window.innerHeight - container.offsetHeight,
      ),
    );
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
    marginInput.parentElement.style.opacity = isPlayerEnabled ? "1" : "0.5";

    const isMaxEnabled = document.getElementById("bot-enable-max").checked;
    const maxInput = document.getElementById("bot-max-score");
    maxInput.disabled = !isMaxEnabled;
    maxInput.style.opacity = isMaxEnabled ? "1" : "0.5";
  };
  applyUIState();

  container.addEventListener("input", (e) => {
    if (e.target.id === "motus-bot-drag-handle") return;
    const currentConfig = loadConfig();
    let parsedDelay = parseInt(
      document.getElementById("bot-initial-delay").value,
      10,
    );
    if (isNaN(parsedDelay) || parsedDelay < 0) parsedDelay = 0;

    saveConfig({
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
    });
    applyUIState();
  });

  document
    .getElementById("bot-open-modal-btn")
    .addEventListener("click", openDictionaryModal);

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
    updateBotStatus("En pause (menu ou dictionnaire ouvert)...", "#fd7e14");
  }
  while (window.isEditingBotConfig) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  updateBotStatus("Rechargement pour le mot suivant...", "#0d6efd");
  location.reload();
}

// ============================================================================
// 🎹 VIRTUAL KEYBOARD INTEGRATION
// ============================================================================

function buildKeyboardMap() {
  const map = {};
  const buttons = document.querySelectorAll(KEY_BUTTON_SELECTOR);
  buttons.forEach((btn) => {
    const keyAttr = (btn.getAttribute("data-touche") || btn.textContent)
      .trim()
      .toUpperCase();
    if (keyAttr === "VALIDER" || keyAttr === "ENTER") {
      map["enter"] = btn;
    } else if (
      keyAttr === "EFFACER" ||
      keyAttr === "BACKSPACE" ||
      keyAttr === "SUPPR"
    ) {
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
  if (!response.ok)
    throw new Error(`Échec du téléchargement (${response.status})`);
  const text = await response.text();
  const allWords = text
    .split(/\r?\n/)
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
  if (!grid) throw new Error(`Grille introuvable (${GRID_SELECTOR})`);
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

function waitForRowReveal(row, timeout = 5000, postDelay = 1000) {
  return new Promise((resolve) => {
    if (!row) return resolve(false);
    const cells = row.querySelectorAll(CELL_SELECTOR);
    const lastCell = cells[cells.length - 1];

    const done = (success) => {
      setTimeout(() => resolve(success), success ? postDelay : 0);
    };

    if (!lastCell || lastCell.classList.contains("mc-revele")) {
      return done(true);
    }

    let timer;
    const observer = new MutationObserver(() => {
      if (lastCell.classList.contains("mc-revele")) {
        clearTimeout(timer);
        observer.disconnect();
        done(true);
      }
    });

    observer.observe(lastCell, {
      attributes: true,
      attributeFilter: ["class"],
    });
    timer = setTimeout(() => {
      observer.disconnect();
      done(false);
    }, timeout);
  });
}

function getRowData(row) {
  if (!row) throw new Error("Ligne introuvable.");
  return Array.from(row.children).map((cell) => {
    const letter = cell.textContent.trim().toLowerCase();
    const classList = cell.classList;
    let status = "absent";
    if (classList.contains("bg-success")) {
      status = "wellPlaced";
    } else if (classList.contains("bg-warning")) {
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
  if (!firstRow) throw new Error("Première ligne introuvable.");

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
        gameState.excludedPositions[letter] =
          gameState.excludedPositions[letter] || [];
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

function findNextCandidate(wordPool, gameState, attemptedInGame) {
  return (
    wordPool.find((word) => {
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

      if (attemptedInGame.includes(word)) return false;

      return true;
    }) || null
  );
}

// ============================================================================
// ⌨️ TYPING ENGINE
// ============================================================================

async function typeWord(word, keyboardMap, currentRow, delay = 60) {
  if (typeof word !== "string") throw new TypeError("Mot invalide.");

  const letters = word.toLowerCase().split("");
  for (const letter of letters) {
    const key = keyboardMap[letter];
    if (key) key.click();
    await new Promise((r) => setTimeout(r, delay));
  }

  if (keyboardMap["enter"]) {
    keyboardMap["enter"].click();
  }

  if (currentRow) {
    await waitForRowReveal(currentRow);
  } else {
    await new Promise((r) => setTimeout(r, 1200));
  }
}

// ============================================================================
// 📊 SCORE & LEADERBOARD PARSER
// ============================================================================

function getTotalScore() {
  const scoreElem = document.querySelector(
    "#mc-score-total, .score_total, .mc-total-score",
  );
  if (scoreElem) {
    return (
      parseInt(
        scoreElem.textContent.replace(/pts/gi, "").replace(/[\s\u00a0]/g, ""),
        10,
      ) || 0
    );
  }
  return 0;
}

function getPlayerScore(playerName) {
  const scoreCards = document.querySelectorAll(
    "#mc-classement-jour .mc-score, .mc-classement-liste li",
  );
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
        const cleanScore = badge.textContent
          .replace(/pts/gi, "")
          .replace(/[\s\u00a0]/g, "");
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
  injectDictionaryModal();

  let delayLeft = loadConfig().initialDelay;
  while (delayLeft > 0) {
    while (loadConfig().isPaused) {
      updateBotStatus("⏸️ En pause", "#dc3545");
      await new Promise((r) => setTimeout(r, 1000));
    }
    updateBotStatus(`Démarrage dans ${delayLeft}s...`, "#fd7e14");
    await new Promise((r) => setTimeout(r, 1000));
    delayLeft--;
  }

  updateBotStatus("Chargement du dictionnaire...", "#0d6efd");

  const currentMode = getCurrentGameMode();
  const lettersCount = getNumberOfLetters();
  const maxAttempts = getMaxAttempts();

  const allWords = await fetchFrenchWordList();
  const invalidWords = loadInvalidWords();
  const discoveredWords = getDiscoveredWords(currentMode, lettersCount);
  const attemptedInGame = [];

  let wordPool = allWords
    .filter((w) => w.length === lettersCount)
    .filter((w) => !invalidWords.includes(w))
    .filter((w) => !discoveredWords.includes(w));

  const gameState = initializeGameStateFromGrid();
  const keyboardMap = buildKeyboardMap();
  let attempt = 0;
  let won = false;

  while (attempt < maxAttempts) {
    while (loadConfig().isPaused) {
      updateBotStatus("⏸️ En pause", "#dc3545");
      await new Promise((r) => setTimeout(r, 1000));
    }

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
      updateBotStatus(`🏆 Plafond de score atteint`, "#6f42c1");
      return;
    }

    if (attempt > 0) {
      const grid = getGrid();
      const rows = grid.querySelectorAll(ROW_SELECTOR);
      const prevRow = rows[attempt - 1] || grid.children[attempt - 1];
      const data = getRowData(prevRow);

      updateGameState(gameState, data);

      if (
        data.length > 0 &&
        data.every((cell) => cell.status === "wellPlaced")
      ) {
        won = true;
        break;
      }
    }

    updateBotStatus("Calcul du mot...", "#0d6efd");
    let word = findNextCandidate(wordPool, gameState, attemptedInGame);

    if (!word) {
      if (attemptedInGame.length > 0) {
        word = attemptedInGame[0];
      } else {
        updateBotStatus("❌ Dictionnaire épuisé", "#dc3545");
        break;
      }
    }

    const grid = getGrid();
    const rows = grid.querySelectorAll(ROW_SELECTOR);
    const currentRow = rows[attempt] || grid.children[attempt];

    updateBotStatus(
      `Envoi : ${word.toUpperCase()} [${currentMode}]`,
      "#fd7e14",
    );
    await typeWord(word, keyboardMap, currentRow);

    attemptedInGame.push(word);
    attempt++;
  }

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
    updateBotStatus(`🎉 Mot trouvé (${attempt}/${maxAttempts}) !`, "#198754");
    const winningWord = attemptedInGame[attemptedInGame.length - 1];
    if (winningWord) {
      addDiscoveredWord(winningWord, currentMode, lettersCount);
    }
  } else {
    updateBotStatus(`😞 Mot manqué.`, "#dc3545");
  }

  await triggerSafeReload();
}

console.clear();
startGame();
