// Game initialization
function initGame() {
    // Initialize game state
    window.gameState = {
        score: 0,
        throws: 0,
        currentHole: 1,
        throwing: false,
        power: 0,
        powerIncreasing: true,
        discInHand: true,
        selectedDisc: null
    };

    // Initialize bag and UI
    const bag = new Bag();
    window.gameState.selectedDisc = bag.getSelectedDisc();
    const ui = new UI();

    // Set up disc change handler
    ui.setOnDiscChange((selectedDisc) => {
        if (selectedDisc) {
            disc.material = discMaterials[selectedDisc.type];
        }
    });

    // Initialize scene
    const scene = new THREE.Scene();
    // ... rest of scene initialization ...

    // Throwing mechanics
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameState.throwing && gameState.discInHand) {
            startThrow();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && gameState.throwing) {
            throwDisc();
        }
    });

    function startThrow() {
        if (!gameState.selectedDisc) {
            ui.showMessage('Select a disc first!');
            return;
        }

        gameState.throwing = true;
        gameState.power = 0;
        gameState.powerIncreasing = true;
        updatePower();
    }

    function updatePower() {
        if (!gameState.throwing) return;

        if (gameState.powerIncreasing) {
            gameState.power += 2;
            if (gameState.power >= 100) {
                gameState.powerIncreasing = false;
            }
        } else {
            gameState.power -= 2;
            if (gameState.power <= 0) {
                gameState.powerIncreasing = true;
            }
        }

        ui.updatePowerMeter(gameState.power);
        requestAnimationFrame(updatePower);
    }

    function throwDisc() {
        const disc = gameState.selectedDisc;
        const power = gameState.power / 100;
        
        // Calculate throw physics based on disc stats and power
        const throwVelocity = disc.speed * power;
        const throwAngle = calculateThrowAngle();
        
        // Apply throw
        applyThrowPhysics(throwVelocity, throwAngle, disc);
        
        // Update game state
        gameState.throwing = false;
        gameState.discInHand = false;
        gameState.throws++;
        
        // Update UI
        ui.hidePowerMeter();
        ui.updateThrows(gameState.throws);
    }

    // ... rest of game logic ...
}

// Start the game
initGame(); 