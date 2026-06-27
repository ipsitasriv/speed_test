
const paragraphs = {
  easy: [
    "Typing every day is a simple way to improve speed and accuracy. Focus on rhythm, not just speed.",
    "A calm mind and steady hands help you type faster. Practice often and let your fingers learn the pattern.",
    "Small goals lead to big progress. Type carefully, watch mistakes, and stay consistent."
  ],
  medium: [
    "Modern web development often begins with simple building blocks such as HTML, CSS, and JavaScript. Mastering these core technologies creates a strong foundation for creating engaging and responsive user experiences.",
    "Typing tests are useful because they help people measure speed, improve focus, and reduce common keyboard mistakes. Over time, regular practice builds confidence and makes everyday computer work much more efficient.",
    "Software engineers benefit from strong typing skills because writing clean code often requires speed, accuracy, and concentration. A good typing habit can improve productivity during development, debugging, and documentation."
  ],
  hard: [
    "Building polished user interfaces requires attention to hierarchy, spacing, contrast, readability, and responsiveness. Developers who understand both design principles and implementation details can create products that feel intuitive, accessible, and enjoyable to use across different devices.",
    "Advanced typing practice is not only about pressing keys quickly but also about maintaining precision under pressure. Consistent performance depends on muscle memory, error recovery, posture, breathing, and the ability to remain focused even when a paragraph becomes structurally complex.",
    "A well-designed application balances visual aesthetics with performance and usability. Animations should feel smooth without being distracting, components should adapt gracefully to small screens, and feedback should be immediate enough to help the user understand every interaction."
  ]
};

// DOM Elements
const paragraphEl = document.getElementById("paragraph");
const paragraphBox = document.getElementById("paragraphBox");
const hiddenInput = document.getElementById("hiddenInput");
const difficultyEl = document.getElementById("difficulty");

const timeLeftEl = document.getElementById("timeLeft");
const progressBarEl = document.getElementById("progressBar");

const wpmEl = document.getElementById("wpm");
const cpmEl = document.getElementById("cpm");
const accuracyEl = document.getElementById("accuracy");
const mistakesEl = document.getElementById("mistakes");
const correctCharsEl = document.getElementById("correctChars");
const highScoreEl = document.getElementById("highScore");

const restartBtn = document.getElementById("restartBtn");
const newParagraphBtn = document.getElementById("newParagraphBtn");
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const summaryModal = document.getElementById("summaryModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const finalWpmEl = document.getElementById("finalWpm");
const finalAccuracyEl = document.getElementById("finalAccuracy");
const finalMistakesEl = document.getElementById("finalMistakes");
const finalTimeEl = document.getElementById("finalTime");
const finalHighScoreEl = document.getElementById("finalHighScore");

const fakeCursor = document.getElementById("fakeCursor");
const confettiCanvas = document.getElementById("confettiCanvas");
const ctx = confettiCanvas.getContext("2d");

// Game state
const MAX_TIME = 60;
let timer = null;
let timeLeft = MAX_TIME;
let isTyping = false;
let currentCharIndex = 0;
let mistakes = 0;
let correctChars = 0;
let totalTyped = 0;
let currentParagraph = "";
let hasFinished = false;

// Theme setup
const savedTheme = localStorage.getItem("typing-theme");
if (savedTheme === "light") {
  document.body.classList.add("light");
  themeIcon.textContent = "☀️";
}

// High score setup
let highScore = Number(localStorage.getItem("typing-high-score")) || 0;
highScoreEl.textContent = highScore;

// -----------------------------
// Utility Functions
// -----------------------------

function getRandomParagraph(difficulty) {
  const list = paragraphs[difficulty];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

function renderParagraph() {
  paragraphEl.innerHTML = "";
  currentParagraph = getRandomParagraph(difficultyEl.value);

  currentParagraph.split("").forEach((char, index) => {
    const span = document.createElement("span");
    span.innerText = char;
    if (index === 0) span.classList.add("active");
    paragraphEl.appendChild(span);
  });

  moveFakeCursor();
}

function focusInput() {
  hiddenInput.focus();
}

function updateStats() {
  const elapsedTime = MAX_TIME - timeLeft;
  const minutes = elapsedTime / 60 || 1 / 60;

  const wpm = Math.max(0, Math.round((correctChars / 5) / minutes));
  const cpm = Math.max(0, Math.round(correctChars / minutes));
  const accuracy = totalTyped === 0 ? 100 : Math.round((correctChars / totalTyped) * 100);

  wpmEl.textContent = wpm;
  cpmEl.textContent = cpm;
  accuracyEl.textContent = `${accuracy}%`;
  mistakesEl.textContent = mistakes;
  correctCharsEl.textContent = correctChars;

  return { wpm, cpm, accuracy };
}

function updateTimerUI() {
  timeLeftEl.textContent = `${timeLeft}s`;
  const percent = (timeLeft / MAX_TIME) * 100;
  progressBarEl.style.width = `${percent}%`;

  if (percent <= 25) {
    progressBarEl.style.background = "linear-gradient(90deg, var(--error), var(--warning))";
  } else {
    progressBarEl.style.background = "linear-gradient(90deg, var(--primary), #22c55e)";
  }
}

function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerUI();
      updateStats();
    } else {
      finishGame();
    }
  }, 1000);
}

