const SCREENS = {
  start: document.getElementById('start-screen'),
  game: document.getElementById('game-screen'),
  result: document.getElementById('result-screen'),
};

const ELEMENTS = {
  setupForm: document.getElementById('setup-form'),
  childName: document.getElementById('child-name'),
  modeSelect: document.getElementById('mode-select'),
  specialMultiplyToggle: document.getElementById('special-multiply-toggle'),
  specialMultiplyOption: document.getElementById('special-multiply-option'),
  lengthSelect: document.getElementById('length-select'),
  saveToggle: document.getElementById('save-toggle'),
  soundToggle: document.getElementById('sound-toggle'),
  clearHistory: document.getElementById('clear-history'),
  syncHistory: document.getElementById('sync-history'),
  syncStatus: document.getElementById('sync-status'),
  historyList: document.getElementById('history-list'),
  playerName: document.getElementById('player-name-display'),
  roundTitle: document.getElementById('round-title'),
  score: document.getElementById('score-display'),
  stars: document.getElementById('stars-display'),
  correct: document.getElementById('correct-display'),
  questionCounter: document.getElementById('question-counter'),
  levelBadge: document.getElementById('level-badge'),
  encouragement: document.getElementById('encouragement'),
  progressFill: document.getElementById('progress-fill'),
  taskType: document.getElementById('task-type-label'),
  bonusPill: document.getElementById('bonus-pill'),
  taskArea: document.getElementById('task-area'),
  feedback: document.getElementById('feedback-box'),
  checkAnswer: document.getElementById('check-answer'),
  nextQuestion: document.getElementById('next-question'),
  restartSession: document.getElementById('restart-session'),
  backHome: document.getElementById('back-home'),
  resultHeadline: document.getElementById('result-headline'),
  resultSummary: document.getElementById('result-summary'),
  finalGrade: document.getElementById('final-grade'),
  finalScore: document.getElementById('final-score'),
  finalCorrect: document.getElementById('final-correct'),
  finalStars: document.getElementById('final-stars'),
  finalAccuracy: document.getElementById('final-accuracy'),
  resultMessage: document.getElementById('result-message'),
  playAgain: document.getElementById('play-again'),
  goHomeResults: document.getElementById('go-home-results'),
};

const HISTORY_PASSWORD = 'schule';
const LENGTHS = {
  short: 24,
  medium: 48,
  long: 90,
  epic: 140,
};
const LOCAL_FALLBACK_KEY = 'mathe-abenteuer-history-fallback-v2';
const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl ? window.APP_CONFIG.apiBaseUrl : '').replace(/\/$/, '');
const RESULTS_ENDPOINT = API_BASE ? `${API_BASE}/results` : '/api/results';

const ENCOURAGEMENTS = [
  'Du machst das klasse!',
  'Weiter so, richtig stark!',
  'Super gerechnet!',
  'Jede Aufgabe bringt Sterne!',
  'Du bist auf einem tollen Weg!',
  'Konzentriert und mutig – prima!',
  'Das sieht nach Mathe-Profi aus!',
];

const RESULT_MESSAGES = {
  1: 'Ausgezeichnet! Du hast heute richtig stark gerechnet. Das ist eine glatte Eins!',
  2: 'Sehr gut! Du hast vieles richtig gelöst und super mitgedacht.',
  3: 'Gut gemacht! Mit ein bisschen Übung wirst du noch sicherer.',
  4: 'Du hast tapfer durchgehalten. Üben hilft – und du bist schon auf dem Weg!',
  5: 'Heute war es noch knifflig. Macht nichts – beim nächsten Mal klappt es besser!',
};

let state = createInitialState();
let historyCache = [];

function createInitialState() {
  return {
    playerName: '',
    mode: 'mix',
    specialMultiplyOnly: false,
    saveResults: true,
    effectsEnabled: true,
    totalQuestions: LENGTHS.long,
    currentIndex: 0,
    score: 0,
    stars: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    selectedChoice: null,
    questions: [],
    currentQuestion: null,
  };
}

function setSyncStatus(text) {
  ELEMENTS.syncStatus.textContent = text;
}

function getFallbackHistory() {
  return JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY) || '[]');
}

function setFallbackHistory(history) {
  localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(history.slice(-100)));
}

