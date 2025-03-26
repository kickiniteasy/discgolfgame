class TerrainManager {
    constructor(scene) {
        this.scene = scene;
        this.terrainObjects = new Map(); // Using Map to store terrain by ID
        this.groundPlane = null;
        this.registerTerrainTypes();
    }

    // Register all terrain types
    registerTerrainTypes() {
        // Register portal terrain type if it exists
        if (typeof PortalTerrain !== 'undefined') {
            Terrain.typeMap['portal'] = PortalTerrain;
        }
    }

    // Create the base ground plane that covers the entire level
    createGroundPlane(courseSize) {
        // Default size if not specified
        const width = courseSize?.width || 300;
        const length = courseSize?.length || 400;

        const geometry = new THREE.PlaneGeometry(width, length);
        const material = new THREE.MeshStandardMaterial({
            color: 0x355E3B, // Dark green base
            roughness: 1.0,
            metalness: 0.0
        });

        this.groundPlane = new THREE.Mesh(geometry, material);
        this.groundPlane.rotation.x = -Math.PI / 2; // Lay flat
        this.groundPlane.receiveShadow = true;
        this.scene.add(this.groundPlane);
    }

    // Load terrain from course JSON data
    loadFromCourseData(courseData) {
        this.clearTerrain();
        
        // Create the base ground plane first
        this.createGroundPlane(courseData.courseSize);

        if (!courseData.terrain || !Array.isArray(courseData.terrain)) {
            console.warn('No terrain data found in course data');
            return;
        }

        // Sort terrain by type to ensure proper rendering order
        const sortedTerrain = [...courseData.terrain].sort((a, b) => {
            const order = {
                'elevation': 1,
                'water': 2,
                'fairway': 3,
                'path': 4,
                'rough': 5,
                'heavyRough': 6,
                'sand': 7,
                'rock': 8,
                'bush': 9,
                'tree': 10,
                'treeGroup': 11
            };
            return (order[a.type] || 99) - (order[b.type] || 99);
        });

        // Adjust the y-position of terrain to prevent z-fighting
        sortedTerrain.forEach((terrainData, index) => {
            // Small y-offset for each layer to prevent z-fighting
            if (!terrainData.position) terrainData.position = { x: 0, y: 0, z: 0 };
            terrainData.position.y += index * 0.01;
            this.createTerrainFromData(terrainData);
        });
    }

    // Create a single terrain object from JSON data
    createTerrainFromData(terrainData) {
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

        const terrain = new TerrainClass(this.scene, options);
        this.addTerrainObject(terrain);
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
            { type: 'tree', count: Math.floor(bounds.count * 0.3), baseScale: 1 },
            { type: 'rock', count: Math.floor(bounds.count * 0.2), baseScale: 0.5 },
            { type: 'bush', count: Math.floor(bounds.count * 0.2), baseScale: 0.7 },
            { type: 'treeGroup', count: Math.floor(bounds.count * 0.1), baseScale: 1.2 },
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
        // Remove all terrain objects
        this.terrainObjects.forEach(terrain => {
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
        for (const terrain of this.terrainObjects.values()) {
            if (!terrain.mesh) continue;

            // Skip ground-type terrain (fairway, rough, etc)
            if (['fairway', 'rough', 'heavyRough', 'path'].includes(terrain.constructor.type)) {
                continue;
            }

            // Handle different terrain types
            switch(terrain.constructor.type) {
                case 'tree':
                    // Only check collision with the trunk
                    if (terrain.mesh.children && terrain.mesh.children[0]) { // First child is trunk
                        const trunk = terrain.mesh.children[0];
                        const trunkBox = new THREE.Box3().setFromObject(trunk);
                        // Scale down trunk collision to be more forgiving
                        const trunkCenter = trunkBox.getCenter(new THREE.Vector3());
                        const trunkSize = trunkBox.getSize(new THREE.Vector3());
                        const scaledTrunkBox = new THREE.Box3(
                            new THREE.Vector3(
                                trunkCenter.x - trunkSize.x * 0.3,
                                trunkBox.min.y,
                                trunkCenter.z - trunkSize.z * 0.3
                            ),
                            new THREE.Vector3(
                                trunkCenter.x + trunkSize.x * 0.3,
                                trunkBox.max.y,
                                trunkCenter.z + trunkSize.z * 0.3
                            )
                        );
                        if (scaledTrunkBox.containsPoint(position)) {
                            return { collided: true, terrain: terrain, point: position.clone() };
                        }
                    }
                    break;

                case 'treeGroup':
                    // Check each tree's trunk individually
                    for (const treeGroup of terrain.mesh.children) {
                        if (treeGroup.children && treeGroup.children[0]) { // First child is trunk
                            const trunk = treeGroup.children[0];
                            const trunkBox = new THREE.Box3().setFromObject(trunk);
                            // Scale down trunk collision
                            const trunkCenter = trunkBox.getCenter(new THREE.Vector3());
                            const trunkSize = trunkBox.getSize(new THREE.Vector3());
                            const scaledTrunkBox = new THREE.Box3(
                                new THREE.Vector3(
                                    trunkCenter.x - trunkSize.x * 0.3,
                                    trunkBox.min.y,
                                    trunkCenter.z - trunkSize.z * 0.3
                                ),
                                new THREE.Vector3(
                                    trunkCenter.x + trunkSize.x * 0.3,
                                    trunkBox.max.y,
                                    trunkCenter.z + trunkSize.z * 0.3
                                )
                            );
                            if (scaledTrunkBox.containsPoint(position)) {
                                return { collided: true, terrain: terrain, point: position.clone() };
                            }
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
            }
        }

        return { collided: false };
    }

    setAllHitboxesVisibility(visible) {
        this.terrainObjects.forEach(terrain => {
            terrain.setHitboxVisibility(visible);
        });
    }
} 