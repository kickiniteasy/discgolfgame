class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.bag = new Bag(); // Each player has their own bag
        this.score = 0;
        this.throws = 0;
        this.position = new THREE.Vector3(0, 0.5, 0);
        this.isCurrentTurn = false;
        
        // Create player model
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
        const material = new THREE.MeshStandardMaterial({ color: this.color });
        this.model = new THREE.Mesh(geometry, material);
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        
        // Add player name label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.font = '32px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(name, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.nameSprite = new THREE.Sprite(spriteMaterial);
        this.nameSprite.scale.set(2, 0.5, 1);
        this.nameSprite.position.y = 1.5;
        
        // Create a group to hold the player model and name
        this.group = new THREE.Group();
        this.group.add(this.model);
        this.group.add(this.nameSprite);
        this.updatePosition();
    }
    
    updatePosition() {
        this.group.position.copy(this.position);
    }
    
    moveToPosition(position) {
        this.position.copy(position);
        this.updatePosition();
    }
    
    setCurrentTurn(isCurrentTurn) {
        this.isCurrentTurn = isCurrentTurn;
        // Highlight current player
        this.model.material.emissive.setHex(isCurrentTurn ? 0x333333 : 0x000000);
    }
    
    addToScene(scene) {
        scene.add(this.group);
    }
    
    removeFromScene(scene) {
        scene.remove(this.group);
    }
    
    updateScore(score) {
        this.score = score;
    }
    
    incrementThrows() {
        this.throws++;
    }
    
    resetThrows() {
        this.throws = 0;
    }
    
    getSelectedDisc() {
        return this.bag.getSelectedDisc();
    }
} 