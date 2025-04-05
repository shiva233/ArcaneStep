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

// Teachable Machine model URL - replace with your model URL
const URL = "https://teachablemachine.withgoogle.com/models/-iT69gyB7/";
let model, webcam, ctx, labelContainer, maxPredictions;

// Initialize the game
async function init() {
    // Set up a new spell sequence
    setupNewSpell();
    
    // Initialize Teachable Machine model
    await initTeachableMachine();
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

// Reset the game
function resetGame() {
    enemyHealth = 100;
    document.getElementById('enemy-health').style.width = '100%';
    setupNewSpell();
}

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', init);
