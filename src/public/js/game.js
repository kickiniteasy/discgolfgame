// Wait for DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

// Game initialization
function initGame() {
    // Get or prompt for player name
    let playerName = localStorage.getItem('discGolfPlayerName');
    if (!playerName) {
        playerName = prompt('Enter your name:', 'Player 1');
        if (!playerName) playerName = 'Player 1';
        localStorage.setItem('discGolfPlayerName', playerName);
    }

    // Initialize game state
    window.gameState = {
        throwing: false,
        power: 0,
        powerIncreasing: true,
        discInHand: true
    };

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 300, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a8024, // Green grass color
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Initialize terrain
    const terrainManager = new TerrainManager(scene);
    terrainManager.generateRandomTerrain({
        minX: -200,
        maxX: 200,
        minZ: -200,
        maxZ: 200,
        count: 50
    });

    // Initialize UI
    const ui = new UI();

    // Initialize player manager with player name
    const playerManager = new PlayerManager(scene);
    playerManager.initializePlayers(playerName);

    // Initialize SettingsUI
    const settingsUI = new SettingsUI(playerManager);

    // Initialize BagUI for the current player
    const bagUI = new BagUI(playerManager.getCurrentPlayer().bag, (selectedDisc) => {
        // Update the disc color when a new disc is selected
        disc.material.color.setHex(playerManager.getCurrentPlayer().color);
    });

    // Initialize course
    const courseData = Course.getCourseById('beginner');
    const course = new Course(scene, courseData);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Disc setup
    const discGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32);
    const disc = new THREE.Mesh(discGeometry, new THREE.MeshStandardMaterial({
        color: playerManager.getCurrentPlayer().color,
        roughness: 0.3,
        metalness: 0.7
    }));
    disc.rotation.x = Math.PI / 2;
    disc.castShadow = true;
    scene.add(disc);

    // Physics variables
    let discVelocity = new THREE.Vector3();
    let discRotation = new THREE.Vector3();
    const gravity = 0.008;
    let discHasLanded = false;
    let discStopTimer = 0;

    // Event listeners
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

    // Touch and click controls for throw button
    const throwButton = document.getElementById('throw-button');
    let throwTouchActive = false;

    throwButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!throwTouchActive && !gameState.throwing && gameState.discInHand) {
            throwTouchActive = true;
            startThrow();
        }
    });

    throwButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (throwTouchActive) {
            throwTouchActive = false;
            if (gameState.throwing) {
                throwDisc();
            }
        }
    });

    // Also handle mouse events for desktop testing
    throwButton.addEventListener('mousedown', (e) => {
        if (!throwTouchActive && !gameState.throwing && gameState.discInHand) {
            throwTouchActive = true;
            startThrow();
        }
    });

    throwButton.addEventListener('mouseup', (e) => {
        if (throwTouchActive) {
            throwTouchActive = false;
            if (gameState.throwing) {
                throwDisc();
            }
        }
    });

    // Also handle mouse leaving the button
    throwButton.addEventListener('mouseleave', (e) => {
        if (throwTouchActive) {
            throwTouchActive = false;
            if (gameState.throwing) {
                throwDisc();
            }
        }
    });

    function startThrow() {
        const currentPlayer = playerManager.getCurrentPlayer();
        
        // Check if player has already completed the hole
        if (currentPlayer.hasCompletedHole) {
            ui.showMessage(`${currentPlayer.name} has already completed this hole!`);
            return;
        }

        if (!currentPlayer.getSelectedDisc()) {
            ui.showMessage('Select a disc first!');
            return;
        }

        gameState.throwing = true;
        gameState.power = 0;
        gameState.powerIncreasing = true;
        throwButton.classList.add('throwing');
        ui.showPowerMeter();
        updatePower();
    }

    function throwDisc() {
        if (!gameState.throwing) return;

        const currentPlayer = playerManager.getCurrentPlayer();
        const selectedDisc = currentPlayer.getSelectedDisc();
        const power = gameState.power / 100;

        // Calculate throw physics
        const direction = calculateThrowDirection();
        const speed = selectedDisc.speed / 10 * power * 1.2;
        discVelocity.copy(direction).multiplyScalar(speed);
        discVelocity.y = power * 0.25;

        // Set rotation
        discRotation.set(
            -direction.z * 0.03,
            0.02,
            direction.x * 0.03
        );

        // Update states
        gameState.throwing = false;
        gameState.discInHand = false;
        currentPlayer.incrementThrows();
        throwButton.classList.remove('throwing');

        // Reset landing state
        discHasLanded = false;
        discStopTimer = 0;

        // Update UI
        ui.updateScoreboard(playerManager.players);
    }

    function calculateThrowDirection() {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        return direction;
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

    function resetDisc() {
        const currentPlayer = playerManager.getCurrentPlayer();
        
        gameState.discInHand = true;
        gameState.throwing = false;
        gameState.power = 0;
        gameState.powerIncreasing = true;

        disc.position.copy(currentPlayer.position).add(new THREE.Vector3(0, 0.5, 0));
        disc.material.color.setHex(currentPlayer.color);
        discVelocity.set(0, 0, 0);
        discRotation.set(0, 0, 0);
        disc.rotation.set(Math.PI / 2, 0, 0);
    }

    function movePlayerToDisc() {
        const currentPlayer = playerManager.getCurrentPlayer();
        currentPlayer.moveToPosition(new THREE.Vector3(disc.position.x, 0.5, disc.position.z));
        resetDisc();
    }

    function nextTurn() {
        playerManager.nextTurn();
        
        // Find next player who hasn't completed the hole
        let foundUnfinishedPlayer = false;
        let loopCount = 0;
        const maxLoops = playerManager.players.length;
        
        while (!foundUnfinishedPlayer && loopCount < maxLoops) {
            const currentPlayer = playerManager.getCurrentPlayer();
            if (!currentPlayer.hasCompletedHole) {
                foundUnfinishedPlayer = true;
                break;
            }
            playerManager.nextTurn();
            loopCount++;
        }
        
        // If no unfinished players found, all players have completed
        if (!foundUnfinishedPlayer) {
            return;
        }

        const currentPlayer = playerManager.getCurrentPlayer();
        resetDisc();
        
        // Get current player and hole positions
        const holePosition = course.getCurrentHolePosition();
        
        // Calculate direction from player to hole
        const directionToHole = new THREE.Vector3()
            .subVectors(holePosition, currentPlayer.position)
            .normalize();
        
        // Position camera behind player, facing hole
        const cameraOffset = new THREE.Vector3()
            .copy(directionToHole)
            .multiplyScalar(-5); // 5 units behind player
        cameraOffset.y = 2; // Height above ground
        
        // Update positions and orientations
        currentPlayer.rotateToFacePosition(holePosition);
        camera.position.copy(currentPlayer.position).add(cameraOffset);
        controls.target.copy(currentPlayer.position);
        
        ui.resetPowerMeter();
        ui.updateScoreboard(playerManager.players);
        
        // Show whose turn it is
        ui.showMessage(`${currentPlayer.name}'s turn`, 1500);
    }

    function completeHole() {
        const currentPlayer = playerManager.getCurrentPlayer();
        
        // Prevent completing hole multiple times
        if (currentPlayer.hasCompletedHole) {
            return;
        }
        
        // Mark current player as completed and update their score
        currentPlayer.completeHole();
        currentPlayer.updateScore(currentPlayer.score + currentPlayer.throws);
        
        // Show completion message for this player
        ui.showMessage(`${currentPlayer.name} completed hole ${course.getHoleNumber()} in ${currentPlayer.throws} throws!`, 2000);
        
        // Check if all players have completed the hole
        const allPlayersCompleted = playerManager.players.every(player => player.hasCompletedHole);
        
        if (allPlayersCompleted) {
            // Show final scores for the hole
            const scores = playerManager.players.map(p => `${p.name}: ${p.throws}`).join(', ');
            ui.showMessage(`Hole ${course.getHoleNumber()} complete! Final scores - ${scores}`, 3000);
            
            // Use a single timeout for transitioning to next hole
            setTimeout(() => {
                const currentHoleNumber = course.getHoleNumber();
                const isLastHole = !course.nextHole();
                
                // Reset completion status and throws for all players
                playerManager.players.forEach(player => {
                    player.resetHoleCompletion();
                    player.resetThrows();
                });
                
                // Only end game if we were on the last hole
                if (isLastHole) {
                    endGame();
                    return;
                }

                // Set up next hole
                ui.updateHole(course.getHoleNumber());
                playerManager.resetPlayerPositions();
                
                // Set up camera for new hole
                const holePosition = course.getCurrentHolePosition();
                const firstPlayer = playerManager.players[0];
                firstPlayer.rotateToFacePosition(holePosition);
                
                // Position camera behind first player
                const directionToHole = new THREE.Vector3()
                    .subVectors(holePosition, firstPlayer.position)
                    .normalize();
                const cameraOffset = new THREE.Vector3()
                    .copy(directionToHole)
                    .multiplyScalar(-5);
                cameraOffset.y = 2;
                
                camera.position.copy(firstPlayer.position).add(cameraOffset);
                controls.target.copy(firstPlayer.position);
                
                // Reset game state and UI elements
                gameState.throwing = false;
                gameState.power = 0;
                gameState.powerIncreasing = true;
                gameState.discInHand = true;
                ui.hidePowerMeter();
                throwButton.classList.remove('throwing');
                
                // Update UI for next hole
                ui.updateScoreboard(playerManager.players);
                resetDisc();
            }, 3000);
            return;
        }
        
        // If not all players have completed, move to next player's turn after a short delay
        setTimeout(() => {
            nextTurn();
            ui.updateScoreboard(playerManager.players);
        }, 1500);
    }

    function endGame() {
        const scores = playerManager.updateScores();
        const winner = scores.reduce((min, player) => 
            player.score < min.score ? player : min
        );

        ui.showMessage(`Game Over! ${winner.name} wins with ${winner.score} throws!`, 5000);
        setTimeout(() => {
            course.resetCourse();
            playerManager.resetPlayerPositions();
            playerManager.players.forEach(player => {
                player.updateScore(0);
                player.resetThrows();
            });
            ui.updateScoreboard(playerManager.players);
        }, 5000);
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Update controls
        controls.update();

        // Update disc physics
        if (gameState.discInHand) {
            const currentPlayer = playerManager.getCurrentPlayer();
            disc.position.copy(currentPlayer.position).add(new THREE.Vector3(0, 0.5, 0));
            
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            disc.lookAt(disc.position.clone().add(direction));
            disc.rotateX(Math.PI / 2);
        } else {
            // Disc flight physics
            disc.position.add(discVelocity);
            disc.rotation.x += discRotation.x;
            disc.rotation.y += discRotation.y;
            disc.rotation.z += discRotation.z;
            
            discVelocity.y -= gravity;
            
            // Ground collision
            if (disc.position.y < 0.025) {
                disc.position.y = 0.025;
                discHasLanded = true;
                
                if (discVelocity.y < 0) {
                    discVelocity.y = -discVelocity.y * 0.1;
                }
                
                discVelocity.x *= 0.8;
                discVelocity.z *= 0.8;
                discRotation.multiplyScalar(0.7);
                
                if (discVelocity.length() < 0.03) {
                    discVelocity.set(0, 0, 0);
                    discRotation.set(0, 0, 0);
                    
                    discStopTimer++;
                    if (discStopTimer > 60) {
                        if (!gameState.discInHand) {
                            movePlayerToDisc();
                            nextTurn();
                        }
                    }
                } else {
                    discStopTimer = 0;
                }
            }
            
            // Check for hole collision
            const collisionResult = course.checkDiscCollision(disc.position);
            if (collisionResult.isInHole) {
                completeHole();
            }
            ui.updateDistance(collisionResult.distance);
        }

        // Update camera target
        if (gameState.discInHand) {
            controls.target.copy(playerManager.getCurrentPlayer().position);
        } else {
            controls.target.copy(disc.position);
        }

        renderer.render(scene, camera);
    }

    // Start the game
    playerManager.resetPlayerPositions();
    
    // Get initial hole position and first player for proper orientation
    const initialHolePosition = course.getCurrentHolePosition();
    const firstPlayer = playerManager.players[0];
    
    // Calculate initial direction from player to hole
    const initialDirectionToHole = new THREE.Vector3()
        .subVectors(initialHolePosition, firstPlayer.position)
        .normalize();
    
    // Position camera behind first player, facing hole
    const initialCameraOffset = new THREE.Vector3()
        .copy(initialDirectionToHole)
        .multiplyScalar(-5);
    initialCameraOffset.y = 2;
    
    // Set up initial positions and orientations
    firstPlayer.rotateToFacePosition(initialHolePosition);
    camera.position.copy(firstPlayer.position).add(initialCameraOffset);
    controls.target.copy(firstPlayer.position);
    
    resetDisc();
    animate();
} 