function resetGame(newParagraph = false) {
  clearInterval(timer);
  timer = null;

  timeLeft = MAX_TIME;
  isTyping = false;
  currentCharIndex = 0;
  mistakes = 0;
  correctChars = 0;
  totalTyped = 0;
  hasFinished = false;

  hiddenInput.value = "";
  updateTimerUI();
  updateStats();

  if (newParagraph || !currentParagraph) {
    renderParagraph();
  } else {
    renderParagraph();
  }

  closeModal();
  paragraphBox.classList.remove("finish-glow");
  focusInput();
}

function finishGame() {
  clearInterval(timer);
  timer = null;
  hasFinished = true;
  hiddenInput.blur();

  const { wpm, accuracy } = updateStats();

  if (wpm > highScore) {
    highScore = wpm;
    localStorage.setItem("typing-high-score", highScore);
    highScoreEl.textContent = highScore;
  }

  finalWpmEl.textContent = wpm;
  finalAccuracyEl.textContent = `${accuracy}%`;
  finalMistakesEl.textContent = mistakes;
  finalTimeEl.textContent = `${MAX_TIME - timeLeft}s`;
  finalHighScoreEl.textContent = highScore;

  showModal();
  paragraphBox.classList.add("finish-glow");
  playFinishSound();

  if (accuracy >= 95) {
    launchConfetti();
  }
}

function showModal() {
  summaryModal.classList.remove("hidden");
  summaryModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  summaryModal.classList.add("hidden");
  summaryModal.setAttribute("aria-hidden", "true");
}

function updateActiveCharacter() {
  const spans = paragraphEl.querySelectorAll("span");
  spans.forEach(span => span.classList.remove("active"));

  if (spans[currentCharIndex]) {
    spans[currentCharIndex].classList.add("active");
  }

  moveFakeCursor();
}

function moveFakeCursor() {
  const activeChar = paragraphEl.querySelector("span.active");
  const boxRect = paragraphBox.getBoundingClientRect();

  if (!activeChar) {
    fakeCursor.style.opacity = "0";
    return;
  }

  fakeCursor.style.opacity = "1";

  const charRect = activeChar.getBoundingClientRect();
  const left = charRect.left - boxRect.left + 1;
  const top = charRect.top - boxRect.top + 4;

  fakeCursor.style.left = `${left}px`;
  fakeCursor.style.top = `${top}px`;
}

function handleTyping(char) {
  if (hasFinished || timeLeft <= 0) return;

  const spans = paragraphEl.querySelectorAll("span");
  const currentSpan = spans[currentCharIndex];
  if (!currentSpan) {
    finishGame();
    return;
  }

  if (!isTyping) {
    isTyping = true;
    startTimer();
  }

  if (char === null) {
    // Handle backspace
    if (currentCharIndex > 0) {
      currentCharIndex--;
      const prevSpan = spans[currentCharIndex];

      if (prevSpan.classList.contains("incorrect")) {
        mistakes--;
      } else if (prevSpan.classList.contains("correct")) {
        correctChars--;
      }

      prevSpan.classList.remove("correct", "incorrect");
      totalTyped = Math.max(0, totalTyped - 1);
    }
  } else {
    totalTyped++;

    if (char === currentSpan.innerText) {
      currentSpan.classList.add("correct");
      currentSpan.classList.remove("incorrect");
      correctChars++;
      playKeySound(true);
    } else {
      currentSpan.classList.add("incorrect");
      currentSpan.classList.remove("correct");
      mistakes++;
      playKeySound(false);
    }

    currentCharIndex++;
  }

  updateActiveCharacter();
  updateStats();

  if (currentCharIndex >= spans.length) {
    finishGame();
  }
}

