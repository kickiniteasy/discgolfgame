class CameraController {
    constructor(scene, camera, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.controls = new THREE.OrbitControls(camera, domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;

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
    focusOnPlayer(player) {
        if (!player) return;
        
        // Get player position
        const playerPosition = player.position.clone();
        
        // Get current hole position from course manager
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
    }

    // Update camera target during gameplay
    updateTarget(position) {
        // Get current hole position
        if (window.courseManager && window.courseManager.getCurrentCourse()) {
            const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
            if (holePosition) {
                this.controls.target.copy(holePosition);
                return;
            }
        }
        // Fallback to provided position if no hole position available
        this.controls.target.copy(position);
    }

    // Update controls (called in animation loop)
    update() {
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