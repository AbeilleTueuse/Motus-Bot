// ============================
// 🔧 CONSTANTES ET CONFIG
// ============================

const GRID_CLASS = "motus-grille";
const KEYBOARD_SELECTOR = "#keyboard .touche";
const SPECIAL_KEYS = { enter: "13", backspace: "46" };
const INVALID_WORDS_KEY = "motus_invalid_words";
const VALID_WORDS_KEY = "motus_valid_words";
const WORD_SOURCE_URL =
  "https://raw.githubusercontent.com/lorenbrichter/Words/refs/heads/master/Words/fr.txt";
const PROXY_PREFIX = "https://corsproxy.io/?";

// ============================
// 💾 GESTION DU LOCALSTORAGE
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
// 🎹 CLAVIER VIRTUEL
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
// 📚 LISTE DES MOTS FRANÇAIS
// ============================

async function fetchFrenchWordList() {
  const url = PROXY_PREFIX + encodeURIComponent(WORD_SOURCE_URL);
  const response = await fetch(url);
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
        .replace(/æ/g, "ae")
    )
    .filter((w) => w && /^[a-z]+$/.test(w));

  return Array.from(new Set(allWords));
}

// ============================
// 🧩 UTILITAIRES DE GRILLE
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
// 🧠 LOGIQUE DU JEU
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
        const known =
          Object.values(gameState.wellPlaced).includes(letter) ||
          gameState.misplaced.has(letter);
        if (!known) gameState.absent.add(letter);
        break;
    }
  });
}

function findNextCandidate(wordList, gameState, validAnswers) {
  return (
    wordList.find((word) => {
      const letters = word.split("");

      // Lettres bien placées
      for (const [i, l] of Object.entries(gameState.wellPlaced)) {
        if (letters[i] !== l) return false;
      }

      // Lettres mal placées
      for (const l of gameState.misplaced) {
        if (!letters.includes(l)) return false;
        const excluded = gameState.excludedPositions[l] || [];
        if (excluded.some((pos) => letters[pos] === l)) return false;
      }

      // Lettres absentes
      for (const l of gameState.absent) {
        if (letters.includes(l)) return false;
      }

      // Vérifier les mots déjà validés
      if (validAnswers.includes(word)) return false;

      return true;
    }) || null
  );
}

// ============================
// ⌨️ INTERACTION AVEC LE CLAVIER
// ============================

async function typeWord(word, delay = 150) {
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
// ✅ VALIDATION ET FIN DE PARTIE
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

// ============================
// 🚀 BOUCLE PRINCIPALE DU JEU
// ============================

async function startGame() {
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
    if (attempt > 0) {
      const prevRow = getGrid().children[attempt - 1];
      const data = getRowData(prevRow);
      updateGameState(gameState, data);
    }

    let word = findNextCandidate(wordPool, gameState, validAnswers);
    if (!word) {
      console.warn(
        "Aucun mot valide trouvé ! Réessai avec des mots déjà validés."
      );
      if (validAnswers.length > 0) {
        word = validAnswers[0];
      } else {
        console.error("Aucun mot déjà validé disponible.");
        break;
      }
    }
    await typeWord(word);

    const valid = await waitForWordValidation();
    if (!valid) {
      console.warn(`❌ "${word}" invalide.`);
      addInvalidWord(word);
      wordPool.splice(wordPool.indexOf(word), 1);
      continue;
    }

    validAnswers.push(word);

    if (isGameWon()) {
      console.log(`🎉 Mot trouvé en ${attempt + 1} essais !`);
      addValidWord(word);
      break;
    }

    attempt++;
  }

  if (isGameLost()) {
    const solution = getSolutionWord();
    console.log(`😞 Échec du jeu. La solution était : ${solution}`);
    addValidWord(solution);
  }

  location.reload();
}

console.clear();
startGame();
