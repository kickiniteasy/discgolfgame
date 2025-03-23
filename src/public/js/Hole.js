class Hole {
    constructor(scene, position, holeNumber) {
        this.scene = scene;
        this.position = position;
        this.holeNumber = holeNumber;
        
        this.createHole();
        this.createFlagPole();
        this.createFlag();
        this.createHoleNumber();
    }

    createHole() {
        const holeGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1, 32);
        const holeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffeb3b, // Yellow
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0xffeb3b,
            emissiveIntensity: 0.3
        });

        this.hole = new THREE.Mesh(holeGeometry, holeMaterial);
        this.hole.position.set(this.position.x, 0.5, this.position.z);
        this.hole.castShadow = true;
        this.scene.add(this.hole);
    }

    createFlagPole() {
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x757575, // Gray
            roughness: 0.3,
            metalness: 0.7
        });
        this.flagPole = new THREE.Mesh(poleGeometry, poleMaterial);
        this.flagPole.position.set(this.position.x, 1.5, this.position.z);
        this.flagPole.castShadow = true;
        this.scene.add(this.flagPole);
    }

    createFlag() {
        const flagGeometry = new THREE.PlaneGeometry(1, 0.6);
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: 0xff5722, // Orange
            roughness: 0.3,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        this.flag = new THREE.Mesh(flagGeometry, flagMaterial);
        this.flag.position.set(this.position.x + 0.5, 2.5, this.position.z);
        this.flag.rotation.y = Math.PI / 2;
        this.flag.castShadow = true;
        this.scene.add(this.flag);
    }

    createHoleNumber() {
        const textGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.font = 'bold 50px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.holeNumber, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        this.numberMesh = new THREE.Mesh(textGeometry, textMaterial);
        this.numberMesh.position.set(this.position.x + 0.5, 2.5, this.position.z);
        this.numberMesh.rotation.y = Math.PI / 2;
        this.scene.add(this.numberMesh);
    }

    getPosition() {
        return new THREE.Vector3(this.position.x, 0, this.position.z);
    }

    checkDiscCollision(discPosition) {
        const distance = discPosition.distanceTo(this.getPosition());
        return {
            distance: distance,
            isInHole: distance < 1 && discPosition.y < 0.5
        };
    }

    remove() {
        this.scene.remove(this.hole);
        this.scene.remove(this.flagPole);
        this.scene.remove(this.flag);
        this.scene.remove(this.numberMesh);
    }
} 