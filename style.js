// =========================
// Practice-La Farm (3 Qs)
// =========================

const STORAGE_KEY = "practiceLaFarm_v1";

const PLANTS = [
  { id: "carrot",     name: "Carrot",     emoji: "🥕", pct: 30 },
  { id: "sunflower",  name: "Sunflower",  emoji: "🌻", pct: 25 },
  { id: "tomato",     name: "Tomato",     emoji: "🍅", pct: 20 },
  { id: "strawberry", name: "Strawberry", emoji: "🍓", pct: 20 },
  { id: "moneyTree",  name: "Money Tree", emoji: "💰🌳", pct: 5  }, // rare
];

// 3 questions total; 1 correct = 1 chest
const QUIZ = [
  {
    q: "What is 7 + 5?",
    choices: ["10", "11", "12", "13"],
    answerIndex: 2
  },
  {
    q: "Which is a prime number?",
    choices: ["9", "15", "17", "21"],
    answerIndex: 2
  },
  {
    q: "What is 3 × 4?",
    choices: ["7", "10", "12", "14"],
    answerIndex: 2
  }
];

let gameState = loadState();

// ----- DOM
const coinsText = document.getElementById("coinsText");
const seedsText = document.getElementById("seedsText");
const scoreText = document.getElementById("scoreText");

const btnQuiz = document.getElementById("btnQuiz");
const btnShop = document.getElementById("btnShop");
const btnReset = document.getElementById("btnReset");

const quizModal = document.getElementById("quizModal");
const shopModal = document.getElementById("shopModal");
const closeQuiz = document.getElementById("closeQuiz");
const closeShop = document.getElementById("closeShop");
const closeShopBottom = document.getElementById("closeShopBottom");

const quizBody = document.getElementById("quizBody");
const submitQuiz = document.getElementById("submitQuiz");

const chestEls = [
  document.getElementById("chest0"),
  document.getElementById("chest1"),
  document.getElementById("chest2"),
];
const chestHint = document.getElementById("chestHint");

const plotsGrid = document.getElementById("plotsGrid");
const invGrid = document.getElementById("invGrid");
const buySeedBtn = document.getElementById("buySeedBtn");

// ----- init
renderAll();
wireEvents();

// =========================
// State
// =========================
function defaultState() {
  return {
    coins: 0,
    seeds: 1,              // first-time user seed
    lastScore: 0,           // 0-3
    chestsAvailable: 0,     // 0-3
    claimedChests: [false, false, false],
    farmPlots: [null, null, null, null], // 4 plots
    inventory: {
      carrot: 0,
      sunflower: 0,
      tomato: 0,
      strawberry: 0,
      moneyTree: 0
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);

    // basic repair in case older keys missing
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      inventory: { ...base.inventory, ...(parsed.inventory || {}) },
      claimedChests: Array.isArray(parsed.claimedChests) ? parsed.claimedChests.slice(0,3) : base.claimedChests,
      farmPlots: Array.isArray(parsed.farmPlots) ? parsed.farmPlots.slice(0,4) : base.farmPlots
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

// =========================
// Rendering
// =========================
function renderAll() {
  updateHUD();
  renderChests();
  renderPlots();
  renderInventory();
}

function updateHUD() {
  coinsText.textContent = String(gameState.coins);
  seedsText.textContent = String(gameState.seeds);
  scoreText.textContent = `${gameState.lastScore}/3`;
}

function renderChests() {
  const available = gameState.chestsAvailable;
  const claimed = gameState.claimedChests;

  chestEls.forEach((el, i) => {
    el.classList.remove("locked", "claimed");

    if (i >= available) {
      el.classList.add("locked");
    } else if (claimed[i]) {
      el.classList.add("claimed");
    }
  });

  if (available === 0) {
    chestHint.textContent = "Take the quiz to unlock chests.";
  } else {
    const remaining = countRemainingChests();
    chestHint.textContent = remaining > 0
      ? `You have ${remaining} chest(s) to claim. Click them for +1 coin each.`
      : "All chests claimed. Do the quiz again to unlock more.";
  }
}

function countRemainingChests() {
  let remaining = 0;
  for (let i = 0; i < 3; i++) {
    if (i < gameState.chestsAvailable && !gameState.claimedChests[i]) remaining++;
  }
  return remaining;
}

function renderPlots() {
  plotsGrid.innerHTML = "";

  gameState.farmPlots.forEach((plantId, idx) => {
    const btn = document.createElement("button");
    btn.className = "plot";

    if (!plantId) {
      btn.innerHTML = `
        <div class="emoji">🟫</div>
        <div class="name">Empty Plot</div>
        <div class="sub">Click to plant</div>
      `;
    } else {
      const plant = PLANTS.find(p => p.id === plantId);
      btn.innerHTML = `
        <div class="emoji">${plant?.emoji ?? "🌱"}</div>
        <div class="name">${plant?.name ?? "Plant"}</div>
        <div class="sub">Plot ${idx + 1}</div>
      `;
    }

    btn.addEventListener("click", () => {
      if (plantId) {
        alert("This plot is already planted!");
        return;
      }
      plantSeed(idx);
    });

    plotsGrid.appendChild(btn);
  });
}

function renderInventory() {
  invGrid.innerHTML = "";
  for (const plant of PLANTS) {
    const count = gameState.inventory[plant.id] ?? 0;
    const row = document.createElement("div");
    row.className = "invItem";
    row.innerHTML = `<span>${plant.emoji} ${plant.name}</span><b>${count}</b>`;
    invGrid.appendChild(row);
  }
}

// =========================
// Events / UI
// =========================
function wireEvents() {
  btnQuiz.addEventListener("click", openQuiz);
  closeQuiz.addEventListener("click", () => setModal(quizModal, false));

  btnShop.addEventListener("click", () => setModal(shopModal, true));
  closeShop.addEventListener("click", () => setModal(shopModal, false));
  closeShopBottom.addEventListener("click", () => setModal(shopModal, false));

  submitQuiz.addEventListener("click", submitQuizAnswers);

  buySeedBtn.addEventListener("click", buySeed);

  btnReset.addEventListener("click", () => {
    if (!confirm("Reset all progress (coins, seeds, plants)?")) return;
    gameState = defaultState();
    saveState();
    renderAll();
  });

  chestEls.forEach((el, i) => {
    el.addEventListener("click", () => claimChest(i));
  });

  // close modals on backdrop click
  [quizModal, shopModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) setModal(modal, false);
    });
  });
}

