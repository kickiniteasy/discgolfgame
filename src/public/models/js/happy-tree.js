export default class HappyTree extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group(); // Create mesh group in constructor
        
        // Setup model-specific properties from options
        this.trunkColor = options.visualProperties?.trunkColor || 
                         options.properties?.trunkColor || 
                         "#8B4513"; // Saddle brown
        this.foliageColor = options.visualProperties?.foliageColor || 
                           options.properties?.foliageColor || 
                           "#228B22"; // Forest green
        
        // Additional properties
        this.trunkHeight = options.properties?.trunkHeight || 2;
        this.trunkRadiusTop = options.properties?.trunkRadiusTop || 0.2;
        this.trunkRadiusBottom = options.properties?.trunkRadiusBottom || 0.3;
        this.foliageHeight = options.properties?.foliageHeight || 2;
        this.foliageRadius = options.properties?.foliageRadius || 1;
        this.segments = options.properties?.segments || 8;
        
        // Initialize time for animations
        this.time = 0;
        
        // For smiley face rotation
        this.smileyFaceVisible = false;
        this.rotationSpeed = options.properties?.smileyRotationSpeed || 0.5; // rotations per second (slowed down)
    }

    async init() {
        // Create model parts
        this.createTrunk();
        this.createFoliage();
        
        // Set position, rotation, scale from options
        if (this.options.position) {
            this.mesh.position.set(
                this.options.position.x || 0,
                this.options.position.y || 0,
                this.options.position.z || 0
            );
        }
        
        if (this.options.rotation) {
            this.mesh.rotation.set(
                this.options.rotation.x || 0,
                this.options.rotation.y || 0,
                this.options.rotation.z || 0
            );
        }
        
        if (this.options.scale) {
            this.mesh.scale.set(
                this.options.scale.x || 1,
                this.options.scale.y || 1,
                this.options.scale.z || 1
            );
        }
        
        return true;
    }
    
    createTrunk() {
        const trunkGeometry = new THREE.CylinderGeometry(
            this.trunkRadiusTop, 
            this.trunkRadiusBottom, 
            this.trunkHeight, 
            this.segments
        );
        
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: this.trunkColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.position.y = this.trunkHeight / 2;
        
        this.addPart(trunk);
        this.trunk = trunk;
    }
    
    createFoliage() {
        const foliageGeometry = new THREE.ConeGeometry(
            this.foliageRadius, 
            this.foliageHeight, 
            this.segments
        );
        
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: this.foliageColor,
            roughness: 1.0,
            metalness: 0.0
        });
        
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        foliage.position.y = this.trunkHeight + (this.foliageHeight / 2);
        
        this.addPart(foliage);
        this.foliage = foliage;
    }

    // Update method for animations
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        this.time += deltaTime;
        
        // Rotate the smiley face if it's visible
        if (this.smileyFaceVisible && this.smileyFace) {
            // Calculate rotation angle based on time and speed
            const rotationAngle = this.time * this.rotationSpeed * Math.PI * 2;
            
            // Update smiley face rotation around the trunk
            this.updateSmileyFacePosition(rotationAngle);
        }
    }
    
    // Override for custom collision detection
    handleCollision(point) {
        const collision = super.handleCollision(point);
        if (collision.collided) {
            //console.log("Collision detected with tree: ", this.mesh);
            this.showSmileyFace();
        }
        return collision;
    }
    
    showSmileyFace() {
        // Remove any existing smiley face
        this.removeSmileyFace();
        
        // Create a smiley face group
        this.smileyFace = new THREE.Group();
        
        // Create eyes - using SphereGeometry for eyes
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.3,
            metalness: 0.6
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0.2, 0);
        this.smileyFace.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 0.2, 0);
        this.smileyFace.add(rightEye);
        
        // Create smiling mouth - using TorusGeometry for a curved line
        const mouthGeometry = new THREE.TorusGeometry(0.2, 0.03, 8, 16, Math.PI);
        const mouthMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.3,
            metalness: 0.6
        });
        
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.05, 0);
        mouth.rotation.z = Math.PI;
        this.smileyFace.add(mouth);
        
        // Position the smiley face in a circular orbit around the foliage area
        this.smileyFace.position.set(0, 0, 0);
        
        // Create an orbit container to help with rotation
        this.smileyOrbit = new THREE.Group();
        // Position at the middle of the foliage instead of the trunk
        this.smileyOrbit.position.y = this.trunkHeight + (this.foliageHeight * 0.5);
        
        // Initial position (positioned at front of tree)
        this.updateSmileyFacePosition(0);
        
        // Add the smiley face to the orbit container
        this.smileyOrbit.add(this.smileyFace);
        
        // Add the orbit container to the mesh
        this.mesh.add(this.smileyOrbit);
        
        // Mark as visible for animations
        this.smileyFaceVisible = true;
        
        // Set a timer to remove the smiley face after 3 seconds
        this.smileyFaceTimer = setTimeout(() => {
            this.removeSmileyFace();
        }, 3000);
    }
    
    updateSmileyFacePosition(angle) {
        if (!this.smileyFace) return;
        
        // Calculate orbit radius - moved in closer to the foliage
        const orbitRadius = this.foliageRadius * 0.8;
        
        // Position on circle around trunk
        const x = Math.sin(angle) * orbitRadius;
        const z = Math.cos(angle) * orbitRadius;
        
        // Update position
        this.smileyFace.position.set(x, 0, z);
        
        // Make face always look outward from the trunk
        this.smileyFace.rotation.y = angle;
    }
    
    removeSmileyFace() {
        // Clear any existing timer
        if (this.smileyFaceTimer) {
            clearTimeout(this.smileyFaceTimer);
            this.smileyFaceTimer = null;
        }
        
        // Remove the smiley face if it exists
        if (this.smileyOrbit) {
            this.mesh.remove(this.smileyOrbit);
            
            // Clean up geometries and materials
            if (this.smileyFace) {
                this.smileyFace.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
            
            this.smileyFace = null;
            this.smileyOrbit = null;
            this.smileyFaceVisible = false;
        }
    }
    
    // Enhanced cleanup to remove smiley face when tree is destroyed
    cleanup() {
        // Remove any smiley face
        this.removeSmileyFace();
        
        // Call the parent cleanup method
        super.cleanup();
    }
}