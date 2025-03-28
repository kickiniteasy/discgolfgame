class TerrainManager {
    constructor(scene) {
        this.scene = scene;
        this.terrainObjects = new Map(); // Using Map to store terrain by ID
        this.groundPlane = null;
        this.textureLoader = new THREE.TextureLoader();
        this.registerTerrainTypes();
    }

    // Register all terrain types
    registerTerrainTypes() {
        // Register portal terrain type
        Terrain.typeMap['portal'] = PortalTerrain;
    }

    // Create the base ground plane that covers the entire level
    createGroundPlane(courseSize) {
        // Default size if not specified
        const width = courseSize?.width || 300;
        const length = courseSize?.length || 400;

        // Load textures with error handling
        const grassTexture = this.textureLoader.load(
            'textures/ground/tile.png',
            undefined,
            undefined,
            (error) => console.error('Error loading grass texture:', error)
        );

        // Try to load grayscale map for normal mapping
        const grassGrayscale = this.textureLoader.load(
            'textures/ground/grayscale.png',
            undefined,
            undefined,
            (error) => {
                // Just log as debug since grayscale map is optional
                console.debug('Could not load ground grayscale map:', error);
            }
        );
        
        // Configure texture repeat based on size
        const repeatX = width / 5; // More detailed grass (reduced from 10)
        const repeatY = length / 5;
        
        // Configure texture settings for better quality
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(repeatX, repeatY);
        grassTexture.anisotropy = 4; // Reduced from 16 to ensure compatibility
        grassTexture.magFilter = THREE.LinearFilter;
        grassTexture.minFilter = THREE.LinearMipmapLinearFilter;
        grassTexture.encoding = THREE.sRGBEncoding; // Proper color space
        
        if (grassGrayscale) {
            grassGrayscale.wrapS = grassGrayscale.wrapT = THREE.RepeatWrapping;
            grassGrayscale.repeat.set(repeatX, repeatY);
            grassGrayscale.anisotropy = 4;
            grassGrayscale.magFilter = THREE.LinearFilter;
            grassGrayscale.minFilter = THREE.LinearMipmapLinearFilter;
        }

        const geometry = new THREE.PlaneGeometry(width, length, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: grassTexture,
            normalMap: grassGrayscale || null,
            normalScale: new THREE.Vector2(0.8, 0.8), // Reduced normal map effect
            color: 0x7ea04d, // Adjusted green tint
            roughness: 0.9,
            metalness: 0.0,
            envMapIntensity: 1.0, // Reset to default
            depthWrite: true // Base ground plane should write to depth buffer
        });

        this.groundPlane = new THREE.Mesh(geometry, material);
        this.groundPlane.rotation.x = -Math.PI / 2; // Lay flat
        this.groundPlane.receiveShadow = true;
        this.groundPlane.renderOrder = -1; // Ensure ground plane renders first
        this.scene.add(this.groundPlane);
    }

    // Load terrain from course JSON data
    async loadFromCourseData(courseData) {
        // Clear ALL terrain including portals
        this.terrainObjects.forEach((terrain, id) => {
            terrain.removeFromScene();
            this.terrainObjects.delete(id);
        });

        // Remove ground plane if it exists
        if (this.groundPlane) {
            this.scene.remove(this.groundPlane);
            if (this.groundPlane.geometry) this.groundPlane.geometry.dispose();
            if (this.groundPlane.material) this.groundPlane.material.dispose();
            this.groundPlane = null;
        }
        
        // Create the base ground plane first
        this.createGroundPlane(courseData.courseSize);

        if (!courseData.terrain || !Array.isArray(courseData.terrain)) {
            console.warn('No terrain data found in course data');
            return;
        }

        // Create all terrain objects in the order they appear in the JSON
        for (const terrainData of courseData.terrain) {
            // Add position if not present
            if (!terrainData.position) terrainData.position = { x: 0, y: 0, z: 0 };
            
            // Create the terrain object
            const terrain = await this.createTerrainFromData(terrainData);
            
            // Configure ground-type terrain for proper layering
            if (terrain?.mesh?.material) {
                const material = terrain.mesh.material;
                if (['fairway', 'rough', 'path', 'water', 'sand'].includes(terrainData.type)) {
                    // Set render order based on type - using negative values to render before other objects
                    switch (terrainData.type) {
                        case 'water':
                            terrain.mesh.renderOrder = -5;
                            material.transparent = true;
                            material.opacity = material.opacity || 0.8;
                            material.depthWrite = true;
                            material.polygonOffset = true;
                            material.polygonOffsetFactor = -1;
                            break;
                        case 'sand':
                            terrain.mesh.renderOrder = -4;
                            material.transparent = true;
                            material.depthWrite = true;
                            material.polygonOffset = true;
                            material.polygonOffsetFactor = -2;
                            break;
                        case 'rough':
                            terrain.mesh.renderOrder = -3;
                            material.transparent = true;
                            material.depthWrite = true;
                            material.polygonOffset = true;
                            material.polygonOffsetFactor = -3;
                            break;
                        case 'fairway':
                            terrain.mesh.renderOrder = -2;
                            material.transparent = true;
                            material.depthWrite = true;
                            material.polygonOffset = true;
                            material.polygonOffsetFactor = -4;
                            break;
                        case 'path':
                            terrain.mesh.renderOrder = -1;
                            material.transparent = true;
                            material.depthWrite = true;
                            material.polygonOffset = true;
                            material.polygonOffsetFactor = -5;
                            break;
                    }
                }
            }
        }

        // Set the base ground plane to render first
        if (this.groundPlane) {
            this.groundPlane.renderOrder = -10; // Render before all other terrain
            if (this.groundPlane.material) {
                this.groundPlane.material.transparent = true;
                this.groundPlane.material.side = THREE.FrontSide;
                this.groundPlane.material.depthWrite = true;
                this.groundPlane.material.alphaTest = 0.1;
            }
        }
    }

    // Create a single terrain object from JSON data
    async createTerrainFromData(terrainData) {
        const TerrainClass = Terrain.typeMap[terrainData.type];
        if (!TerrainClass) {
            console.warn(`Unknown terrain type: ${terrainData.type}`);
            return;
        }

        const position = new THREE.Vector3(
            terrainData.position?.x || 0,
            terrainData.position?.y || 0,
            terrainData.position?.z || 0
        );

        const rotation = new THREE.Vector3(
            terrainData.rotation?.x || 0,
            terrainData.rotation?.y || 0,
            terrainData.rotation?.z || 0
        );

        const scale = new THREE.Vector3(
            terrainData.scale?.x || 1,
            terrainData.scale?.y || 1,
            terrainData.scale?.z || 1
        );

        const options = {
            id: terrainData.id,
            position: position,
            rotation: rotation,
            scale: scale,
            visualProperties: terrainData.visualProperties || {},
            variant: terrainData.variant || 'default',
            tags: terrainData.tags || [],
            properties: terrainData.properties || {},
            customProperties: terrainData.customProperties || {},
            showHitboxes: window.gameState?.showHitboxes || false,
            shape: terrainData.shape,
            textureSettings: terrainData.textureSettings
        };

        const terrain = new TerrainClass(this.scene, options);
        const success = await terrain.init();
        
        if (terrain.mesh) {
            this.terrainObjects.set(terrain.id, terrain);
        } else {
            console.warn(`Failed to initialize terrain: ${terrainData.id} (${terrainData.type})`);
        }

        return terrain;
    }

    // Generate random terrain (keeping for backwards compatibility and testing)
    generateRandomTerrain(bounds = {
        minX: -200,
        maxX: 200,
        minZ: -200,
        maxZ: 200,
        count: 50
    }) {
        this.clearTerrain();

        // Helper function to get random position
        const getRandomPosition = () => ({
            x: Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
            y: 0,
            z: Math.random() * (bounds.maxZ - bounds.minZ) + bounds.minZ
        });

        // Helper function to get random scale
        const getRandomScale = (baseScale = 1, variation = 0.5) => ({
            x: baseScale + Math.random() * variation,
            y: baseScale + Math.random() * variation,
            z: baseScale + Math.random() * variation
        });

        // Generate terrain objects with proper scaling
        const terrainDistribution = [
            { type: 'tree', count: Math.floor(bounds.count * 0.15), baseScale: 1.0 },
            { type: 'bush', count: Math.floor(bounds.count * 0.2), baseScale: 0.8 },
            { type: 'rock', count: Math.floor(bounds.count * 0.2), baseScale: 0.5 },
            { type: 'elevation', count: Math.floor(bounds.count * 0.2), baseScale: 2 }
        ];

        terrainDistribution.forEach(({ type, count, baseScale }) => {
            for (let i = 0; i < count; i++) {
                const terrainData = {
                    id: crypto.randomUUID(),
                    type: type,
                    position: getRandomPosition(),
                    rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
                    scale: getRandomScale(baseScale),
                    properties: type === 'elevation' ? { height: 1 + Math.random() * 3 } : {},
                    visualProperties: {
                        roughness: 0.8 + Math.random() * 0.2,
                        metalness: 0.1,
                        opacity: 1.0
                    },
                    variant: 'default',
                    tags: [type]
                };

                this.createTerrainFromData(terrainData);
            }
        });
    }

    addTerrainObject(terrainObject) {
        terrainObject.addToScene();
        this.terrainObjects.set(terrainObject.id, terrainObject);
    }

    removeTerrainObject(terrainObject) {
        if (this.terrainObjects.has(terrainObject.id)) {
            terrainObject.removeFromScene();
            this.terrainObjects.delete(terrainObject.id);
        }
    }

    clearTerrain() {
        // First remove and cleanup all terrain objects
        this.terrainObjects.forEach(terrain => {
            // Remove from scene and dispose resources
            terrain.removeFromScene();
        });
        // Clear the terrain objects map
        this.terrainObjects.clear();

        // Clean up ground plane
        if (this.groundPlane) {
            this.scene.remove(this.groundPlane);
            if (this.groundPlane.geometry) this.groundPlane.geometry.dispose();
            if (this.groundPlane.material) this.groundPlane.material.dispose();
            this.groundPlane = null;
        }
    }

    // Convert current terrain to JSON format
    toJSON() {
        return Array.from(this.terrainObjects.values()).map(terrain => terrain.toJSON());
    }

    // Save course terrain to file
    async saveTerrain(filename) {
        const terrainData = this.toJSON();
        try {
            const response = await fetch(`/api/courses/${filename}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(terrainData)
            });
            if (!response.ok) throw new Error('Failed to save terrain data');
            return true;
        } catch (error) {
            console.error('Error saving terrain:', error);
            return false;
        }
    }

    // Load course terrain from file
    async loadTerrain(filename) {
        try {
            const response = await fetch(`/api/courses/${filename}`);
            if (!response.ok) throw new Error('Failed to load terrain data');
            const terrainData = await response.json();
            this.loadFromCourseData({ terrain: terrainData });
            return true;
        } catch (error) {
            console.error('Error loading terrain:', error);
            return false;
        }
    }

    update(deltaTime) {
        this.terrainObjects.forEach(terrain => {
            terrain.update(deltaTime);
        });
    }

    // Check for collisions between a point and terrain objects
    checkCollision(position) {
        // Debug log all portals at start of collision check
        const allPortals = Array.from(this.terrainObjects.values())
            .filter(t => t.constructor.type === 'portal')
            .map(p => ({
                id: p.id,
                isEntry: p.options.properties.isEntry,
                position: p.options.position,
                targetUrl: p.options.properties.targetUrl,
                hasHitbox: !!p.hitboxMesh,
                hasMesh: !!p.mesh,
                isVisible: p.mesh?.visible,
                isAnimating: !!p.update
            }));

        for (const terrain of this.terrainObjects.values()) {
            if (!terrain.mesh) {
                console.log('Terrain has no mesh:', terrain.id, terrain.constructor.type);
                continue;
            }

            // Skip ground-type terrain (fairway, rough, etc)
            if (['fairway', 'rough', 'path', 'water', 'sand'].includes(terrain.constructor.type)) {
                continue;
            }

            // Handle different terrain types
            switch(terrain.constructor.type) {
                case 'portal':
                    // Use standard hitbox collision for portals
                    if (!terrain.hitboxMesh) {
                        console.warn('Portal has no hitbox mesh:', terrain.id);
                        continue;
                    }
                    const portalBox = new THREE.Box3().setFromObject(terrain.hitboxMesh);
                    portalBox.expandByScalar(0.5); // Make hitbox slightly larger for better collision detection
                    
                    // Debug logging for portal collision checks
                    if (portalBox.containsPoint(position)) {
                        return { collided: true, terrain: terrain, point: position.clone(), isPortal: true };
                    }
                    break;

                case 'tree':
                    // Check collision with trunk (cylinder) and foliage (cone) separately
                    if (terrain.hitboxMesh) {
                        const trunkHitbox = terrain.hitboxMesh.children.find(c => c.name === 'trunkHitbox');
                        const foliageHitbox = terrain.hitboxMesh.children.find(c => c.name === 'foliageHitbox');
                        
                        if (trunkHitbox && foliageHitbox) {
                            // Get world matrices for transformations
                            trunkHitbox.updateMatrixWorld();
                            foliageHitbox.updateMatrixWorld();
                            
                            // Create inverse matrices to transform point to local space
                            const trunkInverseMatrix = new THREE.Matrix4().copy(trunkHitbox.matrixWorld).invert();
                            const foliageInverseMatrix = new THREE.Matrix4().copy(foliageHitbox.matrixWorld).invert();
                            
                            // Transform point to local space of each hitbox
                            const trunkLocalPoint = position.clone().applyMatrix4(trunkInverseMatrix);
                            const foliageLocalPoint = position.clone().applyMatrix4(foliageInverseMatrix);
                            
                            // Check trunk collision (cylinder)
                            // In local space, cylinder is centered at origin, aligned with Y axis
                            const trunkRadialDist = Math.sqrt(trunkLocalPoint.x * trunkLocalPoint.x + trunkLocalPoint.z * trunkLocalPoint.z);
                            if (trunkRadialDist <= 0.3 && // 0.3 is max radius of trunk (bottom)
                                trunkLocalPoint.y >= -1 && // Cylinder is centered, so height goes from -1 to 1
                                trunkLocalPoint.y <= 1) {
                                return { collided: true, terrain: terrain, point: position.clone() };
                            }
                            
                            // Check foliage collision (cone)
                            // In local space, cone base is at origin, pointing up
                            const foliageRadialDist = Math.sqrt(foliageLocalPoint.x * foliageLocalPoint.x + foliageLocalPoint.z * foliageLocalPoint.z);
                            // Cone radius varies linearly from 1 at base (y=0) to 0 at top (y=2)
                            const foliageMaxRadius = Math.max(0, 1 - (foliageLocalPoint.y / 2));
                            if (foliageRadialDist <= foliageMaxRadius && 
                                foliageLocalPoint.y >= 0 && 
                                foliageLocalPoint.y <= 2) {
                                return { collided: true, terrain: terrain, point: position.clone() };
                            }
                        }
                    }
                    break;

                case 'bush':
                    // Bushes should have very minimal collision unless disc is very low
                    if (position.y < 0.3) { // Only check if disc is very low
                        const bushBox = new THREE.Box3().setFromObject(terrain.mesh);
                        const bushCenter = bushBox.getCenter(new THREE.Vector3());
                        const bushSize = bushBox.getSize(new THREE.Vector3());
                        const scaledBushBox = new THREE.Box3(
                            new THREE.Vector3(
                                bushCenter.x - bushSize.x * 0.4,
                                bushBox.min.y,
                                bushCenter.z - bushSize.z * 0.4
                            ),
                            new THREE.Vector3(
                                bushCenter.x + bushSize.x * 0.4,
                                bushBox.max.y,
                                bushCenter.z + bushSize.z * 0.4
                            )
                        );
                        if (scaledBushBox.containsPoint(position)) {
                            return { collided: true, terrain: terrain, point: position.clone() };
                        }
                    }
                    break;

                case 'rock':
                    // Rocks are solid but use a slightly reduced collision box
                    const rockBox = new THREE.Box3().setFromObject(terrain.mesh);
                    const rockCenter = rockBox.getCenter(new THREE.Vector3());
                    const rockSize = rockBox.getSize(new THREE.Vector3());
                    const scaledRockBox = new THREE.Box3(
                        new THREE.Vector3(
                            rockCenter.x - rockSize.x * 0.7,
                            rockBox.min.y,
                            rockCenter.z - rockSize.z * 0.7
                        ),
                        new THREE.Vector3(
                            rockCenter.x + rockSize.x * 0.7,
                            rockBox.max.y,
                            rockCenter.z + rockSize.z * 0.7
                        )
                    );
                    if (scaledRockBox.containsPoint(position)) {
                        return { collided: true, terrain: terrain, point: position.clone() };
                    }
                    break;
            }
        }

        return { collided: false };
    }

    setAllHitboxesVisibility(visible) {
        this.terrainObjects.forEach(terrain => {
            // Only show hitboxes for obstacles and solid terrain
            const showableTypes = ['tree', 'rock', 'bush', 'elevation', 'custom', 'portal'];
            if (showableTypes.includes(terrain.constructor.type)) {
                terrain.setHitboxVisibility(visible);
            } else {
                terrain.setHitboxVisibility(false);
            }
        });
    }

    updateTreePhysics(terrain, dt) {
        // Implementation of updateTreePhysics method
    }

    // Helper method to create and add terrain directly
    async addTerrain(type, options) {

        // If adding a portal, preserve existing portals of opposite type
        const terrainData = {
            id: crypto.randomUUID(),
            type: type,
            position: options.position,
            rotation: options.rotation,
            scale: options.scale,
            properties: options.properties || {},
            visualProperties: options.visualProperties || {},
            variant: options.variant || 'default',
            tags: options.tags || []
        };
            
        return await this.createTerrainFromData(terrainData);
    }

    setGrassTexturesEnabled(enabled) {
        // Update ground plane
        if (this.groundPlane && this.groundPlane.material) {
            if (!enabled) {
                // Store original textures
                this._originalGroundTextures = {
                    map: this.groundPlane.material.map,
                    normalMap: this.groundPlane.material.normalMap
                };
                // Remove textures
                this.groundPlane.material.map = null;
                this.groundPlane.material.normalMap = null;
            } else if (this._originalGroundTextures) {
                // Restore original textures
                this.groundPlane.material.map = this._originalGroundTextures.map;
                this.groundPlane.material.normalMap = this._originalGroundTextures.normalMap;
            }
            this.groundPlane.material.needsUpdate = true;
        }

        // Update all terrain objects that use grass textures
        this.terrainObjects.forEach(terrain => {
            if (terrain instanceof FairwayTerrain) {
                const material = terrain.mesh?.material;
                if (material) {
                    if (!enabled) {
                        // Store original textures
                        terrain._originalTextures = {
                            map: material.map,
                            normalMap: material.normalMap
                        };
                        // Remove textures
                        material.map = null;
                        material.normalMap = null;
                    } else if (terrain._originalTextures) {
                        // Restore original textures
                        material.map = terrain._originalTextures.map;
                        material.normalMap = terrain._originalTextures.normalMap;
                    }
                    material.needsUpdate = true;
                }
            }
        });
    }
} 