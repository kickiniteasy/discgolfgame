class Disc {
    constructor(scene, discData) {
        this.scene = scene;
        this.discData = discData;
        console.log('Disc constructor - Input data:', discData); // Debug log
        
        // Create disc mesh based on type
        let geometry;
        switch(discData.type) {
            case 'driver':
                // Drivers are thinner and have a sharper edge
                geometry = new THREE.CylinderGeometry(0.11, 0.1, 0.015, 32);
                break;
            case 'midrange':
                // Midranges have a more rounded edge
                geometry = new THREE.CylinderGeometry(0.105, 0.1, 0.02, 32);
                break;
            case 'putter':
                // Putters are thicker and more blunt
                geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.025, 32);
                break;
            default:
                // Fallback to default disc shape
                geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32);
        }
        
        // Ensure we have a valid color
        let discColor;
        try {
            // Try to create a THREE.Color from the hex string
            console.log('Attempting to create color from:', discData.color); // Debug log
            discColor = new THREE.Color(discData.color);
            console.log('Created color:', discColor); // Debug log
        } catch (e) {
            console.log('Color creation failed:', e); // Debug log
            // If that fails, use a default color based on disc type
            switch(discData.type) {
                case 'driver':
                    discColor = new THREE.Color('#ff7043');
                    break;
                case 'midrange':
                    discColor = new THREE.Color('#42a5f5');
                    break;
                case 'putter':
                    discColor = new THREE.Color('#ffd54f');
                    break;
                default:
                    discColor = new THREE.Color('#ffffff');
            }
            console.log('Using fallback color:', discColor); // Debug log
        }
        
        const material = new THREE.MeshPhongMaterial({ 
            color: discColor,
            shininess: 30
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Physics state
        this.velocity = new THREE.Vector3();
        this.isFlying = false;
        this.position = new THREE.Vector3();
        
        scene.add(this.mesh);
    }
    
    throw(direction, power) {
        // Reset state
        this.isFlying = true;
        
        // Calculate initial velocity based on power and direction
        // Scale velocity based on disc speed rating
        // Speed 10 disc should go ~120m, Speed 5 should go ~60m
        const maxVelocity = 65; // Max velocity for a Speed 10 disc
        const speedRatio = this.discData.speed / 10; // Scale based on speed rating
        const baseVelocity = maxVelocity * speedRatio; // Scale velocity by disc speed
        const speed = (power / 100) * baseVelocity;
        
        this.velocity.copy(direction).multiplyScalar(speed);
        this.velocity.y = speed * 0.2; // Initial upward velocity
        
        // Store initial throw power to scale effects
        this.initialSpeed = speed;
    }
    
    update(deltaTime) {
        if (!this.isFlying) return;
        
        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;
        
        // Apply disc characteristics
        const speed = this.velocity.length();
        if (speed > 0.1) {
            // Scale turn and fade based on how much speed has been lost
            const speedRatio = speed / this.initialSpeed;
            
            // Adjust speed based on disc speed rating (faster discs maintain speed better)
            const speedMultiplier = 0.7 + (this.discData.speed * 0.03);  // Range from 0.7 to 1.0 based on speed
            const adjustedSpeedRatio = speedRatio * speedMultiplier;
            
            // Turn only happens at high speeds (early in flight)
            if (adjustedSpeedRatio > 0.6) {
                const turnFactor = this.discData.turn * deltaTime * 0.02;
                this.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), turnFactor);
            }
            
            // Fade happens more as disc slows down
            if (adjustedSpeedRatio < 0.4) {
                const fadeFactor = this.discData.fade * deltaTime * 0.025 * (1 - adjustedSpeedRatio);
                this.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), fadeFactor);
            }
            
            // Improved glide calculation based on speed and glide rating
            // More lift at higher speeds, tapering off as the disc slows
            const glideEffect = (this.discData.glide * 0.12) * Math.pow(adjustedSpeedRatio, 1.5);
            this.velocity.y += glideEffect * deltaTime;
            
            // Dynamic air resistance that varies with speed and disc characteristics
            const dragBase = 0.9975; // Less drag (0.25% per frame instead of 0.5%)
            const dragCoefficient = dragBase - (1 - adjustedSpeedRatio) * 0.001;
            this.velocity.multiplyScalar(dragCoefficient);
        }
        
        // Update position
        this.position.addScaledVector(this.velocity, deltaTime);
        this.mesh.position.copy(this.position);
        
        // Ground collision check
        const course = window.courseManager.getCurrentCourse();
        if (course) {
            const collision = course.checkDiscCollision(this.position);
            
            // Update distance to hole in UI
            if (window.ui) {
                window.ui.updateDistance(collision.distance);
            }
            
            if (collision.isInHole) {
                this.isFlying = false;
                window.gameState.discInHand = true;
                const currentPlayer = window.playerManager.getCurrentPlayer();
                if (currentPlayer) {
                    currentPlayer.hasCompletedHole = true;
                    // Update player's score
                    const par = window.courseManager.getCurrentCourse().getCurrentHolePar();
                    const strokesOverPar = currentPlayer.throws - par;
                    currentPlayer.score += strokesOverPar;
                    const parText = strokesOverPar === 0 ? "Par" :
                                  strokesOverPar > 0 ? `+${strokesOverPar}` :
                                  strokesOverPar;
                    window.ui.showMessage(`Hole complete in ${currentPlayer.throws} throws! (${parText})`);
                    window.ui.updateScore(currentPlayer.score);
                    
                    // Trigger celebration effects
                    if (window.celebrationEffects) {
                        window.celebrationEffects.celebrate(currentPlayer, strokesOverPar);
                    }
                    
                    window.playerManager.nextTurn();
                }
            } else if (this.position.y <= 0.1) {
                this.isFlying = false;
                window.gameState.discInHand = true;
                const currentPlayer = window.playerManager.getCurrentPlayer();
                if (currentPlayer) {
                    currentPlayer.moveToPosition(this.position.clone());
                    window.playerManager.nextTurn();
                }
            }
        }
        
        // Rotate disc based on movement
        if (speed > 0.1) {
            this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
            this.mesh.rotation.x = -Math.PI/2;
        }
    }
    
    setPosition(position) {
        this.position.copy(position);
        this.mesh.position.copy(position);
    }
    
    getPosition() {
        return this.position;
    }
    
    remove() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
} 