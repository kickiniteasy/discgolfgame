class CameraController {
    constructor(camera, scene, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.controls = new THREE.OrbitControls(camera, domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.panSpeed = 1.0;
        this.controls.rotateSpeed = 0.8;
        this.controls.zoomSpeed = 1.2;
        this.controls.enablePan = true;

        // Auto-target state
        this.autoTarget = true;

        // Animation state
        this.isAnimating = false;
        this.animationStartTime = 0;
        this.animationDuration = 1500; // 1.5 seconds for each direction
        this.startPosition = new THREE.Vector3();
        this.startTarget = new THREE.Vector3();
        this.endPosition = new THREE.Vector3();
        this.endTarget = new THREE.Vector3();
        this.originalPosition = new THREE.Vector3();
        this.originalTarget = new THREE.Vector3();
        this.animationPhase = 'none'; // 'none', 'going', 'pausing', 'returning'
        this.pauseStartTime = 0;
        this.pauseDuration = 750; // 0.75 second pause at hole

        // Handle window resizing
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    // Position camera behind player looking at target (usually the hole)
    positionBehindPlayer(playerPosition, targetPosition) {
        const directionToTarget = new THREE.Vector3()
            .subVectors(targetPosition, playerPosition)
            .normalize();
        
        // Position camera behind player
        const cameraOffset = new THREE.Vector3()
            .copy(directionToTarget)
            .multiplyScalar(-5); // 5 units behind player
        cameraOffset.y = 2; // Height above ground
        
        this.camera.position.copy(playerPosition).add(cameraOffset);
        this.controls.target.copy(playerPosition);
    }

    // Focus camera on a specific player
    focusOnPlayer(player, forceHoleTarget = false) {
        if (!player) return;
        
        // Get player position
        const playerPosition = player.position.clone();
        
        if (this.autoTarget || forceHoleTarget) {
            // Auto-target mode or forced hole target: point at hole
            let targetPosition;
            if (window.courseManager && window.courseManager.getCurrentCourse()) {
                const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
                if (holePosition) {
                    targetPosition = new THREE.Vector3(
                        holePosition.x,
                        holePosition.y || 0,
                        holePosition.z
                    );
                }
            }
            
            // If no hole position available, use default forward direction
            if (!targetPosition) {
                const forwardDirection = new THREE.Vector3(0, 0, -1);
                targetPosition = playerPosition.clone().add(forwardDirection.multiplyScalar(10));
            }
            
            // Position camera behind player looking at hole
            this.positionBehindPlayer(playerPosition, targetPosition);
        } else {
            // Free throw mode: maintain current camera direction
            const currentDirection = new THREE.Vector3()
                .subVectors(this.controls.target, this.camera.position)
                .normalize();
            
            // Project the direction onto the horizontal plane
            currentDirection.y = 0;
            currentDirection.normalize();
            
            // Calculate target position in front of player using current direction
            const targetPosition = playerPosition.clone().add(currentDirection.multiplyScalar(10));
            
            // Position camera behind player maintaining current direction
            this.positionBehindPlayer(playerPosition, targetPosition);
        }
    }

    // Set auto-target mode
    setAutoTarget(enabled) {
        this.autoTarget = enabled;
    }

    // Update camera target during gameplay
    updateTarget(position) {
        if (this.autoTarget) {
            // Auto-target mode: target the hole
            if (window.courseManager && window.courseManager.getCurrentCourse()) {
                const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
                if (holePosition) {
                    this.controls.target.copy(holePosition);
                    return;
                }
            }
            // Fallback to player position if no hole position
            this.controls.target.copy(position);
        } else {
            // Free throw mode: maintain current camera direction relative to new position
            const currentDirection = new THREE.Vector3()
                .subVectors(this.controls.target, this.camera.position)
                .normalize();
            
            // Project the direction onto the horizontal plane
            currentDirection.y = 0;
            currentDirection.normalize();
            
            // Set new target point in front of player using current direction
            const targetOffset = currentDirection.multiplyScalar(5); // 5 units in front
            this.controls.target.copy(position).add(targetOffset);
        }
    }

    // Animate camera to show hole and return
    showHole() {
        if (this.isAnimating || !window.courseManager || !window.courseManager.getCurrentCourse()) return;

        const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
        if (!holePosition) return;

        // Store original position and target for return journey
        this.originalPosition.copy(this.camera.position);
        this.originalTarget.copy(this.controls.target);

        // Set up initial animation to hole
        this.startPosition.copy(this.camera.position);
        this.startTarget.copy(this.controls.target);

        // Calculate end position for viewing hole
        const holePos = new THREE.Vector3(holePosition.x, holePosition.y || 0, holePosition.z);
        const viewDistance = 15; // Distance to view hole from
        const viewHeight = 10;   // Height to view hole from
        
        // Position camera at an angle to the hole
        this.endPosition.set(
            holePos.x - viewDistance,
            holePos.y + viewHeight,
            holePos.z - viewDistance
        );
        this.endTarget.copy(holePos);

        // Start animation
        this.isAnimating = true;
        this.animationStartTime = Date.now();
        this.animationPhase = 'going';
        this.controls.enabled = false;
    }

    // Update animation
    updateAnimation() {
        if (!this.isAnimating) return;

        const currentTime = Date.now();
        
        switch (this.animationPhase) {
            case 'going':
                const goingElapsed = currentTime - this.animationStartTime;
                const goingProgress = Math.min(goingElapsed / this.animationDuration, 1);
                const goingEased = 1 - Math.pow(1 - goingProgress, 3); // Cubic ease-out

                this.camera.position.lerpVectors(this.startPosition, this.endPosition, goingEased);
                this.controls.target.lerpVectors(this.startTarget, this.endTarget, goingEased);

                if (goingProgress >= 1) {
                    this.animationPhase = 'pausing';
                    this.pauseStartTime = currentTime;
                }
                break;

            case 'pausing':
                const pauseElapsed = currentTime - this.pauseStartTime;
                if (pauseElapsed >= this.pauseDuration) {
                    // Set up return journey
                    this.startPosition.copy(this.camera.position);
                    this.startTarget.copy(this.controls.target);
                    this.endPosition.copy(this.originalPosition);
                    this.endTarget.copy(this.originalTarget);
                    this.animationStartTime = currentTime;
                    this.animationPhase = 'returning';
                }
                break;

            case 'returning':
                const returnElapsed = currentTime - this.animationStartTime;
                const returnProgress = Math.min(returnElapsed / this.animationDuration, 1);
                const returnEased = 1 - Math.pow(1 - returnProgress, 3); // Cubic ease-out

                this.camera.position.lerpVectors(this.startPosition, this.endPosition, returnEased);
                this.controls.target.lerpVectors(this.startTarget, this.endTarget, returnEased);

                if (returnProgress >= 1) {
                    this.isAnimating = false;
                    this.animationPhase = 'none';
                    this.controls.enabled = true;
                }
                break;
        }
    }

    // Update controls (called in animation loop)
    update() {
        if (this.isAnimating) {
            this.updateAnimation();
        }
        this.controls.update();
    }

    // Get camera direction for throw calculations
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        return direction;
    }
} 