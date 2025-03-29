export default class CrystalFormation extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.primaryColor = options.visualProperties?.primaryColor || 
                            options.properties?.primaryColor || 
                            "#9370DB"; // Medium purple
        this.secondaryColor = options.visualProperties?.secondaryColor || 
                              options.properties?.secondaryColor || 
                              "#E6E6FA"; // Lavender
        this.glowColor = options.visualProperties?.glowColor || 
                         options.properties?.glowColor || 
                         "#FFFFFF";
        
        // Properties
        this.size = options.properties?.size || 3;
        this.complexity = options.properties?.complexity || 5;
        this.emissiveIntensity = options.properties?.emissiveIntensity || 0.7;
        this.pulseSpeed = options.properties?.pulseSpeed || 1.5;
        this.rotationSpeed = options.properties?.rotationSpeed || 0.3;
        
        // Animation state
        this.crystals = [];
        this.time = 0;
    }

    async init() {
        this.createBase();
        this.createCrystals();
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
    
    createBase() {
        // Stone base
        const baseGeometry = new THREE.CylinderGeometry(
            this.size * 0.8, 
            this.size * 1.2, 
            this.size * 0.6, 
            6, 1
        );
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: "#696969", // Dim gray
            roughness: 0.9,
            metalness: 0.1
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = this.size * 0.3;
        base.castShadow = true;
        base.receiveShadow = true;
        this.addPart(base);
        
        // Add some small rocks around the base
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.size * (0.9 + Math.random() * 0.3);
            
            const rockSize = this.size * (0.1 + Math.random() * 0.15);
            const rockGeometry = new THREE.BoxGeometry(
                rockSize, rockSize, rockSize
            );
            
            // Distort the rock geometry slightly
            const positionAttribute = rockGeometry.getAttribute('position');
            const positions = positionAttribute.array;
            
            for (let j = 0; j < positions.length; j += 3) {
                positions[j] += (Math.random() - 0.5) * 0.2;
                positions[j + 1] += (Math.random() - 0.5) * 0.2;
                positions[j + 2] += (Math.random() - 0.5) * 0.2;
            }
            positionAttribute.needsUpdate = true;
            
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: "#808080", // Gray
                roughness: 0.8,
                metalness: 0.2
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.x = Math.cos(angle) * radius;
            rock.position.z = Math.sin(angle) * radius;
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.addPart(rock);
        }
    }
    
    createCrystals() {
        // Create main crystal cluster
        for (let i = 0; i < this.complexity; i++) {
            // Determine crystal size and angle
            const height = this.size * (0.8 + Math.random() * 1.2);
            const width = height * (0.2 + Math.random() * 0.3);
            const angle = (i / this.complexity) * Math.PI * 2;
            const radius = this.size * 0.4 * Math.random();
            
            // Create crystal geometry
            const crystalGeometry = new THREE.ConeGeometry(
                width,
                height,
                6,
                1,
                false
            );
            
            // Alternate between primary and secondary colors
            const color = i % 2 === 0 ? this.primaryColor : this.secondaryColor;
            const opacity = i % 2 === 0 ? 0.9 : 0.7;
            
            const crystalMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                roughness: 0.1,
                metalness: 0.8,
                emissive: color,
                emissiveIntensity: this.emissiveIntensity * 0.3
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position and rotate the crystal
            crystal.position.set(
                Math.cos(angle) * radius,
                this.size * 0.6 + Math.random() * this.size * 0.3,
                Math.sin(angle) * radius
            );
            
            // Tilt the crystal slightly outward
            crystal.rotation.set(
                (Math.random() - 0.5) * 0.5,
                angle + Math.PI,
                (Math.random() - 0.5) * 0.5 + Math.PI * 0.1
            );
            
            crystal.castShadow = true;
            this.addPart(crystal);
            this.crystals.push({
                mesh: crystal,
                initialEmissive: this.emissiveIntensity * 0.3,
                phaseOffset: Math.random() * Math.PI * 2,
                initialY: crystal.position.y
            });
            
            // Sometimes add a smaller crystal next to this one
            if (Math.random() > 0.5) {
                const smallCrystal = new THREE.Mesh(
                    new THREE.ConeGeometry(width * 0.6, height * 0.6, 6, 1),
                    crystalMaterial.clone()
                );
                
                // Position next to the main crystal
                const smallAngle = angle + (Math.random() - 0.5) * 0.5;
                const smallRadius = radius + width * 0.8;
                
                smallCrystal.position.set(
                    Math.cos(smallAngle) * smallRadius,
                    crystal.position.y - height * 0.3,
                    Math.sin(smallAngle) * smallRadius
                );
                
                smallCrystal.rotation.set(
                    crystal.rotation.x + (Math.random() - 0.5) * 0.3,
                    smallAngle + Math.PI,
                    crystal.rotation.z + (Math.random() - 0.5) * 0.3
                );
                
                smallCrystal.castShadow = true;
                this.addPart(smallCrystal);
                this.crystals.push({
                    mesh: smallCrystal,
                    initialEmissive: this.emissiveIntensity * 0.3,
                    phaseOffset: Math.random() * Math.PI * 2,
                    initialY: smallCrystal.position.y
                });
            }
        }
    }
    
    createGlowingEffects() {
        // Create a central energy core
        const coreGeometry = new THREE.SphereGeometry(this.size * 0.3, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: this.glowColor,
            emissive: this.glowColor,
            emissiveIntensity: this.emissiveIntensity,
            transparent: true,
            opacity: 0.7
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = this.size * 0.8;
        this.addPart(core);
        this.core = core;
        
        // Add energy particles around the crystals
        const numParticles = this.complexity * 3;
        for (let i = 0; i < numParticles; i++) {
            const particleSize = this.size * 0.05 * (0.5 + Math.random() * 0.5);
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(particleSize, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: this.glowColor,
                    emissive: this.glowColor,
                    emissiveIntensity: this.emissiveIntensity,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Random position around the formation
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = this.size * (0.8 + Math.random() * 0.5);
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = this.size * 0.8 + radius * 0.5 * Math.cos(phi);
            particle.position.z = radius * Math.sin(phi) * Math.sin(theta);
            
            this.addPart(particle);
            this.crystals.push({
                mesh: particle,
                isParticle: true,
                initialPosition: particle.position.clone(),
                radius: radius * 0.3,
                speed: 1 + Math.random(),
                initialY: particle.position.y,
                phaseOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        this.time += deltaTime;
        
        // Animate the crystals
        this.crystals.forEach(crystal => {
            if (crystal.mesh.material && crystal.mesh.material.emissiveIntensity) {
                // Pulsing glow effect
                crystal.mesh.material.emissiveIntensity = crystal.initialEmissive + 
                    (Math.sin(this.time * this.pulseSpeed + crystal.phaseOffset) * 0.3);
            }
            
            if (crystal.isParticle) {
                // Floating particles motion
                const initialPos = crystal.initialPosition;
                crystal.mesh.position.x = initialPos.x + Math.sin(this.time * 0.8 + crystal.phaseOffset) * crystal.radius;
                crystal.mesh.position.y = crystal.initialY + Math.cos(this.time * crystal.speed + crystal.phaseOffset) * (crystal.radius * 0.5);
                crystal.mesh.position.z = initialPos.z + Math.cos(this.time * 0.7 + crystal.phaseOffset) * crystal.radius;
            } else {
                // Subtle crystal movement
                crystal.mesh.position.y = crystal.initialY + Math.sin(this.time * 0.5 + crystal.phaseOffset) * 0.05;
            }
        });
        
        // Rotate the whole formation slightly
        if (this.options.properties?.rotate !== false) {
            this.mesh.rotation.y += deltaTime * this.rotationSpeed;
        }
        
        // Animate the core
        if (this.core) {
            // Pulsating size
            const scale = 1 + Math.sin(this.time * this.pulseSpeed) * 0.1;
            this.core.scale.set(scale, scale, scale);
            
            // Pulsating glow
            if (this.core.material.emissiveIntensity) {
                this.core.material.emissiveIntensity = 
                    this.emissiveIntensity * (0.8 + Math.sin(this.time * this.pulseSpeed * 1.5) * 0.2);
            }
        }
    }
}