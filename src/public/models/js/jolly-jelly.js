// JollyJelly.js
export default class JollyJelly extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.jellyColor = options.visualProperties?.color || "#ff66cc";
        this.pulseSpeed = options.properties?.pulseSpeed || 0.005;
        this.pulseAmplitude = options.properties?.pulseAmplitude || 0.2;
        this.baseScale = 1;
        this.pulseTime = 0;
    }

    async init() {
        this.createJelly();
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
                this.options.scale.x || this.baseScale,
                this.options.scale.y || this.baseScale,
                this.options.scale.z || this.baseScale
            );
        } else {
            this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
        }
        this.scene.add(this.mesh);
        return true;
    }

    createJelly() {
        const geometry = new THREE.SphereGeometry(0.7, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: this.jellyColor,
            transparent: true,
            opacity: this.options.visualProperties?.opacity || 0.7,
            roughness: this.options.visualProperties?.roughness || 0.3,
            metalness: this.options.visualProperties?.metalness || 0.1
        });
        const jelly = new THREE.Mesh(geometry, material);
        jelly.castShadow = true;
        jelly.receiveShadow = true;
        this.mesh.add(jelly);
        this.addPart(jelly);
    }

    update(deltaTime) {
        if (this.options.properties?.animated === false) return;
        this.pulseTime += this.pulseSpeed * deltaTime;
        const scaleOffset = 1 + Math.sin(this.pulseTime) * this.pulseAmplitude;
        this.mesh.scale.set(scaleOffset, scaleOffset, scaleOffset);
    }
}
