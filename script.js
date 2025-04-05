// Game variables
let spells = [
    { name: "Fire Ball", damage: 20 },
    { name: "Ice Spike", damage: 15 },
    { name: "Lightning Bolt", damage: 25 },
    { name: "Earth Smash", damage: 30 },
    { name: "Wind Slash", damage: 18 }
];

let movements = ["Stand", "Squat", "Lunges", "Toe touch"];
let currentSpell = null;
let currentMovements = [];
let completedMovements = 0;
let enemyHealth = 100;


let playerMana = 0;
let maxMana = 100;
let lastReadStepCount = parseInt(localStorage.getItem("lastStepCount")) || 0;
let manaPerStep = 2; // How much mana per step IMPORTANT
let manaCostPerSpell = 25; // Mana cost for casting a spell IMPORTANT

// Teachable Machine model URL - replace with your model URL
const URL = "https://teachablemachine.withgoogle.com/models/-iT69gyB7/";
let model, webcam, ctx, labelContainer, maxPredictions;

async function readStepCountFile() {
    try {
        const response = await fetch('steps.txt');
        if (!response.ok) {
            throw new Error('Could not read step file');
        }
        
        const text = await response.text();
        const currentStepCount = parseInt(text.trim());
        
        if (isNaN(currentStepCount)) {
            console.error('Step file contains invalid data');
            return 0;
        }
        
        return currentStepCount;
    } catch (error) {
        console.error('Error reading step file:', error);
        return 0;
    }
}


function updateManaDisplay() {
    document.getElementById('player-mana-bar').style.width = `${(playerMana / maxMana) * 100}%`;
    document.getElementById('mana-text').textContent = `${Math.floor(playerMana)}/${maxMana}`;
}


//monkey balls
async function updateManaFromSteps() {
    const currentStepCount = await readStepCountFile();
    
    // Calculate new steps since last check
    console.log(`Current steps: ${currentStepCount}`);
    console.log(`Last read steps: ${lastReadStepCount}`);
    const newSteps = currentStepCount - lastReadStepCount;
    //print steps to console
    console.log(`New steps: ${newSteps}`);
    
    if (newSteps > 0) {
        // Update the last read count
        lastReadStepCount = currentStepCount;
        localStorage.setItem("lastStepCount", lastReadStepCount);
        
        // Add mana based on steps
        const manaGained = newSteps * manaPerStep;
        playerMana += manaGained;
        
        // Cap at max mana
        if (playerMana > maxMana) {
            playerMana = maxMana;
        }
        
        // Update mana bar
        updateManaDisplay();
        
        // Show a message if steps were added
        showMessage(`You took ${newSteps} steps! +${manaGained} mana`);
    }
    
    return currentStepCount;
}

function updateManaDisplay() {
    document.getElementById('player-mana-bar').style.width = `${(playerMana / maxMana) * 100}%`;
    document.getElementById('mana-text').textContent = `${Math.floor(playerMana)}/${maxMana}`;
}

// Fix the init function order
async function init() {
    // Add mana system UI first before trying to update it
    initManaSystem();
    
    // Set up a new spell sequence
    setupNewSpell();
    
    // Initialize Teachable Machine model
    await initTeachableMachine();
    
    // Setup step checking last
    setupStepChecking();
}

// Set up a new spell with random movements
function setupNewSpell() {
    // Reset completed movements
    completedMovements = 0;
    
    // Select random spell
    currentSpell = spells[Math.floor(Math.random() * spells.length)];
    document.getElementById("current-spell").innerText = currentSpell.name;
    
    // Generate 3 random movements
    currentMovements = [];
    for (let i = 0; i < 3; i++) {
        let movement = movements[Math.floor(Math.random() * movements.length)];
        currentMovements.push(movement);
        document.querySelector(`#movement-${i+1} .movement-name`).innerText = movement;
    }
    
    // Reset movement indicators
    document.querySelectorAll('.movement-indicator').forEach(indicator => {
        indicator.classList.remove('completed');
    });
}

// Initialize Teachable Machine model
async function initTeachableMachine() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Load the model and metadata
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Set up webcam
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    
    // Append webcam element
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    
    // Set up label container
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    // Start prediction loop
    window.requestAnimationFrame(loop);
}

// Main prediction loop
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}
// Add this variable at the top with other game variables
let canDetectMovement = true;

// Then modify the predict function to check this flag
async function predict() {
    // Skip detection if we're in cooldown
    if (!canDetectMovement) return;
    
    webcam.update();
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    
    // Find the movement with highest confidence
    let highestConfidence = 0;
    let detectedMovement = "";
    
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
        
        if (prediction[i].probability > highestConfidence && prediction[i].probability > 0.7) {
            highestConfidence = prediction[i].probability;
            detectedMovement = prediction[i].className;
        }
    }
    
    // Check if detected movement matches the next required movement
    if (detectedMovement === currentMovements[completedMovements] && highestConfidence > 0.8) {
        handleCorrectMovement();
    }
}

