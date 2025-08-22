// === DYNAMIC TIMES TABLE BUILDER ===

let timesTable = 6; // Default to 6
let currentStep = 0;
let currentHintIndex = 0;
let isMemoryMode = false;
let memoryRound = 0;
let hiddenNumbers = [];
let completedAnswers = {};

const numberLine = document.getElementById("number-line");
const speechBubble = document.getElementById("speech-bubble");

// Generic teaching order that works for most times tables
function getTeachingOrder(table) {
  // Start with universals, then build systematically
  return [0, 1, 10, 5, 2, 11, 4, 8, 3, 6, 9, 12, 7];
}

// Generate teaching steps dynamically based on the times table
function generateTeachingSteps(table) {
  const order = getTeachingOrder(table);
  const steps = [];

  for (let pos = 0; pos < order.length; pos++) {
    const i = order[pos];
    const step = { i: i };

    // Generate prompts and hints based on the number and table
    if (i === 0) {
      step.prompt = "The first one is easy because it's the same for EVERY times table. Anything × 0 is 0!";
      step.hints = ["Try typing 0"];
    } else if (i === 1) {
      step.prompt = "Anything × 1 stays the same.";
      step.hints = [`What times table are we doing?`, `It's the same as the number we're learning – ${table}`];
    } else if (i === 10) {
      step.prompt = `Add a 0 to the number: ${table} becomes ${table}0.`;
      step.hints = [`What's ${table} with a 0 on the end?`, `10 × ${table} = ${table * 10}`];
    } else if (i === 5) {
      step.prompt = `Half of 10 × ${table} is what?`;
      step.hints = [`10 × ${table} = ${table * 10}. What's half of ${table * 10}?`, `${table * 10} ÷ 2 = ?`];
    } else if (i === 2) {
      step.prompt = `Double ${table}.`;
      step.hints = [`What's ${table} + ${table}?`, `Imagine two rows of ${table} counters`];
    } else if (i === 11) {
      step.prompt = `${table * 10} plus ${table} is...?`;
      step.hints = [`10 × ${table} = ${table * 10}. What's ${table * 10} + ${table}?`, `Add one more group of ${table}`];
    } else if (i === 4) {
      step.prompt = `Double 2 × ${table}.`;
      step.hints = [`What's 2 × ${table}? Now double it`, `${table * 2} + ${table * 2} = ?`];
    } else if (i === 8) {
      step.prompt = `Double 4 × ${table}.`;
      step.hints = [`What's 4 × ${table}?`, `${table * 4} + ${table * 4} = ?`];
    } else if (i === 3) {
      step.prompt = `What comes after double ${table}?`;
      step.hints = [`What's 2 × ${table}? Now add one more ${table}`, `${table * 2} + ${table} = ?`];
    } else if (i === 6) {
      step.prompt = `Let's work out 6 × ${table}.`;
      step.hints = [`What's 3 × ${table}? Now double it`, `${table * 3} + ${table * 3} = ?`, `What's 5 × ${table}? Now add one more ${table}`];
    } else if (i === 9) {
      step.prompt = `Let's work out 9 × ${table}.`;
      step.hints = [`What's 10 × ${table}? Now subtract one group of ${table}`, `${table * 10} - ${table} = ?`, `What's 8 × ${table}? Try adding one more group of ${table}`];
    } else if (i === 12) {
      step.prompt = `What's 11 × ${table} plus one more ${table}?`;
      step.hints = [`11 × ${table} = ${table * 11}. Add one more ${table}`, `${table * 11} + ${table} = ?`, `What's 10 × ${table} plus 2 × ${table}?`];
    } else if (i === 7) {
      step.prompt = `Let's work out 7 × ${table}.`;
      step.hints = [`What's 6 × ${table}? Now add one more ${table}`, `${table * 6} + ${table} = ?`, `What's 8 × ${table}? Now subtract one ${table}`];
    }

    steps.push(step);
  }

  return steps;
}

