export default class EnchantedTree extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.trunkColor = options.visualProperties?.trunkColor || 
                          options.properties?.trunkColor || 
                          "#8B4513";
        this.leavesColor = options.visualProperties?.leavesColor || 
                           options.properties?.leavesColor || 
                           "#2E8B57";
        this.glowColor = options.visualProperties?.glowColor || 
                         options.properties?.glowColor || 
                         "#7DF9FF";
        
        // Properties
        this.height = options.properties?.height || 12;
        this.trunkRadius = options.properties?.trunkRadius || 0.8;
        this.foliageSize = options.properties?.foliageSize || 5;
        this.glowIntensity = options.properties?.glowIntensity || 0.8;
        this.swayAmount = options.properties?.swayAmount || 0.05;
        this.swaySpeed = options.properties?.swaySpeed || 1.0;
        
        // Animation references
        this.originalPositions = [];
        this.time = 0;
    }

    async init() {
        this.createTrunk();
        this.createFoliage();
        this.createGlowingEffects();
        
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
            const scale = this.options.scale.x || 1;
            this.mesh.scale.set(scale, scale, scale);
        }
        
        return true;
    }
    
    createTrunk() {
        // Main trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(
                this.trunkRadius, this.trunkRadius * 1.5, 
                this.height, 8
            ),
            new THREE.MeshStandardMaterial({ 
                color: this.trunkColor,
                roughness: 0.89,
                metalness: 0.1,
            })
        );
        trunk.position.y = this.height / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.addPart(trunk);
        
        // Add some branches
        this.createBranches();
    }
    
    createBranches() {
        const numBranches = 5;
        const branchMaterial = new THREE.MeshStandardMaterial({ 
            color: this.trunkColor,
            roughness: 0.85,
            metalness: 0.1
        });
        
        for (let i = 0; i < numBranches; i++) {
            const yPos = (i + 2) * (this.height / (numBranches + 1));
            const branchLength = this.trunkRadius * 6 * (1 - (i / numBranches) * 0.3);
            const branchThickness = this.trunkRadius * 0.4;
            
            // Create branch
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    branchThickness * 0.7, 
                    branchThickness, 
                    branchLength, 
                    6
                ),
                branchMaterial
            );
            
            // Rotate and position branch
            branch.rotation.z = Math.PI / 2;
            branch.rotation.y = (Math.PI * 2 / numBranches) * i;
            branch.position.y = yPos;
            branch.position.x = Math.sin(branch.rotation.y) * this.trunkRadius * 0.8;
            branch.position.z = Math.cos(branch.rotation.y) * this.trunkRadius * 0.8;
            
            // Store original position for animation
            this.originalPositions.push({
                mesh: branch,
                position: branch.position.clone(),
                rotation: branch.rotation.clone()
            });
            
            branch.castShadow = true;
            this.addPart(branch);
            
            // Add smaller branches to each main branch
            const numTwigs = 3;
            for (let j = 0; j < numTwigs; j++) {
                const twig = new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        branchThickness * 0.3,
                        branchThickness * 0.5,
                        branchLength * 0.6,
                        5
                    ),
                    branchMaterial
                );
                
                // Position twig along branch
                const twigGroup = new THREE.Group();
                twig.position.x = branchLength * 0.4 * (j / numTwigs + 0.5);
                twig.rotation.z = -Math.PI / 4;
                twig.rotation.y = (Math.PI * 2 / numTwigs) * j;
                
                twigGroup.add(twig);
                twigGroup.rotation.copy(branch.rotation);
                twigGroup.position.copy(branch.position);
                
                twig.castShadow = true;
                this.addPart(twig);
                
                // Store for animation
                this.originalPositions.push({
                    mesh: twig,
                    position: twig.position.clone(),
                    rotation: twig.rotation.clone()
                });
            }
        }
    }
    
    createFoliage() {
        const topFoliage = new THREE.Mesh(
            new THREE.SphereGeometry(this.foliageSize, 12, 12),
            new THREE.MeshStandardMaterial({ 
                color: this.leavesColor,
                roughness: 0.7,
                metalness: 0.1,
            })
        );
        
        topFoliage.position.y = this.height + (this.foliageSize * 0.3);
        topFoliage.castShadow = true;
        this.addPart(topFoliage);
        
        // Lower foliage clusters
        const numClusters = 3;
        for (let i = 0; i < numClusters; i++) {
            const cluster = new THREE.Mesh(
                new THREE.SphereGeometry(
                    this.foliageSize * (0.7 - i * 0.1), 
                    10, 10
                ),
                new THREE.MeshStandardMaterial({ 
                    color: this.leavesColor,
                    roughness: 0.7,
                    metalness: 0.1,
                })
            );
            
            const yPosition = this.height - (i * this.height * 0.2);
            cluster.position.y = yPosition;
            cluster.castShadow = true;
            
            // Store original position for animation
            this.originalPositions.push({
                mesh: cluster,
                position: cluster.position.clone(),
                scale: cluster.scale.clone()
            });
            
            this.addPart(cluster);
        }
    }
    
    createGlowingEffects() {
        // Create glowing particles in the foliage
        const numParticles = 20;
        const particleGroup = new THREE.Group();
        
        for (let i = 0; i < numParticles; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.glowColor,
                    emissive: this.glowColor,
                    emissiveIntensity: this.glowIntensity,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Random position within foliage
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = this.foliageSize * (0.5 + Math.random() * 0.5);
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = this.height + radius * Math.cos(phi);
            particle.position.z = radius * Math.sin(phi) * Math.sin(theta);
            
            // Store original position for animation
            this.originalPositions.push({
                mesh: particle,
                position: particle.position.clone(),
                initialOffset: Math.random() * Math.PI * 2
            });
            
            particleGroup.add(particle);
            this.addPart(particle);
        }
        
        this.mesh.add(particleGroup);
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        this.time += deltaTime;
        
        // Animate the tree's parts
        this.originalPositions.forEach((item, i) => {
            const mesh = item.mesh;
            
            if (i % 3 === 0) { // Only animate some parts
                // Gentle swaying motion
                if (mesh.position && item.position) {
                    mesh.position.x = item.position.x + Math.sin(this.time * this.swaySpeed + i) * this.swayAmount;
                    mesh.position.z = item.position.z + Math.cos(this.time * this.swaySpeed + i * 0.7) * this.swayAmount;
                }
                
                // Gentle rotation
                if (mesh.rotation && item.rotation) {
                    mesh.rotation.x = item.rotation.x + Math.sin(this.time * 0.5 + i) * 0.02;
                    mesh.rotation.z = item.rotation.z + Math.cos(this.time * 0.5 + i) * 0.02;
                }
            }
            
            // Special animation for glowing particles
            if (item.initialOffset !== undefined) {
                const floatSpeed = 0.8;
                const floatAmount = 0.2;
                
                mesh.position.y = item.position.y + Math.sin(this.time * floatSpeed + item.initialOffset) * floatAmount;
                
                // Glow pulsing
                if (mesh.material && mesh.material.emissiveIntensity) {
                    mesh.material.emissiveIntensity = this.glowIntensity * 
                        (0.7 + 0.3 * Math.sin(this.time * 2 + item.initialOffset));
                }
            }
        });
    }
}
