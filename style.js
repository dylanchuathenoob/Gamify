// ---------- STATE ----------

const defaultState = {
  coins: 50,
  selectedPet: null,         // 'cat' | 'dog' | 'bunny'
  inventory: [],             // array of item ids
  equipped: {
    hat: null,
    bed: null,
  },
};

// Shop items (you can expand this list anytime)
const shopItemsData = [
  { id: "hat_red",   name: "Red Hat",   price: 20, emoji: "🎩", type: "hat" },
  { id: "hat_star",  name: "Star Cap",  price: 40, emoji: "🧢", type: "hat" },
  { id: "bed_soft",  name: "Soft Bed",  price: 30, emoji: "🛏️", type: "bed" },
  { id: "food_basic",name: "Basic Food",price: 10, emoji: "🍖", type: "food" },
];

let state = { ...defaultState };

// ---------- LOCAL STORAGE ----------

function loadState() {
  const saved = localStorage.getItem("pl_pet_state");
  if (saved) {
    try {
      state = { ...defaultState, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to parse state, resetting.", e);
      state = { ...defaultState };
    }
  }
}

function saveState() {
  localStorage.setItem("pl_pet_state", JSON.stringify(state));
}

// ---------- UI HELPERS ----------

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function updateCoinsUI() {
  document.getElementById("coinsDisplay").textContent = state.coins;
}

function getPetEmoji(type) {
  if (type === "cat") return "🐱";
  if (type === "dog") return "🐶";
  if (type === "bunny") return "🐰";
  return "❓";
}

function getPetLabel(type) {
  if (!type) return "No pet selected";
  return {
    cat: "Your Cat",
    dog: "Your Dog",
    bunny: "Your Bunny",
  }[type];
}

function updatePetUI() {
  const petEmojiEl = document.getElementById("petEmoji");
  const petLabelEl = document.getElementById("petTypeLabel");
  const equippedHatEl = document.getElementById("equippedHat");
  const equippedBedEl = document.getElementById("equippedBed");

  petEmojiEl.textContent = getPetEmoji(state.selectedPet);
  petLabelEl.textContent = getPetLabel(state.selectedPet);

  // Show equipped items
  const hatItem = shopItemsData.find(i => i.id === state.equipped.hat);
  const bedItem = shopItemsData.find(i => i.id === state.equipped.bed);

  equippedHatEl.textContent = hatItem ? `Hat: ${hatItem.name}` : "";
  equippedBedEl.textContent = bedItem ? `Bed: ${bedItem.name}` : "";
}

function updateInventoryUI() {
  const ul = document.getElementById("inventoryList");
  ul.innerHTML = "";

  if (state.inventory.length === 0) {
    const li = document.createElement("li");
    li.textContent = "You don't own any items yet.";
    ul.appendChild(li);
    return;
  }

  state.inventory.forEach((itemId) => {
    const item = shopItemsData.find((i) => i.id === itemId);
    if (!item) return;
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.type})`;
    ul.appendChild(li);
  });
}

function renderShopItems() {
  const container = document.getElementById("shopItems");
  container.innerHTML = "";

  shopItemsData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "shop-item";

    const header = document.createElement("div");
    header.className = "shop-item-header";

    const emoji = document.createElement("div");
    emoji.className = "shop-emoji";
    emoji.textContent = item.emoji;

    const textBlock = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "shop-name";
    nameEl.textContent = item.name;

    const metaEl = document.createElement("div");
    metaEl.className = "shop-meta";
    metaEl.textContent = `Type: ${item.type} • Price: ${item.price} coins`;

    textBlock.appendChild(nameEl);
    textBlock.appendChild(metaEl);

    header.appendChild(emoji);
    header.appendChild(textBlock);

    const btn = document.createElement("button");
    btn.className = "primary-btn";
    btn.textContent = "Buy";
    btn.onclick = () => buyItem(item.id);

    div.appendChild(header);
    div.appendChild(btn);

    container.appendChild(div);
  });
}

// ---------- GAME ACTIONS ----------

function selectPet(type) {
  state.selectedPet = type;
  saveState();
  updatePetUI();
}

function goToMain() {
  showScreen("screenMain");
}

function backToSelect() {
  showScreen("screenSelect");
}

function earnCoins() {
  // Later: replace this with "score from daily question + streak"
  const earned = 10;
  state.coins += earned;
  saveState();
  updateCoinsUI();
  alert(`You practiced! +${earned} coins.`);
}

function openShop() {
  renderShopItems();
  showScreen("screenShop");
}

function closeShop() {
  showScreen("screenMain");
}

function buyItem(itemId) {
  const item = shopItemsData.find((i) => i.id === itemId);
  if (!item) return;

  if (state.coins < item.price) {
    alert("Not enough coins!");
    return;
  }

  state.coins -= item.price;

  // add to inventory if not owned yet
  if (!state.inventory.includes(itemId)) {
    state.inventory.push(itemId);
  }

  // auto-equip if hat or bed
  if (item.type === "hat") {
    state.equipped.hat = itemId;
  } else if (item.type === "bed") {
    state.equipped.bed = itemId;
  }

  saveState();
  updateCoinsUI();
  updateInventoryUI();
  updatePetUI();
}

// ---------- INIT ----------

window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateCoinsUI();
  updatePetUI();
  updateInventoryUI();

  // Decide which screen to show first
  if (state.selectedPet) {
    showScreen("screenMain");
  } else {
    showScreen("screenSelect");
  }
});
