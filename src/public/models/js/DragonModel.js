/*
 * Dragon Model for Three.js
 * Extracted from original Dragon Flight game
 * 
 * To be loaded by CustomTerrain class as a JS model
 */

export default class DragonModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Animation parameters
        this.wingFlapSpeed = 0.1;
        this.wingFlapDirection = 1;
        this.wingFlapAmount = 0;
        this.tailSwingAmount = 0;
        this.tailSwingSpeed = 0.05;
        this.breathingAmount = 0;
        this.breathingSpeed = 0.02;
        
        // Store dragon parts for animation
        this.dragonParts = {};
        
        // Get color from visualProperties or fall back to custom property or default
        // Handle hex string colors (visualProperties.color will be a string like "#ff0000")
        this.dragonColor = options.visualProperties?.color || 
                          options.properties?.color || 
                          "#8b0000"; // Dark red
    }

    async init() {
        // Create dragon
        this.createDragonBody();
        this.createDragonNeck();
        this.createDragonHead();
        this.createDragonEyes();
        this.createDragonWings();
        this.createDragonTail();
        this.createDragonLegs();
        
        // Apply scale from options if provided
        if (this.options.scale) {
            this.mesh.scale.set(
                this.options.scale.x || 1,
                this.options.scale.y || 1,
                this.options.scale.z || 1
            );
        }
        
        return true;
    }
    
    createDragonBody() {
        // Create all materials first
        const dragonBodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.dragonColor,
            roughness: this.options.visualProperties?.roughness || 0.7,
            metalness: this.options.visualProperties?.metalness || 0.3
        });
        
        // Create body using cylinder and spheres
        const bodyGroup = new THREE.Group();
        
        // Cylinder for body
        const bodyCylinderGeo = new THREE.CylinderGeometry(2, 2, 6, 8);
        const bodyCylinder = new THREE.Mesh(bodyCylinderGeo, dragonBodyMaterial);
        bodyCylinder.castShadow = true;
        bodyGroup.add(bodyCylinder);
        
        // Spheres for rounded ends
        const bodySphereGeo = new THREE.SphereGeometry(2, 8, 8);
        
        const topBodySphere = new THREE.Mesh(bodySphereGeo, dragonBodyMaterial);
        topBodySphere.position.y = 3;
        topBodySphere.castShadow = true;
        bodyGroup.add(topBodySphere);
        
        const bottomBodySphere = new THREE.Mesh(bodySphereGeo, dragonBodyMaterial);
        bottomBodySphere.position.y = -3;
        bottomBodySphere.castShadow = true;
        bodyGroup.add(bottomBodySphere);
        
        this.dragonParts.body = bodyGroup;
        this.mesh.add(bodyGroup);
    }
    
    createDragonNeck() {
        const neckMaterial = new THREE.MeshStandardMaterial({ 
            color: this.dragonColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create neck using cylinder and spheres
        const neckGroup = new THREE.Group();
        
        // Cylinder for neck
        const neckCylinderGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 8);
        const neckCylinder = new THREE.Mesh(neckCylinderGeo, neckMaterial);
        neckCylinder.castShadow = true;
        neckGroup.add(neckCylinder);
        
        // Spheres for rounded ends
        const neckSphereGeo = new THREE.SphereGeometry(1.2, 8, 8);
        
        const topNeckSphere = new THREE.Mesh(neckSphereGeo, neckMaterial);
        topNeckSphere.position.y = 1.5;
        topNeckSphere.castShadow = true;
        neckGroup.add(topNeckSphere);
        
        const bottomNeckSphere = new THREE.Mesh(neckSphereGeo, neckMaterial);
        bottomNeckSphere.position.y = -1.5;
        bottomNeckSphere.castShadow = true;
        neckGroup.add(bottomNeckSphere);
        
        this.dragonParts.neck = neckGroup;
        neckGroup.position.set(0, 0, -4);
        neckGroup.rotation.x = -Math.PI / 6;
        this.mesh.add(neckGroup);
    }
    
    createDragonHead() {
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.dragonColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create dragon head
        const headGeometry = new THREE.ConeGeometry(1.5, 4, 8);
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0, -6.5);
        head.rotation.x = -Math.PI / 4;
        head.castShadow = true;
        
        this.dragonParts.head = head;
        this.mesh.add(head);
    }
    
    createDragonEyes() {
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        
        // Create dragon eyes
        const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.7, 0.5, -6.5);
        this.dragonParts.leftEye = leftEye;
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.7, 0.5, -6.5);
        this.dragonParts.rightEye = rightEye;
        this.mesh.add(rightEye);
    }
    
    createDragonWings() {
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: this.dragonColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            roughness: 0.5,
            metalness: 0.1
        });
        
        // Create wing shape
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(0, 8);
        wingShape.lineTo(12, 4);
        wingShape.lineTo(8, 2);
        wingShape.lineTo(12, 0);
        wingShape.lineTo(0, 0);

        const wingGeometry = new THREE.ShapeGeometry(wingShape);

        // Create left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(2, 0, -1);
        leftWing.rotation.y = Math.PI / 2;
        leftWing.rotation.z = Math.PI / 6;
        leftWing.castShadow = true;
        this.dragonParts.leftWing = leftWing;
        this.mesh.add(leftWing);

        // Create right wing (mirror of left wing)
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-2, 0, -1);
        rightWing.rotation.y = -Math.PI / 2;
        rightWing.rotation.z = -Math.PI / 6;
        rightWing.castShadow = true;
        this.dragonParts.rightWing = rightWing;
        this.mesh.add(rightWing);
    }
    
    createDragonTail() {
        const tailMaterial = new THREE.MeshStandardMaterial({ 
            color: this.dragonColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const tailTipMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.5,
            metalness: 0.5
        });
        
        // Create dragon tail
        const tailGeometry = new THREE.CylinderGeometry(1, 0.2, 10, 8);
        tailGeometry.translate(0, -5, 0);
        tailGeometry.rotateX(Math.PI / 2);

        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0, 6);
        tail.castShadow = true;
        this.dragonParts.tail = tail;
        this.mesh.add(tail);

        // Create tail tip (spike)
        const tailTipGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const tailTip = new THREE.Mesh(tailTipGeometry, tailTipMaterial);
        tailTip.position.set(0, 0, 11);
        tailTip.rotation.x = Math.PI / 2;
        tailTip.castShadow = true;
        this.dragonParts.tailTip = tailTip;
        this.mesh.add(tailTip);
    }
    
    createDragonLegs() {
        const legMaterial = new THREE.MeshStandardMaterial({
            color: this.dragonColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const legGeometry = new THREE.CylinderGeometry(0.5, 0.3, 3, 8);

        // Front legs
        const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontLeftLeg.position.set(1.5, -2, -2);
        frontLeftLeg.castShadow = true;
        this.dragonParts.frontLeftLeg = frontLeftLeg;
        this.mesh.add(frontLeftLeg);

        const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontRightLeg.position.set(-1.5, -2, -2);
        frontRightLeg.castShadow = true;
        this.dragonParts.frontRightLeg = frontRightLeg;
        this.mesh.add(frontRightLeg);

        // Back legs
        const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        backLeftLeg.position.set(1.5, -2, 2);
        backLeftLeg.castShadow = true;
        this.dragonParts.backLeftLeg = backLeftLeg;
        this.mesh.add(backLeftLeg);

        const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        backRightLeg.position.set(-1.5, -2, 2);
        backRightLeg.castShadow = true;
        this.dragonParts.backRightLeg = backRightLeg;
        this.mesh.add(backRightLeg);
    }
    
    // Called by CustomTerrain's update method
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Wing flapping animation
        this.wingFlapAmount += this.wingFlapSpeed * this.wingFlapDirection;
        
        if (this.wingFlapAmount > 0.5) {
            this.wingFlapDirection = -1;
        } else if (this.wingFlapAmount < -0.1) {
            this.wingFlapDirection = 1;
        }
        
        // Apply wing flap animation
        if (this.dragonParts.leftWing && this.dragonParts.rightWing) {
            this.dragonParts.leftWing.rotation.z = Math.PI / 6 + this.wingFlapAmount;
            this.dragonParts.rightWing.rotation.z = -Math.PI / 6 - this.wingFlapAmount;
        }
        
        // Tail swinging animation
        this.tailSwingAmount += this.tailSwingSpeed;
        if (this.dragonParts.tail) {
            this.dragonParts.tail.rotation.y = Math.sin(this.tailSwingAmount) * 0.2;
        }
        if (this.dragonParts.tailTip) {
            this.dragonParts.tailTip.rotation.y = Math.sin(this.tailSwingAmount + 0.5) * 0.3;
        }
        
        // Breathing animation for body
        this.breathingAmount += this.breathingSpeed;
        if (this.dragonParts.body) {
            this.dragonParts.body.scale.y = 1 + Math.sin(this.breathingAmount) * 0.03;
            this.dragonParts.body.scale.x = 1 + Math.sin(this.breathingAmount) * 0.02;
        }
        
        // Slight bobbing up and down for the whole dragon
        if (this.mesh) {
            this.mesh.position.y += Math.sin(this.breathingAmount * 0.5) * 0.01;
        }
    }
    
    handleCollision(point) {
        const collision = super.handleCollision(point);
        if (collision.collided) {
            // increase the speed of the dragon for 1 second
            this.wingFlapSpeed += 0.4;
            
            setTimeout(() => {
                this.wingFlapSpeed -= 0.4;
            }, 1000);
        }
        return collision;
    }
}