async function loadHistory() {
  try {
    setSyncStatus('Lade Verlauf vom Server …');
    const response = await fetch(RESULTS_ENDPOINT, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    historyCache = Array.isArray(data.results) ? data.results : [];
    setSyncStatus('Verlauf vom Server geladen.');
    renderHistory();
  } catch (error) {
    historyCache = getFallbackHistory();
    setSyncStatus('Server nicht erreichbar – zeige lokalen Verlauf auf diesem Gerät.');
    renderHistory();
  }
}

async function saveResult(entry) {
  try {
    const response = await fetch(RESULTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await loadHistory();
  } catch (error) {
    const fallback = getFallbackHistory();
    fallback.push(entry);
    setFallbackHistory(fallback);
    historyCache = fallback.slice().reverse().reverse();
    setSyncStatus('Server nicht erreichbar – Ergebnis lokal auf diesem Gerät gespeichert.');
    renderHistory();
  }
}

async function clearHistoryRemote(password) {
  const response = await fetch(RESULTS_ENDPOINT, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueOptions(correct, spread = 12) {
  const values = new Set([correct]);
  while (values.size < 4) {
    const candidate = correct + rand(-spread, spread);
    if (candidate >= 0) values.add(candidate);
  }
  return shuffle([...values]);
}

function pickOperation(mode) {
  if (mode === 'addsub') return Math.random() < 0.5 ? 'add' : 'sub';
  if (mode === 'multiply') return 'mul';
  return shuffle(['add', 'sub', 'mul'])[0];
}

function makeBaseNumbers(operation, specialMultiplyOnly) {
  if (operation === 'mul') {
    if (specialMultiplyOnly) {
      const left = [2, 3, 4, 5, 10][rand(0, 4)];
      const right = rand(0, 10);
      return [left, right];
    }
    return [rand(0, 10), rand(0, 10)];
  }
  if (operation === 'add') {
    const a = rand(0, 100);
    const b = rand(0, 100 - a);
    return [a, b];
  }
  const a = rand(0, 100);
  const b = rand(0, a);
  return [a, b];
}

function solve(operation, a, b) {
  if (operation === 'add') return a + b;
  if (operation === 'sub') return a - b;
  return a * b;
}

function signFor(operation) {
  if (operation === 'add') return '+';
  if (operation === 'sub') return '−';
  return '×';
}

function levelFor(index) {
  if (index < 12) return 1;
  if (index < 28) return 2;
  if (index < 48) return 3;
  if (index < 80) return 4;
  return 5;
}

function getTaskKind(index) {
  const order = ['input', 'choice', 'truefalse', 'order'];
  if (index % 11 === 10) return 'bonus-choice';
  return order[index % order.length];
}

function createQuestion(index, mode, specialMultiplyOnly) {
  const operation = pickOperation(mode);
  const [a, b] = makeBaseNumbers(operation, specialMultiplyOnly);
  const answer = solve(operation, a, b);
  const kind = getTaskKind(index);
  const prompt = `${a} ${signFor(operation)} ${b}`;
  const labelMap = {
    input: 'Antwort eintippen',
    choice: 'Richtige Auswahl',
    truefalse: 'Wahr oder falsch?',
    order: 'Ordne die Ergebnisse',
    'bonus-choice': 'Bonusaufgabe',
  };

  if (kind === 'input') {
    return { kind, label: labelMap[kind], prompt: `${prompt} = ?`, helper: 'Schreibe das richtige Ergebnis in das Feld.', answer, points: 10 };
  }
  if (kind === 'choice' || kind === 'bonus-choice') {
    return { kind, label: labelMap[kind], prompt: `${prompt} = ?`, helper: 'Tippe die richtige Antwort an.', answer, choices: uniqueOptions(answer, operation === 'mul' ? 8 : 16), points: kind === 'bonus-choice' ? 20 : 12, isBonus: kind === 'bonus-choice' };
  }
  if (kind === 'truefalse') {
    const shownResult = Math.random() < 0.55 ? answer : Math.max(0, answer + rand(-10, 10) || 1);
    const isTrue = shownResult === answer;
    return { kind, label: labelMap[kind], prompt: `${prompt} = ${shownResult}`, helper: 'Stimmt diese Rechnung?', answer: isTrue ? 'wahr' : 'falsch', points: 9 };
  }
  const sets = [];
  for (let i = 0; i < 3; i += 1) {
    const op = pickOperation(mode);
    const [x, y] = makeBaseNumbers(op, specialMultiplyOnly);
    sets.push({ expression: `${x} ${signFor(op)} ${y}`, result: solve(op, x, y) });
  }
  const sorted = [...sets].sort((first, second) => first.result - second.result);
  return { kind, label: labelMap[kind], prompt: 'Ordne die Ergebnisse von klein nach groß.', helper: 'Trage 1, 2 oder 3 ein. 1 = kleinstes Ergebnis.', orderItems: sets, answer: sorted.map((item) => item.expression), points: 15 };
}

function generateQuestions(total, mode, specialMultiplyOnly) {
  return Array.from({ length: total }, (_, index) => createQuestion(index, mode, specialMultiplyOnly));
}

function showScreen(name) {
  Object.values(SCREENS).forEach((screen) => screen.classList.remove('active'));
  SCREENS[name].classList.add('active');
}

function updateSpecialMultiplyVisibility() {
  const shouldShow = ELEMENTS.modeSelect.value === 'mix' || ELEMENTS.modeSelect.value === 'multiply';
  ELEMENTS.specialMultiplyOption.classList.toggle('hidden', !shouldShow);
  if (!shouldShow) ELEMENTS.specialMultiplyToggle.checked = false;
}

function renderHistory() {
  if (!historyCache.length) {
    ELEMENTS.historyList.className = 'history-list empty';
    ELEMENTS.historyList.textContent = 'Noch keine Ergebnisse gespeichert.';
    return;
  }
  ELEMENTS.historyList.className = 'history-list';
  ELEMENTS.historyList.innerHTML = historyCache
    .slice()
    .sort((a, b) => new Date(b.createdAtIso || b.date).getTime() - new Date(a.createdAtIso || a.date).getTime())
    .map((entry) => `
      <article class="history-item">
        <div>
          <strong>${entry.name}</strong>
          <div>${entry.modeLabel}</div>
          <small>${entry.date}</small>
        </div>
        <div><span>Note</span><strong>${entry.grade}</strong></div>
        <div><span>Punkte</span><strong>${entry.score}</strong></div>
        <div><span>Sterne</span><strong>${entry.stars}</strong></div>
        <div><span>Quote</span><strong>${entry.accuracy}%</strong></div>
      </article>
    `)
    .join('');
}

function getModeLabel(mode, specialMultiplyOnly = false) {
  const labels = { mix: 'Bunter Mix', addsub: 'Addition & Subtraktion', multiply: 'Multiplikation' };
  const base = labels[mode] || mode;
  return specialMultiplyOnly ? `${base} – nur mit 2, 3, 4, 5, 10` : base;
}

function updateHud() {
  const current = state.currentIndex + 1;
  const progress = Math.round((state.currentIndex / state.totalQuestions) * 100);
  ELEMENTS.playerName.textContent = state.playerName;
  ELEMENTS.roundTitle.textContent = `Runde ${Math.ceil(current / 12)}`;
  ELEMENTS.score.textContent = state.score;
  ELEMENTS.stars.textContent = state.stars;
  ELEMENTS.correct.textContent = state.correct;
  ELEMENTS.questionCounter.textContent = `${current} / ${state.totalQuestions}`;
  ELEMENTS.levelBadge.textContent = `Level ${levelFor(state.currentIndex)}`;
  ELEMENTS.encouragement.textContent = ENCOURAGEMENTS[state.currentIndex % ENCOURAGEMENTS.length];
  ELEMENTS.progressFill.style.width = `${progress}%`;
}

function renderQuestion() {
  state.currentQuestion = state.questions[state.currentIndex];
  state.selectedChoice = null;
  const q = state.currentQuestion;
  updateHud();
  ELEMENTS.taskType.textContent = q.label;
  ELEMENTS.bonusPill.classList.toggle('hidden', !q.isBonus);
  ELEMENTS.feedback.className = 'feedback-box';
  ELEMENTS.feedback.textContent = 'Bereit? Lies die Aufgabe gut und versuche es!';
  ELEMENTS.checkAnswer.classList.remove('hidden');
  ELEMENTS.nextQuestion.classList.add('hidden');

  if (q.kind === 'input') {
    ELEMENTS.taskArea.innerHTML = `<div class="question-text">${q.prompt}</div><div class="question-subtitle">${q.helper}</div><div class="answer-inline"><input class="answer-input" id="answer-input" type="number" inputmode="numeric" /></div>`;
    document.getElementById('answer-input').focus();
    return;
  }
  if (q.kind === 'choice' || q.kind === 'bonus-choice') {
    ELEMENTS.taskArea.innerHTML = `<div class="question-text">${q.prompt}</div><div class="question-subtitle">${q.helper}</div><div class="choices-grid">${q.choices.map((choice) => `<button class="choice-btn" type="button" data-choice="${choice}">${choice}</button>`).join('')}</div>`;
    bindChoiceButtons();
    return;
  }
  if (q.kind === 'truefalse') {
    ELEMENTS.taskArea.innerHTML = `<div class="question-text">${q.prompt}</div><div class="question-subtitle">${q.helper}</div><div class="true-false-row"><button class="choice-btn" type="button" data-choice="wahr">Wahr</button><button class="choice-btn" type="button" data-choice="falsch">Falsch</button></div>`;
    bindChoiceButtons();
    return;
  }
  ELEMENTS.taskArea.innerHTML = `<div class="question-text">${q.prompt}</div><div class="question-subtitle">${q.helper}</div><div class="order-grid">${q.orderItems.map((item, index) => `<div class="order-card"><strong>${item.expression}</strong><input class="answer-input" type="number" min="1" max="3" data-order-index="${index}" placeholder="1 bis 3" /></div>`).join('')}</div>`;
}

function bindChoiceButtons() {
  document.querySelectorAll('.choice-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.choice-btn').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      state.selectedChoice = button.dataset.choice;
    });
  });
}

