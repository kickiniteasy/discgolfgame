/*
 * Windmill Model for Three.js
 * To be loaded by CustomTerrain class as a JS model
 */

export default class WindmillModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.blades = null;
        
        // Configure windmill properties
        this.rotationSpeed = options.properties?.windSpeed || 0.5;
        
        // Use visualProperties for colors if available, otherwise use custom properties or defaults
        // Handle hex string colors (visualProperties.color will be a string like "#ff0000")
        this.baseColor = options.visualProperties?.color || 
                        options.properties?.baseColor || 
                        "#8b4513";
        this.roofColor = options.visualProperties?.roofColor || 
                         options.properties?.roofColor || 
                         "#654321";
        this.bladeColor = options.visualProperties?.bladeColor || 
                          options.properties?.bladeColor || 
                          this.baseColor; // Default to base color if not specified
    }

    async init() {
        // Create windmill parts
        this.createBase();
        this.createRoof();
        this.createWindow();
        this.createDoor();
        this.createBlades();
        
        // Scale the entire model
        if (this.options.scale) {
            this.mesh.scale.set(
                this.options.scale.x || 1,
                this.options.scale.y || 1,
                this.options.scale.z || 1
            );
        }
        
        return true;
    }
    
    createBase() {
        // Create windmill base/tower
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2, 6, 8),
            new THREE.MeshStandardMaterial({ 
                color: this.baseColor,
                roughness: this.options.visualProperties?.roughness || 0.8,
                metalness: this.options.visualProperties?.metalness || 0.2,
                opacity: this.options.visualProperties?.opacity || 1.0,
                transparent: this.options.visualProperties?.opacity < 1.0
            })
        );
        base.position.y = 3;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
    }
    
    createRoof() {
        // Create conical roof
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(1.7, 2, 8),
            new THREE.MeshStandardMaterial({ 
                color: this.roofColor,
                roughness: 0.7,
                metalness: 0.1
            })
        );
        roof.position.y = 7;
        roof.castShadow = true;
        this.mesh.add(roof);
    }
    
    createWindow() {
        // Create circular window
        const windowMesh = new THREE.Mesh(
            new THREE.CircleGeometry(0.5, 16),
            new THREE.MeshStandardMaterial({ 
                color: 0x87ceeb,
                transparent: true,
                opacity: 0.7,
                roughness: 0.2,
                metalness: 0.8
            })
        );
        windowMesh.position.set(0, 4, 1.5);
        windowMesh.rotation.y = Math.PI;
        this.mesh.add(windowMesh);
        
        // Add window frame
        const windowFrame = new THREE.Mesh(
            new THREE.RingGeometry(0.4, 0.55, 16),
            new THREE.MeshStandardMaterial({ color: this.baseColor })
        );
        windowFrame.position.set(0, 4, 1.51);
        windowFrame.rotation.y = Math.PI;
        this.mesh.add(windowFrame);
    }
    
    createDoor() {
        // Create door
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 0.1),
            new THREE.MeshStandardMaterial({ 
                color: this.roofColor,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        door.position.set(0, 1, 1.5);
        this.mesh.add(door);
        
        // Door handle
        const doorHandle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0x8b8b8b,
                roughness: 0.4,
                metalness: 0.8
            })
        );
        doorHandle.position.set(0.3, 1, 1.56);
        this.mesh.add(doorHandle);
    }
    
    createBlades() {
        // Create blade mount
        const mount = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16),
            new THREE.MeshStandardMaterial({ 
                color: this.baseColor,
                roughness: 0.6,
                metalness: 0.4
            })
        );
        mount.rotation.x = Math.PI / 2;
        mount.position.set(0, 5, 2);
        this.mesh.add(mount);

        // Create blade group
        this.blades = new THREE.Group();
        this.blades.position.copy(mount.position);
        
        // Get blade count from options or default to 4
        const bladeCount = this.options.properties?.bladeCount || 4;

        // Create blades
        for (let i = 0; i < bladeCount; i++) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 5, 0.1),
                new THREE.MeshStandardMaterial({ 
                    color: this.bladeColor,
                    roughness: 0.7,
                    metalness: 0.2
                })
            );
            blade.position.y = 2.5;
            blade.rotation.z = (i * Math.PI * 2) / bladeCount;
            blade.castShadow = true;
            this.blades.add(blade);
        }

        this.mesh.add(this.blades);
    }
    
    // Called by CustomTerrain's update method
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Rotate the blades
        if (this.blades) {
            this.blades.rotation.z += deltaTime * this.rotationSpeed;
        }
    }
    
    // Custom collision detection for the windmill
    handleCollision(point) {
        // Create a bounding box for the windmill
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Check if point is inside the bounding box
        const isInside = boundingBox.containsPoint(point);
        
        return {
            collided: isInside,
            point: point.clone()
        };
    }
}