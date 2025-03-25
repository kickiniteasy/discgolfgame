class Disc {
    constructor(scene, discData) {
        this.scene = scene;
        this.discData = discData;
        
        // Create disc mesh
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32);
        const material = new THREE.MeshPhongMaterial({ color: discData.color });
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
        const speed = (power / 100) * this.discData.speed * 2.0;
        this.velocity.copy(direction).multiplyScalar(speed);
        this.velocity.y = speed * 0.4;
        
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
            
            // Turn only happens at high speeds (early in flight)
            if (speedRatio > 0.5) {
                const turnFactor = this.discData.turn * deltaTime * 0.012;
                this.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), turnFactor);
            }
            
            // Fade happens more as disc slows down
            if (speedRatio < 0.7) {
                const fadeFactor = this.discData.fade * deltaTime * 0.012 * (1 - speedRatio);
                this.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), fadeFactor);
            }
            
            // Glide (reduces downward velocity based on glide rating)
            const glideEffect = this.discData.glide * 0.05;
            this.velocity.y += glideEffect * deltaTime;
            
            // Add air resistance
            const drag = 0.998;
            this.velocity.multiplyScalar(drag);
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