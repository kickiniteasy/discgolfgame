class Sky {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            type: options.type || 'panorama',
            textureUrl: options.textureUrl || 'textures/sky/skybox_4k.png',
            courseSize: options.courseSize || { width: 300, length: 400 }
        };
        this.walls = [];
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.createSky();
    }

    createSky() {
        if (this.options.type === 'panorama') {
            this.createPanoramaWalls();
        }
    }

    createPanoramaWalls() {
        const textureLoader = new THREE.TextureLoader();
        
        // Create a simpler background for mobile
        const canvas = document.createElement('canvas');
        canvas.width = this.isMobile ? 1 : 2; // Smaller for mobile
        canvas.height = this.isMobile ? 256 : 512; // Reduced height for mobile
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0077ff');
        gradient.addColorStop(0.7, '#6eb5ff');
        gradient.addColorStop(1, '#FFFFFF');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        const backgroundTexture = new THREE.CanvasTexture(canvas);
        backgroundTexture.minFilter = THREE.LinearFilter;
        backgroundTexture.magFilter = THREE.LinearFilter;
        backgroundTexture.generateMipmaps = false;
        this.scene.background = backgroundTexture;
        
        // Use lower resolution texture for mobile
        const textureUrl = this.isMobile ? 
            this.options.textureUrl.replace('_4k', '_2k') : 
            this.options.textureUrl;
        
        textureLoader.load(
            textureUrl,
            (texture) => {
                // Configure texture with mobile optimizations
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.needsUpdate = true;
                
                // Wall dimensions
                const frontWidth = this.options.courseSize.width;
                const wallHeight = this.isMobile ? 50 : 100; // Lower height for mobile
                const depth = this.options.courseSize.length;
                
                // Create gradient texture for alpha - simplified for mobile
                const gradientCanvas = document.createElement('canvas');
                gradientCanvas.width = 1;
                gradientCanvas.height = this.isMobile ? 256 : 512;
                const gradientCtx = gradientCanvas.getContext('2d');
                const alphaGradient = gradientCtx.createLinearGradient(0, 0, 0, gradientCanvas.height);
                alphaGradient.addColorStop(0, 'rgba(255,255,255,0)');
                alphaGradient.addColorStop(0.3, 'rgba(255,255,255,1)');
                gradientCtx.fillStyle = alphaGradient;
                gradientCtx.fillRect(0, 0, 1, gradientCanvas.height);
                const alphaMap = new THREE.CanvasTexture(gradientCanvas);
                alphaMap.needsUpdate = true;
                
                // Create a single material instance to be shared
                const wallMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: this.isMobile ? THREE.FrontSide : THREE.DoubleSide, // Single-sided for mobile
                    depthWrite: false,
                    transparent: true,
                    alphaMap: alphaMap
                });
                
                // Create walls
                const walls = [];
                const yOffset = wallHeight / 2;
                
                // Create wall geometries
                const frontGeometry = new THREE.PlaneGeometry(frontWidth, wallHeight);
                const sideGeometry = new THREE.PlaneGeometry(depth, wallHeight);
                
                // North wall (front)
                const northWall = new THREE.Mesh(frontGeometry, wallMaterial);
                northWall.position.set(0, yOffset, -depth/2);
                walls.push(northWall);
                
                // South wall (back)
                const southWall = new THREE.Mesh(frontGeometry, wallMaterial);
                southWall.position.set(0, yOffset, depth/2);
                southWall.rotation.y = Math.PI;
                walls.push(southWall);
                
                // East wall (right)
                const eastWall = new THREE.Mesh(sideGeometry, wallMaterial);
                eastWall.position.set(frontWidth/2, yOffset, 0);
                eastWall.rotation.y = -Math.PI/2;
                walls.push(eastWall);
                
                // West wall (left)
                const westWall = new THREE.Mesh(sideGeometry, wallMaterial);
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
            undefined,
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
} 