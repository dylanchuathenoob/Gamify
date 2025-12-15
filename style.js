// ===== GAME STATE =====
let gameState = {
  coins: 0,
  seeds: 1,
  lastScore: 0,
  totalQuestions: 3,
  chests: [false, false, false], // unlocked state
  plots: Array(8).fill(null), // 8 plots
  inventory: {} // {plantName: count}
};

// ===== PLANT TYPES =====
const PLANTS = [
  { name: "Tomato", emoji: "🍅", value: 3 },
  { name: "Carrot", emoji: "🥕", value: 2 },
  { name: "Corn", emoji: "🌽", value: 4 },
  { name: "Eggplant", emoji: "🍆", value: 3 },
  { name: "Potato", emoji: "🥔", value: 2 },
  { name: "Pumpkin", emoji: "🎃", value: 5 }
];

// ===== QUIZ QUESTIONS =====
const QUESTIONS = [
  {
    q: "What is 5 + 7?",
    choices: ["10", "11", "12", "13"],
    correct: 2
  },
  {
    q: "What is the capital of France?",
    choices: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2
  },
  {
    q: "How many continents are there?",
    choices: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    q: "What is 9 × 6?",
    choices: ["45", "54", "63", "72"],
    correct: 1
  },
  {
    q: "Which planet is closest to the Sun?",
    choices: ["Venus", "Mercury", "Mars", "Earth"],
    correct: 1
  },
  {
    q: "What is 100 - 37?",
    choices: ["63", "73", "53", "67"],
    correct: 0
  }
];

// ===== UTILITY FUNCTIONS =====
function saveGame() {
  localStorage.setItem('farmGame', JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem('farmGame');
  if (saved) {
    gameState = JSON.parse(saved);
  }
}

function updateUI() {
  document.getElementById('coinsText').textContent = gameState.coins;
  document.getElementById('seedsText').textContent = gameState.seeds;
  document.getElementById('scoreText').textContent = 
    `${gameState.lastScore}/${gameState.totalQuestions}`;
  
  updateChests();
  updatePlots();
  updateInventory();
}

function updateChests() {
  gameState.chests.forEach((unlocked, i) => {
    const chest = document.getElementById(`chest${i}`);
    const img = chest.querySelector('img');
    
    if (unlocked) {
      chest.classList.remove('locked');
      chest.disabled = false;
      img.src = 'images/chest-closed.png';
    } else {
      chest.classList.add('locked');
      chest.disabled = true;
    }
  });
  
  const anyUnlocked = gameState.chests.some(c => c);
  const hint = document.getElementById('chestHint');
  hint.textContent = anyUnlocked 
    ? 'Click unlocked chests to collect coins!' 
    : 'Take the quiz to unlock chests.';
}

function updatePlots() {
  const grid = document.getElementById('plotsGrid');
  grid.innerHTML = '';
  
  gameState.plots.forEach((plant, i) => {
    const plot = document.createElement('button');
    plot.className = 'plot';
    
    if (plant) {
      plot.innerHTML = `
        <div class="emoji">${plant.emoji}</div>
        <div class="name">${plant.name}</div>
        <div class="sub">Worth ${plant.value} 🪙</div>
      `;
      plot.onclick = () => harvestPlot(i);
    } else {
      plot.innerHTML = `
        <div class="emoji">🌱</div>
        <div class="name">Empty Plot</div>
        <div class="sub">Plant a seed</div>
      `;
      plot.onclick = () => plantSeed(i);
    }
    
    grid.appendChild(plot);
  });
}

function updateInventory() {
  const grid = document.getElementById('invGrid');
  grid.innerHTML = '';
  
  if (Object.keys(gameState.inventory).length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; opacity: 0.7;">No plants harvested yet.</p>';
    return;
  }
  
  Object.entries(gameState.inventory).forEach(([name, count]) => {
    const plant = PLANTS.find(p => p.name === name);
    const item = document.createElement('div');
    item.className = 'invItem';
    item.innerHTML = `
      <div>
        <span style="font-size: 24px; margin-right: 8px;">${plant.emoji}</span>
        <b>${name}</b>
      </div>
      <div>×${count}</div>
    `;
    grid.appendChild(item);
  });
}

// ===== CHEST FUNCTIONS =====
function openChest(index) {
  if (!gameState.chests[index]) return;
  
  const chest = document.getElementById(`chest${index}`);
  const img = chest.querySelector('img');
  
  // Animate
  img.style.animation = 'chestOpen 0.5s ease';
  
  setTimeout(() => {
    // Change to open image
    img.src = 'images/chest-opened.png';
    
    // Award coins
    const reward = Math.floor(Math.random() * 5) + 3; // 3-7 coins
    gameState.coins += reward;
    
    // Show coin pop
    const coinPop = document.createElement('div');
    coinPop.className = 'coinPop';
    coinPop.textContent = `+${reward} 🪙`;
    chest.appendChild(coinPop);
    
    setTimeout(() => coinPop.remove(), 800);
    
    // Lock chest again
    gameState.chests[index] = false;
    
    updateUI();
    saveGame();
    img.style.animation = '';
  }, 250);
}

// ===== PLOT FUNCTIONS =====
function plantSeed(index) {
  if (gameState.seeds < 1) {
    alert('You need seeds! Buy them from the shop.');
    return;
  }
  
  if (gameState.plots[index]) {
    alert('This plot already has a plant!');
    return;
  }
  
  const randomPlant = PLANTS[Math.floor(Math.random() * PLANTS.length)];
  gameState.plots[index] = randomPlant;
  gameState.seeds--;
  
  updateUI();
  saveGame();
}

function harvestPlot(index) {
  const plant = gameState.plots[index];
  if (!plant) return;
  
  gameState.coins += plant.value;
  gameState.inventory[plant.name] = (gameState.inventory[plant.name] || 0) + 1;
  gameState.plots[index] = null;
  
  updateUI();
  saveGame();
}

// ===== QUIZ FUNCTIONS =====
function openQuiz() {
  // Pick 3 random questions
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  
  const quizBody = document.getElementById('quizBody');
  quizBody.innerHTML = '';
  
  selected.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'qCard';
    card.innerHTML = `
      <div class="qTitle">Question ${i + 1}: ${q.q}</div>
      ${q.choices.map((choice, j) => `
        <label class="choice">
          <input type="radio" name="q${i}" value="${j}">
          <span>${choice}</span>
        </label>
      `).join('')}
    `;
    quizBody.appendChild(card);
  });
  
  // Store selected questions
  quizBody.dataset.questions = JSON.stringify(selected);
  
  document.getElementById('quizModal').classList.remove('hidden');
}