function readAnswer() {
  const q = state.currentQuestion;
  if (q.kind === 'input') {
    const value = document.getElementById('answer-input').value;
    return value === '' ? null : Number(value);
  }
  if (q.kind === 'choice' || q.kind === 'bonus-choice' || q.kind === 'truefalse') return state.selectedChoice;
  const values = [...document.querySelectorAll('[data-order-index]')].map((input) => ({ index: Number(input.dataset.orderIndex), rank: Number(input.value) }));
  if (values.some((item) => !item.rank || item.rank < 1 || item.rank > 3)) return null;
  if (new Set(values.map((item) => item.rank)).size !== 3) return null;
  return values.sort((first, second) => first.rank - second.rank).map((item) => q.orderItems[item.index].expression);
}

function evaluateAnswer(userAnswer) {
  const q = state.currentQuestion;
  if (q.kind === 'order') return JSON.stringify(userAnswer) === JSON.stringify(q.answer);
  if (q.kind === 'truefalse') return String(userAnswer).toLowerCase() === q.answer;
  if (q.kind === 'choice' || q.kind === 'bonus-choice') return Number(userAnswer) === q.answer;
  return Number(userAnswer) === q.answer;
}

function explainCorrectAnswer(q) {
  if (q.kind === 'order') return `Die richtige Reihenfolge ist: ${q.answer.join('  <  ')}.`;
  if (q.kind === 'truefalse') return `Richtig wäre: ${q.answer === 'wahr' ? 'Wahr' : 'Falsch'}.`;
  return `Die richtige Antwort ist ${q.answer}.`;
}

