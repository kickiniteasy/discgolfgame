class BushTerrain extends Terrain {
    static type = 'bush';
    
    async createMesh() {
        const geometry = new THREE.SphereGeometry(0.5, 8, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);

        const hitboxGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            visible: this.options.showHitboxes
        });

        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.hitboxMesh.position.y = -0.25;
        this.mesh.add(this.hitboxMesh);
        
        const randomScale = 0.3;
        this.mesh.scale.x *= 1 + (Math.random() * randomScale - randomScale/2);
        this.mesh.scale.y *= 0.8 + (Math.random() * 0.2);
        this.mesh.scale.z *= 1 + (Math.random() * randomScale - randomScale/2);
        return Promise.resolve();
    }
}

// Register the terrain type
Terrain.typeMap['bush'] = BushTerrain; 