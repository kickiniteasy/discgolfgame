class TreeTerrain extends Terrain {
    static type = 'tree';
    
    async createMesh() {
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        const foliageGeometry = new THREE.ConeGeometry(1, 2, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 1.0
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2;
        
        this.mesh = new THREE.Group();
        this.mesh.add(trunk);
        this.mesh.add(foliage);

        this.hitboxMesh = new THREE.Group();
        
        const trunkHitboxGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
        const hitboxMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5,
            visible: this.options.showHitboxes
        });

        const trunkHitbox = new THREE.LineSegments(
            new THREE.EdgesGeometry(trunkHitboxGeometry),
            hitboxMaterial
        );
        trunkHitbox.name = 'trunkHitbox';

        const foliageHitboxGeometry = new THREE.ConeGeometry(1, 2, 8);
        const foliageHitbox = new THREE.LineSegments(
            new THREE.EdgesGeometry(foliageHitboxGeometry),
            hitboxMaterial
        );
        foliageHitbox.name = 'foliageHitbox';

        this.hitboxMesh.add(trunkHitbox);
        this.hitboxMesh.add(foliageHitbox);
        
        this.scene.add(this.hitboxMesh);

        return Promise.resolve();
    }

    updateHitboxes() {
        if (!this.hitboxMesh || !this.mesh) return;

        const worldPos = new THREE.Vector3();
        this.mesh.getWorldPosition(worldPos);
        
        const worldScale = new THREE.Vector3();
        this.mesh.getWorldScale(worldScale);

        const trunkHitbox = this.hitboxMesh.children.find(c => c.name === 'trunkHitbox');
        const foliageHitbox = this.hitboxMesh.children.find(c => c.name === 'foliageHitbox');
        
        if (trunkHitbox && foliageHitbox) {
            this.hitboxMesh.position.set(worldPos.x, 0, worldPos.z);
            
            const xzScale = Math.max(worldScale.x, worldScale.z);
            
            trunkHitbox.scale.set(xzScale, 1, xzScale);
            const trunkHeight = worldPos.y + (2 * worldScale.y);
            trunkHitbox.scale.y = trunkHeight;
            trunkHitbox.position.y = trunkHeight / 2;
            
            foliageHitbox.scale.set(xzScale, worldScale.y, xzScale);
            foliageHitbox.position.y = worldPos.y + (2 * worldScale.y);
        }
    }

    applyTransforms() {
        super.applyTransforms();
        this.updateHitboxes();
    }
}

// Register the terrain type
Terrain.typeMap['tree'] = TreeTerrain; 