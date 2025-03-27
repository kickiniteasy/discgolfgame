class Hole {
    constructor(scene, position, holeNumber) {
        this.scene = scene;
        this.position = position;
        this.holeNumber = holeNumber;
        this.arrow = null;
        this.arrowStartY = 4.0; // Moved back up (flag is at 3.2)
        this.arrowBounceHeight = 0.2; // How high it bounces
        this.arrowBounceSpeed = 2; // Speed of bounce animation
        this.arrowSpinSpeed = 1.5; // Speed of rotation
        
        this.createBasket();
        this.createFlag();
        this.createArrow();
        this.hideArrow(); // Initially hide the arrow
    }

    createBasket() {
        // Create the main pole
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x757575, // Gray
            roughness: 0.3,
            metalness: 0.7
        });
        this.pole = new THREE.Mesh(poleGeometry, poleMaterial);
        this.pole.position.set(this.position.x, 1.4, this.position.z);
        this.pole.castShadow = true;
        this.scene.add(this.pole);

        // Create the basket (cage)
        const basketGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 32);
        const basketMaterial = new THREE.MeshStandardMaterial({
            color: 0x757575,
            roughness: 0.3,
            metalness: 0.7,
            wireframe: true
        });
        this.basket = new THREE.Mesh(basketGeometry, basketMaterial);
        this.basket.position.set(this.position.x, 1.0, this.position.z);
        this.basket.castShadow = true;
        this.scene.add(this.basket);

        // Create the chain area (simplified as a translucent cylinder that tapers at bottom)
        const chainGeometry = new THREE.CylinderGeometry(0.6, 0.15, 1.5, 32); // Tapered bottom
        const chainMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.4,
            metalness: 0.6,
            transparent: true,
            opacity: 0.3
        });
        this.chains = new THREE.Mesh(chainGeometry, chainMaterial);
        this.chains.position.set(this.position.x, 1.75, this.position.z);
        this.chains.castShadow = true;
        this.scene.add(this.chains);

        // Create the top ring
        const ringGeometry = new THREE.TorusGeometry(0.6, 0.03, 8, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x757575,
            roughness: 0.3,
            metalness: 0.7
        });
        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.position.set(this.position.x, 2.5, this.position.z);
        this.ring.rotation.x = Math.PI / 2;
        this.ring.castShadow = true;
        this.scene.add(this.ring);

        // Create bottom plate
        const plateGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32);
        const plateMaterial = new THREE.MeshStandardMaterial({
            color: 0x757575,
            roughness: 0.3,
            metalness: 0.7
        });
        this.plate = new THREE.Mesh(plateGeometry, plateMaterial);
        this.plate.position.set(this.position.x, 0.8, this.position.z);
        this.plate.castShadow = true;
        this.scene.add(this.plate);
    }

    createFlag() {
        const flagGeometry = new THREE.PlaneGeometry(1.2, 0.8);
        
        // Create canvas for the flag texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 171;
        const context = canvas.getContext('2d');
        
        // Draw classic red background
        context.fillStyle = '#cc0000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add white number with subtle black outline
        context.font = 'bold 100px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add subtle shadow/outline
        context.strokeStyle = 'rgba(0,0,0,0.3)';
        context.lineWidth = 6;
        context.strokeText(this.holeNumber, canvas.width/2, canvas.height/2);
        
        // Add white number
        context.fillStyle = 'white';
        context.fillText(this.holeNumber, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const flagMaterial = new THREE.SpriteMaterial({
            map: texture,
            sizeAttenuation: true
        });

        // Use a sprite instead of a plane - sprites always face the camera
        this.flag = new THREE.Sprite(flagMaterial);
        this.flag.position.set(this.position.x, 3.2, this.position.z);
        this.flag.scale.set(1.2, 0.8, 1.0);
        this.scene.add(this.flag);
    }

    createArrow() {
        // Create arrow shape
        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 0.3);  // Top point
        arrowShape.lineTo(-0.15, 0);  // Bottom left
        arrowShape.lineTo(0.15, 0);  // Bottom right
        arrowShape.lineTo(0, 0.3);  // Back to top

        const extrudeSettings = {
            depth: 0.05,
            bevelEnabled: false
        };

        const geometry = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF, // Back to white
            metalness: 0.3,
            roughness: 0.4
        });

        this.arrow = new THREE.Mesh(geometry, material);
        this.arrow.position.set(this.position.x, this.arrowStartY, this.position.z);
        this.arrow.rotation.x = Math.PI; // Point downward
        this.scene.add(this.arrow);
    }

    showArrow() {
        if (this.arrow) {
            this.arrow.visible = true;
        }
    }

    hideArrow() {
        if (this.arrow) {
            this.arrow.visible = false;
        }
    }

    updateArrow(time) {
        if (this.arrow && this.arrow.visible) {
            // Vertical bounce
            const bounce = Math.sin(time * this.arrowBounceSpeed) * this.arrowBounceHeight;
            this.arrow.position.y = this.arrowStartY + bounce;
            
            // Continuous rotation around Y axis
            this.arrow.rotation.y = time * this.arrowSpinSpeed;
        }
    }

    remove() {
        this.scene.remove(this.pole);
        this.scene.remove(this.basket);
        this.scene.remove(this.chains);
        this.scene.remove(this.ring);
        this.scene.remove(this.plate);
        this.scene.remove(this.flag);
        if (this.arrow) {
            this.scene.remove(this.arrow);
        }
    }

    getPosition() {
        return new THREE.Vector3(this.position.x, 0, this.position.z);
    }

    checkDiscCollision(discPosition) {
        const holePos = this.getPosition();
        const exactDistance = new THREE.Vector2(discPosition.x - holePos.x, discPosition.z - holePos.z).length();
        
        // Check for chain collision (if disc is at chain height)
        const isAtChainHeight = discPosition.y >= 1.0 && discPosition.y <= 2.5;
        const isInChainRange = exactDistance < 0.65; // Slightly larger chain radius for more forgiving hits
        const hitChains = isAtChainHeight && isInChainRange;

        // Check if disc is in basket
        const isInBasketHeight = discPosition.y < 1.2; // Slightly above basket height
        const isInBasketRange = exactDistance < 0.7; // Basket radius
        const inBasket = isInBasketHeight && isInBasketRange;

        return {
            distance: Math.floor(exactDistance), // Round down for display
            hitChains: hitChains,
            // Count it as in if either it's in the basket OR it hit the chains (removed height requirement for chains)
            isInHole: inBasket || hitChains
        };
    }
} 