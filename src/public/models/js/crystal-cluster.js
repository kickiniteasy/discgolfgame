// CrystalCluster.js
export default class CrystalCluster extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.crystalColor = options.visualProperties?.color || "#66ccff";
        this.rotationSpeed = options.properties?.rotationSpeed || 0.02;
    }

    async init() {
        this.createCrystals();
        if (this.options.position) {
            this.mesh.position.set(
                this.options.position.x || 0,
                this.options.position.y || 0,
                this.options.position.z || 0
            );
        }
        if (this.options.rotation) {
            this.mesh.rotation.set(
                this.options.rotation.x || 0,
                this.options.rotation.y || 0,
                this.options.rotation.z || 0
            );
        }
        if (this.options.scale) {
            this.mesh.scale.set(
                this.options.scale.x || 1,
                this.options.scale.y || 1,
                this.options.scale.z || 1
            );
        }
        this.scene.add(this.mesh);
        return true;
    }

    createCrystals() {
        const crystalCount = this.options.properties?.crystalCount || 7;
        for (let i = 0; i < crystalCount; i++) {
            const size = Math.random() * 0.5 + 0.3;
            const geometry = new THREE.ConeGeometry(size, size * 2, 4);
            const material = new THREE.MeshStandardMaterial({
                color: this.crystalColor,
                emissive: this.options.visualProperties?.emissive || "#3399ff",
                emissiveIntensity: this.options.visualProperties?.emissiveIntensity || 0.6,
                roughness: this.options.visualProperties?.roughness || 0.2,
                metalness: this.options.visualProperties?.metalness || 0.5,
                opacity: this.options.visualProperties?.opacity || 1.0,
                transparent: (this.options.visualProperties?.opacity || 1.0) < 1.0
            });
            const crystal = new THREE.Mesh(geometry, material);
            crystal.position.set(
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3
            );
            crystal.castShadow = true;
            crystal.receiveShadow = true;
            this.mesh.add(crystal);
            this.addPart(crystal);
        }
    }

    update(deltaTime) {
        if (this.options.properties?.animated === false) return;
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
    }
}
