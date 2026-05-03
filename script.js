const STORAGE_KEY = "protocole_34_euromillions_draws_v1";

let draws = loadDraws();

const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");

const gridCount = document.getElementById("gridCount");
const protocolMode = document.getElementById("protocolMode");
const strategy = document.getElementById("strategy");
const generateBtn = document.getElementById("generateBtn");
const results = document.getElementById("results");

const drawDate = document.getElementById("drawDate");
const drawNumbers = document.getElementById("drawNumbers");
const drawStars = document.getElementById("drawStars");
const addDrawBtn = document.getElementById("addDrawBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");

const importText = document.getElementById("importText");
const importBtn = document.getElementById("importBtn");

const hotNumbers = document.getElementById("hotNumbers");
const coldNumbers = document.getElementById("coldNumbers");
const lateNumbers = document.getElementById("lateNumbers");
const hotStars = document.getElementById("hotStars");

document.addEventListener("DOMContentLoaded", init);

function init() {
  const today = new Date().toISOString().slice(0, 10);
  drawDate.value = today;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      views.forEach(v => v.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.view).classList.add("active");

      refreshAll();
    });
  });

  generateBtn.addEventListener("click", generateSmartGrids);
  addDrawBtn.addEventListener("click", addDraw);
  clearHistoryBtn.addEventListener("click", clearHistory);
  importBtn.addEventListener("click", importDraws);

  refreshAll();
}

function loadDraws() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveDraws() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draws));
}

function refreshAll() {
  renderHistory();
  renderStats();
}

function parseNumbers(text) {
  return text
    .replaceAll(",", " ")
    .replaceAll("-", " ")
    .replaceAll("|", " ")
    .split(" ")
    .map(x => Number(x.trim()))
    .filter(n => Number.isInteger(n));
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a - b);
}

function addDraw() {
  const date = drawDate.value || new Date().toISOString().slice(0, 10);
  const numbers = uniqueSorted(parseNumbers(drawNumbers.value));
  const stars = uniqueSorted(parseNumbers(drawStars.value));

  if (numbers.length !== 5) {
    alert("Il faut exactement 5 numéros différents.");
    return;
  }

  if (stars.length !== 2) {
    alert("Il faut exactement 2 étoiles différentes.");
    return;
  }

  if (numbers.some(n => n < 1 || n > 50)) {
    alert("Les numéros doivent être entre 1 et 50.");
    return;
  }

  if (stars.some(n => n < 1 || n > 12)) {
    alert("Les étoiles doivent être entre 1 et 12.");
    return;
  }

  const alreadyExists = draws.some(d =>
    d.date === date &&
    JSON.stringify(d.numbers) === JSON.stringify(numbers) &&
    JSON.stringify(d.stars) === JSON.stringify(stars)
  );

  if (alreadyExists) {
    alert("Ce tirage existe déjà.");
    return;
  }

  draws.unshift({ date, numbers, stars });
  saveDraws();

  drawNumbers.value = "";
  drawStars.value = "";

  refreshAll();
  alert("Tirage ajouté.");
}

function clearHistory() {
  const ok = confirm("Tu veux vraiment effacer tout l’historique ?");
  if (!ok) return;

  draws = [];
  saveDraws();
  refreshAll();
}

function importDraws() {
  const lines = importText.value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  let added = 0;
  let skipped = 0;

  lines.forEach(line => {
    const parts = line.split("|").map(p => p.trim());

    if (parts.length < 3) {
      skipped++;
      return;
    }

    const date = parts[0];
    const numbers = uniqueSorted(parseNumbers(parts[1]));
    const stars = uniqueSorted(parseNumbers(parts[2]));

    const valid =
      numbers.length === 5 &&
      stars.length === 2 &&
      numbers.every(n => n >= 1 && n <= 50) &&
      stars.every(n => n >= 1 && n <= 12);

    if (!valid) {
      skipped++;
      return;
    }

    const alreadyExists = draws.some(d =>
      d.date === date &&
      JSON.stringify(d.numbers) === JSON.stringify(numbers) &&
      JSON.stringify(d.stars) === JSON.stringify(stars)
    );

    if (alreadyExists) {
      skipped++;
      return;
    }

    draws.push({ date, numbers, stars });
    added++;
  });

  draws.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveDraws();
  importText.value = "";
  refreshAll();

  alert(`${added} tirage(s) importé(s). ${skipped} ligne(s) ignorée(s).`);
}

