// Game initialization and utility functions
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Three.js to load
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }
    initGame();
});

// Game initialization
async function initGame() {
    // Set default player name
    let playerName = localStorage.getItem('discGolfPlayerName');
    if (!playerName) {
        playerName = 'Alice';
        localStorage.setItem('discGolfPlayerName', playerName);
    }

    // Initialize game state
    window.gameState = {
        throwing: false,
        power: 0,
        powerIncreasing: true,
        discInHand: true,
        currentDisc: null,
        celebrationInProgress: false,
        showHitboxes: false, // Add hitbox visibility state
        disableGrass: false, // Add grass texture toggle state
        disableSkyWalls: false // Add sky walls toggle state
    };

    // Initialize scene
    const scene = new THREE.Scene();

    // Initialize UI first
    window.ui = new UI();

    // Show welcome message with logo
    const welcomeMessage = `<div style="display: flex; align-items: center; gap: 10px; justify-content: center; text-align: center; width: 100%;"><img src="img/logo.svg" alt="VIBE DISC" style="height: 24px;"><span>Welcome to Vibe Disc!</span></div>`;
    window.ui.showMessage(welcomeMessage, 3000, 'info');

    // Initialize stats
    const stats = new Stats();
    stats.dom.id = 'stats-panel';
    stats.dom.style.display = 'none'; // Hide by default
    document.body.appendChild(stats.dom);

    // Initialize managers first
    try {
        // Initialize managers and make them globally accessible
        window.terrainManager = new TerrainManager(scene);
        window.courseManager = new CourseManager(scene);
        window.playerManager = new PlayerManager(scene);
        window.celebrationEffects = new CelebrationEffects(scene);

        // Initialize settings UI after player manager
        const settingsUI = new SettingsUI(window.playerManager);

        // Load initial course through course manager
        await window.courseManager.loadCourseFromFile('beginner');
        //await window.courseManager.loadCourseFromFile('forest_valley');

        // Get course size after course is loaded
        const currentCourse = window.courseManager.getCurrentCourse();
        const courseSize = currentCourse?.courseSize || { width: 300, length: 400 };

        // Create sky with course dimensions and store it globally
        let tmpVisualSettings = {
            skyImageUrl: 'textures/sky/skybox_4k.png',
            backgroundColor: '#87CEEB'
        };
        if (typeof currentCourse.visualSettings !== 'undefined') {
            tmpVisualSettings = currentCourse.visualSettings;
        }
        let skyData = {
            type: 'panorama', 
            textureUrl: tmpVisualSettings.skyImageUrl ? tmpVisualSettings.skyImageUrl : 'textures/sky/skybox_4k.png',
            courseSize: courseSize // Use the actual course size
        };
        console.log("Current course:", currentCourse);
        if (currentCourse.visualSettings) {
            skyData.textureUrl = currentCourse.visualSettings.skyImageUrl;
            skyData.backgroundColor = currentCourse.visualSettings.backgroundColor;
        }
        console.log("Sky data:", skyData);
        window.sky = new Sky(scene, skyData);

        // Initialize camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 10, 20);
        camera.lookAt(0, 0, 0);

        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.getElementById('container').appendChild(renderer.domElement);

        // Initialize camera controller after renderer is created
        window.cameraController = new CameraController(camera, scene, renderer.domElement);

        // Handle window resizing
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        directionalLight.shadow.bias = -0.001;
        scene.add(directionalLight);
        
        // Add a hemisphere light for more natural outdoor lighting
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        scene.add(hemisphereLight);

        // Initialize hitbox toggle in courses section
        const showHitboxesCheckbox = document.getElementById('show-hitboxes');
        if (showHitboxesCheckbox) {
            showHitboxesCheckbox.checked = window.gameState.showHitboxes;
            showHitboxesCheckbox.addEventListener('change', (e) => {
                window.gameState.showHitboxes = e.target.checked;
                window.terrainManager.setAllHitboxesVisibility(e.target.checked);
            });
        }

        // Create BagUI with current player's bag
        const bagUI = new BagUI(null, (selectedDisc) => {
            // Handle disc selection
            if (window.gameState && window.gameState.currentDisc) {
                window.gameState.currentDisc.remove();
                window.gameState.currentDisc = null;
            }
            
            // Create new disc with selected properties
            if (window.gameState) {
                const currentPlayer = window.playerManager.getCurrentPlayer();
                if (currentPlayer) {
                    // Create new disc with the scene reference
                    window.gameState.currentDisc = new Disc(scene, selectedDisc);
                    // Position disc above player
                    const discPosition = currentPlayer.position.clone().add(new THREE.Vector3(0, 1, 0));
                    window.gameState.currentDisc.setPosition(discPosition);
                    window.gameState.discInHand = true;
                }
            }
        });
        
        // Update BagUI when player changes
        window.playerManager.onPlayerChange = (player) => {
            bagUI.setBag(player.bag);
        };

        // Set up throw handlers
        window.ui.setThrowHandlers(
            // Start throw
            () => {
                window.gameState.throwing = true;
                window.gameState.power = 0;
                window.gameState.powerIncreasing = true;
                window.ui.showPowerMeter();
            },
            // Complete throw
            () => {
                if (!window.gameState.throwing) return;
                
                const currentPlayer = window.playerManager.getCurrentPlayer();
                if (!currentPlayer) return;

                const throwPower = window.gameState.power;
                const throwDirection = window.cameraController.getDirection();
                
                // Create new disc if needed
                if (!window.gameState.currentDisc) {
                    const discData = currentPlayer.getSelectedDisc();
                    window.gameState.currentDisc = new Disc(scene, discData);
                    window.gameState.currentDisc.setPosition(currentPlayer.position.clone().add(new THREE.Vector3(0, 1, 0)));
                }
                
                // Throw the disc
                window.gameState.currentDisc.throw(throwDirection, throwPower);
                window.gameState.discInHand = false;  // Set disc as not in hand
                
                // Reset throw state
                window.gameState.throwing = false;
                window.gameState.power = 0;
                window.ui.hidePowerMeter();
                
                // Update player stats
                currentPlayer.incrementThrows();
                window.ui.updateThrows(currentPlayer.throws);
            },
            // Can throw check
            () => window.gameState.discInHand
        );

        // Update UI with total holes
        if (window.courseManager.getCurrentCourse()) {
            const course = window.courseManager.getCurrentCourse();
            const totalHoles = course.holes.length;
            window.ui.updateHole(course.currentHoleIndex + 1, totalHoles);
        }

        // Initialize player after course is loaded and portals are set
        window.playerManager.initializePlayers(playerName);
        const firstPlayer = window.playerManager.getCurrentPlayer();

        // Wait a frame to ensure everything is initialized
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Set initial camera focus on first player
        if (firstPlayer) {
            window.cameraController.focusOnPlayer(firstPlayer);
        }

        // Create initial disc for first player
        if (firstPlayer && firstPlayer.bag) {
            const initialDisc = firstPlayer.bag.discs[0];
            if (initialDisc) {
                window.gameState.currentDisc = new Disc(scene, initialDisc);
                const discPosition = firstPlayer.position.clone().add(new THREE.Vector3(0, 1, 0));
                window.gameState.currentDisc.setPosition(discPosition);
                window.gameState.discInHand = true;
            }
        }

        // Initialize clock for animation timing
        const clock = new THREE.Clock();

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);

            // Update stats
            stats.update();

            // Update game state
            if (window.gameState.throwing) {
                updateThrowPower();
            }
            
            // Update disc physics
            if (window.gameState.currentDisc) {
                window.gameState.currentDisc.update(0.016); // Assuming 60fps
            }
            
            // Update terrain
            if (window.terrainManager) {
                window.terrainManager.update(0.016); // Assuming 60fps
            }

            // Update camera
            if (window.cameraController) {
                window.cameraController.update();
            }

            // Update arrow animation
            if (window.courseManager && window.courseManager.getCurrentCourse()) {
                const currentHole = window.courseManager.getCurrentCourse().holes[window.courseManager.getCurrentCourse().currentHoleIndex];
                if (currentHole) {
                    currentHole.updateArrow(Date.now() * 0.001); // Convert to seconds
                }
            }

            // Render scene
            renderer.render(scene, camera);
        }

        // Function to update throw power
        function updateThrowPower() {
            if (!window.gameState.throwing) return;
            
            const powerChangeRate = 2; // Power change per frame
            if (window.gameState.powerIncreasing) {
                window.gameState.power += powerChangeRate;
                if (window.gameState.power >= 100) {
                    window.gameState.power = 100;
                    window.gameState.powerIncreasing = false;
                }
            } else {
                window.gameState.power -= powerChangeRate;
                if (window.gameState.power <= 0) {
                    window.gameState.power = 0;
                    window.gameState.powerIncreasing = true;
                }
            }
            
            window.ui.updatePowerMeter(window.gameState.power);
        }
        
        animate();
    } catch (error) {
        console.error('Error during game initialization:', error);
    }
}

// Add these helper functions at the end of initGame but before animate()
function createSparkle(color) {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8
    });
    return new THREE.Mesh(geometry, material);
}

function createStar(color) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const starPoints = 5;
    const innerRadius = 0.05;
    const outerRadius = 0.15;
    
    for (let i = 0; i < starPoints * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (starPoints * 2)) * Math.PI * 2;
        vertices.push(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
        );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineLoop(geometry, material);
}

function createCloud(color) {
    const group = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
    });
    
    // Create multiple overlapping spheres for cloud effect
    const positions = [
        [0, 0, 0],
        [-0.15, 0.1, 0],
        [0.15, 0.1, 0],
        [0, 0.15, 0]
    ];
    
    positions.forEach(pos => {
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(pos[0], pos[1], pos[2]);
        group.add(sphere);
    });
    
    return group;
} 