// Generate memory prompts dynamically
function generateMemoryPrompts(table) {
  const prompts = {};

  prompts[0] = [`0 × ${table} = ? (Always 0!)`];
  prompts[1] = [`1 × ${table} = ? (Same as the table number)`];
  prompts[10] = [`10 × ${table} = ? (Add a zero to ${table})`, `10 × ${table} = ? (Count by ${table}s ten times)`];
  prompts[5] = [`5 × ${table} = ? (Half of 10 × ${table})`, `5 × ${table} = ? (${table * 10} ÷ 2)`];
  prompts[11] = [`11 × ${table} = ? (10 × ${table} + one more ${table})`, `11 × ${table} = ? (${table * 10} + ${table})`];
  prompts[2] = [`2 × ${table} = ? (Double ${table})`, `2 × ${table} = ? (${table} + ${table})`];
  prompts[4] = [`4 × ${table} = ? (Double 2 × ${table})`, `4 × ${table} = ? (${table * 2} + ${table * 2})`];
  prompts[8] = [`8 × ${table} = ? (Double 4 × ${table})`, `8 × ${table} = ? (${table * 4} + ${table * 4})`];
  prompts[3] = [`3 × ${table} = ? (2 × ${table} + one more ${table})`, `3 × ${table} = ? (${table * 2} + ${table})`];
  prompts[6] = [`6 × ${table} = ? (Double 3 × ${table})`, `6 × ${table} = ? (${table * 3} + ${table * 3})`];
  prompts[9] = [`9 × ${table} = ? (10 × ${table} - one ${table})`, `9 × ${table} = ? (${table * 10} - ${table})`, `9 × ${table} = ? (8 × ${table} + one more ${table})`];
  prompts[12] = [`12 × ${table} = ? (11 × ${table} + one more ${table})`, `12 × ${table} = ? (${table * 11} + ${table})`, `12 × ${table} = ? (Double 6 × ${table})`];
  prompts[7] = [`7 × ${table} = ? (6 × ${table} + one more ${table})`, `7 × ${table} = ? (${table * 6} + ${table})`, `7 × ${table} = ? (8 × ${table} - one ${table})`];

  return prompts;
}

function updateTimesTable() {
  const selector = document.getElementById("times-table-select");
  timesTable = parseInt(selector.value);

  // Update intro message
  const introBubble = document.getElementById("intro-bubble");
  introBubble.textContent = `Let's start learning the ${timesTable} times table!`;

  // Reset everything for new table
  resetApp();
}

function resetApp() {
  currentStep = 0;
  currentHintIndex = 0;
  isMemoryMode = false;
  memoryRound = 0;
  hiddenNumbers = [];
  completedAnswers = {};

  // Clear and rebuild number line
  buildNumberLine();

  // Hide teaching area
  document.getElementById("teaching-area").style.display = "none";
  document.getElementById("intro-section").style.display = "block";
}

// Build the number line for current times table
function buildNumberLine() {
  numberLine.innerHTML = ""; // Clear existing

  for (let i = 0; i <= 12; i++) {
    const tick = document.createElement("div");
    tick.className = "tick";

    const label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = i;

    const input = document.createElement("input");
    input.type = "text";
    input.id = `input-${i}`;
    input.disabled = true;
    
    // Add Enter key listener
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        if (isMemoryMode) {
          checkMemoryRound();
        } else {
          checkTeachingStep();
        }
      }
    });

    const question = document.createElement("div");
    question.className = "question";
    question.textContent = `${timesTable} × ${i}`;

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.appendChild(input);
    cell.appendChild(question);

    tick.appendChild(label);
    tick.appendChild(cell);
    numberLine.appendChild(tick);
  }
}

function startTeaching() {
  document.getElementById("intro-section").style.display = "none";
  document.getElementById("teaching-area").style.display = "block";
  setTeachingStep(currentStep);
}

function setTeachingStep(index) {
  const teachingSteps = generateTeachingSteps(timesTable);
  const step = teachingSteps[index];
  const i = step.i;
  const input = document.getElementById(`input-${i}`);

  // Clear all highlights and arrows
  document.querySelectorAll("input").forEach(input => {
    input.classList.remove("highlight");
    input.disabled = true;
  });
  clearArrows();

  input.disabled = false;
  input.focus();
  input.classList.add("highlight");
  speechBubble.textContent = step.prompt;
  currentHintIndex = 0;

  // Add visual arrows for relationships during teaching (automatic)
  if (!isMemoryMode) {
    addVisualArrows(i);
  }

  // Hide visual hint if showing
  const visualBox = document.getElementById("visual-hint");
  if (visualBox) visualBox.style.display = "none";
}

function showHint() {
  if (isMemoryMode) {
    showMemoryHint();
    return;
  }

  const teachingSteps = generateTeachingSteps(timesTable);
  const step = teachingSteps[currentStep];
  if (currentHintIndex < step.hints.length) {
    speechBubble.textContent = step.hints[currentHintIndex];
    currentHintIndex++;
  } else {
    speechBubble.textContent = "Try using what you already know!";
  }
}

