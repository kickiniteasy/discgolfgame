class Teebox {
    constructor(scene, position) {
        this.scene = scene;
        
        // Create teebox platform
        const teeboxGeometry = new THREE.BoxGeometry(2, 0.2, 3); // 2m wide, 0.2m high, 3m long
        const teeboxMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080, // Gray color for concrete appearance
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.mesh = new THREE.Mesh(teeboxGeometry, teeboxMaterial);
        this.mesh.position.set(position.x, 0.1, position.z); // Slightly raised above ground
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        
        // Add teebox to scene
        this.scene.add(this.mesh);
    }
    
    getPosition() {
        return this.mesh.position.clone();
    }
    
    // Check if a position is within the teebox bounds
    isOnTeebox(position) {
        const bounds = {
            minX: this.mesh.position.x - 1, // Half width
            maxX: this.mesh.position.x + 1,
            minZ: this.mesh.position.z - 1.5, // Half length
            maxZ: this.mesh.position.z + 1.5
        };
        
        return position.x >= bounds.minX && 
               position.x <= bounds.maxX && 
               position.z >= bounds.minZ && 
               position.z <= bounds.maxZ;
    }
    
    remove() {
        this.scene.remove(this.mesh);
    }
} 