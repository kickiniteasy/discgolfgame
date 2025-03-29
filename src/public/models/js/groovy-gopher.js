// GroovyGopher.js
export default class GroovyGopher extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.bodyColor = options.visualProperties?.bodyColor || "#964B00";
        this.headColor = options.visualProperties?.headColor || "#A0522D";
        this.eyeColor = options.visualProperties?.eyeColor || "#ffffff";
        this.bobSpeed = options.properties?.bobSpeed || 0.02;
        this.bobAmplitude = options.properties?.bobAmplitude || 0.1;
        this.bobTime = 0;
    }

    async init() {
        this.createBody();
        this.createHead();
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

    createBody() {
        const geometry = new THREE.CylinderGeometry(0.4, 0.5, 1, 12);
        const material = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: this.options.visualProperties?.roughness || 0.7,
            metalness: this.options.visualProperties?.metalness || 0.2
        });
        const body = new THREE.Mesh(geometry, material);
        body.position.y = 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        this.addPart(body);
    }

    createHead() {
        const geometry = new THREE.SphereGeometry(0.35, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.headColor,
            roughness: this.options.visualProperties?.roughness || 0.6,
            metalness: this.options.visualProperties?.metalness || 0.3
        });
        const head = new THREE.Mesh(geometry, material);
        head.position.set(0, 1, 0);
        head.castShadow = true;
        head.receiveShadow = true;
        this.mesh.add(head);
        this.addPart(head);
        this.createEyes(head);
        this.createEars(head);
    }

    createEyes(head) {
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: this.eyeColor
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.05, 0.3);
        leftEye.castShadow = true;
        leftEye.receiveShadow = true;
        head.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.05, 0.3);
        rightEye.castShadow = true;
        rightEye.receiveShadow = true;
        head.add(rightEye);
    }

    createEars(head) {
        const earGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const earMaterial = new THREE.MeshStandardMaterial({
            color: this.headColor,
            roughness: this.options.visualProperties?.roughness || 0.6,
            metalness: this.options.visualProperties?.metalness || 0.3
        });
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.2, 0.2, 0);
        leftEar.rotation.z = Math.PI / 8;
        leftEar.castShadow = true;
        leftEar.receiveShadow = true;
        head.add(leftEar);
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.2, 0.2, 0);
        rightEar.rotation.z = -Math.PI / 8;
        rightEar.castShadow = true;
        rightEar.receiveShadow = true;
        head.add(rightEar);
    }

    update(deltaTime) {
        if (this.options.properties?.animated === false) return;
        this.bobTime += this.bobSpeed * deltaTime;
        this.mesh.position.y += Math.sin(this.bobTime) * this.bobAmplitude;
    }
}
