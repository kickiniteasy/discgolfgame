class Terrain {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            position: options.position || new THREE.Vector3(0, 0, 0),
            size: options.size || { width: 1, height: 1, depth: 1 },
            color: options.color || 0x2e6215,
            roughness: options.roughness || 0.9,
            metalness: options.metalness || 0.1
        };
        
        this.mesh = null;
        this.createMesh();
    }

    createMesh() {
        // Override in child classes
        console.warn('createMesh() should be implemented by child classes');
    }

    addToScene() {
        if (this.mesh) {
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.scene.add(this.mesh);
        }
    }

    removeFromScene() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }

    update(deltaTime) {
        // Override in child classes if needed
    }
}

// Example terrain type: Hill
class HillTerrain extends Terrain {
    createMesh() {
        const { width, height, depth } = this.options.size;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: this.options.color,
            roughness: this.options.roughness,
            metalness: this.options.metalness
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.options.position);
        this.mesh.position.y += height / 2; // Adjust Y to sit on ground
    }
}

// Example terrain type: Rock
class RockTerrain extends Terrain {
    createMesh() {
        // Create a more irregular shape for rocks using multiple merged geometries
        const geometry = new THREE.SphereGeometry(this.options.size.width / 2, 8, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080, // Gray color for rocks
            roughness: 0.95,
            metalness: 0.05
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.options.position);
        
        // Add some random rotation for variety
        this.mesh.rotation.x = Math.random() * Math.PI;
        this.mesh.rotation.y = Math.random() * Math.PI;
        this.mesh.rotation.z = Math.random() * Math.PI;
    }
}

// Example terrain type: Bush
class BushTerrain extends Terrain {
    createMesh() {
        const geometry = new THREE.SphereGeometry(this.options.size.width / 2, 8, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2d5a27, // Darker green for bushes
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.options.position);
        
        // Scale slightly differently in each axis for natural look
        this.mesh.scale.x *= 1 + (Math.random() * 0.3 - 0.15);
        this.mesh.scale.y *= 0.8 + (Math.random() * 0.2);
        this.mesh.scale.z *= 1 + (Math.random() * 0.3 - 0.15);
    }
} 