function checkTeachingStep() {
  if (isMemoryMode) {
    checkMemoryRound();
    return;
  }

  const teachingSteps = generateTeachingSteps(timesTable);
  const step = teachingSteps[currentStep];
  const i = step.i;
  const input = document.getElementById(`input-${i}`);
  const userAnswer = parseInt(input.value);
  const correctAnswer = i * timesTable;

  if (userAnswer === correctAnswer) {
    input.style.backgroundColor = "lightgreen";
    completedAnswers[i] = correctAnswer;
    currentStep++;
    if (currentStep < teachingSteps.length) {
      setTeachingStep(currentStep);
    } else {
      startMemoryMode();
    }
  } else {
    input.style.backgroundColor = "salmon";
    speechBubble.textContent = `Oops! Try again: what is ${timesTable} × ${i}?`;
  }
}

function startMemoryMode() {
  isMemoryMode = true;
  memoryRound = 0;
  hiddenNumbers = [];

  const teachingSteps = generateTeachingSteps(timesTable);

  // Fill in all answers in the teaching order
  for (let stepIndex = 0; stepIndex < teachingSteps.length; stepIndex++) {
    const i = teachingSteps[stepIndex].i;
    const input = document.getElementById(`input-${i}`);
    input.value = i * timesTable;
    input.style.backgroundColor = "lightgreen";
    input.disabled = true;
  }

  speechBubble.textContent = "Great! Now let's test your memory. I'll hide answers one by one, and you can chant them out loud or type over the faded numbers!";

  // Start the memory phase after a short delay
  setTimeout(() => {
    setMemoryRound();
  }, 3000);
}

function setMemoryRound() {
  const memoryOrder = getTeachingOrder(timesTable);

  if (memoryRound >= memoryOrder.length) {
    // All rounds completed
    speechBubble.textContent = "🎉 Amazing! You've mastered the " + timesTable + " times table from memory! Well done! 🎉";
    // Add restart button in speech bubble
    setTimeout(() => {
      speechBubble.innerHTML = "🎉 Amazing! You've mastered the " + timesTable + " times table from memory! Well done! 🎉<br><button onclick='resetApp()' style='margin-top: 10px; padding: 8px 16px; background: #0077ff; color: white; border: none; border-radius: 5px; cursor: pointer;'>Choose Another Table</button>";
    }, 2000);
    return;
  }

  // Add the current number to hidden numbers (using memoryOrder)
  const numberToHide = memoryOrder[memoryRound];
  hiddenNumbers.push(numberToHide);

  // Clear all highlights and arrows for memory mode
  document.querySelectorAll("input").forEach(input => {
    input.classList.remove("highlight");
  });
  clearArrows();

  for (let i = 0; i <= 12; i++) {
    const input = document.getElementById(`input-${i}`);

    if (hiddenNumbers.includes(i)) {
      // Hidden numbers - empty input box that user must fill
      input.value = "";
      input.placeholder = "";
      input.style.backgroundColor = "";
      input.style.color = "#333";
      input.disabled = false;
      input.style.visibility = "visible";
    } else {
      // Visible but faded - show answer as placeholder, allow typing over
      const correctAnswer = i * timesTable;
      input.value = "";
      input.placeholder = correctAnswer.toString();
      input.style.backgroundColor = "";
      input.style.color = "#333";
      input.disabled = false;
      input.style.visibility = "visible";
    }
  }

  // Show memory instructions and focus on zero
  speechBubble.textContent = `Round ${memoryRound + 1}: Start at 0 and fill in the ENTIRE number line from memory! Press Enter when you've filled them all in.`;

  // Always focus on zero
  const zeroInput = document.getElementById(`input-0`);
  if (zeroInput) {
    zeroInput.focus();
    zeroInput.classList.add("highlight");
  }

  currentHintIndex = 0;
}

