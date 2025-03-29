/*
 * Crystal Formation Model for Three.js
 * A glowing crystalline structure that pulses with energy
 */

export default class CrystalFormationModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Crystal properties
        this.pulseFrequency = options.properties?.pulseFrequency || 1.0;
        this.glowIntensity = options.properties?.glowIntensity || 0.8;
        this.crystallineCount = options.properties?.crystallineCount || 7;
        
        // Animation properties
        this.pulseTime = 0;
        this.crystals = [];
        
        // Crystal colors
        this.primaryColor = options.visualProperties?.color || 
                           options.properties?.primaryColor || 
                           "#7851a9"; // Purple default
                           
        this.secondaryColor = options.visualProperties?.secondaryColor || 
                             options.properties?.secondaryColor || 
                             "#00ffff"; // Cyan glow
        
        this.beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10);
        this.beamMaterial = new THREE.MeshBasicMaterial({  
            color: this.secondaryColor,
            emissive: this.secondaryColor,
            emissiveIntensity: this.glowIntensity,
            transparent: true,
            opacity: 0.4
        });
        this.beam = null;
    }

    async init() {
        // Create base/foundation
        this.createBase();
        
        // Create crystals
        this.createCrystals();
        
        // Create ambient light effect
        this.createGlowEffect();
        
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
    
    createBase() {
        // Create rocky base
        const baseGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 6);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: "#555555",
            roughness: 0.9,
            metalness: 0.2
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        this.addPart(base);
    }
    
    createCrystals() {
        // Create varying crystal structures
        for (let i = 0; i < this.crystallineCount; i++) {
            // Random parameters for each crystal
            const height = 1.5 + Math.random() * 3;
            const width = 0.3 + Math.random() * 0.5;
            const segments = 4 + Math.floor(Math.random() * 3);
            
            // Create crystal geometry
            const crystalGeometry = new THREE.ConeGeometry(width, height, segments);
            
            // Create crystal material with emissive properties
            const crystalMaterial = new THREE.MeshStandardMaterial({
                color: this.primaryColor,
                emissive: this.secondaryColor,
                emissiveIntensity: 0.4,
                metalness: 0.9,
                roughness: 0.2,
                transparent: true,
                opacity: 0.8
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position randomly on the base
            const angle = (i / this.crystallineCount) * Math.PI * 2;
            const radius = 0.8 + Math.random() * 0.7;
            
            crystal.position.x = Math.cos(angle) * radius;
            crystal.position.z = Math.sin(angle) * radius;
            crystal.position.y = height / 2;
            
            // Random rotation
            crystal.rotation.x = (Math.random() - 0.5) * 0.5;
            crystal.rotation.z = (Math.random() - 0.5) * 0.5;
            
            crystal.castShadow = true;
            this.mesh.add(crystal);
            this.addPart(crystal);
            
            // Store for animation
            this.crystals.push({
                mesh: crystal,
                initialEmissive: 0.4,
                phaseDifference: Math.random() * Math.PI * 2
            });
        }
    }
    
    createGlowEffect() {
        // Create central glow effect
        const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: this.secondaryColor,
            emissive: this.secondaryColor,
            emissiveIntensity: this.glowIntensity,
            transparent: true,
            opacity: 0.4
        });
        
        this.glowEffect = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowEffect.position.y = 1.5;
        this.mesh.add(this.glowEffect);
        this.addPart(this.glowEffect);
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Update pulse time
        this.pulseTime += deltaTime * this.pulseFrequency;
        
        // Animate crystals
        this.crystals.forEach(crystal => {
            const pulseFactor = Math.sin(this.pulseTime + crystal.phaseDifference) * 0.5 + 0.5;
            
            // Update emissive intensity
            crystal.mesh.material.emissiveIntensity = crystal.initialEmissive + pulseFactor * 0.6;
            
            // Subtle scale pulsing
            const scale = 1 + pulseFactor * 0.1;
            crystal.mesh.scale.set(scale, 1, scale);
        });
        
        // Animate central glow
        if (this.glowEffect) {
            const glowPulse = Math.sin(this.pulseTime * 1.5) * 0.5 + 0.5;
            this.glowEffect.material.emissiveIntensity = this.glowIntensity * (0.7 + glowPulse * 0.5);
            this.glowEffect.scale.set(1 + glowPulse * 0.2, 1 + glowPulse * 0.2, 1 + glowPulse * 0.2);
        }

        if (this.beam) {
            this.beam.position.z += 0.1;
            this.beam.scale.set(1 + (this.beam.position.distanceTo(this.mesh.position) / 10), 1 + (this.beam.position.distanceTo(this.mesh.position) / 10), 1 + (this.beam.position.distanceTo(this.mesh.position) / 10));
            this.beam.lookAt(this.beam.position);
            if (this.beam.position.distanceTo(this.mesh.position) < 0.1) {
                this.beam.visible = false;
                this.beam.geometry.dispose();
                this.beam.material.dispose();
                this.beam = null;
            }
        }
    }
    
    // Custom energy beam emission function
    emitEnergyBeam(targetPosition) {
        if (!this.beam) {
            this.beam = new THREE.Mesh(this.beamGeometry, this.beamMaterial);
            this.mesh.add(this.beam);
            this.addPart(this.beam);
        }
        this.beam.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
        this.beam.lookAt(targetPosition);
    }
    
    handleCollision(point) {
        const collision = super.handleCollision(point);
        collision.energyLevel = this.glowIntensity * (Math.sin(this.pulseTime) * 0.5 + 0.5);

        if (collision.collided) {
            // the entire color should change to be red
            this.crystals.forEach(crystal => {
                crystal.mesh.material.color.set("#ffaaaa");
                crystal.mesh.material.emissive.set("#ffaaaa");
                crystal.mesh.material.emissiveIntensity = 1;
            });
            // make the glow effect red
            //this.emitEnergyBeam(collision.point);
            
            setTimeout(() => {
                this.crystals.forEach(crystal => {
                    crystal.mesh.material.color.set(this.primaryColor);
                    crystal.mesh.material.emissive.set(this.secondaryColor);
                    crystal.mesh.material.emissiveIntensity = 0.4;
                });
            }, 1000);
        }
        return collision;
    }
}