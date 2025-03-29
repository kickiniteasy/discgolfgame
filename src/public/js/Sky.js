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
        
        // Log all scene children to debug
        console.log("Scene children:", this.scene.children.map(child => child.name || "unnamed"));
    }

    createSky() {
        // Simplest approach possible
        console.log("Creating minimal sky with:", this.options.textureUrl);
        
        // Clean up existing
        this.dispose();
        
        // Create a fixed color sky that will definitely show up
        // This isn't pretty but will help us debug
        const blueColor = new THREE.Color(0x3a7bd5);
        
        // Create a sphere slightly bigger than the course
        const size = Math.max(
            this.options.courseSize.width, 
            this.options.courseSize.length
        ) * 1.5;
        
        // Super simple geometry with minimum segments
        const geometry = new THREE.SphereGeometry(size, 16, 12);
        
        // Make sure we're seeing the inside
        geometry.scale(-1, 1, -1);
        
        // Use a pure color material - no textures yet
        const material = new THREE.MeshBasicMaterial({
            color: blueColor,
            side: THREE.BackSide,
            transparent: false,
            fog: false,
            depthWrite: false,
            depthTest: false  // Disable depth testing
        });
        
        // Create mesh with the absolute minimum complexity
        const sky = new THREE.Mesh(geometry, material);
        sky.name = "MinimalSky";
        
        // Position at the origin
        sky.position.set(0, 0, 0);
        
        // Override any rendering settings
        sky.renderOrder = -9999;  // Render before anything else
        
        // Add to scene first before any other objects
        this.scene.children.unshift(sky);
        this.scene.add(sky);
        
        this.walls = [sky];
        
        console.log("Simple blue sky created, checking visibility:", sky.visible);
        console.log("Sky position:", sky.position);
        console.log("Sky in scene:", this.scene.children.includes(sky));
        
        // Try loading texture next
        this.tryLoadingTexture(sky);
    }
    
    tryLoadingTexture(skyMesh) {
        // Let's try loading the texture separately after confirming geometry works
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            this.options.textureUrl,
            (texture) => {
                console.log("Texture loaded, dimensions:", 
                            texture.image ? 
                            `${texture.image.width}x${texture.image.height}` : 
                            "unknown");
                
                // Apply the texture to our existing sky
                skyMesh.material.map = texture;
                skyMesh.material.color.set(0xFFFFFF); // Reset color to white to show texture
                skyMesh.material.needsUpdate = true;
                
                console.log("Texture applied to sky");
            },
            null,
            (error) => {
                console.error("Error loading texture:", error);
            }
        );
    }
    
    updateCourseSize(newSize) {
        if (!newSize || !newSize.width || !newSize.length) return;
        this.options.courseSize = newSize;
        this.createSky();
    }

    dispose() {
        if (this.walls && this.walls.length > 0) {
            this.walls.forEach(wall => {
                if (wall.geometry) wall.geometry.dispose();
                if (wall.material) {
                    if (wall.material.map) wall.material.map.dispose();
                    wall.material.dispose();
                }
                this.scene.remove(wall);
            });
            this.walls = [];
        }
    }

    setWallsVisible(visible) {
        if (this.walls && this.walls.length > 0) {
            this.walls.forEach(wall => {
                wall.visible = visible;
                console.log(`Sky visibility set to: ${visible}`);
            });
        }
    }

    applyVisualSettings(visualSettings) {
        console.log("Applying visual settings:", visualSettings);
        if (visualSettings.skyImageUrl) {
            this.options.textureUrl = visualSettings.skyImageUrl;
            this.createSky();
        }
    }

}