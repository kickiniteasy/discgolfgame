/*
BaseModel Documentation for Custom Three.js Models

This BaseModel class serves as the foundation for all custom 3D models in the system.
Follow these guidelines to ensure your models are compatible with the CustomTerrain loader.

MODEL CREATION PATTERN:
1. Always export your model as a default class that extends BaseModel
2. Create the THREE.Group() in the constructor
3. Override the init() method to build your model parts
4. Make sure to handle properties correctly using the visualProperties and properties objects

REQUIRED MODEL STRUCTURE:
export default class YourModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group(); // Create mesh group in constructor
        
        // Setup model-specific properties from options
        this.mainColor = options.visualProperties?.color || 
                         options.properties?.mainColor || 
                         "#default";
    }

    async init() {
        // Create model parts here and add to this.mesh
        this.createPart1();
        this.createPart2();
        
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
    
    // Part creation methods
    createPart1() {
        const part = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ 
                color: this.mainColor,
                roughness: this.options.visualProperties?.roughness || 0.5,
                metalness: this.options.visualProperties?.metalness || 0.3,
                opacity: this.options.visualProperties?.opacity || 1.0,
                transparent: this.options.visualProperties?.opacity < 1.0
            })
        );
        part.castShadow = true;
        part.receiveShadow = true;
        this.mesh.add(part);
        this.addPart(part); // Important: track part for proper cleanup
    }
    
    // Override this for animations
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Perform animations here
    }
}

PROPERTIES HANDLING:
- Options are passed from CustomTerrain via the options parameter
- Use visualProperties for visual aspects (colors, textures, opacity)
- Use properties for behavioral aspects (speeds, counts, sizes)

Example access pattern:
    this.color = options.visualProperties?.color || options.properties?.color || "#default";
    this.speed = options.properties?.speed || 1.0;

BEST PRACTICES:
1. Always call this.addPart() for each mesh to ensure proper cleanup
2. Implement handleCollision() for interactive models
3. Add castShadow and receiveShadow where appropriate
4. Store original positions when implementing animations
5. Skip animations if options.properties?.animated === false

Available Shapes:
- BoxGeometry(width, height, depth)
- SphereGeometry(radius, widthSegments, heightSegments)
- CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
- ConeGeometry(radius, height, radialSegments)
- TorusGeometry(radius, tube, radialSegments, tubularSegments)

Material Options:
{
    color: '#hexcolor',    // CSS colors like '#ff0000' or 'red'
    transparent: true,     // Enable transparency
    opacity: 0.5,          // 0 = invisible, 1 = solid
    metalness: 0.0,        // 0 = non-metallic, 1 = metallic
    roughness: 0.5,        // 0 = glossy, 1 = diffuse
    emissive: '#color',    // Self-illumination color
    emissiveIntensity: 0.5 // Strength of self-illumination
}
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
        // First check with a slightly smaller bounding box for quick rejection
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Make the bounding box a bit smaller for more accurate collisions
        const shrinkAmount = 0.5; // Adjust based on your model's scale
        boundingBox.min.add(new THREE.Vector3(shrinkAmount, shrinkAmount, shrinkAmount));
        boundingBox.max.sub(new THREE.Vector3(shrinkAmount, shrinkAmount, shrinkAmount));
        
        if (!boundingBox.containsPoint(point)) {   
            return {
                collided: false,
                point: null
            };
        }
        //console.log("Collision detected: ", this.mesh);
        
        // Check against individual mesh children
        for (let childIdx in this.mesh.children) {
            const child = this.mesh.children[childIdx];
            // Skip parts without geometry (like groups)
            if (!child.geometry) {
                
                // If it's a group, recursively check its children
                if (child.children && child.children.length > 0) {
                    for (const grandchild of child.children) {
                        if (!grandchild.geometry) {
                            console.log("Grandchild without geometry: ", grandchild);
                            continue;
                        }
                        
                        // Convert point to local space of this specific part
                        const localPoint = point.clone();
                        grandchild.worldToLocal(localPoint);
                        
                        // Check if local point is within this part's bounds
                        const partBox = new THREE.Box3().setFromObject(grandchild);
                        if (partBox.containsPoint(localPoint)) {
                            return {
                                collided: true,
                                point: point.clone()
                            };
                        }
                    }
                }
                continue;
            }
            
            // Create a local point by transforming global point to part's local space
            const localPoint = point.clone().sub(child.position);
            if (child.parent !== this.mesh) {
                // Account for nested hierarchy if part isn't direct child of mesh
                let current = child;
                while (current.parent && current.parent !== this.mesh) {
                    localPoint.sub(current.parent.position);
                    current = current.parent;
                }
            }

            // Create a bounding box for this specific part
            const partBox = new THREE.Box3().setFromObject(child);
            if (partBox.containsPoint(point)) {
                return {
                    collided: true,
                    point: point.clone()
                };
            }

            
        }
        
        return {
            collided: false,
            point: point.clone()
        };
    }

    // Enhanced cleanup method for BaseModel.js
    cleanup() {
        // First, remove all parts from the mesh if they're still attached
        if (this.mesh) {
            while (this.mesh.children.length > 0) {
                const child = this.mesh.children[0];
                this.mesh.remove(child);
            }
        }

        // Then dispose of geometries and materials for all parts
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

        // Clear the parts array
        this.parts = [];

        // Clear any additional resources
        if (this.mixer) {
            this.mixer = null;
        }
    }
} 