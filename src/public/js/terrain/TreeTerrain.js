class TreeTerrain extends CustomTerrain {
    static type = 'tree';
    
    constructor(scene, options = {}) {
        // Set the model URL to happy-tree.js
        options.properties = options.properties || {};
        options.properties.modelUrl = './models/js/happy-tree.js';
        options.properties.animated = true; // Enable animations for the happy trees
        
        // Pass the updated options to CustomTerrain constructor
        super(scene, options);
    }

    // This is the key method for collision detection with trees
    // TerrainManager will check the terrain constructor.type and process 'tree' types separately
    // So we need to ensure our CustomTerrain-based trees still handle collisions properly
    handleCollision(position) {
        // If we have a model instance, use its handleCollision method
        if (this.modelInstance && typeof this.modelInstance.handleCollision === 'function') {
            return this.modelInstance.handleCollision(position);
        }
        
        // If model isn't loaded yet or doesn't have collision handling,
        // implement simple collision detection based on the mesh's bounding box
        if (this.mesh) {
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            if (boundingBox.containsPoint(position)) {
                return { collided: true, point: position.clone() };
            }
        }
        
        return { collided: false, point: null };
    }
}

// Register the tree terrain type
Terrain.typeMap['tree'] = TreeTerrain;