function checkMemoryRound() {
  let allCorrect = true;
  let emptyInputs = [];

  // Check ALL inputs from 0 to 12 - they must all be filled
  for (let i = 0; i <= 12; i++) {
    const input = document.getElementById(`input-${i}`);
    const userAnswer = parseInt(input.value);
    const correctAnswer = i * timesTable;

    if (isNaN(userAnswer) || input.value.trim() === "") {
      emptyInputs.push(i);
      input.style.backgroundColor = "";
    } else if (userAnswer === correctAnswer) {
      input.style.backgroundColor = "lightgreen";
    } else {
      input.style.backgroundColor = "salmon";
      allCorrect = false;
    }
  }

  // Check if any inputs are empty
  if (emptyInputs.length > 0) {
    speechBubble.textContent = `Please fill in ALL the answers! You still need: ${emptyInputs.map(i => i + ' × ' + timesTable).join(', ')}`;
    return;
  }

  if (!allCorrect) {
    speechBubble.textContent = "Some answers are incorrect. Try again!";
    return;
  }

  // All correct - move to next round
  speechBubble.textContent = "Excellent! Moving to the next round...";
  memoryRound++;

  setTimeout(() => {
    setMemoryRound();
  }, 1500);
}

function showMemoryHint() {
  const memoryOrder = getTeachingOrder(timesTable);
  const currentNumber = memoryOrder[memoryRound - 1]; // -1 because we increment after setting
  const memoryPrompts = generateMemoryPrompts(timesTable);

  // Show visual arrows when hint is pressed during memory mode
  if (currentNumber !== undefined) {
    clearArrows();
    addVisualArrows(currentNumber);
  }

  if (currentNumber !== undefined && memoryPrompts[currentNumber]) {
    const hints = memoryPrompts[currentNumber];
    if (currentHintIndex < hints.length) {
      speechBubble.textContent = hints[currentHintIndex];
      currentHintIndex++;
    } else {
      speechBubble.textContent = "You can do this! Use the strategies you learned.";
    }
  } else {
    speechBubble.textContent = `Think about doubling, counting by ${timesTable}s, or using known facts!`;
  }
}

function addVisualArrows(targetNumber) {
  // Add arrows to show relationships during teaching
  if (targetNumber === 2) {
    // Double of 1
    addArrow(1, targetNumber, "double");
  } else if (targetNumber === 4) {
    // Double of 2
    addArrow(2, targetNumber, "double");
  } else if (targetNumber === 5) {
    // Half of 10
    addArrow(10, targetNumber, "÷ 2");
  } else if (targetNumber === 6) {
    // Double of 3
    addArrow(3, targetNumber, "double");
  } else if (targetNumber === 8) {
    // Double of 4
    addArrow(4, targetNumber, "double");
  } else if (targetNumber === 9) {
    // 10 minus 1
    addArrow(10, targetNumber, "- 1 group");
  } else if (targetNumber === 11) {
    // 10 plus 1
    addArrow(10, targetNumber, "+ 1 group");
  } else if (targetNumber === 12) {
    // Double of 6 or 11 + 1
    addArrow(6, targetNumber, "double");
    // Also show 11 + 1 relationship
    addArrow(11, targetNumber, "+ 1 group");
  } else if (targetNumber === 7) {
    // 6 + 1 or 8 - 1
    addArrow(6, targetNumber, "+ 1 group");
  }
}

function addArrow(fromNumber, toNumber, label) {
  const fromInput = document.getElementById(`input-${fromNumber}`);
  const toInput = document.getElementById(`input-${toNumber}`);
  
  if (!fromInput || !toInput) return;

  const arrow = document.createElement('div');
  arrow.className = 'teaching-arrow';
  arrow.innerHTML = `
    <div class="arrow-line"></div>
    <div class="arrow-label">${label}</div>
  `;
  
  // Position the arrow
  const fromRect = fromInput.getBoundingClientRect();
  const toRect = toInput.getBoundingClientRect();
  const containerRect = numberLine.getBoundingClientRect();
  
  const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
  const toX = toRect.left - containerRect.left + toRect.width / 2;
  const y = fromRect.bottom - containerRect.top + 10;
  
  arrow.style.position = 'absolute';
  arrow.style.left = Math.min(fromX, toX) + 'px';
  arrow.style.top = y + 'px';
  arrow.style.width = Math.abs(toX - fromX) + 'px';
  arrow.style.pointerEvents = 'none';
  arrow.style.zIndex = '10';
  
  numberLine.appendChild(arrow);
}

function clearArrows() {
  const arrows = document.querySelectorAll('.teaching-arrow');
  arrows.forEach(arrow => arrow.remove());
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  buildNumberLine();
  
  // Set initial intro message
  const introBubble = document.getElementById("intro-bubble");
  if (introBubble) {
    introBubble.textContent = `Let's start learning the ${timesTable} times table!`;
  }
});
