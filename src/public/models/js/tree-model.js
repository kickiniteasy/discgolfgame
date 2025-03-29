
export default class TreeModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Default colors
        this.trunkColor = options.visualProperties?.trunkColor || 
                         options.properties?.trunkColor || 
                         "#8B4513"; // Saddle Brown
                         
        this.leavesColor = options.visualProperties?.leavesColor || 
                          options.properties?.leavesColor || 
                          "#228B22"; // Forest Green
                          
        this.trunkHeight = options.properties?.trunkHeight || 2.5;
        this.trunkRadius = options.properties?.trunkRadius || 0.3;
        this.leavesSize = options.properties?.leavesSize || 2;
        this.windMovement = options.properties?.windMovement || 0.5;
        
        // Store original positions for animation
        this.originalPositions = {};
    }

    async init() {
        this.createTrunk();
        this.createLeaves();
        
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
    
    createTrunk() {
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(
                this.trunkRadius * 0.7, // narrower at top
                this.trunkRadius,
                this.trunkHeight,
                8
            ),
            new THREE.MeshStandardMaterial({ 
                color: this.trunkColor,
                roughness: this.options.visualProperties?.roughness || 0.8,
                metalness: this.options.visualProperties?.metalness || 0.1
            })
        );
        
        // Position trunk so bottom is at y=0
        trunk.position.y = this.trunkHeight / 2;
        
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        this.addPart(trunk);
        this.trunk = trunk;
    }
    
    createLeaves() {
        // Create a group for the foliage
        const foliage = new THREE.Group();
        
        // Create multiple layers of leaves
        const layerCount = 3;
        for (let i = 0; i < layerCount; i++) {
            const ratio = 1 - (i * 0.2);
            const height = this.trunkHeight + (i * this.leavesSize * 0.3);
            
            const leaves = new THREE.Mesh(
                new THREE.ConeGeometry(
                    this.leavesSize * ratio,
                    this.leavesSize * 1.2,
                    8
                ),
                new THREE.MeshStandardMaterial({ 
                    color: this.leavesColor,
                    roughness: this.options.visualProperties?.roughness || 0.7,
                    metalness: this.options.visualProperties?.metalness || 0.1
                })
            );
            
            leaves.position.y = height;
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            
            foliage.add(leaves);
            this.addPart(leaves);
            
            // Store original position for animation
            this.originalPositions[`leaves_${i}`] = {
                x: leaves.position.x,
                y: leaves.position.y,
                z: leaves.position.z
            };
        }
        
        this.mesh.add(foliage);
        this.foliage = foliage;
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Simple wind animation for the leaves
        const time = Date.now() * 0.001;
        
        // Animate each layer of leaves
        for (let i = 0; i < this.foliage.children.length; i++) {
            const leaves = this.foliage.children[i];
            const original = this.originalPositions[`leaves_${i}`];
            
            // Gentle swaying movement
            const windFactor = this.windMovement * (i + 1) * 0.05;
            const offsetX = Math.sin(time + i) * windFactor;
            const offsetZ = Math.cos(time * 0.7 + i) * windFactor;
            
            leaves.position.x = original.x + offsetX;
            leaves.position.z = original.z + offsetZ;
            
            // Subtle rotation
            leaves.rotation.x = Math.sin(time * 0.5) * 0.05;
            leaves.rotation.z = Math.cos(time * 0.3) * 0.05;
        }
    }
}