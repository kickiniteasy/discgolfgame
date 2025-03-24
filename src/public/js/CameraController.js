class CameraController {
    constructor(scene, renderer) {
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Controls setup
        this.controls = new THREE.OrbitControls(this.camera, renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

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

    // Update camera target during gameplay
    updateTarget(position) {
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