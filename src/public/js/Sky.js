class Sky {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            type: options.type || 'panorama',
            textureUrl: options.textureUrl || 'textures/sky/skybox_4k.png',
            courseSize: options.courseSize || { width: 300, length: 400 }
        };
        this.walls = [];
        this.createSky();
    }

    createSky() {
        if (this.options.type === 'panorama') {
            this.createPanoramaWalls();
        }
    }

    createPanoramaWalls() {
        const textureLoader = new THREE.TextureLoader();
        
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
                // Configure texture
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.needsUpdate = true;
                
                // Wall dimensions - match course size exactly
                const frontWidth = this.options.courseSize.width;
                const wallHeight = 100;   // Height of all walls
                const depth = this.options.courseSize.length;
                
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
                
                // Position walls exactly at ground level
                const yOffset = wallHeight / 2;  // Center point of wall height
                
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
                walls.forEach((wall, index) => {
                    wall.name = ['North', 'South', 'East', 'West'][index] + ' Wall';
                    this.scene.add(wall);
                    this.walls.push(wall);
                });
            },
            (progress) => {
                // Optional: Handle progress silently
            },
            (error) => {
                console.error('Error loading wall texture:', error);
            }
        );
    }

    updateCourseSize(newSize) {
        if (!newSize || !newSize.width || !newSize.length) return;
        
        // Update the stored course size
        this.options.courseSize = newSize;
        
        // Remove existing walls
        this.dispose();
        
        // Recreate walls with new size
        this.walls = [];
        this.createSky();
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

    setWallsVisible(visible) {
        this.walls.forEach(wall => {
            wall.visible = visible;
        });
    }
} 