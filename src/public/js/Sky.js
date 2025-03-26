class Sky {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            type: options.type || 'panorama',
            textureUrl: options.textureUrl || 'textures/sky/skybox_4k.png'
        };

        console.log('Sky constructor - Using texture:', this.options.textureUrl);
        this.createSky();
    }

    createSky() {
        if (this.options.type === 'panorama') {
            console.log('Creating panorama walls');
            this.createPanoramaWalls();
        }
    }

    createPanoramaWalls() {
        const textureLoader = new THREE.TextureLoader();
        console.log('Loading wall texture from:', this.options.textureUrl);
        
        // Create a gradient background first
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0077ff'); // Deep sky blue
        gradient.addColorStop(0.7, '#6eb5ff'); // Lighter blue
        gradient.addColorStop(1, '#FFFFFF'); // White
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2, 512);
        const backgroundTexture = new THREE.CanvasTexture(canvas);
        this.scene.background = backgroundTexture;
        
        textureLoader.load(
            this.options.textureUrl,
            (texture) => {
                console.log('Wall texture loaded successfully');
                // Configure texture
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.needsUpdate = true;
                
                // Wall dimensions
                const frontWidth = 1000;  // Width of front/back walls
                const wallHeight = 500;   // Height of all walls
                const depth = 800;        // Distance between front and back walls
                
                // Create gradient texture for alpha
                const gradientCanvas = document.createElement('canvas');
                gradientCanvas.width = 1;
                gradientCanvas.height = 512;
                const gradientCtx = gradientCanvas.getContext('2d');
                const alphaGradient = gradientCtx.createLinearGradient(0, 0, 0, 512);
                alphaGradient.addColorStop(0, 'rgba(255,255,255,0)'); // Transparent at top
                alphaGradient.addColorStop(0.3, 'rgba(255,255,255,1)'); // Solid at bottom
                gradientCtx.fillStyle = alphaGradient;
                gradientCtx.fillRect(0, 0, 1, 512);
                const alphaMap = new THREE.CanvasTexture(gradientCanvas);
                alphaMap.needsUpdate = true;
                
                // Material that won't cast or receive shadows
                const wallMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    transparent: true,
                    alphaMap: alphaMap
                });
                
                // Create walls
                const walls = [];
                
                // Calculate Y position to align with horizon
                const yOffset = wallHeight * 0.15; // Only show 85% of the wall above ground
                
                // North wall (front)
                const northWall = new THREE.Mesh(
                    new THREE.PlaneGeometry(frontWidth, wallHeight),
                    wallMaterial.clone()
                );
                northWall.position.set(0, yOffset, -depth/2);
                walls.push(northWall);
                
                // South wall (back)
                const southWall = new THREE.Mesh(
                    new THREE.PlaneGeometry(frontWidth, wallHeight),
                    wallMaterial.clone()
                );
                southWall.position.set(0, yOffset, depth/2);
                southWall.rotation.y = Math.PI;
                walls.push(southWall);
                
                // East wall (right)
                const eastWall = new THREE.Mesh(
                    new THREE.PlaneGeometry(depth, wallHeight),
                    wallMaterial.clone()
                );
                eastWall.position.set(frontWidth/2, yOffset, 0);
                eastWall.rotation.y = -Math.PI/2;
                walls.push(eastWall);
                
                // West wall (left)
                const westWall = new THREE.Mesh(
                    new THREE.PlaneGeometry(depth, wallHeight),
                    wallMaterial.clone()
                );
                westWall.position.set(-frontWidth/2, yOffset, 0);
                westWall.rotation.y = Math.PI/2;
                walls.push(westWall);
                
                // Add all walls to scene
                this.walls = walls;
                walls.forEach((wall, index) => {
                    wall.name = ['North', 'South', 'East', 'West'][index] + ' Wall';
                    this.scene.add(wall);
                    console.log(`Added ${wall.name} to scene:`, {
                        position: wall.position,
                        rotation: wall.rotation,
                        geometry: wall.geometry.parameters
                    });
                });
                
                console.log('Walls added to scene:', {
                    textureSize: `${texture.image.width}x${texture.image.height}`,
                    frontWidth,
                    wallHeight,
                    depth,
                    wallCount: walls.length
                });
            },
            (progress) => {
                console.log('Loading wall texture progress:', Math.round(progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading wall texture:', error);
            }
        );
    }

    dispose() {
        if (this.walls) {
            this.walls.forEach(wall => {
                wall.geometry.dispose();
                wall.material.dispose();
                this.scene.remove(wall);
            });
            this.walls = null;
        }
    }
} 