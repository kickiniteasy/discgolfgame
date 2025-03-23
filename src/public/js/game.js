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
    
    // Add terrain variation
    function addTerrainVariation() {
        for (let i = 0; i < 50; i++) {
            const size = Math.random() * 5 + 1;
            const height = Math.random() * 2 + 0.2;
            const geometry = new THREE.BoxGeometry(size, height, size);
            const material = new THREE.MeshStandardMaterial({
                color: 0x2e6215, // Darker green for terrain
                roughness: 0.9,
                metalness: 0.1
            });
            const terrain = new THREE.Mesh(geometry, material);
            terrain.position.x = Math.random() * 400 - 200;
            terrain.position.y = height / 2;
            terrain.position.z = Math.random() * 400 - 200;
            terrain.receiveShadow = true;
            terrain.castShadow = true;
            scene.add(terrain);
        }
    }
    addTerrainVariation();

    // Initialize UI
    const ui = new UI();

    // Initialize player manager with player name
    const playerManager = new PlayerManager(scene);
    playerManager.initializePlayers(playerName);

    // Initialize course
    const courseData = Course.getCourseById('beginner');
    const course = new Course(scene, courseData);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

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
        ui.hidePowerMeter();

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
        resetDisc();
        ui.updateScoreboard(playerManager.players);
    }

    function completeHole() {
        const currentPlayer = playerManager.getCurrentPlayer();
        ui.showMessage(`${currentPlayer.name} completed hole ${course.getHoleNumber()} in ${currentPlayer.throws} throws!`, 3000);

        currentPlayer.updateScore(currentPlayer.score + currentPlayer.throws);
        currentPlayer.resetThrows();

        if (!course.nextHole()) {
            endGame();
            return;
        }

        ui.updateHole(course.getHoleNumber());
        playerManager.resetPlayerPositions();
        ui.updateScoreboard(playerManager.players);
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
    resetDisc();
    animate();
} 