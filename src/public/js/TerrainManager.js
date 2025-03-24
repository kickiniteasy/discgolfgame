class TerrainManager {
    constructor(scene) {
        this.scene = scene;
        this.terrainObjects = [];
    }

    generateRandomTerrain(bounds = {
        minX: -200,
        maxX: 200,
        minZ: -200,
        maxZ: 200,
        count: 50
    }) {
        // Clear existing terrain
        this.clearTerrain();

        // Generate hills
        for (let i = 0; i < bounds.count * 0.6; i++) {
            const size = {
                width: Math.random() * 5 + 1,
                height: Math.random() * 2 + 0.2,
                depth: Math.random() * 5 + 1
            };
            
            const position = new THREE.Vector3(
                Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
                0,
                Math.random() * (bounds.maxZ - bounds.minZ) + bounds.minZ
            );

            const hill = new HillTerrain(this.scene, {
                position,
                size,
                color: 0x2e6215
            });
            
            hill.addToScene();
            this.terrainObjects.push(hill);
        }

        // Generate rocks
        for (let i = 0; i < bounds.count * 0.2; i++) {
            const size = {
                width: Math.random() * 2 + 0.5,
                height: Math.random() * 2 + 0.5,
                depth: Math.random() * 2 + 0.5
            };
            
            const position = new THREE.Vector3(
                Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
                0,
                Math.random() * (bounds.maxZ - bounds.minZ) + bounds.minZ
            );

            const rock = new RockTerrain(this.scene, {
                position,
                size
            });
            
            rock.addToScene();
            this.terrainObjects.push(rock);
        }

        // Generate bushes
        for (let i = 0; i < bounds.count * 0.2; i++) {
            const size = {
                width: Math.random() * 1.5 + 0.5,
                height: Math.random() * 1.5 + 0.5,
                depth: Math.random() * 1.5 + 0.5
            };
            
            const position = new THREE.Vector3(
                Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
                0,
                Math.random() * (bounds.maxZ - bounds.minZ) + bounds.minZ
            );

            const bush = new BushTerrain(this.scene, {
                position,
                size
            });
            
            bush.addToScene();
            this.terrainObjects.push(bush);
        }
    }

    addTerrainObject(terrainObject) {
        terrainObject.addToScene();
        this.terrainObjects.push(terrainObject);
    }

    removeTerrainObject(terrainObject) {
        const index = this.terrainObjects.indexOf(terrainObject);
        if (index !== -1) {
            terrainObject.removeFromScene();
            this.terrainObjects.splice(index, 1);
        }
    }

    clearTerrain() {
        this.terrainObjects.forEach(terrain => {
            terrain.removeFromScene();
        });
        this.terrainObjects = [];
    }

    update(deltaTime) {
        this.terrainObjects.forEach(terrain => {
            terrain.update(deltaTime);
        });
    }
} 