export default class ForestFaery extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.skinColor = options.visualProperties?.skinColor || 
                         options.properties?.skinColor || 
                         "#FFE4B5"; // Moccasin (light skin tone)
        this.hairColor = options.visualProperties?.hairColor || 
                          options.properties?.hairColor || 
                          "#FFD700"; // Gold
        this.wingColor = options.visualProperties?.wingColor || 
                          options.properties?.wingColor || 
                          "#E6E6FA"; // Lavender
        this.dressColor = options.visualProperties?.dressColor || 
                           options.properties?.dressColor || 
                           "#87CEEB"; // Sky blue
        this.glowColor = options.visualProperties?.glowColor || 
                          options.properties?.glowColor || 
                          "#FFFFFF"; // White
        
        // Properties
        this.size = options.properties?.size || 0.5; // Faeries are small!
        this.wingSpan = options.properties?.wingSpan || 1.2;
        this.glowIntensity = options.properties?.glowIntensity || 0.7;
        this.flySpeed = options.properties?.flySpeed || 1.5;
        this.wingFlapSpeed = options.properties?.wingFlapSpeed || 15;
        this.hoverHeight = options.properties?.hoverHeight || 2;
        
        // Animation state
        this.parts = {};
        this.time = 0;
        this.originalPositions = {};
        this.flyingPath = [];
        
        // Generate random flying path
        this.generateFlyingPath();
    }

    async init() {
        this.createBody();
        this.createHead();
        this.createWings();
        this.createLimbs();
        this.createDress();
        this.createGlow();
        
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
    
    generateFlyingPath() {
        // Create a randomized path for the faery to follow
        const pathPoints = 8;
        const pathRadius = this.size * 10;
        
        for (let i = 0; i < pathPoints; i++) {
            const angle = (i / pathPoints) * Math.PI * 2;
            // Add some randomness to the path
            const radius = pathRadius * (0.8 + Math.random() * 0.4);
            const height = this.hoverHeight * (0.8 + Math.random() * 0.4);
            
            this.flyingPath.push({
                x: Math.cos(angle) * radius,
                y: height,
                z: Math.sin(angle) * radius
            });
        }
    }
    
    createBody() {
        // Create the faery body (torso)
        const bodyGeometry = new THREE.CylinderGeometry(
            this.size * 0.15, 
            this.size * 0.12, 
            this.size * 0.5, 
            8
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.skinColor,
            roughness: 0.6,
            metalness: 0.2
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = this.size * 0.25;
        body.castShadow = true;
        this.addPart(body);
        this.parts.body = body;
        this.originalPositions.body = body.position.clone();
    }
    
    createHead() {
        // Create the faery head
        const headGeometry = new THREE.SphereGeometry(
            this.size * 0.15, 16, 16
        );
        const headMaterial = new THREE.MeshStandardMaterial({
            color: this.skinColor,
            roughness: 0.6,
            metalness: 0.2
        });
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = this.size * 0.6;
        head.castShadow = true;
        this.addPart(head);
        this.parts.head = head;
        this.originalPositions.head = head.position.clone();
        
        // Add hair
        const hairGeometry = new THREE.SphereGeometry(
            this.size * 0.16, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6
        );
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: this.hairColor,
            roughness: 0.8,
            metalness: 0.3
        });
        
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = this.size * 0.6 + this.size * 0.02;
        hair.castShadow = true;
        this.addPart(hair);
        
        // Add face features (simplified)
        const eyeGeometry = new THREE.SphereGeometry(this.size * 0.02, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: "#000080", // Navy blue
            roughness: 0.5,
            metalness: 0.3
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(
            -this.size * 0.06, 
            this.size * 0.62, 
            this.size * 0.13
        );
        this.addPart(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(
            this.size * 0.06, 
            this.size * 0.62, 
            this.size * 0.13
        );
        this.addPart(rightEye);
        
        // Smile (simplified)
        const smileGeometry = new THREE.TorusGeometry(
            this.size * 0.05, this.size * 0.01, 8, 8, Math.PI
        );
        const smileMaterial = new THREE.MeshStandardMaterial({
            color: "#FF69B4", // Hot pink
            roughness: 0.6,
            metalness: 0.2
        });
        
        const smile = new THREE.Mesh(smileGeometry, smileMaterial);
        smile.position.set(0, this.size * 0.58, this.size * 0.13);
        smile.rotation.x = Math.PI;
        this.addPart(smile);
    }
    
    createWings() {
        // Create the faery wings
        const wingGroup = new THREE.Group();
        
        // Wing material
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: this.wingColor,
            transparent: true,
            opacity: 0.7,
            roughness: 0.3,
            metalness: 0.5,
            side: THREE.DoubleSide,
            emissive: this.wingColor,
            emissiveIntensity: 0.3
        });
        
        // Helper function to create a wing
        const createWing = (side, angle) => {
            // Wing shape approximated with modified sphere geometry
            const wingGeometry = new THREE.SphereGeometry(
                this.size * this.wingSpan, 8, 8, 
                Math.PI * 0.25, Math.PI * 0.5, 
                Math.PI * 0.25, Math.PI * 0.5
            );
            
            // Distort wing geometry to make it more wing-like
            const positionAttribute = wingGeometry.getAttribute('position');
            const positions = positionAttribute.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Flatten and stretch
                positions[i] *= side * 1.5; // X (stretch horizontally)
                positions[i+1] *= 0.2;      // Y (flatten)
                positions[i+2] *= 0.8;      // Z
                
                // Add some curvature
                if (positions[i] * side > 0) {
                    positions[i+2] -= Math.abs(positions[i]) * 0.3;
                }
            }
            
            positionAttribute.needsUpdate = true;
            
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.position.y = this.size * 0.4;
            wing.position.x = side * this.size * 0.1;
            wing.rotation.z = side * angle;
            
            return wing;
        };
        
        // Create left and right wings
        this.parts.leftWingUpper = createWing(-1, Math.PI * 0.1);
        this.parts.rightWingUpper = createWing(1, -Math.PI * 0.1);
        
        // Add lower wings
        this.parts.leftWingLower = createWing(-1, Math.PI * 0.2);
        this.parts.leftWingLower.scale.set(0.7, 0.7, 0.7);
        this.parts.leftWingLower.position.y -= this.size * 0.1;
        
        this.parts.rightWingLower = createWing(1, -Math.PI * 0.2);
        this.parts.rightWingLower.scale.set(0.7, 0.7, 0.7);
        this.parts.rightWingLower.position.y -= this.size * 0.1;
        
        // Store original wing rotations for animation
        this.originalPositions.leftWingUpper = this.parts.leftWingUpper.rotation.clone();
        this.originalPositions.rightWingUpper = this.parts.rightWingUpper.rotation.clone();
        this.originalPositions.leftWingLower = this.parts.leftWingLower.rotation.clone();
        this.originalPositions.rightWingLower = this.parts.rightWingLower.rotation.clone();
        
        // Add wings to the mesh
        this.addPart(this.parts.leftWingUpper);
        this.addPart(this.parts.rightWingUpper);
        this.addPart(this.parts.leftWingLower);
        this.addPart(this.parts.rightWingLower);
    }
    
    createLimbs() {
        // Create arms and legs
        const limbMaterial = new THREE.MeshStandardMaterial({
            color: this.skinColor,
            roughness: 0.6,
            metalness: 0.2
        });
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(
            this.size * 0.03, this.size * 0.02, this.size * 0.3, 8
        );
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, limbMaterial);
        leftArm.position.set(
            -this.size * 0.15, 
            this.size * 0.4, 
            0
        );
        leftArm.rotation.z = Math.PI * 0.2;
        this.addPart(leftArm);
        this.parts.leftArm = leftArm;
        this.originalPositions.leftArm = {
            position: leftArm.position.clone(),
            rotation: leftArm.rotation.clone()
        };
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, limbMaterial);
        rightArm.position.set(
            this.size * 0.15, 
            this.size * 0.4, 
            0
        );
        rightArm.rotation.z = -Math.PI * 0.2;
        this.addPart(rightArm);
        this.parts.rightArm = rightArm;
        this.originalPositions.rightArm = {
            position: rightArm.position.clone(),
            rotation: rightArm.rotation.clone()
        };
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(
            this.size * 0.04, this.size * 0.03, this.size * 0.3, 8
        );
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, limbMaterial);
        leftLeg.position.set(
            -this.size * 0.07, 
            this.size * 0, 
            0
        );
        this.addPart(leftLeg);
        this.parts.leftLeg = leftLeg;
        this.originalPositions.leftLeg = {
            position: leftLeg.position.clone(),
            rotation: leftLeg.rotation.clone()
        };
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, limbMaterial);
        rightLeg.position.set(
            this.size * 0.07, 
            this.size * 0, 
            0
        );
        this.addPart(rightLeg);
        this.parts.rightLeg = rightLeg;
        this.originalPositions.rightLeg = {
            position: rightLeg.position.clone(),
            rotation: rightLeg.rotation.clone()
        };
    }
    
    createDress() {
        // Create a simple dress for the faery
        const dressTopGeometry = new THREE.ConeGeometry(
            this.size * 0.2, this.size * 0.3, 8, 1, true
        );
        const dressBottomGeometry = new THREE.ConeGeometry(
            this.size * 0.25, this.size * 0.3, 8, 1, true
        );
        
        const dressMaterial = new THREE.MeshStandardMaterial({
            color: this.dressColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Top part of dress
        const dressTop = new THREE.Mesh(dressTopGeometry, dressMaterial);
        dressTop.position.y = this.size * 0.35;
        dressTop.rotation.x = Math.PI;
        dressTop.castShadow = true;
        this.addPart(dressTop);
        
        // Bottom part of dress (skirt)
        const dressBottom = new THREE.Mesh(dressBottomGeometry, dressMaterial);
        dressBottom.position.y = this.size * 0.15;
        dressBottom.rotation.x = Math.PI;
        dressBottom.castShadow = true;
        this.addPart(dressBottom);
    }
    
    createGlow() {
        // Create a glowing aura around the faery
        const glowGeometry = new THREE.SphereGeometry(
            this.size * 1.2, 16, 16
        );
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: this.glowColor,
            transparent: true,
            opacity: 0.2,
            emissive: this.glowColor,
            emissiveIntensity: this.glowIntensity,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = this.size * 0.3;
        this.addPart(glow);
        this.parts.glow = glow;
        
        // Add some trailing sparkles
        const numSparkles = 10;
        this.sparkles = [];
        
        for (let i = 0; i < numSparkles; i++) {
            const sparkleSize = this.size * (0.02 + Math.random() * 0.03);
            const sparkle = new THREE.Mesh(
                new THREE.SphereGeometry(sparkleSize, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: this.glowColor,
                    emissive: this.glowColor,
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Randomize initial positions
            sparkle.position.set(
                (Math.random() - 0.5) * this.size * 2,
                (Math.random() - 0.5) * this.size * 2,
                (Math.random() - 0.5) * this.size * 2
            );
            
            this.sparkles.push({
                mesh: sparkle,
                speed: 0.2 + Math.random() * 0.8,
                offset: Math.random() * Math.PI * 2,
                life: 0,
                maxLife: 2 + Math.random() * 3
            });
            
            this.addPart(sparkle);
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        this.time += deltaTime;
        
        // Faery flight animation
        if (this.flyingPath.length > 0) {
            this.animateFlight(deltaTime);
        }
        
        // Wing flapping animation
        this.animateWings(deltaTime);
        
        // Limb movement animation
        this.animateLimbs(deltaTime);
        
        // Sparkle trail animation
        this.animateSparkles(deltaTime);
        
        // Glow pulsing animation
        if (this.parts.glow && this.parts.glow.material) {
            this.parts.glow.material.emissiveIntensity = 
                this.glowIntensity * (0.7 + Math.sin(this.time * 2) * 0.3);
            this.parts.glow.material.opacity = 
                0.2 * (0.7 + Math.sin(this.time * 1.5) * 0.3);
        }
    }
    
    animateFlight(deltaTime) {
        // Calculate current position along path
        const pathSpeed = this.flySpeed;
        const pathPosition = (this.time * pathSpeed) % this.flyingPath.length;
        const index1 = Math.floor(pathPosition);
        const index2 = (index1 + 1) % this.flyingPath.length;
        const blend = pathPosition - index1;
        
        // Interpolate between path points
        const point1 = this.flyingPath[index1];
        const point2 = this.flyingPath[index2];
        
        const targetX = point1.x + (point2.x - point1.x) * blend;
        const targetY = point1.y + (point2.y - point1.y) * blend;
        const targetZ = point1.z + (point2.z - point1.z) * blend;
        
        // Move toward target position with some easing
        const easing = 0.05;
        this.mesh.position.x += (targetX - this.mesh.position.x) * easing;
        this.mesh.position.y += (targetY - this.mesh.position.y) * easing;
        this.mesh.position.z += (targetZ - this.mesh.position.z) * easing;
        
        // Calculate direction of movement
        const direction = new THREE.Vector3(
            point2.x - point1.x,
            point2.y - point1.y,
            point2.z - point1.z
        ).normalize();
        
        // Orient faery toward movement direction
        if (direction.length() > 0.1) {
            const lookAt = new THREE.Vector3(
                this.mesh.position.x + direction.x,
                this.mesh.position.y + direction.y,
                this.mesh.position.z + direction.z
            );
            
            // Create a temporary vector for the up direction
            const up = new THREE.Vector3(0, 1, 0);
            
            // Create a rotation matrix
            const matrix = new THREE.Matrix4();
            matrix.lookAt(this.mesh.position, lookAt, up);
            
            // Convert to quaternion
            const quaternion = new THREE.Quaternion();
            quaternion.setFromRotationMatrix(matrix);
            
            // Apply rotation with smoothing
            this.mesh.quaternion.slerp(quaternion, 0.1);
        }
        
        // Add some bobbing motion
        this.mesh.position.y += Math.sin(this.time * 3) * 0.05;
    }
    
    animateWings(deltaTime) {
        // Wing flapping animation
        const flapAmount = Math.sin(this.time * this.wingFlapSpeed) * Math.PI * 0.2;
        
        if (this.parts.leftWingUpper) {
            this.parts.leftWingUpper.rotation.z = 
                this.originalPositions.leftWingUpper.z + flapAmount;
        }
        
        if (this.parts.rightWingUpper) {
            this.parts.rightWingUpper.rotation.z = 
                this.originalPositions.rightWingUpper.z - flapAmount;
        }
        
        if (this.parts.leftWingLower) {
            this.parts.leftWingLower.rotation.z = 
                this.originalPositions.leftWingLower.z + flapAmount * 0.7;
        }
        
        if (this.parts.rightWingLower) {
            this.parts.rightWingLower.rotation.z = 
                this.originalPositions.rightWingLower.z - flapAmount * 0.7;
        }
    }
    
    animateLimbs(deltaTime) {
        // Subtle limb movement
        const armSwing = Math.sin(this.time * 2) * 0.1;
        const legSwing = Math.sin(this.time * 2) * 0.05;
        
        if (this.parts.leftArm) {
            this.parts.leftArm.rotation.x = 
                this.originalPositions.leftArm.rotation.x + armSwing;
        }
        
        if (this.parts.rightArm) {
            this.parts.rightArm.rotation.x = 
                this.originalPositions.rightArm.rotation.x - armSwing;
        }
        
        if (this.parts.leftLeg) {
            this.parts.leftLeg.rotation.x = 
                this.originalPositions.leftLeg.rotation.x + legSwing;
        }
        
        if (this.parts.rightLeg) {
            this.parts.rightLeg.rotation.x = 
                this.originalPositions.rightLeg.rotation.x - legSwing;
        }
    }
    
    animateSparkles(deltaTime) {
        // Update sparkle trail
        if (this.sparkles) {
            for (const sparkle of this.sparkles) {
                // Update life
                sparkle.life += deltaTime;
                
                if (sparkle.life > sparkle.maxLife) {
                    // Reset sparkle
                    sparkle.life = 0;
                    sparkle.mesh.position.copy(this.mesh.position);
                    sparkle.mesh.position.y += this.size * 0.3;
                    sparkle.offset = Math.random() * Math.PI * 2;
                    sparkle.maxLife = 2 + Math.random() * 3;
                }
                
                // Fade out as life progresses
                const fade = 1.0 - (sparkle.life / sparkle.maxLife);
                if (sparkle.mesh.material) {
                    sparkle.mesh.material.opacity = fade * 0.7;
                    sparkle.mesh.material.emissiveIntensity = fade * 0.8;
                }
                
                // Move sparkle downward and outward
                sparkle.mesh.position.y -= deltaTime * sparkle.speed * 0.5;
                sparkle.mesh.position.x += Math.sin(sparkle.offset) * deltaTime * 0.2;
                sparkle.mesh.position.z += Math.cos(sparkle.offset) * deltaTime * 0.2;
            }
        }
    }
}