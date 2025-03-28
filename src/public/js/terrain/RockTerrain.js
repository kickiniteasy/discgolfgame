class RockTerrain extends Terrain {
    static type = 'rock';
    
    async createMesh() {
        const geometry = new THREE.DodecahedronGeometry(0.5, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.95,
            metalness: 0.05
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.mesh.rotation.x = Math.random() * Math.PI;
        this.mesh.rotation.y = Math.random() * Math.PI;
        this.mesh.rotation.z = Math.random() * Math.PI;
        return Promise.resolve();
    }
}

// Register the terrain type
Terrain.typeMap['rock'] = RockTerrain; 