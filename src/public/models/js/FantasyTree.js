/*
 * Fantasy Glowing Tree Model for Three.js
 * A magical tree with glowing fruits/leaves that sway in the wind
 */

export default class FantasyTreeModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Tree properties
        this.trunkHeight = options.properties?.trunkHeight || 5;
        this.trunkRadius = options.properties?.trunkRadius || 0.5;
        this.leafClusters = options.properties?.leafClusters || 6;
        this.fruitCount = options.properties?.fruitCount || 8;
        this.swayStrength = options.properties?.swayStrength || 0.1;
        this.swaySpeed = options.properties?.swaySpeed || 1.0;
        
        // Animation properties
        this.swayTime = 0;
        this.branches = [];
        this.fruits = [];
        
        // Colors
        this.trunkColor = options.visualProperties?.trunkColor || 
                         options.properties?.trunkColor || 
                         "#8B4513"; // Brown
                         
        this.leafColor = options.visualProperties?.color || 
                         options.properties?.leafColor || 
                         "#88ff88"; // Light green
                         
        this.fruitColor = options.visualProperties?.fruitColor || 
                          options.properties?.fruitColor || 
                          "#ff5588"; // Pink
    }

    async init() {
        // Create the trunk
        this.createTrunk();
        
        // Create branches with leaves
        this.createBranches();
        
        // Create glowing fruits
        this.createFruits();
        
        // Set position, rotation, and scale from options
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
        // Create tree trunk with slight taper
        const trunkGeometry = new THREE.CylinderGeometry(
            this.trunkRadius * 0.7,  // Top radius (slightly tapered)
            this.trunkRadius,         // Bottom radius
            this.trunkHeight,
            8  // segments
        );
        
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: this.trunkColor,
            roughness: 0.9,
            metalness: 0.1,
            opacity: this.options.visualProperties?.opacity || 1.0,
            transparent: this.options.visualProperties?.opacity < 1.0
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = this.trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.mesh.add(trunk);
        this.addPart(trunk);
    }
    
    createBranches() {
        // Create branching structure with leaf clusters
        for (let i = 0; i < this.leafClusters; i++) {
            // Position branches along the trunk at different heights and angles
            const heightPercent = 0.4 + (i / this.leafClusters) * 0.6;
            const angle = (i / this.leafClusters) * Math.PI * 2;
            const branchLength = 1 + Math.random() * 1.5;
            
            // Create branch
            const branchGeometry = new THREE.CylinderGeometry(
                0.1,
                0.15,
                branchLength,
                5
            );
            
            const branchMaterial = new THREE.MeshStandardMaterial({
                color: this.trunkColor,
                roughness: 0.9,
                metalness: 0.1
            });
            
            // Position branch
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            branch.position.y = this.trunkHeight * heightPercent;
            
            // Rotate branch outward from trunk
            branch.rotation.z = Math.PI / 2;
            branch.rotation.y = angle;
            
            // Move branch out from center
            branch.position.x = Math.cos(angle) * this.trunkRadius;
            branch.position.z = Math.sin(angle) * this.trunkRadius;
            
            // Translate branch along its length
            branch.position.x += Math.cos(angle) * branchLength / 2;
            branch.position.z += Math.sin(angle) * branchLength / 2;
            
            branch.castShadow = true;
            this.mesh.add(branch);
            this.addPart(branch);
            
            // Store branches for animation
            this.branches.push({
                mesh: branch,
                angle: angle,
                height: heightPercent,
                length: branchLength,
                originalPos: {
                    x: branch.position.x,
                    y: branch.position.y,
                    z: branch.position.z
                }
            });
            
            // Create leaf cluster at end of branch
            this.createLeafCluster(
                branch.position.x + Math.cos(angle) * branchLength / 2,
                branch.position.y,
                branch.position.z + Math.sin(angle) * branchLength / 2,
                angle
            );
        }
    }
    
    createLeafCluster(x, y, z, angle) {
        // Create a cluster of leaves at the end of a branch
        const leafClusterGeometry = new THREE.SphereGeometry(
            0.5 + Math.random() * 0.3,  // random size
            8,
            8
        );
        
        const leafClusterMaterial = new THREE.MeshStandardMaterial({
            color: this.leafColor,
            emissive: this.leafColor,
            emissiveIntensity: 0.2,
            roughness: 0.8,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        
        const leafCluster = new THREE.Mesh(leafClusterGeometry, leafClusterMaterial);
        leafCluster.position.set(x, y, z);
        leafCluster.castShadow = true;
        this.mesh.add(leafCluster);
        this.addPart(leafCluster);
        
        // Store as part of the branch for animation
        this.branches[this.branches.length - 1].leafCluster = {
            mesh: leafCluster,
            originalPos: {
                x: leafCluster.position.x,
                y: leafCluster.position.y,
                z: leafCluster.position.z
            }
        };
    }
    
    createFruits() {
        // Create glowing fruits distributed among the leaf clusters
        for (let i = 0; i < this.fruitCount; i++) {
            console.log("Creating fruit: ", i);
            // Choose a random branch to place this fruit
            const branchIndex = Math.floor(Math.random() * this.branches.length);
            const branch = this.branches[branchIndex];
            
            // Create fruit geometry
            const fruitGeometry = new THREE.SphereGeometry(
                0.3,  // small fruit
                8,
                8
            );
            
            const fruitMaterial = new THREE.MeshStandardMaterial({
                color: this.fruitColor,
                emissive: this.fruitColor,
                emissiveIntensity: 0.8,
                roughness: 0.3,
                metalness: 0.5,
                transparent: true,
                opacity: 0.9
            });
            
            const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
            
            // Position fruit near but not exactly at the leaf cluster
            const offset = 0.3;
            const offsetAngle = Math.random() * Math.PI * 2;
            
            // Get base position from leaf cluster
            const leafCluster = branch.leafCluster.mesh;
            fruit.position.x = leafCluster.position.x + 0.3 + Math.cos(offsetAngle) * offset;
            fruit.position.y = leafCluster.position.y + (Math.random() - 0.5) * offset;
            fruit.position.z = leafCluster.position.z + 0.3 + Math.sin(offsetAngle) * offset;
            
            fruit.castShadow = true;
            this.mesh.add(fruit);
            this.addPart(fruit);
            
            // Store fruit for animation
            this.fruits.push({
                mesh: fruit,
                branch: branchIndex,
                pulseOffset: Math.random() * Math.PI * 2,
                originalPos: {
                    x: fruit.position.x,
                    y: fruit.position.y,
                    z: fruit.position.z
                }
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Update sway time
        this.swayTime += deltaTime * this.swaySpeed;
        
        // Animate branches and leaves
        this.branches.forEach((branch, index) => {
            // Each branch sways slightly differently
            const sway = Math.sin(this.swayTime + index * 0.5) * this.swayStrength;
            
            // Move branches
            const swayX = Math.cos(branch.angle) * sway;
            const swayZ = Math.sin(branch.angle) * sway;
            
            branch.mesh.position.x = branch.originalPos.x + swayX;
            branch.mesh.position.z = branch.originalPos.z + swayZ;
            
            // Move leaf clusters attached to branches
            if (branch.leafCluster) {
                branch.leafCluster.mesh.position.x = branch.leafCluster.originalPos.x + swayX * 1.5;
                branch.leafCluster.mesh.position.z = branch.leafCluster.originalPos.z + swayZ * 1.5;
                
                // Pulsing glow on leaves
                const leafPulse = (Math.sin(this.swayTime * 0.5) * 0.5 + 0.5) * 0.3;
                branch.leafCluster.mesh.material.emissiveIntensity = 0.2 + leafPulse;
            }
        });
        
        // Animate fruits
        this.fruits.forEach(fruit => {
            // Move fruits with their branches
            const branch = this.branches[fruit.branch];
            const swayFactor = Math.sin(this.swayTime + fruit.branch * 0.5) * this.swayStrength;
            
            const swayX = Math.cos(branch.angle) * swayFactor;
            const swayZ = Math.sin(branch.angle) * swayFactor;
            
            fruit.mesh.position.x = fruit.originalPos.x + swayX * 1.5;
            fruit.mesh.position.z = fruit.originalPos.z + swayZ * 1.5;
            
            // Pulsing glow on fruits
            const fruitPulse = (Math.sin(this.swayTime * 2 + fruit.pulseOffset) * 0.5 + 0.5) * 0.5;
            fruit.mesh.material.emissiveIntensity = 0.8 + fruitPulse;
            
            // Subtle size pulsing
            const scale = 1 + fruitPulse * 0.2;
            fruit.mesh.scale.set(scale, scale, scale);
        });
    }
    
    // Custom function to harvest fruit
    harvestFruit() {
        if (this.fruits.length === 0) {
            return false;
        }
        
        // Remove a random fruit
        const fruitIndex = Math.floor(Math.random() * this.fruits.length);
        const fruit = this.fruits[fruitIndex];
        
        // Remove from scene and array
        this.mesh.remove(fruit.mesh);
        this.fruits.splice(fruitIndex, 1);
        
        return true;
    }
    
    handleCollision(point) {
        const collision = super.handleCollision(point);
        if (collision.collided) {
            console.log("Harvesting fruit !!!");
            this.harvestFruit();
        }
        return collision;
    }
}