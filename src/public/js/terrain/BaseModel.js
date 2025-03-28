/*
Base Model Template for Three.js Models

Available Shapes:
- BoxGeometry(width, height, depth)
- SphereGeometry(radius, widthSegments, heightSegments)
- CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
- ConeGeometry(radius, height, radialSegments)
- TorusGeometry(radius, tube, radialSegments, tubularSegments)

Example Material:
new THREE.MeshStandardMaterial({ 
    color: '#hexcolor',     // CSS colors like '#ff0000' or 'red'
    transparent: true,      // Enable transparency
    opacity: 0.5,          // 0 = invisible, 1 = solid
    metalness: 0.0,        // 0 = non-metallic, 1 = metallic
    roughness: 0.5         // 0 = glossy, 1 = diffuse
})

Positioning:
mesh.position.set(x, y, z)    // Move object
mesh.rotation.set(x, y, z)    // Rotate in radians
mesh.scale.set(x, y, z)       // Scale object
*/

class BaseModel {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = options;
        this.mesh = null;
        this.parts = [];  // Track all meshes for cleanup
    }

    async init() {
        await this.createMesh();
        if (this.mesh) {
            this.scene.add(this.mesh);
        }
        return true;
    }

    // Override this method in your model
    async createMesh() {
        this.mesh = new THREE.Group();
        
        // Example: Create a simple cube
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: '#ff0000' })
        );
        this.addPart(cube);
        
        return true;
    }

    // Helper to track parts for cleanup
    addPart(mesh) {
        this.parts.push(mesh);
        if (this.mesh) {
            this.mesh.add(mesh);
        }
    }

    // Override this for custom animations
    update(deltaTime) {
        // Example: this.mesh.rotation.y += deltaTime;
    }

    // Override this for custom collision detection
    handleCollision(point) {
        const box = new THREE.Box3().setFromObject(this.mesh);
        return {
            collided: box.containsPoint(point),
            point: point.clone()
        };
    }

    // Cleanup method - call this when removing the model
    cleanup() {
        // Remove all parts and dispose of geometries/materials
        this.parts.forEach(part => {
            if (part.geometry) {
                part.geometry.dispose();
            }
            if (part.material) {
                if (Array.isArray(part.material)) {
                    part.material.forEach(m => m.dispose());
                } else {
                    part.material.dispose();
                }
            }
        });

        // Remove main mesh from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }

        this.parts = [];
    }
} 