// -----------------------------
// Sound Effects with Web Audio API
// -----------------------------
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency, duration, type = "sine", volume = 0.03) {
  const ctxAudio = getAudioContext();
  const oscillator = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(ctxAudio.destination);

  oscillator.start();

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctxAudio.currentTime + duration
  );

  oscillator.stop(ctxAudio.currentTime + duration);
}

function playKeySound(isCorrect) {
  try {
    if (isCorrect) {
      playTone(520, 0.05, "sine", 0.02);
    } else {
      playTone(180, 0.07, "square", 0.02);
    }
  } catch (error) {
    console.log("Audio unavailable:", error);
  }
}

function playFinishSound() {
  try {
    playTone(523, 0.08, "sine", 0.03);
    setTimeout(() => playTone(659, 0.08, "sine", 0.03), 100);
    setTimeout(() => playTone(784, 0.12, "sine", 0.03), 200);
  } catch (error) {
    console.log("Audio unavailable:", error);
  }
}

// -----------------------------
// Confetti
// -----------------------------
let confettiPieces = [];
let confettiAnimationId = null;

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function createConfetti() {
  confettiPieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * -confettiCanvas.height,
    size: Math.random() * 8 + 4,
    speedY: Math.random() * 3 + 2,
    speedX: Math.random() * 2 - 1,
    rotation: Math.random() * 360,
    color: ["#22c55e", "#6366f1", "#f59e0b", "#ef4444", "#06b6d4"][
      Math.floor(Math.random() * 5)
    ]
  }));
}

function drawConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiPieces.forEach(piece => {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate((piece.rotation * Math.PI) / 180);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
    ctx.restore();

    piece.y += piece.speedY;
    piece.x += piece.speedX;
    piece.rotation += 4;
  });

  confettiPieces = confettiPieces.filter(piece => piece.y < confettiCanvas.height + 20);

  if (confettiPieces.length > 0) {
    confettiAnimationId = requestAnimationFrame(drawConfetti);
  } else {
    cancelAnimationFrame(confettiAnimationId);
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

function launchConfetti() {
  resizeCanvas();
  createConfetti();
  drawConfetti();
}

// -----------------------------
// Theme
// -----------------------------
function toggleTheme() {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");

  themeIcon.textContent = isLight ? "☀️" : "🌙";
  localStorage.setItem("typing-theme", isLight ? "light" : "dark");
}

// -----------------------------
// Event Listeners
// -----------------------------
paragraphBox.addEventListener("click", focusInput);

hiddenInput.addEventListener("input", (event) => {
  const value = event.target.value;

  if (!value) return;

  const typedChar = value[value.length - 1];
  handleTyping(typedChar);

  // Clear input so we track one keystroke at a time
  hiddenInput.value = "";
});

hiddenInput.addEventListener("keydown", (event) => {
  if (hasFinished || timeLeft <= 0) {
    event.preventDefault();
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    handleTyping(null);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    resetGame(true);
  }

  if (event.key === "Escape") {
    resetGame(true);
  }

  // Refocus input for typing keys
  if (
    event.key.length === 1 ||
    event.key === "Backspace" ||
    event.key === " "
  ) {
    focusInput();
  }
});

restartBtn.addEventListener("click", () => resetGame(true));
newParagraphBtn.addEventListener("click", () => resetGame(true));
difficultyEl.addEventListener("change", () => resetGame(true));
themeToggleBtn.addEventListener("click", toggleTheme);
closeModalBtn.addEventListener("click", closeModal);

window.addEventListener("resize", moveFakeCursor);
window.addEventListener("load", () => {
  resizeCanvas();
  renderParagraph();
  updateTimerUI();
  updateStats();
  focusInput();
});

window.addEventListener("resize", resizeCanvas);

// Disable copy, paste, cut, drag
["copy", "paste", "cut", "dragstart", "drop", "contextmenu"].forEach(evt => {
  paragraphBox.addEventListener(evt, e => e.preventDefault());
  hiddenInput.addEventListener(evt, e => e.preventDefault());
});
