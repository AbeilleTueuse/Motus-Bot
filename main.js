const GRID_CLASS = "motus-grille";
const KEYBOARD_SELECTOR = "#keyboard .touche";
const SPECIAL_KEYS = {
  enter: "13",
  backspace: "46"
};
const KEYBOARDS_MAP = buildKeyboardMap();

function buildKeyboardMap() {
  const map = {};

  document.querySelectorAll(KEYBOARD_SELECTOR).forEach(btn => {
    const label = btn.textContent.trim().toLowerCase();

    if (label && /^[a-z]$/.test(label)) {
      map[label] = btn;
    }
  });

  for (const [name, id] of Object.entries(SPECIAL_KEYS)) {
    const btn = document.getElementById(id);
    if (btn) map[name] = btn;
  }

  return Object.freeze(map);
}

async function getFrenchWordList() {
    const url = "https://raw.githubusercontent.com/Taknok/French-Wordlist/master/francais.txt";
    const proxy = "https://corsproxy.io/?" + encodeURIComponent(url);

    const response = await fetch(proxy);
    if (!response.ok) {
        throw new Error(`Erreur de téléchargement : ${response.status}`);
    }

    const text = await response.text();

    const words = Array.from(
        new Set(
            text
                .split(/\r?\n/)
                .map(w => w.trim().toLowerCase())
                .filter(w => w.length > 0 && !w.includes("-"))
        )
    );

    return words;
}

function waitForClassRemoval(el, className = "done", timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (!el) return reject(new Error("Element not found"));

    if (!el.classList.contains(className)) return resolve();

    const observer = new MutationObserver((mutations) => {
      if (!el.classList.contains(className)) {
        observer.disconnect();
        if (timer) clearTimeout(timer);
        resolve();
      }
    });

    observer.observe(el, { attributes: true, attributeFilter: ["class"] });

    let timer = null;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout: the class "${className}" is still present after ${timeoutMs} ms`));
      }, timeoutMs);
    }
  });
}

function getNumberOfLetters() {
  const grid = document.querySelector(`.${GRID_CLASS}`);
  if (!grid) throw new Error(`Grid not found: ${GRID_CLASS}`);

  const firstRow = grid.firstElementChild;
  if (!firstRow) throw new Error("First row of the grid is missing.");

  return firstRow.children.length;
}

function getMaxAttempts() {
    const grid = document.querySelector(`.${GRID_CLASS}`);
    if (!grid) throw new Error(`Grid not found: ${GRID_CLASS}`);

    const rows = Array.from(grid.children);
    return rows.length;
}

async function typeWord(word, delay = 150) {
    if (typeof word !== "string") {
        throw new TypeError("The word must be a string.");
    }

    const letters = word.toLowerCase().split("");
    const gridSize = getNumberOfLetters();

    if (letters.length !== gridSize) {
        console.warn(`⚠️ The word "${word}" does not match the required length (${gridSize} letters).`);
    }

    for (const letter of letters) {
        const button = KEYBOARDS_MAP[letter];
        if (!button) {
            console.warn(`⚠️ Unknown or missing keyboard letter: "${letter}"`);
            continue;
        }

        button.click();
        await new Promise(res => setTimeout(res, delay));
    }

    // Press "Enter" at the end
    const enterKey = KEYBOARDS_MAP.enter;
    if (enterKey) enterKey.click();
    else console.warn("⚠️ Enter key not found.");

    await new Promise(res => setTimeout(res, 5000));
}

function getRowData(row) {
  if (!row) throw new Error("Row element not found");

  const data = [];

  for (const cell of row.children) {
    const letter = cell.textContent.trim().toLowerCase();

    let status = "absent";
    const classes = cell.firstElementChild.classList;

    if (classes.contains("green")) {
      status = "wellPlaced";
    } else if (classes.contains("orange")) {
      status = "misplaced";
    }

    data.push({ letter, status });
  }

  return data;
}

function getBestWord(wordList, gameState) {
  for (const word of wordList) {
    const letters = word.split("");

    let isValid = true;

    for (const [index, letter] of Object.entries(gameState.wellPlaced)) {
      if (letters[index] !== letter) {
        isValid = false;
        break;
      }
    }
    if (!isValid) continue;

    for (const letter of gameState.misplaced) {
      if (!letters.includes(letter)) {
        isValid = false;
        break;
      }

      const excluded = gameState.excludedPositions[letter] || [];
      for (const pos of excluded) {
        if (letters[pos] === letter) {
          isValid = false;
          break;
        }
      }
      if (!isValid) break;
    }
    if (!isValid) continue;

    for (const letter of gameState.absent) {
      if (letters.includes(letter)) {
        isValid = false;
        break;
      }
    }
    if (!isValid) continue;

    return word;
  }

  return null;
}

function updateGameState(gameState, rowData) {
  rowData.forEach((cell, index) => {
    const { letter, status } = cell;

    switch (status) {
      case "wellPlaced":
        gameState.wellPlaced[index] = letter;
        gameState.absent.delete(letter);
        break;

      case "misplaced":
        gameState.misplaced.add(letter);
        gameState.absent.delete(letter);
        if (!gameState.excludedPositions[letter]) {
          gameState.excludedPositions[letter] = [];
        }
        gameState.excludedPositions[letter].push(index);
        break;

      case "absent":
        const foundElsewhere =
          Object.values(gameState.wellPlaced).includes(letter) ||
          gameState.misplaced.has(letter);

        if (!foundElsewhere) {
          gameState.absent.add(letter);
        }
        break;
    }
  });
}


async function startGame() {
    const wordList = await getFrenchWordList();
    const numberOfLetters = getNumberOfLetters();
    const maxAttempts = getMaxAttempts();
    const filteredWords = wordList.filter(word => word.length === numberOfLetters);
    let attemptCount = 0;
    let gameState = {
        wellPlaced: {},
        misplaced: new Set(),
        absent: new Set(),
        excludedPositions: {},
    };

    while (attemptCount < maxAttempts) {
        const row = document.querySelector(`.${GRID_CLASS}`).children[attemptCount];
        let word = filteredWords[0];

        if (attemptCount > 0) {
            const previousRow = document.querySelector(`.${GRID_CLASS}`).children[attemptCount - 1];
            const data = getRowData(previousRow);
            updateGameState(gameState, data);
            word = getBestWord(filteredWords, gameState);
        }
        console.log(`Attempt ${attemptCount + 1}: Typing the word "${word}"`);
        console.log("Current game state:", gameState);
        await typeWord(word);
        // await waitForClassRemoval(row.lastElementChild, "done");
        attemptCount++;
    }
}