function closeQuiz() {
  document.getElementById('quizModal').classList.add('hidden');
}

function submitQuiz() {
  const quizBody = document.getElementById('quizBody');
  const questions = JSON.parse(quizBody.dataset.questions);
  
  let score = 0;
  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected && parseInt(selected.value) === q.correct) {
      score++;
    }
  });
  
  gameState.lastScore = score;
  gameState.totalQuestions = questions.length;
  
  // Unlock chests based on score
  for (let i = 0; i < score; i++) {
    gameState.chests[i] = true;
  }
  
  alert(`You scored ${score}/${questions.length}!\n${score} chest(s) unlocked!`);
  
  closeQuiz();
  updateUI();
  saveGame();
}

// ===== SHOP FUNCTIONS =====
function openShop() {
  document.getElementById('shopModal').classList.remove('hidden');
}

function closeShop() {
  document.getElementById('shopModal').classList.add('hidden');
}

function buySeed() {
  if (gameState.coins < 5) {
    alert('Not enough coins! You need 5 coins to buy a seed.');
    return;
  }
  
  gameState.coins -= 5;
  gameState.seeds++;
  
  updateUI();
  saveGame();
}

// ===== RESET FUNCTION =====
function resetGame() {
  if (!confirm('Are you sure you want to reset everything?')) return;
  
  gameState = {
    coins: 0,
    seeds: 1,
    lastScore: 0,
    totalQuestions: 3,
    chests: [false, false, false],
    plots: Array(8).fill(null),
    inventory: {}
  };
  
  updateUI();
  saveGame();
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  // Load saved game
  loadGame();
  updateUI();
  
  // Top bar buttons
  document.getElementById('btnQuiz').addEventListener('click', openQuiz);
  document.getElementById('btnShop').addEventListener('click', openShop);
  document.getElementById('btnReset').addEventListener('click', resetGame);
  
  // Quiz modal
  document.getElementById('closeQuiz').addEventListener('click', closeQuiz);
  document.getElementById('submitQuiz').addEventListener('click', submitQuiz);
  
  // Shop modal
  document.getElementById('closeShop').addEventListener('click', closeShop);
  document.getElementById('closeShopBottom').addEventListener('click', closeShop);
  document.getElementById('buySeedBtn').addEventListener('click', buySeed);
  
  // Chest buttons
  document.getElementById('chest0').addEventListener('click', () => openChest(0));
  document.getElementById('chest1').addEventListener('click', () => openChest(1));
  document.getElementById('chest2').addEventListener('click', () => openChest(2));
  
  // Close modals when clicking backdrop
  document.getElementById('quizModal').addEventListener('click', (e) => {
    if (e.target.id === 'quizModal') closeQuiz();
  });
  
  document.getElementById('shopModal').addEventListener('click', (e) => {
    if (e.target.id === 'shopModal') closeShop();
  });
});
