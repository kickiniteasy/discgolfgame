// NeonPyramid.js
export default class NeonPyramid extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.mainColor = options.visualProperties?.color || options.properties?.mainColor || "#00ffcc";
        this.emissiveColor = options.visualProperties?.emissive || "#00ffcc";
        this.rotationSpeed = options.properties?.rotationSpeed || 0.01;
    }

    async init() {
        this.createPyramid();
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

    createPyramid() {
        const geometry = new THREE.ConeGeometry(1, 1.5, 4);
        const material = new THREE.MeshStandardMaterial({
            color: this.mainColor,
            emissive: this.emissiveColor,
            emissiveIntensity: this.options.visualProperties?.emissiveIntensity || 0.8,
            roughness: this.options.visualProperties?.roughness || 0.3,
            metalness: this.options.visualProperties?.metalness || 0.5,
            opacity: this.options.visualProperties?.opacity || 1.0,
            transparent: (this.options.visualProperties?.opacity || 1.0) < 1.0
        });
        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        this.mesh.add(pyramid);
        this.addPart(pyramid);
    }

    update(deltaTime) {
        if (this.options.properties?.animated === false) return;
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
    }
}