function renderHistory() {
  historyList.innerHTML = "";
  historyCount.textContent = `${draws.length} tirage(s) enregistré(s).`;

  if (draws.length === 0) {
    historyList.innerHTML = `<p class="muted">Aucun tirage enregistré pour le moment.</p>`;
    return;
  }

  draws.slice(0, 80).forEach(draw => {
    const item = document.createElement("div");
    item.className = "history-item";

    item.innerHTML = `
      <div class="history-date">${formatDate(draw.date)}</div>
      <div class="history-row">
        ${draw.numbers.map(n => `<span class="history-num">${n}</span>`).join("")}
        ${draw.stars.map(s => `<span class="history-star">★ ${s}</span>`).join("")}
      </div>
    `;

    historyList.appendChild(item);
  });
}

function formatDate(date) {
  if (!date) return "Date inconnue";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR");
}

function buildStats() {
  const numberFreq = {};
  const starFreq = {};
  const numberLastSeen = {};
  const starLastSeen = {};

  for (let i = 1; i <= 50; i++) {
    numberFreq[i] = 0;
    numberLastSeen[i] = null;
  }

  for (let i = 1; i <= 12; i++) {
    starFreq[i] = 0;
    starLastSeen[i] = null;
  }

  draws.forEach((draw, index) => {
    draw.numbers.forEach(n => {
      numberFreq[n]++;
      if (numberLastSeen[n] === null) numberLastSeen[n] = index;
    });

    draw.stars.forEach(s => {
      starFreq[s]++;
      if (starLastSeen[s] === null) starLastSeen[s] = index;
    });
  });

  const hotNums = Object.entries(numberFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([n, count]) => ({ value: Number(n), count }));

  const coldNums = Object.entries(numberFreq)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 8)
    .map(([n, count]) => ({ value: Number(n), count }));

  const lateNums = Object.entries(numberLastSeen)
    .map(([n, last]) => ({ value: Number(n), delay: last === null ? draws.length + 10 : last }))
    .sort((a, b) => b.delay - a.delay)
    .slice(0, 8);

  const hotStarsArr = Object.entries(starFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([n, count]) => ({ value: Number(n), count }));

  return {
    numberFreq,
    starFreq,
    numberLastSeen,
    starLastSeen,
    hotNums,
    coldNums,
    lateNums,
    hotStarsArr
  };
}

function renderStats() {
  const stats = buildStats();

  if (draws.length === 0) {
    hotNumbers.innerHTML = `<span class="muted">Ajoute des tirages.</span>`;
    coldNumbers.innerHTML = `<span class="muted">Ajoute des tirages.</span>`;
    lateNumbers.innerHTML = `<span class="muted">Ajoute des tirages.</span>`;
    hotStars.innerHTML = `<span class="muted">Ajoute des tirages.</span>`;
    return;
  }

  hotNumbers.innerHTML = stats.hotNums.map(x => `<span class="pill gold">${x.value} - ${x.count}x</span>`).join("");
  coldNumbers.innerHTML = stats.coldNums.map(x => `<span class="pill blue">${x.value} - ${x.count}x</span>`).join("");
  lateNumbers.innerHTML = stats.lateNums.map(x => `<span class="pill red">${x.value} - retard ${x.delay}</span>`).join("");
  hotStars.innerHTML = stats.hotStarsArr.map(x => `<span class="pill gold">★ ${x.value} - ${x.count}x</span>`).join("");
}

