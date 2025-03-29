// DizzyDuck.js
export default class DizzyDuck extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.bodyColor = options.visualProperties?.bodyColor || "#ffff00";
        this.beakColor = options.visualProperties?.beakColor || "#ff9900";
        this.eyeColor = options.visualProperties?.eyeColor || "#000000";
        this.wingColor = options.visualProperties?.wingColor || "#ffdd00";
        this.flapSpeed = options.properties?.flapSpeed || 0.05;
        this.flapAngle = 0;
    }

    async init() {
        this.createBody();
        this.createHead();
        this.createBeak();
        this.createWings();
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
        const geometry = new THREE.SphereGeometry(0.8, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: this.options.visualProperties?.roughness || 0.5,
            metalness: this.options.visualProperties?.metalness || 0.3
        });
        const body = new THREE.Mesh(geometry, material);
        body.scale.set(1, 0.8, 1.2);
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        this.addPart(body);
    }

    createHead() {
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: this.options.visualProperties?.roughness || 0.5,
            metalness: this.options.visualProperties?.metalness || 0.3
        });
        const head = new THREE.Mesh(geometry, material);
        head.position.set(0, 0.6, 0.8);
        head.castShadow = true;
        head.receiveShadow = true;
        this.mesh.add(head);
        this.addPart(head);
        this.createEyes(head);
    }

    createEyes(head) {
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: this.eyeColor
        });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.1, 0.45);
        leftEye.castShadow = true;
        leftEye.receiveShadow = true;
        head.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 0.1, 0.45);
        rightEye.castShadow = true;
        rightEye.receiveShadow = true;
        head.add(rightEye);
    }

    createBeak() {
        const geometry = new THREE.ConeGeometry(0.15, 0.4, 8);
        const material = new THREE.MeshStandardMaterial({
            color: this.beakColor,
            roughness: this.options.visualProperties?.roughness || 0.4,
            metalness: this.options.visualProperties?.metalness || 0.2
        });
        const beak = new THREE.Mesh(geometry, material);
        beak.position.set(0, 0, 1.2);
        beak.rotation.x = Math.PI / 2;
        beak.castShadow = true;
        beak.receiveShadow = true;
        this.mesh.add(beak);
        this.addPart(beak);
    }

    createWings() {
        const geometry = new THREE.BoxGeometry(0.1, 0.4, 0.6);
        const material = new THREE.MeshStandardMaterial({
            color: this.wingColor,
            roughness: this.options.visualProperties?.roughness || 0.5,
            metalness: this.options.visualProperties?.metalness || 0.3
        });
        this.leftWing = new THREE.Mesh(geometry, material);
        this.leftWing.position.set(-0.8, 0.2, 0);
        this.leftWing.castShadow = true;
        this.leftWing.receiveShadow = true;
        this.mesh.add(this.leftWing);
        this.addPart(this.leftWing);
        this.rightWing = new THREE.Mesh(geometry, material);
        this.rightWing.position.set(0.8, 0.2, 0);
        this.rightWing.castShadow = true;
        this.rightWing.receiveShadow = true;
        this.mesh.add(this.rightWing);
        this.addPart(this.rightWing);
    }

    update(deltaTime) {
        if (this.options.properties?.animated === false) {    
            return;
        }
        this.flapAngle += this.flapSpeed * deltaTime;
        const flap = Math.sin(this.flapAngle) * 0.3;

        if (this.leftWing) {
            this.leftWing.rotation.y += flap;
        }
        if (this.rightWing) {
            this.rightWing.rotation.z -= flap;
        }
    }
}