function celebrateCorrect(points) {
  state.correct += 1;
  state.streak += 1;
  state.score += points + (state.streak >= 5 ? 3 : 0);
  if (state.correct % 3 === 0) state.stars += 1;
  ELEMENTS.feedback.className = 'feedback-box success';
  ELEMENTS.feedback.innerHTML = `Richtig! ⭐ Du bekommst <strong>${points}</strong> Punkte.`;
}

function handleWrong(q) {
  state.wrong += 1;
  state.streak = 0;
  ELEMENTS.feedback.className = 'feedback-box error';
  ELEMENTS.feedback.innerHTML = `Fast! ${explainCorrectAnswer(q)}`;
  ELEMENTS.taskArea.classList.remove('shake'); void ELEMENTS.taskArea.offsetWidth; ELEMENTS.taskArea.classList.add('shake');
}

function submitAnswer() {
  const userAnswer = readAnswer();
  if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
    ELEMENTS.feedback.className = 'feedback-box error';
    ELEMENTS.feedback.textContent = 'Bitte gib zuerst eine Antwort ein oder wähle etwas aus.';
    return;
  }
  const isCorrect = evaluateAnswer(userAnswer);
  if (isCorrect) celebrateCorrect(state.currentQuestion.points); else handleWrong(state.currentQuestion);
  updateHud();
  ELEMENTS.checkAnswer.classList.add('hidden');
  ELEMENTS.nextQuestion.classList.remove('hidden');
}

function nextStep() {
  state.currentIndex += 1;
  if (state.currentIndex >= state.totalQuestions) { finishGame(); return; }
  renderQuestion();
}

function accuracy() { return Math.round((state.correct / state.totalQuestions) * 100); }

function determineGrade(rate) {
  if (rate >= 90) return 1;
  if (rate >= 78) return 2;
  if (rate >= 64) return 3;
  if (rate >= 50) return 4;
  return 5;
}