function setModal(modalEl, open) {
  modalEl.classList.toggle("hidden", !open);
}

// =========================
// Quiz
// =========================
function openQuiz() {
  // build quiz HTML
  quizBody.innerHTML = "";
  QUIZ.forEach((item, qIndex) => {
    const card = document.createElement("div");
    card.className = "qCard";
    card.innerHTML = `
      <div class="qTitle">Q${qIndex + 1}. ${item.q}</div>
      ${item.choices.map((c, i) => `
        <label class="choice">
          <input type="radio" name="q${qIndex}" value="${i}">
          <span>${c}</span>
        </label>
      `).join("")}
    `;
    quizBody.appendChild(card);
  });

  setModal(quizModal, true);
}

function submitQuizAnswers() {
  let correct = 0;

  QUIZ.forEach((item, qIndex) => {
    const picked = document.querySelector(`input[name="q${qIndex}"]:checked`);
    if (!picked) return; // unanswered = wrong
    const chosenIndex = Number(picked.value);
    if (chosenIndex === item.answerIndex) correct++;
  });

  // 1 correct = 1 chest (max 3)
  gameState.lastScore = correct;
  gameState.chestsAvailable = correct;
  gameState.claimedChests = [false, false, false];

  saveState();
  renderAll();

  setModal(quizModal, false);

  if (correct === 0) alert("Score: 0/3. No chests this time 😭");
  else alert(`Score: ${correct}/3! You unlocked ${correct} chest(s).`);
}

// =========================
// Chests
// =========================
function claimChest(index) {
  if (index >= gameState.chestsAvailable) return;
  if (gameState.claimedChests[index]) return;

  gameState.claimedChests[index] = true;
  gameState.coins += 1;

  saveState();
  updateHUD();
  renderChests();
}

// =========================
// Shop / Seeds / Planting
// =========================
function buySeed() {
  if (gameState.coins < 5) {
    alert("Not enough coins. You need 5 coins for a seed.");
    return;
  }
  gameState.coins -= 5;
  gameState.seeds += 1;

  saveState();
  renderAll();
}

function plantSeed(plotIndex) {
  if (gameState.seeds <= 0) {
    alert("No seeds! Go to the shop to buy more.");
    return;
  }
  if (gameState.farmPlots[plotIndex] !== null) return;

  gameState.seeds -= 1;

  const plantId = rollPlant();
  gameState.farmPlots[plotIndex] = plantId;
  gameState.inventory[plantId] = (gameState.inventory[plantId] ?? 0) + 1;

  saveState();
  renderAll();

  const plant = PLANTS.find(p => p.id === plantId);
  alert(`Your seed grew into: ${plant?.name ?? "a plant"} ${plant?.emoji ?? ""}`);
}

function rollPlant() {
  // weighted roll by pct
  const total = PLANTS.reduce((sum, p) => sum + p.pct, 0);
  let r = Math.random() * total;

  for (const p of PLANTS) {
    r -= p.pct;
    if (r <= 0) return p.id;
  }
  return "carrot";
}
