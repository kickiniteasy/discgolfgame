// ChatGPT
export default class CosmicTree extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.trunkColor = options.visualProperties?.trunkColor || "#8B4513";
        this.leafColor = options.visualProperties?.leafColor || "#228B22";
        this.swaySpeed = options.properties?.swaySpeed || 0.005;
        this.swayAngle = 0;
    }

    async init() {
        this.createTrunk();
        this.createLeaves();
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

    createTrunk() {
        const geometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const material = new THREE.MeshStandardMaterial({
            color: this.trunkColor,
            roughness: this.options.visualProperties?.roughness || 0.8,
            metalness: this.options.visualProperties?.metalness || 0.2,
        });
        const trunk = new THREE.Mesh(geometry, material);
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.mesh.add(trunk);
        this.addPart(trunk);
    }

    createLeaves() {
        const leafCount = this.options.properties?.leafCount || 5;
        for (let i = 0; i < leafCount; i++) {
            const geometry = new THREE.SphereGeometry(0.5, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: this.leafColor,
                roughness: this.options.visualProperties?.roughness || 0.5,
                metalness: this.options.visualProperties?.metalness || 0.1,
            });
            const leaf = new THREE.Mesh(geometry, material);
            leaf.position.set(
                (Math.random() - 0.5) * 2,
                2 + Math.random(),
                (Math.random() - 0.5) * 2
            );
            leaf.castShadow = true;
            leaf.receiveShadow = true;
            this.mesh.add(leaf);
            this.addPart(leaf);
        }
    }

    update(deltaTime) {
        if (this.options.properties?.animated === false) return;
        this.swayAngle += this.swaySpeed * deltaTime;
        this.mesh.rotation.z = Math.sin(this.swayAngle) * 0.1;
    }
}
