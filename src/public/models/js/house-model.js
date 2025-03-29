export default class HouseModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Default colors
        this.wallColor = options.visualProperties?.wallColor || 
                        options.properties?.wallColor || 
                        "#F5F5DC"; // Beige
                        
        this.roofColor = options.visualProperties?.roofColor || 
                        options.properties?.roofColor || 
                        "#8B4513"; // Saddle Brown
                        
        this.windowColor = options.visualProperties?.windowColor || 
                          options.properties?.windowColor || 
                          "#87CEEB"; // Sky Blue
                          
        this.doorColor = options.visualProperties?.doorColor || 
                        options.properties?.doorColor || 
                        "#A52A2A"; // Brown
                        
        // House dimensions
        this.width = options.properties?.width || 4;
        this.height = options.properties?.height || 3;
        this.depth = options.properties?.depth || 4;
        
        // Door state for interaction
        this.doorOpen = false;
        this.doorPart = null;
    }

    async init() {
        this.createWalls();
        this.createRoof();
        this.createDoor();
        this.createWindows();
        
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
            const scale = this.options.scale.x || this.options.scale || 1;
            this.mesh.scale.set(scale, scale, scale);
        }
        
        return true;
    }
    
    createWalls() {
        // Create the main house body
        const walls = new THREE.Mesh(
            new THREE.BoxGeometry(this.width, this.height, this.depth),
            new THREE.MeshStandardMaterial({ 
                color: this.wallColor,
                roughness: this.options.visualProperties?.roughness || 0.7,
                metalness: this.options.visualProperties?.metalness || 0.1
            })
        );
        
        // Position so bottom is at y=0
        walls.position.y = this.height / 2;
        
        walls.castShadow = true;
        walls.receiveShadow = true;
        
        this.addPart(walls);
        this.walls = walls;
    }
    
    createRoof() {
        // Create a triangular prism for the roof
        const roofHeight = this.height * 0.6;
        const roofOverhang = 0.3;
        
        // Use a custom geometry for the roof
        const roofGeometry = new THREE.BufferGeometry();
        
        // Define the vertices
        const vertices = new Float32Array([
            // Front face
            -this.width/2 - roofOverhang, this.height, -this.depth/2 - roofOverhang,
            this.width/2 + roofOverhang, this.height, -this.depth/2 - roofOverhang,
            0, this.height + roofHeight, -this.depth/2 - roofOverhang,
            
            // Back face
            -this.width/2 - roofOverhang, this.height, this.depth/2 + roofOverhang,
            this.width/2 + roofOverhang, this.height, this.depth/2 + roofOverhang,
            0, this.height + roofHeight, this.depth/2 + roofOverhang,
            
            // Left face
            -this.width/2 - roofOverhang, this.height, -this.depth/2 - roofOverhang,
            -this.width/2 - roofOverhang, this.height, this.depth/2 + roofOverhang,
            0, this.height + roofHeight, -this.depth/2 - roofOverhang,
            0, this.height + roofHeight, this.depth/2 + roofOverhang,
            
            // Right face
            this.width/2 + roofOverhang, this.height, -this.depth/2 - roofOverhang,
            this.width/2 + roofOverhang, this.height, this.depth/2 + roofOverhang,
            0, this.height + roofHeight, -this.depth/2 - roofOverhang,
            0, this.height + roofHeight, this.depth/2 + roofOverhang
        ]);
        
        // Define the triangles
        const indices = [
            // Front face
            0, 1, 2,
            
            // Back face
            3, 4, 5,
            
            // Left face
            6, 8, 7,
            7, 8, 9,
            
            // Right face
            10, 12, 11,
            11, 12, 13
        ];
        
        roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        roofGeometry.setIndex(indices);
        roofGeometry.computeVertexNormals();
        
        const roof = new THREE.Mesh(
            roofGeometry,
            new THREE.MeshStandardMaterial({ 
                color: this.roofColor,
                roughness: this.options.visualProperties?.roughness || 0.8,
                metalness: this.options.visualProperties?.metalness || 0.2,
                side: THREE.DoubleSide
            })
        );
        
        roof.castShadow = true;
        roof.receiveShadow = true;
        
        this.addPart(roof);
        this.roof = roof;
    }
    
    createDoor() {
        const doorWidth = this.width * 0.25;
        const doorHeight = this.height * 0.6;
        
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, doorHeight, 0.1),
            new THREE.MeshStandardMaterial({ 
                color: this.doorColor,
                roughness: this.options.visualProperties?.roughness || 0.5,
                metalness: this.options.visualProperties?.metalness || 0.3
            })
        );
        
        // Position door at front of house
        door.position.set(0, doorHeight / 2, this.depth / 2 + 0.05);
        
        door.castShadow = true;
        door.receiveShadow = true;
        
        // Add door handle
        const doorHandle = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: "#FFD700", // Gold
                roughness: 0.2,
                metalness: 0.8
            })
        );
        
        doorHandle.position.set(doorWidth * 0.3, 0, 0.07);
        door.add(doorHandle);
        
        this.addPart(door);
        this.doorPart = door;
    }
    
    createWindows() {
        const windowSize = this.width * 0.2;
        const windowDepth = 0.05;
        
        // Create front windows
        for (let i = -1; i <= 1; i += 2) {
            const window = new THREE.Mesh(
                new THREE.BoxGeometry(windowSize, windowSize, windowDepth),
                new THREE.MeshStandardMaterial({ 
                    color: this.windowColor,
                    roughness: 0.2,
                    metalness: 0.5,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Position windows at front of house
            window.position.set(
                i * (this.width * 0.25), 
                this.height * 0.7, 
                this.depth / 2 + windowDepth / 2
            );
            
            // Add window frame
            const frameSize = windowSize * 1.15;
            const frame = new THREE.Mesh(
                new THREE.BoxGeometry(frameSize, frameSize, windowDepth * 0.5),
                new THREE.MeshStandardMaterial({ 
                    color: "#FFFFFF", // White
                    roughness: 0.5,
                    metalness: 0.1
                })
            );
            
            frame.position.set(0, 0, -windowDepth * 0.3);
            window.add(frame);
            
            // Add window dividers
            const divider1 = new THREE.Mesh(
                new THREE.BoxGeometry(windowSize * 0.05, windowSize, windowDepth * 1.1),
                new THREE.MeshStandardMaterial({ color: "#FFFFFF" })
            );
            
            const divider2 = new THREE.Mesh(
                new THREE.BoxGeometry(windowSize, windowSize * 0.05, windowDepth * 1.1),
                new THREE.MeshStandardMaterial({ color: "#FFFFFF" })
            );
            
            window.add(divider1);
            window.add(divider2);
            
            window.castShadow = true;
            window.receiveShadow = true;
            
            this.addPart(window);
        }
        
        // Create side windows
        for (let i = -1; i <= 1; i += 2) {
            const sideWindow = new THREE.Mesh(
                new THREE.BoxGeometry(windowDepth, windowSize, windowSize),
                new THREE.MeshStandardMaterial({ 
                    color: this.windowColor,
                    roughness: 0.2,
                    metalness: 0.5,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Position windows at sides of house
            sideWindow.position.set(
                this.width / 2 + windowDepth / 2,
                this.height * 0.7,
                i * (this.depth * 0.25)
            );
            
            sideWindow.castShadow = true;
            sideWindow.receiveShadow = true;
            
            this.addPart(sideWindow);
        }
    }
    
    handleCollision(point) {
        const collision = super.handleCollision(point);
        
        if (collision.collided) {
            // Check if collision is with the door
            const doorBounds = new THREE.Box3().setFromObject(this.doorPart);
            
            if (doorBounds.containsPoint(point)) {
                this.toggleDoor();
            }
        }
        
        return collision;
    }
    
    toggleDoor() {
        if (!this.doorPart) return;
        
        if (this.doorOpen) {
            // Close door
            this.doorPart.rotation.y = 0;
        } else {
            // Open door
            this.doorPart.rotation.y = Math.PI / 2;
        }
        
        this.doorOpen = !this.doorOpen;
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Subtle smoke from chimney could be added here
        // Light in windows that turns on at night could be added here
    }
}