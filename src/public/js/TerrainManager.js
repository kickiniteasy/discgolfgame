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
        
        // Log registration to verify
        console.log('Registered terrain types:', Object.keys(Terrain.typeMap));
    }

    // Create the base ground plane that covers the entire level
    createGroundPlane(courseSize) {
        // Default size if not specified
        const width = courseSize?.width || 300;
        const length = courseSize?.length || 400;

        // Load textures with error handling
        const grassTexture = this.textureLoader.load(
            'textures/grass/grass_diffuse.png', // Changed to .png and removed leading slash
            undefined,
            undefined,
            (error) => console.error('Error loading grass texture:', error)
        );
        const grassNormal = this.textureLoader.load(
            'textures/grass/grass_normal.png', // Changed to .png and removed leading slash
            undefined,
            undefined,
            (error) => console.error('Error loading normal map:', error)
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
        
        grassNormal.wrapS = grassNormal.wrapT = THREE.RepeatWrapping;
        grassNormal.repeat.set(repeatX, repeatY);
        grassNormal.anisotropy = 4;
        grassNormal.magFilter = THREE.LinearFilter;
        grassNormal.minFilter = THREE.LinearMipmapLinearFilter;

        const geometry = new THREE.PlaneGeometry(width, length, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: grassTexture,
            normalMap: grassNormal,
            normalScale: new THREE.Vector2(0.8, 0.8), // Reduced normal map effect
            color: 0x7ea04d, // Adjusted green tint
            roughness: 0.9,
            metalness: 0.0,
            envMapIntensity: 1.0 // Reset to default
        });

        this.groundPlane = new THREE.Mesh(geometry, material);
        this.groundPlane.rotation.x = -Math.PI / 2; // Lay flat
        this.groundPlane.receiveShadow = true;
        this.scene.add(this.groundPlane);
    }

    // Load terrain from course JSON data
    async loadFromCourseData(courseData) {
        // Log all portals before course loading
        console.log('Portals before course loading:', 
            Array.from(this.terrainObjects.values())
                .filter(t => t.constructor.type === 'portal')
                .map(p => ({
                    id: p.id,
                    isEntry: p.options.properties.isEntry,
                    position: p.options.position,
                    targetUrl: p.options.properties.targetUrl
                }))
        );

        // Preserve existing portals before clearing
        const existingPortals = Array.from(this.terrainObjects.values())
            .filter(t => t.constructor.type === 'portal')
            .map(p => ({
                type: 'portal',
                id: p.id,
                position: p.options.position,
                rotation: p.options.rotation,
                scale: p.options.scale,
                properties: p.options.properties,
                visualProperties: p.options.visualProperties,
                variant: p.options.variant,
                tags: p.options.tags
            }));

        // Clear non-portal terrain
        this.terrainObjects.forEach((terrain, id) => {
            if (terrain.constructor.type !== 'portal') {
                terrain.removeFromScene();
                this.terrainObjects.delete(id);
            }
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

        // Sort terrain by type to ensure proper rendering order
        const sortedTerrain = [...courseData.terrain].sort((a, b) => {
            const order = {
                'fairway': 2,
                'rough': 4,
                'water': 5,
                'sand': 7,
                'tree': 8,
                'bush': 9,
                'rock': 10,
                'path': 12,
                'custom': 15
            };
            return (order[a.type] || 99) - (order[b.type] || 99);
        });

        // Create all terrain objects
        for (const terrainData of sortedTerrain) {
            // Skip portal terrain if we already have a portal of the same type
            if (terrainData.type === 'portal') {
                const isEntry = terrainData.properties?.isEntry;
                const hasPortalOfType = existingPortals.some(p => 
                    p.properties?.isEntry === isEntry);
                if (hasPortalOfType) {
                    console.log('Skipping portal creation, already exists:', terrainData.id);
                    continue;
                }
            }

            // Small y-offset for each layer to prevent z-fighting
            if (!terrainData.position) terrainData.position = { x: 0, y: 0, z: 0 };
            terrainData.position.y += sortedTerrain.indexOf(terrainData) * 0.01;
            await this.createTerrainFromData(terrainData);
        }

        // Restore any existing portals that weren't in the course data
        for (const portalData of existingPortals) {
            const isEntry = portalData.properties?.isEntry;
            const hasPortalOfType = Array.from(this.terrainObjects.values())
                .some(t => t.constructor.type === 'portal' && 
                      t.options.properties?.isEntry === isEntry);
            if (!hasPortalOfType) {
                console.log('Restoring preserved portal:', portalData.id);
                await this.createTerrainFromData(portalData);
            }
        }
    }

    // Create a single terrain object from JSON data
    async createTerrainFromData(terrainData) {
        console.log('createTerrainFromData start, current portals:', 
            Array.from(this.terrainObjects.values())
                .filter(t => t.constructor.type === 'portal')
                .map(p => ({
                    id: p.id,
                    isEntry: p.options.properties.isEntry
                }))
        );

        const TerrainClass = Terrain.typeMap[terrainData.type];
        if (!TerrainClass) {
            console.warn(`Unknown terrain type: ${terrainData.type}`);
            return;
        }

        // Create position, rotation, and scale vectors
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
            showHitboxes: window.gameState?.showHitboxes || false
        };

        // Debug log for portal creation
        if (terrainData.type === 'portal') {
            console.log('Creating terrain from data:', {
                type: terrainData.type,
                id: terrainData.id,
                position,
                properties: terrainData.properties,
                visualProperties: terrainData.visualProperties
            });
        }

        const terrain = new TerrainClass(this.scene, options);
        // Wait for terrain to be fully initialized before adding to map
        const success = await terrain.init();
        console.log('Terrain init result:', {
            id: terrainData.id,
            type: terrainData.type,
            success: success,
            hasMesh: !!terrain.mesh
        });
        
        // Only add to map if initialization was successful
        if (terrain.mesh) {
            this.terrainObjects.set(terrain.id, terrain);
            console.log('Added terrain to map:', {
                id: terrain.id,
                type: terrain.constructor.type,
                currentPortals: Array.from(this.terrainObjects.values())
                    .filter(t => t.constructor.type === 'portal')
                    .map(p => ({
                        id: p.id,
                        isEntry: p.options.properties.isEntry
                    }))
            });

            // Debug log all portals after adding new terrain
            if (terrainData.type === 'portal') {
                console.log('Current portals in TerrainManager:', 
                    Array.from(this.terrainObjects.values())
                        .filter(t => t.constructor.type === 'portal')
                        .map(p => ({
                            id: p.id,
                            isEntry: p.options.properties.isEntry,
                            position: p.options.position,
                            targetUrl: p.options.properties.targetUrl
                        }))
                );
            }
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
        console.log('clearTerrain called, current portals:', 
            Array.from(this.terrainObjects.values())
                .filter(t => t.constructor.type === 'portal')
                .map(p => ({
                    id: p.id,
                    isEntry: p.options.properties.isEntry
                }))
        );
        // Remove all terrain objects
        this.terrainObjects.forEach(terrain => {
            if (terrain.constructor.type === 'portal') {
                console.log('Removing portal in clearTerrain:', terrain.id);
            }
            terrain.removeFromScene();
        });
        this.terrainObjects.clear();

        // Remove ground plane if it exists
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
        console.log('All portals during collision check:', allPortals);

        for (const terrain of this.terrainObjects.values()) {
            if (!terrain.mesh) {
                console.log('Terrain has no mesh:', terrain.id, terrain.constructor.type);
                continue;
            }

            // Skip ground-type terrain (fairway, rough, etc)
            if (['fairway', 'rough', 'path'].includes(terrain.constructor.type)) {
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
                    console.log('Checking portal collision:', {
                        portalId: terrain.id,
                        isEntry: terrain.options.properties.isEntry,
                        discPosition: position.clone(),
                        portalBox: {
                            min: portalBox.min.clone(),
                            max: portalBox.max.clone()
                        },
                        portalPosition: terrain.mesh.position.clone(),
                        hitboxPosition: terrain.hitboxMesh.position.clone()
                    });
                    
                    if (portalBox.containsPoint(position)) {
                        console.log('Portal collision detected!', {
                            portalId: terrain.id,
                            isEntry: terrain.options.properties.isEntry,
                            position: position.clone()
                        });
                        return { collided: true, terrain: terrain, point: position.clone(), isPortal: true };
                    }
                    break;

                case 'tree':
                    // Check collision with each part of the tree hitbox
                    if (terrain.hitboxMesh) {
                        let collided = false;
                        terrain.hitboxMesh.children.forEach(hitbox => {
                            const box = new THREE.Box3().setFromObject(hitbox);
                            // Add a small buffer to the hitbox
                            box.expandByScalar(0.1);
                            if (box.containsPoint(position)) {
                                collided = true;
                            }
                        });
                        if (collided) {
                            return { collided: true, terrain: terrain, point: position.clone() };
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

                case 'elevation':
                    // Elevations need full collision boxes
                    const elevBox = new THREE.Box3().setFromObject(terrain.mesh);
                    if (elevBox.containsPoint(position)) {
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
        console.log('addTerrain start, type:', type, 'current portals:', 
            Array.from(this.terrainObjects.values())
                .filter(t => t.constructor.type === 'portal')
                .map(p => ({
                    id: p.id,
                    isEntry: p.options.properties.isEntry
                }))
        );

        // Log existing portals before any changes
        const existingPortals = Array.from(this.terrainObjects.values())
            .filter(t => t.constructor.type === 'portal')
            .map(p => ({
                id: p.id,
                isEntry: p.options.properties.isEntry,
                position: p.options.position,
                targetUrl: p.options.properties.targetUrl
            }));
            
        console.log('Existing portals before adding new portal:', existingPortals);

        // If adding a portal, preserve existing portals of opposite type
        if (type === 'portal') {
            const isEntry = options.properties?.isEntry;
            
            // Store ALL existing portals before making any changes
            const preservedPortals = Array.from(this.terrainObjects.values())
                .filter(t => t.constructor.type === 'portal')
                .map(p => ({
                    type: 'portal',
                    id: p.id,
                    position: p.options.position,
                    rotation: p.options.rotation,
                    scale: p.options.scale,
                    properties: p.options.properties,
                    visualProperties: p.options.visualProperties,
                    variant: p.options.variant,
                    tags: p.options.tags
                }));

            console.log('Preserving portals:', preservedPortals);

            // Remove only portals of the same type
            this.terrainObjects.forEach((terrain, id) => {
                if (terrain.constructor.type === 'portal' && 
                    terrain.options.properties.isEntry === isEntry) {
                    console.log('Removing portal of same type:', terrain.id);
                    terrain.removeFromScene();
                    this.terrainObjects.delete(id);
                }
            });

            // Create the new portal
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
            
            console.log('Creating new portal:', terrainData);
            const newPortal = await this.createTerrainFromData(terrainData);

            // Wait for the new portal to be fully initialized and added
            if (newPortal && newPortal.mesh) {
                console.log('New portal created successfully:', newPortal.id);
            }

            // Restore preserved portals of opposite type
            for (const portalData of preservedPortals) {
                if (portalData.properties.isEntry !== isEntry) {
                    console.log('Restoring preserved portal:', portalData.id);
                    await this.createTerrainFromData(portalData);
                }
            }

            // Log final state
            console.log('Final portal state:', Array.from(this.terrainObjects.values())
                .filter(t => t.constructor.type === 'portal')
                .map(p => ({
                    id: p.id,
                    isEntry: p.options.properties.isEntry,
                    position: p.options.position
                })));

            return newPortal;
        } else {
            // For non-portal terrain, proceed as normal
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
    }
} 