/*
 * Phoenix Model for Three.js
 * Features animated flaming wings and particle effects
 * 
 * To be loaded by CustomTerrain class as a JS model
 */

export default class PhoenixModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Animation parameters
        this.wingFlapSpeed = 0.15;
        this.wingFlapDirection = 1;
        this.wingFlapAmount = 0;
        this.tailSwayAmount = 0;
        this.tailSwaySpeed = 0.08;
        this.breathingAmount = 0;
        this.breathingSpeed = 0.03;
        this.flameIntensity = 0;
        this.flameSpeed = 0.05;
        
        // Store phoenix parts for animation
        this.phoenixParts = {};
        
        // Get color from visualProperties or fall back to custom property or default
        this.bodyColor = options.visualProperties?.color || 
                        options.properties?.color || 
                        "#ff4500"; // Bright orange-red
                        
        this.flameColor = options.visualProperties?.flameColor || 
                         options.properties?.flameColor || 
                         "#ffdd00"; // Bright yellow
                         
        // Create particle system for flames
        this.particles = [];
        this.particleSystem = null;
    }

    async init() {
        // Create phoenix body parts
        this.createPhoenixBody();
        this.createPhoenixNeck();
        this.createPhoenixHead();
        this.createPhoenixBeak();
        this.createPhoenixEyes();
        this.createPhoenixWings();
        this.createPhoenixTail();
        this.createPhoenixLegs();
        this.createFlameParticles();
        
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
    
    createPhoenixBody() {
        // Create materials with emissive properties for glowing effect
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.4,
            metalness: 0.2,
            emissive: this.bodyColor,
            emissiveIntensity: 0.2
        });
        
        // Create body using ellipsoid (scaled sphere)
        const bodyGroup = new THREE.Group();
        
        // Main body
        const bodyGeo = new THREE.SphereGeometry(2, 16, 12);
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
        bodyMesh.scale.set(1, 0.8, 1.5);
        bodyMesh.castShadow = true;
        bodyGroup.add(bodyMesh);
        
        // Add details - feather tufts using small cones
        const tuftMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.4,
            emissive: this.bodyColor,
            emissiveIntensity: 0.3
        });
        
        // Add tufts of feathers on back
        for (let i = 0; i < 5; i++) {
            const tuftGeo = new THREE.ConeGeometry(0.4, 1.2, 8);
            const tuft = new THREE.Mesh(tuftGeo, tuftMaterial);
            tuft.position.set(0, 0.6, -1 + i * 0.5);
            tuft.rotation.x = Math.PI * 0.1;
            tuft.castShadow = true;
            bodyGroup.add(tuft);
        }
        
        this.phoenixParts.body = bodyGroup;
        this.mesh.add(bodyGroup);
        this.addPart(bodyMesh); // Add to parts array for cleanup
    }
    
    createPhoenixNeck() {
        const neckMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.4,
            metalness: 0.2,
            emissive: this.bodyColor,
            emissiveIntensity: 0.2
        });
        
        // Create neck using cylinder
        const neckGroup = new THREE.Group();
        
        // Cylinder for neck
        const neckCylinderGeo = new THREE.CylinderGeometry(0.6, 0.8, 2.5, 12);
        const neckCylinder = new THREE.Mesh(neckCylinderGeo, neckMaterial);
        neckCylinder.castShadow = true;
        neckGroup.add(neckCylinder);
        this.addPart(neckCylinder);
        
        // Add details - feather rings using torus
        const neckFeathersMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.4,
            emissive: this.bodyColor,
            emissiveIntensity: 0.3
        });
        
        // Add feather rings around neck
        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry(0.7, 0.15, 8, 16);
            const ring = new THREE.Mesh(ringGeo, neckFeathersMaterial);
            ring.position.y = -0.8 + i * 0.8;
            ring.rotation.x = Math.PI / 2;
            ring.castShadow = true;
            neckGroup.add(ring);
            this.addPart(ring);
        }
        
        this.phoenixParts.neck = neckGroup;
        neckGroup.position.set(0, 1.5, -2.5);
        neckGroup.rotation.x = Math.PI / 6;
        this.mesh.add(neckGroup);
    }
    
    createPhoenixHead() {
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.4,
            metalness: 0.2,
            emissive: this.bodyColor,
            emissiveIntensity: 0.2
        });
        
        // Create head group
        const headGroup = new THREE.Group();
        
        // Main head - slightly elongated sphere
        const headGeo = new THREE.SphereGeometry(0.8, 16, 12);
        const head = new THREE.Mesh(headGeo, headMaterial);
        head.scale.set(1, 0.9, 1.2);
        head.castShadow = true;
        headGroup.add(head);
        this.addPart(head);
        
        // Crest feathers on top of head
        const crestMaterial = new THREE.MeshStandardMaterial({ 
            color: this.flameColor,
            roughness: 0.4,
            emissive: this.flameColor,
            emissiveIntensity: 0.5
        });
        
        // Add crest feathers
        for (let i = 0; i < 5; i++) {
            const crestGeo = new THREE.ConeGeometry(0.15, 1.2, 8);
            const crest = new THREE.Mesh(crestGeo, crestMaterial);
            
            // Position in a fan-like arrangement
            const angle = (i - 2) * 0.2;
            crest.position.set(Math.sin(angle) * 0.2, 0.7, Math.cos(angle) * 0.2 - 0.2);
            crest.rotation.x = Math.PI * 0.3 + angle * 0.2;
            crest.rotation.z = angle * 0.5;
            crest.castShadow = true;
            headGroup.add(crest);
            this.addPart(crest);
        }
        
        this.phoenixParts.head = headGroup;
        headGroup.position.set(0, 2.8, -3.8);
        this.mesh.add(headGroup);
    }
    
    createPhoenixBeak() {
        const beakMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffd700, // Gold
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Create beak using cone
        const beakGeo = new THREE.ConeGeometry(0.3, 1, 8);
        const beak = new THREE.Mesh(beakGeo, beakMaterial);
        beak.position.set(0, 2.8, -4.8);
        beak.rotation.x = -Math.PI / 2;
        beak.castShadow = true;
        
        this.phoenixParts.beak = beak;
        this.mesh.add(beak);
        this.addPart(beak);
    }
    
    createPhoenixEyes() {
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffaa00, // Amber
            emissive: 0xffaa00,
            emissiveIntensity: 0.7
        });
        
        // Create phoenix eyes
        const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.5, 3, -4.3);
        this.phoenixParts.leftEye = leftEye;
        this.mesh.add(leftEye);
        this.addPart(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.5, 3, -4.3);
        this.phoenixParts.rightEye = rightEye;
        this.mesh.add(rightEye);
        this.addPart(rightEye);
        
        // Add pupil
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pupilGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(0.52, 3, -4.4);
        this.mesh.add(leftPupil);
        this.addPart(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(-0.52, 3, -4.4);
        this.mesh.add(rightPupil);
        this.addPart(rightPupil);
    }
    
    createPhoenixWings() {
        // Create multi-layered wing material with glow
        const wingBaseMaterial = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            roughness: 0.4,
            metalness: 0.2,
            emissive: this.bodyColor,
            emissiveIntensity: 0.3
        });
        
        const wingTipMaterial = new THREE.MeshStandardMaterial({
            color: this.flameColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            roughness: 0.3,
            emissive: this.flameColor,
            emissiveIntensity: 0.5
        });
        
        // Create wing shapes
        const wingGroup = new THREE.Group();
        
        // Function to create a single feathered wing
        const createWing = (isLeft) => {
            const singleWing = new THREE.Group();
            
            // Main wing structure (shape geometry)
            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.lineTo(0, 4);
            wingShape.bezierCurveTo(3, 5, 7, 4, 10, 2);
            wingShape.lineTo(7, 1);
            wingShape.bezierCurveTo(5, 0, 2, -0.5, 0, 0);
            
            const wingGeometry = new THREE.ShapeGeometry(wingShape);
            const mainWing = new THREE.Mesh(wingGeometry, wingBaseMaterial);
            singleWing.add(mainWing);
            this.addPart(mainWing);
            
            // Wing tip with flame color
            const tipShape = new THREE.Shape();
            tipShape.moveTo(7, 1);
            tipShape.lineTo(10, 2);
            tipShape.bezierCurveTo(12, 1, 13, 0, 12, -1);
            tipShape.lineTo(7, 1);
            
            const tipGeometry = new THREE.ShapeGeometry(tipShape);
            const wingTip = new THREE.Mesh(tipGeometry, wingTipMaterial);
            singleWing.add(wingTip);
            this.addPart(wingTip);
            
            // Add feather details
            for (let i = 0; i < 6; i++) {
                const featherGeo = new THREE.PlaneGeometry(3, 0.4);
                const featherMat = i < 3 ? wingBaseMaterial : wingTipMaterial;
                const feather = new THREE.Mesh(featherGeo, featherMat);
                
                // Position along the wing curve
                feather.position.set(1.5 + i * 1.5, 2 - i * 0.3, 0.05);
                feather.rotation.z = -Math.PI / 8 - i * 0.05;
                singleWing.add(feather);
                this.addPart(feather);
            }
            
            // Mirror for right wing if needed
            if (!isLeft) {
                singleWing.scale.x = -1;
            }
            
            return singleWing;
        };
        
        // Create left and right wings
        const leftWing = createWing(true);
        leftWing.position.set(1.5, 0.5, -1);
        leftWing.rotation.y = Math.PI / 2;
        leftWing.rotation.z = Math.PI / 6;
        this.phoenixParts.leftWing = leftWing;
        wingGroup.add(leftWing);

        const rightWing = createWing(false);
        rightWing.position.set(-1.5, 0.5, -1);
        rightWing.rotation.y = -Math.PI / 2;
        rightWing.rotation.z = -Math.PI / 6;
        this.phoenixParts.rightWing = rightWing;
        wingGroup.add(rightWing);
        
        this.mesh.add(wingGroup);
    }
    
    createPhoenixTail() {
        // Create fancy tail with multiple feathers
        const tailGroup = new THREE.Group();
        
        // Materials with gradient colors
        const tailBaseMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.4,
            side: THREE.DoubleSide,
            emissive: this.bodyColor,
            emissiveIntensity: 0.2
        });
        
        const tailTipMaterial = new THREE.MeshStandardMaterial({ 
            color: this.flameColor,
            roughness: 0.3,
            side: THREE.DoubleSide,
            emissive: this.flameColor,
            emissiveIntensity: 0.4
        });
        
        // Create multiple tail feathers in a fan arrangement
        const featherCount = 9;
        const featherLength = 8;
        const spreadAngle = Math.PI / 3; // How wide the tail fans out
        
        for (let i = 0; i < featherCount; i++) {
            // Create a custom feather shape
            const featherShape = new THREE.Shape();
            featherShape.moveTo(0, 0);
            featherShape.lineTo(0, featherLength);
            featherShape.bezierCurveTo(
                0.5, featherLength - 0.5,
                1.5, featherLength - 1,
                2, featherLength - 2
            );
            featherShape.lineTo(0.5, 0);
            featherShape.lineTo(0, 0);
            
            const featherGeometry = new THREE.ShapeGeometry(featherShape);
            
            // Determine if this is a center or outer feather for coloring
            const isCenterFeather = Math.abs(i - (featherCount - 1) / 2) < 2;
            const featherMaterial = isCenterFeather ? tailTipMaterial : tailBaseMaterial;
            
            const feather = new THREE.Mesh(featherGeometry, featherMaterial);
            
            // Position in a fan arrangement
            const angle = (i / (featherCount - 1) - 0.5) * spreadAngle;
            feather.rotation.y = angle;
            
            // Slight curve upward
            feather.rotation.x = 0.2;
            
            // Scale - center feathers are slightly longer
            const scaleFactor = isCenterFeather ? 1.2 : 1;
            feather.scale.set(0.4 * scaleFactor, 1 * scaleFactor, 1);
            
            tailGroup.add(feather);
            this.addPart(feather);
        }
        
        this.phoenixParts.tail = tailGroup;
        tailGroup.position.set(0, 0, 3);
        tailGroup.rotation.x = -0.2; // Slight upward angle
        this.mesh.add(tailGroup);
    }
    
    createPhoenixLegs() {
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0xe69138, // Orange-brown
            roughness: 0.7,
            metalness: 0.1
        });
        
        const footMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700, // Gold
            roughness: 0.5,
            metalness: 0.5
        });
        
        // Create legs and feet
        const legGroup = new THREE.Group();
        
        // Function to create a single leg with talons
        const createLeg = (isLeft) => {
            const singleLeg = new THREE.Group();
            
            // Thigh
            const thighGeo = new THREE.CylinderGeometry(0.3, 0.2, 1.2, 8);
            const thigh = new THREE.Mesh(thighGeo, legMaterial);
            thigh.position.y = -0.6;
            thigh.rotation.x = -Math.PI / 6;
            singleLeg.add(thigh);
            this.addPart(thigh);
            
            // Lower leg
            const calfGeo = new THREE.CylinderGeometry(0.15, 0.1, 1, 8);
            const calf = new THREE.Mesh(calfGeo, legMaterial);
            calf.position.set(0, -1.5, 0.2);
            calf.rotation.x = Math.PI / 8;
            singleLeg.add(calf);
            this.addPart(calf);
            
            // Foot with three talons
            for (let i = 0; i < 3; i++) {
                const talonGeo = new THREE.ConeGeometry(0.1, 0.5, 8);
                const talon = new THREE.Mesh(talonGeo, footMaterial);
                
                // Position talons in a spread pattern
                const angle = (i - 1) * Math.PI / 4;
                talon.position.set(
                    Math.sin(angle) * 0.2,
                    -2, 
                    Math.cos(angle) * 0.2 + 0.3
                );
                talon.rotation.x = -Math.PI / 2;
                singleLeg.add(talon);
                this.addPart(talon);
            }
            
            // Position left or right
            singleLeg.position.x = isLeft ? 0.7 : -0.7;
            
            return singleLeg;
        };
        
        // Create both legs
        const leftLeg = createLeg(true);
        legGroup.add(leftLeg);
        
        const rightLeg = createLeg(false);
        legGroup.add(rightLeg);
        
        this.phoenixParts.legs = legGroup;
        legGroup.position.set(0, 0, 0.5);
        this.mesh.add(legGroup);
    }
    
    createFlameParticles() {
        // Create particle system for flame effects
        const particleCount = 200;
        const particleGeo = new THREE.BufferGeometry();
        
        // Create arrays for particle positions and other attributes
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const lifetimes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            // Store particle data for animation
            this.particles.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                size: 0,
                lifetime: 0,
                maxLifetime: 0
            });
            
            // Set initial attributes
            sizes[i] = 0;
            lifetimes[i] = 0;
        }
        
        // Set buffer attributes
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particle system
        this.particleSystem = new THREE.Points(particleGeo, particleMaterial);
        this.mesh.add(this.particleSystem);
        this.addPart(this.particleSystem);
    }
    
    // Update flame particles
    updateParticles(deltaTime) {
        if (!this.particleSystem) return;
        
        const positions = this.particleSystem.geometry.attributes.position.array;
        const colors = this.particleSystem.geometry.attributes.color.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        
        // Get flameTips positions from wings
        const flameSources = [
            // Left wing tip
            new THREE.Vector3(2.5, 0.5, -1),
            // Right wing tip
            new THREE.Vector3(-2.5, 0.5, -1),
            // Tail 
            new THREE.Vector3(0, 0, 5),
            // Crest
            new THREE.Vector3(0, 3.5, -3.8)
        ];
        
        // Apply some rotation to get world positions
        flameSources.forEach(source => {
            // Apply phoenix rotation/position if needed
            if (this.mesh.rotation.y !== 0) {
                source.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
            }
            source.add(this.mesh.position);
        });
        
        // Update existing particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // Update position based on velocity
            particle.position.x += particle.velocity.x * deltaTime;
            particle.position.y += particle.velocity.y * deltaTime;
            particle.position.z += particle.velocity.z * deltaTime;
            
            // Update lifetime
            particle.lifetime -= deltaTime;
            
            // If particle is dead, reset it from a random source
            if (particle.lifetime <= 0) {
                this.resetParticle(particle, flameSources);
            }
            
            // Update size based on lifetime
            particle.size = (particle.lifetime / particle.maxLifetime) * 0.3;
            
            // Update colors based on lifetime (yellow to red)
            const lifetimeRatio = particle.lifetime / particle.maxLifetime;
            const idx = i * 3;
            colors[idx] = 1; // R
            colors[idx + 1] = 0.7 * lifetimeRatio; // G
            colors[idx + 2] = 0.2 * Math.pow(lifetimeRatio, 2); // B
            
            // Update position and size in buffer
            positions[idx] = particle.position.x;
            positions[idx + 1] = particle.position.y;
            positions[idx + 2] = particle.position.z;
            sizes[i] = particle.size;
        }
        
        // Mark attributes for update
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
    }
    
    // Reset a particle to a new random source
    resetParticle(particle, sources) {
        // Pick a random source
        const sourceIdx = Math.floor(Math.random() * sources.length);
        const source = sources[sourceIdx];
        
        // Set position to the source with small random offset
        particle.position.set(
            source.x + (Math.random() - 0.5) * 0.5,
            source.y + (Math.random() - 0.5) * 0.5,
            source.z + (Math.random() - 0.5) * 0.5
        );
        
        // Set random velocity (upward and outward)
        particle.velocity.set(
            (Math.random() - 0.5) * 2,
            Math.random() * 2 + 2,
            (Math.random() - 0.5) * 2
        );
        
        // Set random lifetime 
        particle.maxLifetime = Math.random() * 1 + 0.5; // 0.5 to 1.5 seconds
        particle.lifetime = particle.maxLifetime;
        
        // Set random size
        particle.size = Math.random() * 0.2 + 0.1;
    }
    
    // Called by CustomTerrain's update method
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Wing flapping animation
        this.wingFlapAmount += this.wingFlapSpeed * this.wingFlapDirection;
        
        if (this.wingFlapAmount > 0.5) {
            this.wingFlapDirection = -1;
        } else if (this.wingFlapAmount < -0.1) {
            this.wingFlapDirection = 1;
        }
        
        // Apply wing flap animation
        if (this.phoenixParts.leftWing && this.phoenixParts.rightWing) {
            this.phoenixParts.leftWing.rotation.z = Math.PI / 6 + this.wingFlapAmount;
            this.phoenixParts.rightWing.rotation.z = -Math.PI / 6 - this.wingFlapAmount;
        }
        
        // Tail swaying animation
        this.tailSwayAmount += this.tailSwaySpeed;
        if (this.phoenixParts.tail) {
            this.phoenixParts.tail.rotation.y = Math.sin(this.tailSwayAmount) * 0.2;
        }
        
        // Breathing animation for body
        this.breathingAmount += this.breathingSpeed;
        if (this.phoenixParts.body) {
            this.phoenixParts.body.scale.y = 1 + Math.sin(this.breathingAmount) * 0.04;
            this.phoenixParts.body.scale.x = 1 + Math.sin(this.breathingAmount) * 0.02;
        }
        
        // Flame intensity animation
        this.flameIntensity = (Math.sin(this.breathingAmount * 2) + 1) * 0.5; // 0 to 1
        
        // Update particle effects
        this.updateParticles(deltaTime);
        
        // Slight bobbing for the whole phoenix
        if (this.mesh) {
            // Store the original Y position if not already saved
            this.originalY = this.originalY !== undefined ? this.originalY : this.mesh.position.y;
            
            // Apply breathing animation while maintaining the original position
            this.mesh.position.y = this.originalY + Math.sin(this.breathingAmount * 0.5) * 0.1;
        }
    }
    
    // Custom collision detection for the phoenix
    handleCollision(point) {
        // Create a bounding box for the phoenix
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Check if point is inside the bounding box
        const isInside = boundingBox.containsPoint(point);
        
        return {
            collided: isInside,
            point: point.clone()
        };
    }
    
    // Enhanced cleanup for phoenix with particle system
    cleanup() {
        // Clean up particle system
        if (this.particleSystem) {
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
            this.particleSystem = null;
        }
        
        // Clear particle array
        this.particles = [];
        
        // Call parent cleanup
        super.cleanup();
    }
}