class Disc {
    constructor(scene, discData) {
        this.scene = scene;
        this.discData = discData;
        
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
            discColor = new THREE.Color(discData.color);
        } catch (e) {
            discColor = new THREE.Color(0xff0000); // Default to red if color creation fails
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
        
        // Store scene reference and add mesh to scene
        this.scene = scene;
        this.scene.add(this.mesh);
        
        // Initialize trail
        this.trailPoints = [];
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: discColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.trail = new THREE.Mesh();
        this.trail.material = trailMaterial;
        this.trail.visible = false;
        this.scene.add(this.trail);
    }
    
    updateTrailGeometry() {
        if (this.trailPoints.length < 2) {
            // Not enough points for a trail yet
            if (this.trail) {
                this.trail.visible = false;
            }
            return;
        }

        try {
            const curve = new THREE.CatmullRomCurve3(this.trailPoints);
            const tubeGeometry = new THREE.TubeGeometry(
                curve, 
                Math.max(1, this.trailPoints.length - 1), 
                0.12,  // Wider trail, close to disc width (disc is ~0.1)
                2,     // Keep flat ribbon effect
                false
            );
            if (this.trail.geometry) {
                this.trail.geometry.dispose();
            }
            this.trail.geometry = tubeGeometry;
            this.trail.visible = true;
        } catch (error) {
            console.warn('Error updating trail geometry:', error);
            this.trail.visible = false;
        }
    }
    
    setPosition(position) {
        this.position.copy(position);
        this.mesh.position.copy(position);
        
        // Clear trail when disc position is manually set
        if (this.trail) {
            this.trailPoints = [];
            this.trail.visible = false;
        }
        
        // When not flying, keep disc upright like a shield and facing camera direction
        if (!this.isFlying && window.cameraController) {
            // Get camera's forward direction
            const direction = new THREE.Vector3();
            window.cameraController.camera.getWorldDirection(direction);
            direction.y = 0;  // Remove any up/down tilt
            direction.normalize();
            
            // Set disc upright (like a shield) and facing camera direction
            const angle = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.set(0, angle, 0);
        }
    }
    
    throw(direction, power) {
        // Start new trail from current position
        this.trailPoints = [this.position.clone()];
        this.trail.visible = false;
        
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
        if (!this.isFlying || !this.mesh) return;
        
        // Store previous position for collision detection
        const previousPosition = this.position.clone();
        
        // Apply gravity
        this.velocity.y -= 9.8 * deltaTime;
        
        // Update trail
        if (this.trail && this.isFlying) {
            this.trailPoints.push(this.position.clone());
            // Keep only last 30 points to limit trail length
            if (this.trailPoints.length > 30) {
                this.trailPoints.shift();
            }
            this.updateTrailGeometry();
        }
        
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
            const glideEffect = (this.discData.glide * 0.12) * Math.pow(adjustedSpeedRatio, 1.5);
            this.velocity.y += glideEffect * deltaTime;
            
            // Dynamic air resistance
            const dragBase = 0.9975;
            const dragCoefficient = dragBase - (1 - adjustedSpeedRatio) * 0.001;
            this.velocity.multiplyScalar(dragCoefficient);
        }
        
        // Update position
        this.position.addScaledVector(this.velocity, deltaTime);
        
        // Check for terrain collisions
        if (window.terrainManager) {
            const collision = window.terrainManager.checkCollision(this.position);
            if (collision.collided) {
                if (collision.isPortal) {
                    console.log('Portal collision detected!');
                    // Let the portal handle the collision
                    collision.terrain.handlePortalCollision();
                    // Remove the disc since we're teleporting
                    this.remove();
                    window.gameState.currentDisc = null;
                    return;
                }
                
                // Handle regular collision
                // Move back to previous position
                this.position.copy(previousPosition);
                
                // Calculate bounce
                const bounceReduction = 0.3; // Reduce velocity on bounce
                this.velocity.multiplyScalar(-bounceReduction); // Reverse and reduce velocity
                
                // Add some randomness to the bounce direction
                const randomness = 0.2;
                this.velocity.x += (Math.random() - 0.5) * randomness;
                this.velocity.z += (Math.random() - 0.5) * randomness;
                
                // If speed is too low after bounce, stop the disc
                if (this.velocity.length() < 2.0) {
                    this.isFlying = false;
                    window.gameState.discInHand = true;
                    const currentPlayer = window.playerManager.getCurrentPlayer();
                    if (currentPlayer) {
                        currentPlayer.moveToPosition(this.position.clone());
                        window.playerManager.nextTurn();
                    }
                }
            }
        }
        
        // Update mesh position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        
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

                    // Create completion message
                    let message;
                    if (currentPlayer.throws === 1) {
                        message = "🌟 HOLE IN ONE! 🌟";
                    } else if (strokesOverPar === -2) {
                        message = "🦅 EAGLE! 🦅";
                    } else if (strokesOverPar === -1) {
                        message = "🐦 BIRDIE! 🐦";
                    } else if (strokesOverPar === 0) {
                        message = "PAR";
                    } else if (strokesOverPar === 1) {
                        message = "BOGEY";
                    } else if (strokesOverPar === 2) {
                        message = "DOUBLE";
                    } else if (strokesOverPar === 3) {
                        message = "TRIPLE";
                    } else {
                        message = `+${strokesOverPar}`;
                    }

                    window.ui.showMessage(message);
                    window.ui.updateScore(currentPlayer.score);
                    
                    // Trigger celebration effects and wait for completion before moving to next turn
                    if (window.celebrationEffects) {
                        window.celebrationEffects.celebrate(currentPlayer, strokesOverPar, () => {
                            // Only move to next turn after celebration is complete
                            window.playerManager.nextTurn();
                        });
                    } else {
                        window.playerManager.nextTurn();
                    }
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
        if (speed > 0.1 && this.mesh) {
            // Use velocity direction
            const direction = this.velocity.clone().normalize();
            
            // Keep disc upright like a shield during flight, just rotate to face direction
            const angle = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.set(0, angle, 0);
        }
    }
    
    getPosition() {
        return this.position;
    }
    
    remove() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            this.mesh = null;
        }
        // Clean up trail
        if (this.trail && this.scene) {
            this.scene.remove(this.trail);
            if (this.trail.geometry) this.trail.geometry.dispose();
            if (this.trail.material) this.trail.material.dispose();
            this.trail = null;
        }
    }
} 