// Update the handleCorrectMovement function
function handleCorrectMovement() {
    // Disable further detection during cooldown
    canDetectMovement = false;
    
    // Mark movement as completed
    document.querySelector(`#movement-${completedMovements+1} .movement-indicator`).classList.add('completed');
    
    // Increment completed movements
    completedMovements++;
    
    // Check if spell is complete
    if (completedMovements >= 3) {
        castSpell();
    }
    
    // Re-enable detection after a delay
    setTimeout(() => {
        canDetectMovement = true;
    }, 1500); // 1.5 second cooldown
}

// Cast the spell and damage the enemy
function castSpell() {
    // Animate wizard
    document.querySelector('.wizard').classList.add('casting');
    setTimeout(() => {
        document.querySelector('.wizard').classList.remove('casting');
    }, 500);
    
    if (playerMana < manaCostPerSpell) {
        // Pause game and show message
        pauseGame();
        showOutOfManaMessage();
        return;
    }

    playerMana -= manaCostPerSpell;
    updateManaDisplay();

    // Reduce enemy health
    enemyHealth -= currentSpell.damage;
    if (enemyHealth < 0) enemyHealth = 0;
    
    // Update health bar
    document.getElementById('enemy-health').style.width = enemyHealth + '%';
    
    // Check for victory
    if (enemyHealth <= 0) {
        setTimeout(() => {
            alert("Victory! You defeated the enemy!");
            resetGame();
        }, 1000);
    } else {
        // Set up next spell
        setTimeout(() => {
            setupNewSpell();
        }, 1000);
    }
}

function pauseGame() {
    canDetectMovement = false;
    document.getElementById('game-paused-overlay').style.display = 'flex';
}

// Function to resume the game
function resumeGame() {
    canDetectMovement = true;
    document.getElementById('game-paused-overlay').style.display = 'none';
}

function showOutOfManaMessage() {
    const overlay = document.getElementById('game-paused-overlay');
    overlay.innerHTML = `
        <div class="pause-message">
            <h2>Out of Mana!</h2>
            <p>You need to take a walk to recharge your magical energy.</p>
            <p>Come back after taking some steps outside!</p>
            <button id="check-steps-button">I'm Back! Check My Steps</button>
        </div>
    `;

    document.getElementById('check-steps-button').addEventListener('click', async () => {
        const newSteps = await updateManaFromSteps();
        
        if (playerMana >= manaCostPerSpell) {
            resumeGame();
            showMessage("Mana recharged! Continue your magical battle!");
        } else {
            showMessage(`Not enough steps yet! You have ${playerMana.toFixed(1)} mana.`);
        }
    });
}

// Function to show temporary messages
function showMessage(text, duration = 3000) {
    const messageElement = document.getElementById('game-message') || createMessageElement();
    messageElement.textContent = text;
    messageElement.style.display = 'block';
    messageElement.style.opacity = '1';
    
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 500);
    }, duration);
}

// Create message element if it doesn't exist
function createMessageElement() {
    const messageElement = document.createElement('div');
    messageElement.id = 'game-message';
    messageElement.className = 'game-message';
    document.querySelector('.game-container').appendChild(messageElement);
    return messageElement;
}

// Periodically check for steps (not too often to avoid performance issues)
function setupStepChecking() {
    // Initial check at startup
    updateManaFromSteps();
    
    // Check for new steps every 30 seconds
    setInterval(updateManaFromSteps, 30000);
}

function initManaSystem() {
    // Add mana display and pause overlay to DOM
    addManaUIElements();
    
    // Setup step checking
    setupStepChecking();
}

// Add UI elements needed for mana system
function addManaUIElements() {
    // Add mana bar if it doesn't exist
    if (!document.getElementById('mana-container')) {
        const manaContainer = document.createElement('div');
        manaContainer.className = 'mana-container';
        manaContainer.innerHTML = `
            <div class="mana-label">Mana</div>
            <div class="mana-bar-container">
                <div class="mana-bar" id="player-mana-bar"></div>
            </div>
            <div class="mana-text" id="mana-text">0/${maxMana}</div>
        `;
        
        // Insert the mana container near the wizard
        document.querySelector('.wizard').parentNode.appendChild(manaContainer);
    }
    
    // Add pause overlay if it doesn't exist
    if (!document.getElementById('game-paused-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'game-paused-overlay';
        overlay.className = 'paused-overlay';
        overlay.style.display = 'none';
        document.querySelector('.game-container').appendChild(overlay);
    }
}

// Reset the game
function resetGame() {
    enemyHealth = 100;
    document.getElementById('enemy-health').style.width = '100%';
    setupNewSpell();
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', init);
