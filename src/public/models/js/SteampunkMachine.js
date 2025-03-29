/*
 * Steampunk Machine Model for Three.js
 * An elaborate mechanical contraption with moving gears, pistons, and steam
 */

export default class SteampunkMachineModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Machine properties
        this.gearCount = options.properties?.gearCount || 6;
        this.pistonCount = options.properties?.pistonCount || 2;
        this.machineSpeed = options.properties?.machineSpeed || 1;
        this.smokeEnabled = options.properties?.smokeEnabled !== false; // Default true
        
        // Animation properties
        this.rotationTime = 0;
        this.gears = [];
        this.pistons = [];
        this.smokeParticles = [];
        
        // Colors
        this.brassColor = options.visualProperties?.color || 
                         options.properties?.brassColor || 
                         "#D4AF37"; // Brass gold
                         
        this.copperColor = options.visualProperties?.copperColor || 
                          options.properties?.copperColor || 
                          "#B87333"; // Copper
                          
        this.ironColor = options.visualProperties?.ironColor || 
                         options.properties?.ironColor || 
                         "#71797E"; // Iron gray
                         
        this.steamColor = options.visualProperties?.steamColor || 
                         options.properties?.steamColor || 
                         "#F5F5F5"; // White smoke
    }

    async init() {
        // Create the machine base
        this.createBase();
        
        // Create gears and mechanical parts
        this.createGears();
        
        // Create pistons
        this.createPistons();
        
        // Create pipes and boiler
        this.createBoilerAndPipes();
        
        // Create steam/smoke particles
        if (this.smokeEnabled) {
            this.createSteamEffects();
        }
        
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
        // Create a platform base for the machine
        const baseGeometry = new THREE.BoxGeometry(4, 0.5, 3);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: this.ironColor,
            roughness: 0.7,
            metalness: 0.6
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.25; // Half height
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        this.addPart(base);
        
        // Add some base details (bolts, etc)
        for (let x = -1.5; x <= 1.5; x += 1) {
            for (let z = -1; z <= 1; z += 1) {
                const boltGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 6);
                const boltMaterial = new THREE.MeshStandardMaterial({
                    color: this.brassColor,
                    roughness: 0.5,
                    metalness: 0.8
                });
                
                const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
                bolt.position.set(x, 0.05, z);
                this.mesh.add(bolt);
                this.addPart(bolt);
            }
        }
    }
    
    createGears() {
        // Create various gears at different positions
        for (let i = 0; i < this.gearCount; i++) {
            // Parameters for this gear
            const isLarge = i < this.gearCount / 2;
            const radius = isLarge ? 0.6 + Math.random() * 0.3 : 0.3 + Math.random() * 0.2;
            const thickness = 0.1 + Math.random() * 0.1;
            const teethCount = Math.floor(radius * 20); // More teeth for bigger gears
            
            // Create gear geometry (simplified as a cylinder with a smaller inner cylinder)
            const gearGeometry = new THREE.CylinderGeometry(radius, radius, thickness, teethCount);
            const gearMaterial = new THREE.MeshStandardMaterial({
                color: i % 2 === 0 ? this.brassColor : this.copperColor,
                roughness: 0.4,
                metalness: 0.8
            });
            
            const gear = new THREE.Mesh(gearGeometry, gearMaterial);
            
            // Add gear teeth (small boxes around the edge)
            const teethGeometry = new THREE.BoxGeometry(0.1, thickness, 0.2);
            const teethMaterial = new THREE.MeshStandardMaterial({
                color: gearMaterial.color,
                roughness: 0.4,
                metalness: 0.8
            });
            
            for (let t = 0; t < teethCount; t++) {
                const angle = (t / teethCount) * Math.PI * 2;
                const tooth = new THREE.Mesh(teethGeometry, teethMaterial);
                
                tooth.position.x = Math.cos(angle) * (radius + 0.05);
                tooth.position.z = Math.sin(angle) * (radius + 0.05);
                tooth.rotation.y = angle;
                
                gear.add(tooth);
            }
            
            // Add center hole
            const holeGeometry = new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, thickness + 0.01, 12);
            const holeMaterial = new THREE.MeshStandardMaterial({
                color: this.ironColor,
                roughness: 0.6,
                metalness: 0.7
            });
            
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            gear.add(hole);
            
            // Position gear
            let posX, posY, posZ;
            
            if (isLarge) {
                // Main gears on vertical plane
                const angle = (i / (this.gearCount / 2)) * Math.PI * 0.6 - Math.PI * 0.3;
                posX = Math.cos(angle) * 1.2;
                posY = 1 + Math.sin(angle) * 1.2;
                posZ = 0.5;
                
                // Rotate to be vertical
                gear.rotation.x = Math.PI / 2;
            } else {
                // Smaller gears on horizontal plane
                const angle = (i / (this.gearCount / 2)) * Math.PI - Math.PI / 2;
                posX = Math.cos(angle) * 0.8;
                posY = 0.5;
                posZ = Math.sin(angle) * 0.8;
            }
            
            gear.position.set(posX, posY, posZ);
            gear.castShadow = true;
            this.mesh.add(gear);
            this.addPart(gear);
            
            // Store for animation
            this.gears.push({
                mesh: gear,
                radius: radius,
                speed: (isLarge ? 1 : -2) * (Math.random() * 0.5 + 0.8) // Opposite directions for meshing
            });
        }
    }
    
    createPistons() {
        // Create pistons that move up and down
        for (let i = 0; i < this.pistonCount; i++) {
            // Piston group
            const pistonGroup = new THREE.Group();
            pistonGroup.position.set(
                -1 + i * 2,  // Evenly space pistons
                0.5,         // Base height
                -0.8         // Front of machine
            );
            this.mesh.add(pistonGroup);
            
            // Piston cylinder
            const cylinderGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1, 12);
            const cylinderMaterial = new THREE.MeshStandardMaterial({
                color: this.ironColor,
                roughness: 0.5,
                metalness: 0.7
            });
            
            const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
            cylinder.position.y = 0.5; // Move up half height
            cylinder.rotation.x = Math.PI / 2; // Rotate to horizontal
            pistonGroup.add(cylinder);
            this.addPart(cylinder);
            
            // Piston rod that moves
            const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
            const rodMaterial = new THREE.MeshStandardMaterial({
                color: this.brassColor,
                roughness: 0.3,
                metalness: 0.9
            });
            
            const rod = new THREE.Mesh(rodGeometry, rodMaterial);
            rod.position.z = 0; // Will be animated
            rod.rotation.x = Math.PI / 2; // Rotate to horizontal
            pistonGroup.add(rod);
            this.addPart(rod);
            
            // Piston head
            const headGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12);
            const headMaterial = new THREE.MeshStandardMaterial({
                color: this.copperColor,
                roughness: 0.4,
                metalness: 0.8
            });
            
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.z = -0.75; // End of the rod
            head.rotation.x = Math.PI / 2; // Rotate to horizontal
            rod.add(head);
            this.addPart(head);
            
            // Store for animation
            this.pistons.push({
                rod: rod,
                phase: i * Math.PI, // Offset phases
                amplitude: 0.3      // Movement amount
            });
        }
    }
    
    createBoilerAndPipes() {
        // Create main boiler tank
        const boilerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16);
        const boilerMaterial = new THREE.MeshStandardMaterial({
            color: this.copperColor,
            roughness: 0.3,
            metalness: 0.8
        });
        
        const boiler = new THREE.Mesh(boilerGeometry, boilerMaterial);
        boiler.position.set(0, 1.5, -0.5);
        boiler.rotation.x = Math.PI / 2; // Horizontal
        boiler.castShadow = true;
        this.mesh.add(boiler);
        this.addPart(boiler);
        
        // Add boiler details (pressure gauge, hatch, etc)
        
        // Pressure gauge
        const gaugeBaseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12);
        const gaugeMaterial = new THREE.MeshStandardMaterial({
            color: this.brassColor,
            roughness: 0.3,
            metalness: 0.9
        });
        
        const gaugeBase = new THREE.Mesh(gaugeBaseGeometry, gaugeMaterial);
        gaugeBase.position.set(0, 1.5, 0.3);
        gaugeBase.rotation.x = Math.PI / 2;
        this.mesh.add(gaugeBase);
        this.addPart(gaugeBase);
        
        const gaugeGeometry = new THREE.CircleGeometry(0.12, 12);
        const gaugeFaceMaterial = new THREE.MeshStandardMaterial({
            color: "#ffffff",
            roughness: 0.4,
            metalness: 0.1
        });
        
        const gauge = new THREE.Mesh(gaugeGeometry, gaugeFaceMaterial);
        gauge.position.set(0, 1.5, 0.36);
        gauge.rotation.x = Math.PI / 2;
        this.mesh.add(gauge);
        this.addPart(gauge);
        
        // Needle
        const needleGeometry = new THREE.BoxGeometry(0.01, 0.08, 0.01);
        const needleMaterial = new THREE.MeshStandardMaterial({
            color: "#ff0000",
            roughness: 0.4,
            metalness: 0.4
        });
        
        this.gaugeNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
        this.gaugeNeedle.position.set(0, 1.5, 0.37);
        this.gaugeNeedle.rotation.x = Math.PI / 2;
        this.mesh.add(this.gaugeNeedle);
        this.addPart(this.gaugeNeedle);
        
        // Connect pipes between components
        this.createPipe(
            new THREE.Vector3(0, 1.5, 0), // Boiler center
            new THREE.Vector3(-1, 0.5, -0.8), // First piston
            0.1 // Pipe radius
        );
        
        if (this.pistonCount > 1) {
            this.createPipe(
                new THREE.Vector3(0, 1.5, 0), // Boiler center
                new THREE.Vector3(1, 0.5, -0.8), // Second piston
                0.1 // Pipe radius
            );
        }
        
        // Create steam release valve on top
        const valveGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8);
        const valve = new THREE.Mesh(valveGeometry, boilerMaterial);
        valve.position.set(0, 2.2, -0.5);
        this.mesh.add(valve);
        this.addPart(valve);
        
        // Steam release point
        this.steamReleasePoint = new THREE.Vector3(0, 2.4, -0.5);
    }
    
    createPipe(start, end, radius) {
        // Create a pipe between two points
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        // Create pipe as a cylinder
        const pipeGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: this.copperColor,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        
        // Position at midpoint
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        pipe.position.copy(midpoint);
        
        // Orient cylinder to connect the points
        pipe.lookAt(end);
        pipe.rotateX(Math.PI / 2); // Adjust for cylinder's default orientation
        
        pipe.castShadow = true;
        this.mesh.add(pipe);
        this.addPart(pipe);
        
        // Add flanges at connection points
        const flangeGeometry = new THREE.CylinderGeometry(radius * 1.5, radius * 1.5, 0.05, 8);
        const flangeMaterial = new THREE.MeshStandardMaterial({
            color: this.brassColor,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const startFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
        startFlange.position.copy(start);
        startFlange.lookAt(end);
        startFlange.rotateX(Math.PI / 2);
        this.mesh.add(startFlange);
        this.addPart(startFlange);
        
        const endFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
        endFlange.position.copy(end);
        endFlange.lookAt(start);
        endFlange.rotateX(Math.PI / 2);
        this.mesh.add(endFlange);
        this.addPart(endFlange);
    }
    
    createSteamEffects() {
        // Create steam particles
        const particleCount = 15;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshStandardMaterial({
            color: this.steamColor,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Hide initially
            particle.visible = false;
            
            this.mesh.add(particle);
            this.addPart(particle);
            
            // Track for animation
            this.smokeParticles.push({
                mesh: particle,
                life: 0,
                maxLife: 2 + Math.random(),
                speed: 0.5 + Math.random() * 0.5,
                active: false
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Update rotation time
        this.rotationTime += deltaTime * this.machineSpeed;
        
        // Animate gears
        this.gears.forEach(gear => {
            gear.mesh.rotation.z += deltaTime * gear.speed * this.machineSpeed;
        });
        
        // Animate pistons
        this.pistons.forEach(piston => {
            // Oscillating motion
            const position = Math.sin(this.rotationTime * 2 + piston.phase) * piston.amplitude;
            piston.rod.position.z = position;
        });
        
        // Animate gauge needle
        if (this.gaugeNeedle) {
            // Wobbling gauge
            const gaugeRotation = Math.sin(this.rotationTime) * 0.2 + Math.PI / 4;
            this.gaugeNeedle.rotation.z = gaugeRotation;
        }
        
        // Animate steam particles
        if (this.smokeEnabled) {
            // Steam release frequency
            const steamProbability = deltaTime * 3 * this.machineSpeed;
            
            // Possibly create new steam particle
            if (Math.random() < steamProbability) {
                // Find an inactive particle
                const inactiveParticle = this.smokeParticles.find(p => !p.active);
                if (inactiveParticle) {
                    inactiveParticle.active = true;
                    inactiveParticle.life = 0;
                    inactiveParticle.mesh.visible = true;
                    inactiveParticle.mesh.position.copy(this.steamReleasePoint);
                    
                    // Reset scale and opacity
                    inactiveParticle.mesh.scale.set(0.1, 0.1, 0.1);
                    inactiveParticle.mesh.material.opacity = 0.6;
                }
            }
            
            // Update active particles
            this.smokeParticles.forEach(particle => {
                if (particle.active) {
                    particle.life += deltaTime;
                    
                    // Move upward
                    particle.mesh.position.y += deltaTime * particle.speed;
                    
                    // Add some drift
                    particle.mesh.position.x += deltaTime * (Math.random() - 0.5) * 0.3;
                    particle.mesh.position.z += deltaTime * (Math.random() - 0.5) * 0.3;
                    
                    // Expand and fade
                    const lifeRatio = particle.life / particle.maxLife;
                    const scale = 0.1 + lifeRatio * 0.4;
                    particle.mesh.scale.set(scale, scale, scale);
                    
                    // Fade out
                    particle.mesh.material.opacity = 0.6 * (1 - lifeRatio);
                    
                    // Deactivate if lifetime expired
                    if (particle.life >= particle.maxLife) {
                        particle.active = false;
                        particle.mesh.visible = false;
                    }
                }
            });
        }
    }
    
    // Make the machine work faster
    increaseSpeed() {
        this.machineSpeed = Math.min(this.machineSpeed * 1.5, 5);
        console.log('Machine speed increased to', this.machineSpeed);
    }
    
    // Make the machine work slower
    decreaseSpeed() {
        this.machineSpeed = Math.max(this.machineSpeed * 0.7, 0.1);
        console.log('Machine speed decreased to', this.machineSpeed);
    }
    
    handleCollision(point) {
        const collision = super.handleCollision(point);
        collision.isMachine = true;
        collision.machineSpeed = this.machineSpeed;

        // increase the speed of the machine for 1 second
        this.machineSpeed += 0.2;
        setTimeout(() => {
            this.machineSpeed -= 0.2;
        }, 1000);
        return collision;
    }
}