function generateSmartGrids() {
  const count = Number(gridCount.value);
  const useProtocol = protocolMode.checked;
  const selectedStrategy = strategy.value;
  const candidates = [];
  const tries = selectedStrategy === "aggressive" ? 25000 : 15000;

  for (let i = 0; i < tries; i++) {
    const grid = createRandomGrid(useProtocol);
    const score = scoreGrid(grid, selectedStrategy);
    candidates.push({ ...grid, score });
  }

  const unique = removeDuplicateGrids(candidates);
  const best = unique.sort((a, b) => b.score.total - a.score.total).slice(0, count);

  renderGeneratedGrids(best, selectedStrategy);
}

function createRandomGrid(useProtocol) {
  let numbers = [];
  let stars = [];

  if (useProtocol) {
    numbers.push(34);
    stars.push(4);
  }

  while (numbers.length < 5) {
    const n = randomInt(1, 50);
    if (!numbers.includes(n)) numbers.push(n);
  }

  while (stars.length < 2) {
    const s = randomInt(1, 12);
    if (!stars.includes(s)) stars.push(s);
  }

  return {
    numbers: numbers.sort((a, b) => a - b),
    stars: stars.sort((a, b) => a - b)
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function removeDuplicateGrids(candidates) {
  const map = new Map();

  candidates.forEach(grid => {
    const key = `${grid.numbers.join("-")}|${grid.stars.join("-")}`;
    if (!map.has(key)) map.set(key, grid);
  });

  return [...map.values()];
}

function scoreGrid(grid, selectedStrategy) {
  const stats = buildStats();
  let total = 0;
  const reasons = [];

  const sum = grid.numbers.reduce((a, b) => a + b, 0);
  const evenCount = grid.numbers.filter(n => n % 2 === 0).length;
  const lowCount = grid.numbers.filter(n => n <= 25).length;
  const humanRisk = calculateHumanRisk(grid);
  const deltas = calculateDeltas(grid.numbers);
  const alreadyDrawn = wasAlreadyDrawn(grid);
  const frequencyScore = calculateFrequencyScore(grid, stats);
  const delayScore = calculateDelayScore(grid, stats);

  if (evenCount === 2 || evenCount === 3) {
    total += 12;
    reasons.push("pair/impair équilibré");
  } else {
    total += 4;
  }

  if (lowCount === 2 || lowCount === 3) {
    total += 12;
    reasons.push("bas/haut équilibré");
  } else {
    total += 4;
  }

  if (sum >= 90 && sum <= 170) {
    total += 14;
    reasons.push("somme propre");
  } else if (sum >= 75 && sum <= 185) {
    total += 7;
  }

  if (deltas.min >= 2 && deltas.max <= 22) {
    total += 12;
    reasons.push("écarts corrects");
  } else {
    total += 4;
  }

  total += frequencyScore.points;
  if (frequencyScore.points >= 10) reasons.push("fréquence intéressante");

  total += delayScore.points;
  if (delayScore.points >= 10) reasons.push("retard exploité");

  if (humanRisk <= 25) {
    total += 16;
    reasons.push("grille peu humaine");
  } else if (humanRisk <= 45) {
    total += 8;
  }

  if (!alreadyDrawn) {
    total += 8;
    reasons.push("jamais sortie dans ton historique");
  }

  if (grid.numbers.includes(34)) {
    total += 5;
    reasons.push("numéro 34 présent");
  }

  if (grid.stars.includes(4)) {
    total += 5;
    reasons.push("étoile 4 présente");
  }

  if (selectedStrategy === "rare") {
    total += Math.max(0, 15 - Math.floor(humanRisk / 4));
  }

  if (selectedStrategy === "humanSafe") {
    total += humanRisk < 25 ? 12 : -8;
  }

  if (selectedStrategy === "aggressive") {
    total += delayScore.points >= 12 ? 10 : 0;
  }

  total = Math.max(0, Math.min(100, Math.round(total)));

  return {
    total,
    sum,
    evenCount,
    lowCount,
    humanRisk,
    reasons: reasons.slice(0, 5)
  };
}

function calculateDeltas(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const deltas = [];

  for (let i = 1; i < sorted.length; i++) {
    deltas.push(sorted[i] - sorted[i - 1]);
  }

  return {
    list: deltas,
    min: Math.min(...deltas),
    max: Math.max(...deltas)
  };
}

function calculateHumanRisk(grid) {
  let risk = 0;
  const nums = grid.numbers;
  const under31 = nums.filter(n => n <= 31).length;

  if (under31 >= 4) risk += 25;

  const deltas = calculateDeltas(nums).list;
  const sameDeltas = new Set(deltas).size <= 2;
  if (sameDeltas) risk += 20;

  const hasSequence = nums.some((n, i) => i > 0 && n === nums[i - 1] + 1);
  if (hasSequence) risk += 15;

  const popular = [7, 10, 11, 13, 17, 21, 23, 27, 31, 33];
  const popularCount = nums.filter(n => popular.includes(n)).length;
  risk += popularCount * 4;

  const visualPatterns = ["1-2-3-4-5", "5-10-15-20-25", "7-14-21-28-35", "10-20-30-40-50"];
  const key = nums.join("-");
  if (visualPatterns.includes(key)) risk += 40;

  return Math.min(100, risk);
}

function calculateFrequencyScore(grid, stats) {
  if (draws.length === 0) return { points: 8 };
  let points = 0;

  grid.numbers.forEach(n => {
    const freq = stats.numberFreq[n] || 0;
    if (freq === 0) points += 2;
    else if (freq <= 2) points += 3;
    else if (freq <= 6) points += 4;
    else points += 2;
  });

  return { points: Math.min(16, points) };
}

function calculateDelayScore(grid, stats) {
  if (draws.length === 0) return { points: 8 };
  let points = 0;

  grid.numbers.forEach(n => {
    const delay = stats.numberLastSeen[n] === null ? draws.length + 10 : stats.numberLastSeen[n];
    if (delay >= 20) points += 4;
    else if (delay >= 10) points += 3;
    else if (delay >= 4) points += 2;
    else points += 1;
  });

  return { points: Math.min(16, points) };
}

function wasAlreadyDrawn(grid) {
  return draws.some(draw =>
    JSON.stringify(draw.numbers) === JSON.stringify(grid.numbers) &&
    JSON.stringify(draw.stars) === JSON.stringify(grid.stars)
  );
}

function renderGeneratedGrids(grids, selectedStrategy) {
  results.innerHTML = "";

  if (grids.length === 0) {
    results.innerHTML = `<div class="card"><p class="muted">Aucune grille générée.</p></div>`;
    return;
  }

  grids.forEach((grid, index) => {
    const card = document.createElement("div");
    card.className = "grid-card";

    const strategyLabel = getStrategyLabel(selectedStrategy);

    card.innerHTML = `
      <div class="grid-head">
        <strong>Grille ${index + 1}</strong>
        <span class="score">${grid.score.total}/100</span>
      </div>

      <div class="balls">
        ${grid.numbers.map(n => `<span class="ball ${n === 34 ? "locked" : ""}">${n}</span>`).join("")}
      </div>

      <div class="star-balls">
        ${grid.stars.map(s => `<span class="star ${s === 4 ? "locked" : ""}">★ ${s}</span>`).join("")}
      </div>

      <p class="reason">
        Mode : ${strategyLabel}<br>
        Somme : ${grid.score.sum} - Risque humain : ${grid.score.humanRisk}/100<br>
        Raisons : ${grid.score.reasons.join(", ") || "grille équilibrée"}
      </p>
    `;

    results.appendChild(card);
  });
}

function getStrategyLabel(value) {
  if (value === "balanced") return "Équilibré";
  if (value === "rare") return "Grille rare";
  if (value === "aggressive") return "Agressif";
  if (value === "humanSafe") return "Anti-grille humaine";
  return "Équilibré";
}
