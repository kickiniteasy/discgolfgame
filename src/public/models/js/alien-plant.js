/*
 * Alien Plant Species Model for Three.js
 * An exotic, bioluminescent plant with tentacle-like vines
 */

export default class AlienPlantModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Plant properties
        this.stemHeight = options.properties?.stemHeight || 2.5;
        this.tentacleCount = options.properties?.tentacleCount || 5;
        this.bulbCount = options.properties?.bulbCount || 3;
        this.isHostile = options.properties?.isHostile === true; // Default false
        
        // Animation properties
        this.animationTime = 0;
        this.tentacles = [];
        this.bulbs = [];
        
        // Colors
        this.stemColor = options.visualProperties?.stemColor || 
                        options.properties?.stemColor || 
                        "#2E8B57"; // Sea green
                        
        this.bulbColor = options.visualProperties?.color || 
                         options.properties?.bulbColor || 
                         "#FF69B4"; // Hot pink
                        
        this.glowColor = options.visualProperties?.glowColor || 
                         options.properties?.glowColor || 
                         "#F0F8FF"; // Alice blue
    }

    async init() {
        // Create root/base
        this.createBase();
        
        // Create main stem
        this.createStem();
        
        // Create tentacle vines
        this.createTentacles();
        
        // Create glowing bulbs
        this.createBulbs();
        
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
        // Create root base with organic shape
        const baseGeometry = new THREE.SphereGeometry(
            0.5,
            8,
            8,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );
        
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: this.stemColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.scale.y = 0.4; // Flatten
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        this.addPart(base);
        
        // Add root details/tendrils
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const tendrilGeometry = new THREE.CylinderGeometry(
                0.03,
                0.05,
                0.3 + Math.random() * 0.3,
                5
            );
            
            const tendril = new THREE.Mesh(tendrilGeometry, baseMaterial);
            
            // Position around base
            tendril.position.set(
                Math.cos(angle) * 0.4,
                0.05,
                Math.sin(angle) * 0.4
            );
            
            // Angle outward
            tendril.rotation.x = Math.PI / 2;
            tendril.rotation.z = -angle;
            
            base.add(tendril);
            this.addPart(tendril);
        }
    }
    
    createStem() {
        // Create main stem using multiple slightly tilted cylinders
        const segmentCount = 5;
        const segmentHeight = this.stemHeight / segmentCount;
        
        let lastY = 0;
        let lastTilt = { x: 0, z: 0 };
        
        for (let i = 0; i < segmentCount; i++) {
            const segmentGeometry = new THREE.CylinderGeometry(
                0.15 * (1 - i / segmentCount * 0.5), // Taper towards top
                0.15 * (1 - (i - 1) / segmentCount * 0.5),
                segmentHeight,
                8
            );
            
            // Vary the color slightly for each segment
            const colorVar = 0.1;
            const stemColorHSL = new THREE.Color(this.stemColor).getHSL({});
            const segmentColor = new THREE.Color().setHSL(
                stemColorHSL.h + (Math.random() - 0.5) * 0.05,
                stemColorHSL.s + (Math.random() - 0.5) * colorVar,
                stemColorHSL.l + (Math.random() - 0.5) * colorVar
            );
            
            const segmentMaterial = new THREE.MeshStandardMaterial({
                color: segmentColor,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            // Position - each segment starts where the last one ended
            segment.position.y = lastY + segmentHeight / 2;
            
            // Apply slight random tilt to each segment
            const tiltAmount = 0.1;
            const tiltX = lastTilt.x + (Math.random() - 0.5) * tiltAmount;
            const tiltZ = lastTilt.z + (Math.random() - 0.5) * tiltAmount;
            
            segment.rotation.x = tiltX;
            segment.rotation.z = tiltZ;
            
            // Update for next segment
            lastY = segment.position.y + segmentHeight / 2;
            lastTilt = { x: tiltX, z: tiltZ };
            
            segment.castShadow = true;
            this.mesh.add(segment);
            this.addPart(segment);
            
            // Store the top-most position for attaching tentacles
            if (i === segmentCount - 1) {
                this.stemTop = {
                    y: lastY,
                    tilt: lastTilt
                };
            }
        }
    }
    
    createTentacles() {
        // Create tentacle-like vines sprouting from top
        for (let i = 0; i < this.tentacleCount; i++) {
            const tentacleGroup = new THREE.Group();
            
            // Position at top of stem
            tentacleGroup.position.y = this.stemTop.y - 0.1;
            this.mesh.add(tentacleGroup);
            
            // Create tentacle with segments
            const segmentCount = 5 + Math.floor(Math.random() * 3);
            const tentacleLength = 1 + Math.random() * 1.5;
            const segmentLength = tentacleLength / segmentCount;
            
            // Create segments
            const segments = [];
            let lastY = 0;
            let lastSegment = null;
            
            for (let j = 0; j < segmentCount; j++) {
                const thickness = 0.08 * (1 - j / segmentCount * 0.7); // Taper
                
                const segmentGeometry = new THREE.CylinderGeometry(
                    thickness * 0.8,
                    thickness,
                    segmentLength,
                    6
                );
                
                // Vary the color slightly from stem
                const stemColorHSL = new THREE.Color(this.stemColor).getHSL({});
                const segmentColor = new THREE.Color().setHSL(
                    stemColorHSL.h + (Math.random() - 0.5) * 0.1,
                    stemColorHSL.s * (0.8 + Math.random() * 0.4),
                    stemColorHSL.l * (0.8 + Math.random() * 0.4)
                );
                
                const segmentMaterial = new THREE.MeshStandardMaterial({
                    color: segmentColor,
                    roughness: 0.8,
                    metalness: 0.2
                });
                
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                
                if (lastSegment) {
                    // Attach to end of previous segment
                    lastSegment.add(segment);
                    segment.position.y = segmentLength;
                } else {
                    // First segment - attach to tentacle group
                    tentacleGroup.add(segment);
                    segment.position.y = 0;
                    
                    // Angle tentacle outward from center
                    const angle = (i / this.tentacleCount) * Math.PI * 2;
                    const tilt = Math.PI / 4; // 45-degree angle
                    
                    segment.rotation.x = Math.sin(angle) * tilt;
                    segment.rotation.z = -Math.cos(angle) * tilt;
                }
                
                segment.castShadow = true;
                this.addPart(segment);
                lastSegment = segment;
                segments.push(segment);
            }
            
            // Store for animation
            this.tentacles.push({
                segments: segments,
                angle: (i / this.tentacleCount) * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2
            });
            
            // Add a bulb to the end of some tentacles
            if (Math.random() > 0.3) {
                this.addBulbToTentacle(lastSegment, i);
            }
        }
    }
    
    addBulbToTentacle(segment, tentacleIndex) {
        // Add a bioluminescent bulb at the end of a tentacle
        const bulbSize = 0.15 + Math.random() * 0.1;
        const bulbGeometry = new THREE.SphereGeometry(bulbSize, 8, 8);
        
        // Color based on hostility
        const bulbColor = this.isHostile ? 
                         new THREE.Color("#FF3333") : // Angry red
                         new THREE.Color(this.bulbColor);
        
        const bulbMaterial = new THREE.MeshStandardMaterial({
            color: bulbColor,
            emissive: bulbColor,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.position.y = 0.12;
        bulb.castShadow = true;
        segment.add(bulb);
        this.addPart(bulb);
        
        // Add glow effect
        const glowSize = bulbSize * 1.5;
        const glowGeometry = new THREE.SphereGeometry(glowSize, 8, 8);
        const glowColor = this.isHostile ? 
                         new THREE.Color("#FF6666") : // Softer red
                         new THREE.Color(this.glowColor);
        
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.4
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        bulb.add(glow);
        this.addPart(glow);
        
        // Store for animation
        this.bulbs.push({
            bulb: bulb,
            glow: glow,
            originalScale: bulbSize,
            pulseSpeed: 0.5 + Math.random() * 1,
            phase: Math.random() * Math.PI * 2,
            tentacleIndex: tentacleIndex
        });
    }
    
    createBulbs() {
        // Add bulbs to the stem
        for (let i = 0; i < this.bulbCount; i++) {
            // Position bulbs at various heights on the stem
            const heightPercentage = 0.3 + (i / this.bulbCount) * 0.6;
            const height = this.stemTop.y * heightPercentage;
            
            // Random position around stem
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.2;
            
            const bulbSize = 0.12 + Math.random() * 0.08;
            const bulbGeometry = new THREE.SphereGeometry(bulbSize, 8, 8);
            
            // Color based on hostility
            const bulbColor = this.isHostile ? 
                             new THREE.Color("#FF3333") : // Angry red
                             new THREE.Color(this.bulbColor);
            
            const bulbMaterial = new THREE.MeshStandardMaterial({
                color: bulbColor,
                emissive: bulbColor,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.9
            });
            
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
            bulb.position.set(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            bulb.castShadow = true;
            this.mesh.add(bulb);
            this.addPart(bulb);
            
            // Add glow effect
            const glowSize = bulbSize * 1.5;
            const glowGeometry = new THREE.SphereGeometry(glowSize, 8, 8);
            const glowColor = this.isHostile ? 
                             new THREE.Color("#FF6666") : // Softer red
                             new THREE.Color(this.glowColor);
            
            const glowMaterial = new THREE.MeshStandardMaterial({
                color: glowColor,
                emissive: glowColor,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.4
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            bulb.add(glow);
            this.addPart(glow);
            
            // Store for animation
            this.bulbs.push({
                bulb: bulb,
                glow: glow,
                originalScale: bulbSize,
                pulseSpeed: 0.5 + Math.random() * 1,
                phase: Math.random() * Math.PI * 2,
                tentacleIndex: -1 // Not on a tentacle
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Update animation time
        this.animationTime += deltaTime;
        
        // Animate tentacles - gentle swaying motion
        this.tentacles.forEach((tentacle, index) => {
            // Skip first segment (attached to stem)
            for (let i = 1; i < tentacle.segments.length; i++) {
                const segment = tentacle.segments[i];
                
                // Calculate wave motion - more pronounced for tip segments
                const segmentFactor = i / tentacle.segments.length;
                const waveStrength = 0.05 + segmentFactor * 0.15;
                const waveSpeed = tentacle.speed;
                
                // Calculate wave
                const waveX = Math.sin(this.animationTime * waveSpeed + tentacle.phase) * waveStrength;
                const waveZ = Math.cos(this.animationTime * waveSpeed + tentacle.phase) * waveStrength;
                
                // Apply rotation
                segment.rotation.x = waveX;
                segment.rotation.z = waveZ;
                
                // If hostile, make tentacles move more aggressively
                if (this.isHostile) {
                    const aggressionFactor = 1.5;
                    segment.rotation.x *= aggressionFactor;
                    segment.rotation.z *= aggressionFactor;
                }
            }
        });
        
        // Animate bulbs - pulsing glow
        this.bulbs.forEach(bulb => {
            // Calculate pulsation
            const pulse = Math.sin(this.animationTime * bulb.pulseSpeed + bulb.phase) * 0.2 + 1;
            
            // Adjust bulb size and glow intensity
            const scale = bulb.originalScale * pulse;
            bulb.bulb.scale.set(scale, scale, scale);
            
            // Glow intensity
            bulb.glow.material.emissiveIntensity = 0.3 + pulse * 0.4;
            bulb.glow.material.opacity = 0.2 + pulse * 0.3;
            
            // If hostile, make bulbs pulse faster and brighter
            if (this.isHostile) {
                // Quicker flickering
                const hostilePulse = Math.sin(this.animationTime * bulb.pulseSpeed * 3) * 0.3 + 1;
                bulb.glow.material.emissiveIntensity = 0.6 + hostilePulse * 0.5;
            }
        });
    }
    
    // Toggle hostile/friendly state
    toggleHostility() {
        this.isHostile = !this.isHostile;
        
        // Update bulb colors based on new state
        const newBulbColor = this.isHostile ? "#FF3333" : this.bulbColor;
        const newGlowColor = this.isHostile ? "#FF6666" : this.glowColor;
        
        // Update all bulbs
        this.bulbs.forEach(bulb => {
            // Change bulb color
            bulb.bulb.material.color.set(newBulbColor);
            bulb.bulb.material.emissive.set(newBulbColor);
            
            // Change glow color
            bulb.glow.material.color.set(newGlowColor);
            bulb.glow.material.emissive.set(newGlowColor);
        });
        
        return this.isHostile;
    }
    
    // Make the plant "react" to something (bend slightly toward a point)
    reactTo(point) {
        // Calculate direction to point
        const direction = new THREE.Vector3()
            .subVectors(point, this.mesh.position)
            .normalize();
        
        // Bend tentacles in that direction
        this.tentacles.forEach(tentacle => {
            // Calculate how aligned this tentacle is with the target direction
            const tentacleDir = new THREE.Vector3(
                Math.cos(tentacle.angle),
                0,
                Math.sin(tentacle.angle)
            );
            
            // Dot product to determine alignment (-1 to 1)
            const alignment = tentacleDir.dot(direction);
            
            // Tentacles aligned with target extend more, others retract
            const extensionFactor = 0.2 * alignment;
            
            // Apply to segments
            tentacle.segments.forEach((segment, index) => {
                if (index > 0) { // Skip base segment
                    segment.scale.y = 1 + extensionFactor;
                }
            });
        });
    }
    
    handleCollision(point) {
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        const isInside = boundingBox.containsPoint(point);
        
        // If the plant is hostile and something collides with it, react
        if (isInside && this.isHostile) {
            this.reactTo(point);
        }
        
        return {
            collided: isInside,
            point: point.clone(),
            isHostile: this.isHostile,
            bulbCount: this.bulbs.length
        };
    }
}