export default class TreasureChestModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.woodColor = options.visualProperties?.woodColor || 
                         options.properties?.woodColor || 
                         "#8B4513"; // Default: brown
        this.metalColor = options.visualProperties?.metalColor || 
                          options.properties?.metalColor || 
                          "#CD853F"; // Default: peru
        this.lockColor = options.visualProperties?.lockColor || 
                         options.properties?.lockColor || 
                         "#FFD700"; // Default: gold
        this.treasureColor = options.visualProperties?.treasureColor || 
                            options.properties?.treasureColor || 
                            "#FFD700"; // Default: gold
        
        // Chest state
        this.isOpen = options.properties?.startOpen === true;
        this.openingSpeed = options.properties?.openingSpeed || 2;
        this.lidAngle = this.isOpen ? Math.PI * 0.4 : 0;
        
        // References for animation
        this.lidGroup = null;
        this.treasureGroup = null;
        this.particles = [];
        
        // Particles system
        this.particleCount = options.properties?.particleCount || 15;
        this.particleSize = options.properties?.particleSize || 0.05;
    }

    async init() {
        // Create chest parts
        this.createBase();
        this.createLid();
        this.createLock();
        this.createTreasure();
        
        // Create initial particle system
        if (this.options.properties?.showParticles !== false) {
            this.createParticles();
        }
        
        // Apply position, rotation, scale from options
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
    
    createBase() {
        // Base wood material
        const woodMaterial = new THREE.MeshStandardMaterial({ 
            color: this.woodColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Metal trim material
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: this.metalColor,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Chest base (box)
        const baseWidth = 1.0;
        const baseHeight = 0.6;
        const baseDepth = 0.7;
        
        const baseBox = new THREE.Mesh(
            new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth),
            woodMaterial
        );
        baseBox.position.set(0, baseHeight / 2, 0);
        baseBox.castShadow = true;
        baseBox.receiveShadow = true;
        this.addPart(baseBox);
        
        // Add metal trim to the base
        this.addTrim(0, 0.05, 0, baseWidth + 0.05, 0.05, baseDepth + 0.05, metalMaterial);
        this.addTrim(0, baseHeight - 0.05, 0, baseWidth + 0.05, 0.05, baseDepth + 0.05, metalMaterial);
        
        // Add corner reinforcements
        const corners = [
            { x: -baseWidth/2 + 0.1, z: -baseDepth/2 + 0.1 },
            { x: baseWidth/2 - 0.1, z: -baseDepth/2 + 0.1 },
            { x: -baseWidth/2 + 0.1, z: baseDepth/2 - 0.1 },
            { x: baseWidth/2 - 0.1, z: baseDepth/2 - 0.1 }
        ];
        
        corners.forEach(corner => {
            const cornerReinforcement = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, baseHeight, 0.1),
                metalMaterial
            );
            cornerReinforcement.position.set(corner.x, baseHeight / 2, corner.z);
            cornerReinforcement.castShadow = true;
            this.addPart(cornerReinforcement);
        });
    }
    
    addTrim(x, y, z, width, height, depth, material) {
        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );
        trim.position.set(x, y, z);
        trim.castShadow = true;
        this.addPart(trim);
    }
    
    createLid() {
        // Create lid group for animation
        this.lidGroup = new THREE.Group();
        this.lidGroup.position.set(0, 0.6, -0.35); // Position at hinge point
        
        // Lid wood material
        const woodMaterial = new THREE.MeshStandardMaterial({ 
            color: this.woodColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Metal trim material
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: this.metalColor,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Lid dimensions
        const lidWidth = 1.0;
        const lidHeight = 0.3;
        const lidDepth = 0.7;
        
        // Main lid part
        const lid = new THREE.Mesh(
            new THREE.BoxGeometry(lidWidth, lidHeight, lidDepth),
            woodMaterial
        );
        lid.position.set(0, lidHeight / 2, lidDepth / 2);
        lid.castShadow = true;
        lid.receiveShadow = true;
        this.lidGroup.add(lid);
        
        // Lid trim
        const lidTrim = new THREE.Mesh(
            new THREE.BoxGeometry(lidWidth + 0.05, 0.05, lidDepth + 0.05),
            metalMaterial
        );
        lidTrim.position.set(0, 0, lidDepth / 2);
        lidTrim.castShadow = true;
        this.lidGroup.add(lidTrim);
        
        // Hinges
        const hingeWidth = 0.2;
        const hingePositions = [-lidWidth / 2 + 0.2, lidWidth / 2 - 0.2];
        
        hingePositions.forEach(x => {
            const hinge = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, hingeWidth, 8),
                metalMaterial
            );
            hinge.rotation.set(0, 0, Math.PI / 2);
            hinge.position.set(x, 0, 0);
            hinge.castShadow = true;
            this.lidGroup.add(hinge);
        });
        
        // Apply initial rotation based on open state
        this.lidGroup.rotation.x = this.lidAngle;
        
        this.mesh.add(this.lidGroup);
    }
    
    createLock() {
        // Lock material
        const lockMaterial = new THREE.MeshStandardMaterial({ 
            color: this.lockColor,
            roughness: 0.2,
            metalness: 0.8
        });
        
        // Lock base attached to the lid
        const lockBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.15, 0.05),
            lockMaterial
        );
        lockBase.position.set(0, 0.1, 0.05);
        lockBase.castShadow = true;
        this.lidGroup.add(lockBase);
        
        // Keyhole
        const keyhole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8),
            new THREE.MeshStandardMaterial({ color: "#000000" })
        );
        keyhole.rotation.set(Math.PI / 2, 0, 0);
        keyhole.position.set(0, 0.1, 0.08);
        this.lidGroup.add(keyhole);
        
        // Lock latch that connects to the base
        if (!this.isOpen) {
            const lockLatch = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.05, 0.25),
                lockMaterial
            );
            lockLatch.position.set(0, -0.05, 0.15);
            lockLatch.castShadow = true;
            this.lidGroup.add(lockLatch);
        }
    }
    
    createTreasure() {
        // Only show treasure if chest is open
        if (!this.isOpen && this.options.properties?.showTreasureWhenClosed !== true) {
            return;
        }
        
        this.treasureGroup = new THREE.Group();
        this.treasureGroup.position.set(0, 0.4, 0);
        
        // Create a pile of gold coins
        const coinCount = this.options.properties?.coinCount || 20;
        const coinMaterial = new THREE.MeshStandardMaterial({ 
            color: this.treasureColor,
            roughness: 0.2,
            metalness: 0.8,
            emissive: this.treasureColor,
            emissiveIntensity: 0.2
        });
        
        // Create the coins with random positions in the chest
        for (let i = 0; i < coinCount; i++) {
            const coin = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16),
                coinMaterial
            );
            
            // Position coins randomly in a pile
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 0.4;
            coin.position.set(
                Math.sin(angle) * distance,
                Math.random() * 0.2 - 0.2,
                Math.cos(angle) * distance
            );
            
            // Random rotation
            coin.rotation.set(
                Math.random() * Math.PI / 4,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI / 4
            );
            
            coin.castShadow = true;
            coin.receiveShadow = true;
            this.treasureGroup.add(coin);
        }
        
        // Add a few jewels
        const jewelColors = ["#FF0000", "#0000FF", "#00FF00", "#FF00FF"];
        const jewelCount = this.options.properties?.jewelCount || 5;
        
        for (let i = 0; i < jewelCount; i++) {
            const jewel = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.1),
                new THREE.MeshStandardMaterial({ 
                    color: jewelColors[i % jewelColors.length],
                    roughness: 0.1,
                    metalness: 0.9,
                    emissive: jewelColors[i % jewelColors.length],
                    emissiveIntensity: 0.3
                })
            );
            
            // Position jewels on top of coins
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 0.3;
            jewel.position.set(
                Math.sin(angle) * distance,
                0.05,
                Math.cos(angle) * distance
            );
            
            // Random rotation
            jewel.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            jewel.castShadow = true;
            this.treasureGroup.add(jewel);
        }
        
        this.mesh.add(this.treasureGroup);
    }
    
    createParticles() {
        // Create particles for a sparkling effect
        const particleGroup = new THREE.Group();
        
        for (let i = 0; i < this.particleCount; i++) {
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: this.treasureColor,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(this.particleSize, 4, 4),
                particleMaterial
            );
            
            // Position particles around the treasure
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * 0.5 + 0.3;
            const distance = Math.random() * 0.5;
            
            particle.position.set(
                Math.sin(angle) * distance,
                height,
                Math.cos(angle) * distance
            );
            
            // Store particle information for animation
            this.particles.push({
                mesh: particle,
                originalY: particle.position.y,
                speed: 0.2 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2
            });
            
            particleGroup.add(particle);
        }
        
        // Only show particles if chest is open
        particleGroup.visible = this.isOpen;
        this.particleGroup = particleGroup;
        this.mesh.add(particleGroup);
    }
    
    update(deltaTime) {
        // Skip animation if disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Smooth open/close animation
        if (this.isOpen && this.lidAngle < Math.PI * 0.4) {
            this.lidAngle += deltaTime * this.openingSpeed;
            if (this.lidAngle > Math.PI * 0.4) this.lidAngle = Math.PI * 0.4;
            this.lidGroup.rotation.x = this.lidAngle;
            
            // Show treasure and particles when chest opens
            if (this.treasureGroup && !this.treasureGroup.visible) {
                this.treasureGroup.visible = true;
            }
            if (this.particleGroup && !this.particleGroup.visible) {
                this.particleGroup.visible = true;
            }
        } else if (!this.isOpen && this.lidAngle > 0) {
            this.lidAngle -= deltaTime * this.openingSpeed;
            if (this.lidAngle < 0) this.lidAngle = 0;
            this.lidGroup.rotation.x = this.lidAngle;
            
            // Hide treasure and particles when chest closes
            if (this.lidAngle === 0) {
                if (this.treasureGroup && this.options.properties?.showTreasureWhenClosed !== true) {
                    this.treasureGroup.visible = false;
                }
                if (this.particleGroup) {
                    this.particleGroup.visible = false;
                }
            }
        }
        
        // Animate particles
        const time = performance.now() * 0.001;
        
        this.particles.forEach(particle => {
            // Move particles up and down gently
            particle.mesh.position.y = particle.originalY + Math.sin(time * particle.speed + particle.phase) * 0.1;
            
            // Pulse opacity
            particle.mesh.material.opacity = 0.4 + Math.sin(time * 2 * particle.speed + particle.phase) * 0.4;
            
            // Slight rotation
            particle.mesh.rotation.y += deltaTime * 2;
        });
    }
    
    // Handle click to open/close chest
    handleCollision(point) {
        const collision = super.handleCollision(point);
        
        if (collision.collided && this.options.properties?.interactive !== false) {
            // Toggle chest open/closed
            this.isOpen = !this.isOpen;
            
            // Play sound if provided
            if (this.options.properties?.playSoundOnOpen) {
                // Sound would be handled by game engine
                console.log("Chest " + (this.isOpen ? "opened" : "closed") + "!");
            }
            
            // Create treasure if it doesn't exist yet
            if (this.isOpen && !this.treasureGroup) {
                this.createTreasure();
            }
            
            // Create particles if they don't exist yet
            if (this.isOpen && !this.particleGroup && this.options.properties?.showParticles !== false) {
                this.createParticles();
            }
        }
        
        return collision;
    }
}
