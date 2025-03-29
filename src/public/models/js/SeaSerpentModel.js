/*
 * Sea Serpent Model for Three.js
 * Features undulating movement and water effects
 * 
 * To be loaded by CustomTerrain class as a JS model
 */

export default class SeaSerpentModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Animation parameters
        this.undulateAmount = 0;
        this.undulateSpeed = 0.8;
        this.finWaveAmount = 0;
        this.finWaveSpeed = 1.2;
        this.breathingAmount = 0;
        this.breathingSpeed = 0.4;
        this.waterEffectAmount = 0;
        this.waterEffectSpeed = 1.0;
        
        // Store serpent segments for animation
        this.serpentParts = {};
        this.bodySegments = [];
        
        // Get color from visualProperties or fall back to custom property or default
        this.mainColor = options.visualProperties?.color || 
                         options.properties?.color || 
                         "#1a6178"; // Deep sea blue
                         
        this.accentColor = options.visualProperties?.accentColor || 
                          options.properties?.accentColor || 
                          "#5ae8d0"; // Aqua teal
                          
        this.finColor = options.visualProperties?.finColor || 
                       options.properties?.finColor || 
                       "#2bbed8"; // Lighter blue
                       
        // Water effects
        this.waterParticles = [];
        this.waterParticleSystem = null;
    }

    async init() {
        // Create serpent parts
        this.createSerpentHead();
        this.createSerpentBody();
        this.createSerpentFins();
        this.createSerpentSpines();
        this.createSerpentTail();
        this.createWaterEffects();
        
        // Apply scale from options if provided
        if (this.options.scale) {
            this.mesh.scale.set(
                this.options.scale.x || 1,
                this.options.scale.y || 1,
                this.options.scale.z || 1
            );
        }
        
        return true;
    }
    
    createSerpentHead() {
        // Create materials
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.mainColor,
            roughness: 0.6,
            metalness: 0.4
        });
        
        const jawMaterial = new THREE.MeshStandardMaterial({ 
            color: this.mainColor,
            roughness: 0.5,
            metalness: 0.3
        });
        
        const teethMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Create head group
        const headGroup = new THREE.Group();
        
        // Main head - elongated shape
        const headGeo = new THREE.SphereGeometry(2, 16, 16);
        const head = new THREE.Mesh(headGeo, headMaterial);
        head.scale.set(1.2, 0.8, 1.5);
        head.position.z = -8;
        head.castShadow = true;
        headGroup.add(head);
        this.addPart(head);
        
        // Lower jaw
        const jawGeo = new THREE.ConeGeometry(1.5, 3, 8, 1, true);
        const jaw = new THREE.Mesh(jawGeo, jawMaterial);
        jaw.rotation.x = Math.PI; // Flip cone
        jaw.position.set(0, -0.8, -9);
        jaw.scale.set(1, 0.5, 1.5);
        jaw.castShadow = true;
        headGroup.add(jaw);
        this.serpentParts.jaw = jaw;
        this.addPart(jaw);
        
        // Teeth
        for (let i = 0; i < 8; i++) {
            // Upper teeth
            const upperToothGeo = new THREE.ConeGeometry(0.15, 0.4, 6);
            const upperTooth = new THREE.Mesh(upperToothGeo, teethMaterial);
            const angle = (i / 8) * Math.PI * 0.8 - Math.PI * 0.4;
            upperTooth.position.set(
                Math.sin(angle) * 1.5, 
                -0.3,
                Math.cos(angle) * 1.5 - 9
            );
            upperTooth.rotation.x = Math.PI / 2;
            upperTooth.castShadow = true;
            headGroup.add(upperTooth);
            this.addPart(upperTooth);
            
            // Lower teeth (on jaw)
            if (i % 2 === 0) {
                const lowerToothGeo = new THREE.ConeGeometry(0.15, 0.4, 6);
                const lowerTooth = new THREE.Mesh(lowerToothGeo, teethMaterial);
                const lowerAngle = (i / 8) * Math.PI * 0.8 - Math.PI * 0.4;
                lowerTooth.position.set(
                    Math.sin(lowerAngle) * 1.3, 
                    -1.1,
                    Math.cos(lowerAngle) * 1.3 - 9
                );
                lowerTooth.rotation.x = -Math.PI / 2;
                lowerTooth.castShadow = true;
                headGroup.add(lowerTooth);
                this.addPart(lowerTooth);
            }
        }
        
        // Eyes
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            roughness: 0.3
        });
        
        // Create serpent eyes
        const eyeGeometry = new THREE.SphereGeometry(0.4, 16, 16);

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(1.2, 0, -8.5);
        headGroup.add(leftEye);
        this.addPart(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-1.2, 0, -8.5);
        headGroup.add(rightEye);
        this.addPart(rightEye);
        
        // Add slit pupils
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftPupil = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 0.8),
            pupilMaterial
        );
        leftPupil.position.set(1.2, 0, -8.3);
        leftPupil.rotation.y = Math.PI;
        headGroup.add(leftPupil);
        this.addPart(leftPupil);
        
        const rightPupil = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 0.8),
            pupilMaterial
        );
        rightPupil.position.set(-1.2, 0, -8.3);
        rightPupil.rotation.y = Math.PI;
        headGroup.add(rightPupil);
        this.addPart(rightPupil);
        
        // Horns/crests
        const hornMaterial = new THREE.MeshStandardMaterial({
            color: this.accentColor,
            roughness: 0.4,
            metalness: 0.6
        });
        
        for (let i = 0; i < 3; i++) {
            const hornSize = 1 - i * 0.2;
            const hornGeo = new THREE.ConeGeometry(0.3 * hornSize, 1.2 * hornSize, 8);
            const horn = new THREE.Mesh(hornGeo, hornMaterial);
            horn.position.set(0, 0.5 + i * 0.6, -7.5 - i * 0.3);
            horn.rotation.x = -Math.PI / 4;
            horn.castShadow = true;
            headGroup.add(horn);
            this.addPart(horn);
        }
        
        this.serpentParts.head = headGroup;
        this.mesh.add(headGroup);
    }
    
    createSerpentBody() {
        const segments = 12; // Number of body segments
        const segmentLength = 2.5; // Length of each segment
        const startRadius = 1.8; // Radius at the head
        const endRadius = 0.8; // Radius at the tail
        
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.mainColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const bodyGroup = new THREE.Group();
        
        // Create body segments
        for (let i = 0; i < segments; i++) {
            const segmentGroup = new THREE.Group();
            
            // Calculate radius for this segment (tapers toward tail)
            const ratio = i / (segments - 1);
            const radius = startRadius * (1 - ratio) + endRadius * ratio;
            
            // Main segment cylinder
            const segmentGeo = new THREE.CylinderGeometry(
                radius, 
                radius * 0.95, // Slight taper for each segment
                segmentLength,
                12
            );
            
            const segment = new THREE.Mesh(segmentGeo, bodyMaterial);
            segment.rotation.x = Math.PI / 2; // Align cylinder with z-axis
            segment.castShadow = true;
            segmentGroup.add(segment);
            this.addPart(segment);
            
            // Position the segment
            const zPos = -6 + i * segmentLength;
            segmentGroup.position.z = zPos;
            
            // Store for animation
            this.bodySegments.push(segmentGroup);
            bodyGroup.add(segmentGroup);
        }
        
        this.serpentParts.body = bodyGroup;
        this.mesh.add(bodyGroup);
    }
    
    createSerpentFins() {
        const finMaterial = new THREE.MeshStandardMaterial({
            color: this.finColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            roughness: 0.4,
            metalness: 0.2
        });
        
        const finGroup = new THREE.Group();
        
        // Create dorsal fin (on top)
        const dorsalShape = new THREE.Shape();
        dorsalShape.moveTo(0, 0);
        dorsalShape.quadraticCurveTo(4, 5, 8, 0);
        dorsalShape.lineTo(0, 0);
        
        const dorsalGeo = new THREE.ShapeGeometry(dorsalShape);
        const dorsalFin = new THREE.Mesh(dorsalGeo, finMaterial);
        dorsalFin.rotation.y = Math.PI / 2;
        dorsalFin.position.set(0, 2, 0);
        dorsalFin.scale.set(0.7, 0.7, 1);
        dorsalFin.castShadow = true;
        this.serpentParts.dorsalFin = dorsalFin;
        finGroup.add(dorsalFin);
        this.addPart(dorsalFin);
        
        // Create side fins
        const sideFinShape = new THREE.Shape();
        sideFinShape.moveTo(0, 0);
        sideFinShape.lineTo(0, -3);
        sideFinShape.quadraticCurveTo(4, -4, 6, -1);
        sideFinShape.lineTo(0, 0);
        
        // Left fin
        const leftFinGeo = new THREE.ShapeGeometry(sideFinShape);
        const leftFin = new THREE.Mesh(leftFinGeo, finMaterial);
        leftFin.rotation.y = Math.PI / 2;
        leftFin.rotation.z = Math.PI / 6;
        leftFin.position.set(2, 0, -2);
        leftFin.castShadow = true;
        this.serpentParts.leftFin = leftFin;
        finGroup.add(leftFin);
        this.addPart(leftFin);
        
        // Right fin (mirror of left)
        const rightFinGeo = new THREE.ShapeGeometry(sideFinShape);
        const rightFin = new THREE.Mesh(rightFinGeo, finMaterial);
        rightFin.rotation.y = Math.PI / 2;
        rightFin.rotation.z = -Math.PI / 6;
        rightFin.position.set(-2, 0, -2);
        rightFin.castShadow = true;
        this.serpentParts.rightFin = rightFin;
        finGroup.add(rightFin);
        this.addPart(rightFin);
        
        this.mesh.add(finGroup);
    }
    
    createSerpentSpines() {
        const spineMaterial = new THREE.MeshStandardMaterial({
            color: this.accentColor,
            roughness: 0.4,
            metalness: 0.6
        });
        
        const spineGroup = new THREE.Group();
        
        // Create spines along the back
        const spineCount = 20;
        const spineLength = 30; // Total length to place spines along
        
        for (let i = 0; i < spineCount; i++) {
            // Calculate spine size (larger in middle, smaller at ends)
            const position = i / (spineCount - 1);
            const size = Math.sin(position * Math.PI) * 0.8 + 0.2;
            
            const spineGeo = new THREE.ConeGeometry(0.15 * size, 1 * size, 6);
            const spine = new THREE.Mesh(spineGeo, spineMaterial);
            
            // Position along the body
            const zPos = -7 + position * spineLength;
            spine.position.set(0, 1.8 * (1 - position * 0.3), zPos);
            spine.rotation.x = Math.PI * 0.15;
            spine.castShadow = true;
            
            spineGroup.add(spine);
            this.addPart(spine);
        }
        
        this.serpentParts.spines = spineGroup;
        this.mesh.add(spineGroup);
    }
    
    createSerpentTail() {
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: this.mainColor,
            roughness: 0.6,
            metalness: 0.3
        });
        
        const finMaterial = new THREE.MeshStandardMaterial({
            color: this.finColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            roughness: 0.4,
            metalness: 0.2
        });
        
        const tailGroup = new THREE.Group();
        
        // Tail base (continuation of body)
        const tailBaseGeo = new THREE.CylinderGeometry(0.8, 0.3, 3, 8);
        const tailBase = new THREE.Mesh(tailBaseGeo, tailMaterial);
        tailBase.rotation.x = Math.PI / 2;
        tailBase.position.z = 24;
        tailBase.castShadow = true;
        tailGroup.add(tailBase);
        this.addPart(tailBase);
        
        // Tail fin (vertical)
        const tailFinShape = new THREE.Shape();
        tailFinShape.moveTo(0, 0);
        tailFinShape.quadraticCurveTo(1, 2, 0, 4);
        tailFinShape.quadraticCurveTo(-1, 2, 0, 0);
        
        const tailFinGeo = new THREE.ShapeGeometry(tailFinShape);
        const tailFin = new THREE.Mesh(tailFinGeo, finMaterial);
        tailFin.rotation.y = Math.PI / 2;
        tailFin.position.set(0, 0, 26);
        tailFin.scale.set(2, 2, 1);
        tailFin.castShadow = true;
        
        this.serpentParts.tailFin = tailFin;
        tailGroup.add(tailFin);
        this.addPart(tailFin);
        
        this.mesh.add(tailGroup);
    }
    
    createWaterEffects() {
        // Create particle system for water splash/bubble effects
        const particleCount = 100;
        const particleGeo = new THREE.BufferGeometry();
        
        // Create arrays for particle positions and other attributes
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            // Store particle data for animation
            this.waterParticles.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                size: Math.random() * 0.2 + 0.1,
                lifetime: 0,
                maxLifetime: Math.random() * 2 + 1
            });
            
            // Set initial attributes to zero/hidden
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            colors[i * 3] = 0.7; // R
            colors[i * 3 + 1] = 0.9; // G
            colors[i * 3 + 2] = 1.0; // B
            
            sizes[i] = 0;
        }
        
        // Set buffer attributes
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particle system
        this.waterParticleSystem = new THREE.Points(particleGeo, particleMaterial);
        this.mesh.add(this.waterParticleSystem);
        this.addPart(this.waterParticleSystem);
    }
    
    // Update water particles/splash effects
    updateWaterEffects(deltaTime) {
        if (!this.waterParticleSystem) return;
        
        const positions = this.waterParticleSystem.geometry.attributes.position.array;
        const sizes = this.waterParticleSystem.geometry.attributes.size.array;
        
        // Water surface level
        const waterLevel = -1;
        
        // Update existing particles
        for (let i = 0; i < this.waterParticles.length; i++) {
            const particle = this.waterParticles[i];
            
            // Update lifetime
            particle.lifetime -= deltaTime;
            
            // If particle is dead, potentially reset it
            if (particle.lifetime <= 0) {
                // Only spawn new particles at certain "splash" points
                // These points are where the serpent's body crosses the water
                if (Math.random() < 0.1) { // Control spawn rate
                    this.resetWaterParticle(particle);
                } else {
                    // Hide particle if not respawning
                    positions[i * 3] = 0;
                    positions[i * 3 + 1] = -100; // Move far away (hidden)
                    positions[i * 3 + 2] = 0;
                    sizes[i] = 0;
                    continue;
                }
            }
            
            // Update position based on velocity
            particle.position.x += particle.velocity.x * deltaTime;
            particle.position.y += particle.velocity.y * deltaTime;
            particle.position.z += particle.velocity.z * deltaTime;
            
            // Apply gravity
            particle.velocity.y -= 9.8 * deltaTime;
            
            // Water resistance
            if (particle.position.y < waterLevel) {
                particle.velocity.x *= 0.95;
                particle.velocity.z *= 0.95;
                particle.velocity.y *= 0.7;
                
                // Push back up to water level
                particle.position.y = waterLevel;
                particle.velocity.y = Math.abs(particle.velocity.y) * 0.3;
            }
            
            // Update size based on lifetime
            const lifetimeRatio = particle.lifetime / particle.maxLifetime;
            sizes[i] = particle.size * lifetimeRatio;
            
            // Update position in buffer
            positions[i * 3] = particle.position.x;
            positions[i * 3 + 1] = particle.position.y;
            positions[i * 3 + 2] = particle.position.z;
        }
        
        // Mark attributes for update
        this.waterParticleSystem.geometry.attributes.position.needsUpdate = true;
        this.waterParticleSystem.geometry.attributes.size.needsUpdate = true;
    }
    
    // Reset a water particle
    resetWaterParticle(particle) {
        // Find splash points - places where body segments cross water level
        const splashPoints = [];
        const waterLevel = -1;
        
        // Use body segments to find potential splash points
        this.bodySegments.forEach((segment, index) => {
            if (Math.abs(segment.position.y - waterLevel) < 1) {
                splashPoints.push({
                    x: segment.position.x,
                    z: segment.position.z
                });
            }
        });
        
        // Add head/tail as potential splash points
        splashPoints.push({ x: 0, z: -8 });
        splashPoints.push({ x: 0, z: 24 });
        
        // If we have splash points, use them, otherwise use a default
        let splashPoint;
        if (splashPoints.length > 0) {
            splashPoint = splashPoints[Math.floor(Math.random() * splashPoints.length)];
        } else {
            splashPoint = { x: 0, z: 0 };
        }
        
        // Set position at the splash point
        particle.position.set(
            splashPoint.x + (Math.random() - 0.5) * 2,
            waterLevel,
            splashPoint.z + (Math.random() - 0.5) * 2
        );
        
        // Set velocity (mostly upward for splash)
        particle.velocity.set(
            (Math.random() - 0.5) * 3,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 3
        );
        
        // Reset lifetime
        particle.maxLifetime = Math.random() * 1.5 + 0.5;
        particle.lifetime = particle.maxLifetime;
    }
    
    // Called by CustomTerrain's update method
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Update undulation animation
        this.undulateAmount += this.undulateSpeed * deltaTime;
        
        // Apply undulating motion to body segments
        this.bodySegments.forEach((segment, index) => {
            const segmentOffset = index * 0.4;
            const undulationX = Math.sin(this.undulateAmount + segmentOffset) * 1.5;
            const undulationY = Math.cos(this.undulateAmount + segmentOffset) * 0.5;
            
            segment.position.x = undulationX;
            segment.position.y = undulationY;
            
            // Rotate segments to follow the curve
            if (index > 0) {
                const prevSegment = this.bodySegments[index - 1];
                const dx = segment.position.x - prevSegment.position.x;
                const dy = segment.position.y - prevSegment.position.y;
                const dz = segment.position.z - prevSegment.position.z;
                
                // Calculate rotation to face previous segment
                segment.rotation.y = Math.atan2(dx, dz);
                segment.rotation.x = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
            }
        });
        
        // Head follows first body segment
        if (this.serpentParts.head && this.bodySegments.length > 0) {
            const firstSegment = this.bodySegments[0];
            this.serpentParts.head.position.x = firstSegment.position.x;
            this.serpentParts.head.position.y = firstSegment.position.y;
            this.serpentParts.head.rotation.y = firstSegment.rotation.y;
            this.serpentParts.head.rotation.x = firstSegment.rotation.x;
        }
        
        // Animate jaw opening/closing
        if (this.serpentParts.jaw) {
            this.serpentParts.jaw.rotation.x = Math.PI + Math.sin(this.undulateAmount * 2) * 0.1;
        }
        
        // Animate fins waving
        this.finWaveAmount += this.finWaveSpeed * deltaTime;
        
        if (this.serpentParts.dorsalFin) {
            this.serpentParts.dorsalFin.rotation.z = Math.sin(this.finWaveAmount) * 0.2;
        }
        
        if (this.serpentParts.leftFin) {
            this.serpentParts.leftFin.rotation.z = Math.PI / 6 + Math.sin(this.finWaveAmount) * 0.3;
        }
        
        if (this.serpentParts.rightFin) {
            this.serpentParts.rightFin.rotation.z = -Math.PI / 6 - Math.sin(this.finWaveAmount) * 0.3;
        }
        
        if (this.serpentParts.tailFin) {
            this.serpentParts.tailFin.rotation.z = Math.sin(this.finWaveAmount * 1.5) * 0.5;
        }
        
        // Update water effects
        this.waterEffectAmount += this.waterEffectSpeed * deltaTime;
        this.updateWaterEffects(deltaTime);
    }
    
    // Custom collision detection for the serpent
    handleCollision(point) {
        // Create a bounding box for the serpent
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Check if point is inside the bounding box
        const isInside = boundingBox.containsPoint(point);
        
        return {
            collided: isInside,
            point: point.clone()
        };
    }
    
    // Enhanced cleanup
    cleanup() {
        // Clean up water particle system
        if (this.waterParticleSystem) {
            this.waterParticleSystem.geometry.dispose();
            this.waterParticleSystem.material.dispose();
            this.waterParticleSystem = null;
        }
        
        // Clear particle array
        this.waterParticles = [];
        
        // Call parent cleanup
        super.cleanup();
    }
}