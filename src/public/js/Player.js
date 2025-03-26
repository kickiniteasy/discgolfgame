class Player {
    constructor(id, name, color, type = 'ai') {
        this.id = id;
        this.name = name;
        this.color = color;
        this.type = type; // 'human' or 'ai'
        this.bag = new Bag(); // Each player has their own bag
        this.score = 0;
        this.throws = 0;
        this.position = new THREE.Vector3(0, 0.5, 0); // Base height for player when not on teebox
        this.isCurrentTurn = false;
        this.hasCompletedHole = false;
        this.lastDiscPosition = null; // Track where their disc landed
        this.selectedDiscIndex = 0;
        this.discs = [
            { name: 'Driver', speed: 11, glide: 5, turn: -1, fade: 3 },
            { name: 'Mid-Range', speed: 5, glide: 5, turn: -1, fade: 1 },
            { name: 'Putter', speed: 2, glide: 3, turn: 0, fade: 1 }
        ];
        
        // Create player model
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 32); // Made player taller (1 unit)
        const material = new THREE.MeshStandardMaterial({ color: this.color });
        this.model = new THREE.Mesh(geometry, material);
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        
        // Add player name label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Set up text style with smaller font and refined background
        context.textAlign = 'center';
        
        // Measure text width to create appropriate background
        context.font = '24px Arial';
        const textMetrics = context.measureText(name);
        const textWidth = textMetrics.width;
        const padding = 20;
        const cornerRadius = 12;
        
        // Draw rounded rectangle background
        const bgWidth = textWidth + padding * 2;
        const bgHeight = 40;
        const bgX = (canvas.width - bgWidth) / 2;
        const bgY = (canvas.height - bgHeight) / 2;
        
        context.beginPath();
        context.moveTo(bgX + cornerRadius, bgY);
        context.lineTo(bgX + bgWidth - cornerRadius, bgY);
        context.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + cornerRadius);
        context.lineTo(bgX + bgWidth, bgY + bgHeight - cornerRadius);
        context.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - cornerRadius, bgY + bgHeight);
        context.lineTo(bgX + cornerRadius, bgY + bgHeight);
        context.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - cornerRadius);
        context.lineTo(bgX, bgY + cornerRadius);
        context.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
        context.closePath();
        
        // Add subtle shadow
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 4;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fill();
        
        // Reset shadow for text
        context.shadowColor = 'transparent';
        
        // Draw text with outline
        context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        context.lineWidth = 3;
        context.strokeText(name, canvas.width / 2, canvas.height / 2 + 2);
        context.fillStyle = 'white';
        context.fillText(name, canvas.width / 2, canvas.height / 2 + 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthTest: false
        });
        this.nameSprite = new THREE.Sprite(spriteMaterial);
        this.nameSprite.scale.set(1.5, 0.4, 1);
        this.nameSprite.position.y = 0.8;
        
        // Create a group to hold the player model and name
        this.group = new THREE.Group();
        this.group.add(this.model);
        this.group.add(this.nameSprite);
        this.updatePosition();

        // Create player marker
        this.createPlayerMarker();
    }
    
    updatePosition() {
        this.group.position.copy(this.position);
    }
    
    moveToPosition(position) {
        this.position.copy(position);
        this.lastDiscPosition = position.clone();  // Store last disc position
        if (this.marker) {
            this.marker.position.copy(this.position);
        }
        this.updatePosition();
    }
    
    rotateToFacePosition(targetPosition) {
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.position)
            .normalize();
        const angle = Math.atan2(direction.x, direction.z);
        this.group.rotation.y = angle;
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
    
    completeHole() {
        this.hasCompletedHole = true;
    }
    
    resetHoleCompletion() {
        this.hasCompletedHole = false;
    }
    
    updateColor(newColor) {
        this.color = newColor;
        this.model.material.color.setHex(newColor);
        
        // Remove the disc color update since discs should keep their own colors
        // regardless of player color
    }

    createPlayerMarker() {
        // Implementation of createPlayerMarker method
    }
} 