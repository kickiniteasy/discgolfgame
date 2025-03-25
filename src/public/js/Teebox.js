class Teebox {
    /**
     * Creates a new teebox in the scene
     * @param {THREE.Scene} scene - The Three.js scene to add the teebox to
     * @param {Object} position - Position coordinates {x, z}
     * @param {Object} rotation - Rotation angles in degrees
     *                           y: Primary rotation that determines which direction teebox faces (0-360)
     *                           x, z: Should be 0 unless special case needed
     *                           Examples: 
     *                           - { x: 0, y: 0, z: 0 } = Faces positive Z (forward)
     *                           - { x: 0, y: 90, z: 0 } = Faces positive X (right)
     *                           - { x: 0, y: 180, z: 0 } = Faces negative Z (backward)
     *                           - { x: 0, y: 270, z: 0 } = Faces negative X (left)
     */
    constructor(scene, position, rotation = { x: 0, y: 0, z: 0 }) {
        this.scene = scene;
        
        // Create teebox platform
        const teeboxGeometry = new THREE.BoxGeometry(2, 0.2, 3); // 2m wide, 0.2m high, 3m long
        const teeboxMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080, // Gray color for concrete appearance
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.mesh = new THREE.Mesh(teeboxGeometry, teeboxMaterial);
        this.mesh.position.set(position.x, 0.1, position.z); // Fixed height above ground
        
        // Convert rotation from degrees to radians (THREE.js uses radians internally)
        this.mesh.rotation.set(
            rotation.x * Math.PI / 180,
            rotation.y * Math.PI / 180,
            rotation.z * Math.PI / 180
        );
        
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;

        // Mark this mesh as a physical obstacle
        this.mesh.userData.isObstacle = true;
        this.mesh.userData.type = 'teebox';
        
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
            maxZ: this.mesh.position.z + 1.5,
            y: this.mesh.position.y // Use actual teebox height
        };
        
        return position.x >= bounds.minX && 
               position.x <= bounds.maxX && 
               position.z >= bounds.minZ && 
               position.z <= bounds.maxZ &&
               Math.abs(position.y - bounds.y) < 0.5; // Check height is close to teebox
    }
    
    remove() {
        this.scene.remove(this.mesh);
    }
} 