async function finishGame() {
  const rate = accuracy();
  const grade = determineGrade(rate);
  ELEMENTS.resultHeadline.textContent = `Super gemacht, ${state.playerName}!`;
  ELEMENTS.resultSummary.textContent = `Du hast ${state.totalQuestions} Aufgaben im Modus „${getModeLabel(state.mode, state.specialMultiplyOnly)}“ gespielt.`;
  ELEMENTS.finalGrade.textContent = String(grade);
  ELEMENTS.finalScore.textContent = String(state.score);
  ELEMENTS.finalCorrect.textContent = String(state.correct);
  ELEMENTS.finalStars.textContent = String(state.stars);
  ELEMENTS.finalAccuracy.textContent = `${rate}%`;
  ELEMENTS.resultMessage.textContent = RESULT_MESSAGES[grade];

  if (state.saveResults) {
    await saveResult({
      name: state.playerName,
      modeLabel: getModeLabel(state.mode, state.specialMultiplyOnly),
      grade,
      score: state.score,
      stars: state.stars,
      accuracy: rate,
      date: new Date().toLocaleString('de-AT'),
    });
  }

  showScreen('result');
}

function startGame(config) {
  state = createInitialState();
  state.playerName = config.name;
  state.mode = config.mode;
  state.specialMultiplyOnly = config.specialMultiplyOnly;
  state.totalQuestions = LENGTHS[config.length] || LENGTHS.long;
  state.saveResults = config.saveResults;
  state.effectsEnabled = config.effectsEnabled;
  state.questions = generateQuestions(state.totalQuestions, state.mode, state.specialMultiplyOnly);
  state.currentIndex = 0;
  showScreen('game');
  renderQuestion();
}

function backToHome() {
  showScreen('start');
  renderHistory();
  updateSpecialMultiplyVisibility();
}

ELEMENTS.setupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  startGame({
    name: ELEMENTS.childName.value.trim() || 'Mathe-Profi',
    mode: ELEMENTS.modeSelect.value,
    specialMultiplyOnly: ELEMENTS.specialMultiplyToggle.checked,
    length: ELEMENTS.lengthSelect.value,
    saveResults: ELEMENTS.saveToggle.checked,
    effectsEnabled: ELEMENTS.soundToggle.checked,
  });
});

ELEMENTS.modeSelect.addEventListener('change', updateSpecialMultiplyVisibility);
ELEMENTS.syncHistory.addEventListener('click', loadHistory);
ELEMENTS.checkAnswer.addEventListener('click', submitAnswer);
ELEMENTS.nextQuestion.addEventListener('click', nextStep);
ELEMENTS.restartSession.addEventListener('click', () => startGame({
  name: state.playerName,
  mode: state.mode,
  specialMultiplyOnly: state.specialMultiplyOnly,
  length: Object.entries(LENGTHS).find(([, value]) => value === state.totalQuestions)?.[0] || 'long',
  saveResults: state.saveResults,
  effectsEnabled: state.effectsEnabled,
}));
ELEMENTS.backHome.addEventListener('click', backToHome);
ELEMENTS.playAgain.addEventListener('click', () => startGame({
  name: state.playerName,
  mode: state.mode,
  specialMultiplyOnly: state.specialMultiplyOnly,
  length: Object.entries(LENGTHS).find(([, value]) => value === state.totalQuestions)?.[0] || 'long',
  saveResults: state.saveResults,
  effectsEnabled: state.effectsEnabled,
}));
ELEMENTS.goHomeResults.addEventListener('click', backToHome);
ELEMENTS.clearHistory.addEventListener('click', async () => {
  const password = window.prompt('Bitte Passwort zum Löschen des Verlaufs eingeben:');
  if (password === null) return;
  if (password !== HISTORY_PASSWORD) {
    window.alert('Falsches Passwort. Der Verlauf wurde nicht gelöscht.');
    return;
  }
  try {
    await clearHistoryRemote(password);
    historyCache = [];
    setFallbackHistory([]);
    renderHistory();
    setSyncStatus('Verlauf auf dem Server gelöscht.');
    window.alert('Der Verlauf wurde gelöscht.');
  } catch (error) {
    setFallbackHistory([]);
    historyCache = [];
    renderHistory();
    setSyncStatus('Server nicht erreichbar – lokaler Verlauf gelöscht.');
    window.alert('Server nicht erreichbar. Nur lokaler Verlauf wurde gelöscht.');
  }
});

document.addEventListener('keydown', (event) => {
  if (!SCREENS.game.classList.contains('active')) return;
  if (event.key === 'Enter' && !ELEMENTS.checkAnswer.classList.contains('hidden')) submitAnswer();
  else if (event.key === 'Enter' && !ELEMENTS.nextQuestion.classList.contains('hidden')) nextStep();
});

updateSpecialMultiplyVisibility();
loadHistory();
