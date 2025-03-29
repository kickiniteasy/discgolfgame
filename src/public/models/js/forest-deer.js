export default class ForestDeer extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.bodyColor = options.visualProperties?.bodyColor || 
                          options.properties?.bodyColor || 
                          "#D2B48C"; // Tan
        this.underbellyColor = options.visualProperties?.underbellyColor || 
                                options.properties?.underbellyColor || 
                                "#F5F5DC"; // Beige
        this.antlerColor = options.visualProperties?.antlerColor || 
                            options.properties?.antlerColor || 
                            "#8B4513"; // Saddle brown
        this.eyeColor = options.visualProperties?.eyeColor || 
                         options.properties?.eyeColor || 
                         "#000000"; // Black
        this.noseColor = options.visualProperties?.noseColor || 
                          options.properties?.noseColor || 
                          "#000000"; // Black
        this.markingsColor = options.visualProperties?.markingsColor || 
                              options.properties?.markingsColor || 
                              "#FFFFFF"; // White
        this.glowColor = options.visualProperties?.glowColor || 
                          options.properties?.glowColor || 
                          "#FFFFFF"; // White
        
        // Properties
        this.size = options.properties?.size || 1.5;
        this.antlerSize = options.properties?.antlerSize || 1.0;
        this.isMale = options.properties?.isMale !== false; // Default to male (with antlers)
        this.isMagical = options.properties?.isMagical !== false; // Default to magical (with glow)
        this.glowIntensity = options.properties?.glowIntensity || 0.5;
        this.walkSpeed = options.properties?.walkSpeed || 0.5;
        this.walkRadius = options.properties?.walkRadius || 10;
        
        // Animation state
        this.parts = {};
        this.time = 0;
        this.originalPositions = {};
        this.originalRotations = {};
        this.walkPath = [];
        this.currentPathIndex = 0;
        this.idleTime = 0;
        this.isIdle = false;
        this.headLookDirection = new THREE.Vector3();
        
        // Generate random walking path
        this.generateWalkPath();
    }

    async init() {
        this.createBody();
        this.createHead();
        this.createLegs();
        this.createTail();
        
        if (this.isMale) {
            this.createAntlers();
        }
        
        if (this.isMagical) {
            this.createGlowEffects();
        }
        
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
    
    generateWalkPath() {
        // Create a randomized path for the deer to follow
        const pathPoints = 6;
        const pathRadius = this.walkRadius;
        
        for (let i = 0; i < pathPoints; i++) {
            const angle = (i / pathPoints) * Math.PI * 2;
            // Add some randomness to the path
            const radius = pathRadius * (0.7 + Math.random() * 0.6);
            
            this.walkPath.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                idleChance: Math.random() // Random chance this will be an idle point
            });
        }
    }
    
    createBody() {
        // Create the deer body
        const bodyGeometry = new THREE.CylinderGeometry(
            this.size * 0.3, 
            this.size * 0.4, 
            this.size * 1.2, 
            8
        );
        
        // Adjust the cylinder to be horizontal
        for (let i = 0; i < bodyGeometry.attributes.position.count; i++) {
            const x = bodyGeometry.attributes.position.getX(i);
            const y = bodyGeometry.attributes.position.getY(i);
            
            bodyGeometry.attributes.position.setX(i, y);
            bodyGeometry.attributes.position.setY(i, x);
        }
        
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = this.size * 0.8;
        body.castShadow = true;
        body.receiveShadow = true;
        this.addPart(body);
        this.parts.body = body;
        this.originalPositions.body = body.position.clone();
        
        // Create neck
        const neckGeometry = new THREE.CylinderGeometry(
            this.size * 0.2, 
            this.size * 0.3, 
            this.size * 0.5, 
            8
        );
        
        const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
        neck.position.set(
            this.size * 0.6, 
            this.size * 0.9, 
            0
        );
        neck.rotation.z = Math.PI * 0.25;
        neck.castShadow = true;
        this.addPart(neck);
        this.parts.neck = neck;
        this.originalPositions.neck = neck.position.clone();
        this.originalRotations.neck = neck.rotation.clone();
        
        // Create underbelly
        const underbellyGeometry = new THREE.SphereGeometry(
            this.size * 0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5
        );
        const underbellyMaterial = new THREE.MeshStandardMaterial({
            color: this.underbellyColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const underbelly = new THREE.Mesh(underbellyGeometry, underbellyMaterial);
        underbelly.position.set(0, this.size * 0.62, 0);
        underbelly.rotation.x = Math.PI;
        underbelly.castShadow = true;
        this.addPart(underbelly);
        
        // Create any markings (spots) if needed
        if (Math.random() > 0.5) {
            this.createMarkings();
        }
    }
    
    createMarkings() {
        // Add some spots or markings to the deer
        const numSpots = Math.floor(5 + Math.random() * 8);
        const spotMaterial = new THREE.MeshStandardMaterial({
            color: this.markingsColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        for (let i = 0; i < numSpots; i++) {
            const spotSize = this.size * (0.05 + Math.random() * 0.08);
            const spotGeometry = new THREE.SphereGeometry(spotSize, 8, 8);
            
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            
            // Position on body with slight randomization
            const angle = Math.random() * Math.PI * 2;
            const heightOffset = (Math.random() - 0.5) * this.size * 0.2;
            
            spot.position.set(
                (Math.random() - 0.5) * this.size * 0.8,
                this.size * 0.8 + heightOffset,
                (Math.random() - 0.5) * this.size * 0.5
            );
            
            // Flatten the spot against the body
            spot.scale.y = 0.2;
            this.addPart(spot);
        }
    }
    
    createHead() {
        // Create the deer head
        const headGeometry = new THREE.SphereGeometry(
            this.size * 0.18, 16, 16
        );
        const headMaterial = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(
            this.size * 0.9, 
            this.size * 1.1, 
            0
        );
        head.castShadow = true;
        this.addPart(head);
        this.parts.head = head;
        this.originalPositions.head = head.position.clone();
        
        // Create snout
        const snoutGeometry = new THREE.ConeGeometry(
            this.size * 0.1, this.size * 0.2, 8
        );
        
        const snout = new THREE.Mesh(snoutGeometry, headMaterial);
        snout.position.set(
            this.size * 1.05, 
            this.size * 1.05, 
            0
        );
        snout.rotation.z = -Math.PI * 0.5;
        snout.castShadow = true;
        this.addPart(snout);
        
        // Create nose
        const noseGeometry = new THREE.SphereGeometry(
            this.size * 0.05, 8, 8
        );
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: this.noseColor,
            roughness: 0.5,
            metalness: 0.2
        });
        
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(
            this.size * 1.15, 
            this.size * 1.05, 
            0
        );
        nose.scale.x = 0.7;
        this.addPart(nose);
        
        // Create eyes
        const eyeGeometry = new THREE.SphereGeometry(
            this.size * 0.03, 8, 8
        );
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: this.eyeColor,
            roughness: 0.5,
            metalness: 0.3
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(
            this.size * 0.95, 
            this.size * 1.2, 
            this.size * 0.12
        );
        this.addPart(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(
            this.size * 0.95, 
            this.size * 1.2, 
            -this.size * 0.12
        );
        this.addPart(rightEye);
        
        // Create ears
        const earGeometry = new THREE.ConeGeometry(
            this.size * 0.08, this.size * 0.15, 8
        );
        const earMaterial = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Left ear
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(
            this.size * 0.85, 
            this.size * 1.25, 
            this.size * 0.15
        );
        leftEar.rotation.x = Math.PI * 0.15;
        leftEar.rotation.z = -Math.PI * 0.1;
        this.addPart(leftEar);
        this.parts.leftEar = leftEar;
        this.originalRotations.leftEar = leftEar.rotation.clone();
        
        // Right ear
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(
            this.size * 0.85, 
            this.size * 1.25, 
            -this.size * 0.15
        );
        rightEar.rotation.x = -Math.PI * 0.15;
        rightEar.rotation.z = -Math.PI * 0.1;
        this.addPart(rightEar);
        this.parts.rightEar = rightEar;
        this.originalRotations.rightEar = rightEar.rotation.clone();
    }
    
    createAntlers() {
        // Only male deer have antlers
        const antlerMaterial = new THREE.MeshStandardMaterial({
            color: this.antlerColor,
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Function to create a single antler branch
        const createAntlerBranch = (startPos, direction, length, thickness, branchFactor) => {
            const antlerGeometry = new THREE.CylinderGeometry(
                thickness * 0.7, thickness, length, 8
            );
            
            const antler = new THREE.Mesh(antlerGeometry, antlerMaterial);
            antler.position.copy(startPos);
            
            // Orient along direction
            antler.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0), direction.clone().normalize()
            );
            
            // Move to attach at bottom
            antler.position.add(direction.clone().multiplyScalar(length * 0.5));
            
            antler.castShadow = true;
            this.addPart(antler);
            
            // End position for potential branches
            const endPos = startPos.clone().add(direction.clone().multiplyScalar(length));
            
            // Add branches recursively if branch factor is high enough
            if (branchFactor > 0.2 && length > this.size * 0.1) {
                const numBranches = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numBranches; i++) {
                    // Create random direction for branch
                    const branchDir = direction.clone();
                    branchDir.x += (Math.random() - 0.5) * 1.0;
                    branchDir.y += (Math.random() - 0.5) * 0.2 + 0.4;
                    branchDir.z += (Math.random() - 0.5) * 1.0;
                    branchDir.normalize();
                    
                    // Create branch with reduced parameters
                    createAntlerBranch(
                        endPos, 
                        branchDir, 
                        length * (0.5 + Math.random() * 0.3), 
                        thickness * 0.7,
                        branchFactor * 0.7
                    );
                }
            }
            
            return endPos;
        };
        
        // Create base antlers from the head
        const leftBasePos = new THREE.Vector3(
            this.size * 0.8, 
            this.size * 1.3, 
            this.size * 0.1
        );
        
        const rightBasePos = new THREE.Vector3(
            this.size * 0.8, 
            this.size * 1.3, 
            -this.size * 0.1
        );
        
        // Left main antler
        const leftDir = new THREE.Vector3(0.3, 1, 0.2).normalize();
        const leftMainEnd = createAntlerBranch(
            leftBasePos, 
            leftDir, 
            this.size * 0.3 * this.antlerSize, 
            this.size * 0.03 * this.antlerSize,
            0.9
        );
        
        // Right main antler
        const rightDir = new THREE.Vector3(0.3, 1, -0.2).normalize();
        const rightMainEnd = createAntlerBranch(
            rightBasePos, 
            rightDir, 
            this.size * 0.3 * this.antlerSize, 
            this.size * 0.03 * this.antlerSize,
            0.9
        );
    }
    
    createLegs() {
        // Create the deer legs
        const legMaterial = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Function to create a leg
        const createLeg = (x, z, isFront) => {
            const legGroup = new THREE.Group();
            
            // Upper leg
            const upperLegGeometry = new THREE.CylinderGeometry(
                this.size * 0.06, 
                this.size * 0.05, 
                this.size * 0.4, 
                8
            );
            
            const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
            upperLeg.position.y = -this.size * 0.2;
            upperLeg.castShadow = true;
            legGroup.add(upperLeg);
            this.addPart(upperLeg);
            
            // Lower leg
            const lowerLegGeometry = new THREE.CylinderGeometry(
                this.size * 0.04, 
                this.size * 0.02, 
                this.size * 0.4, 
                8
            );
            
            const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
            lowerLeg.position.y = -this.size * 0.6;
            lowerLeg.castShadow = true;
            legGroup.add(lowerLeg);
            this.addPart(lowerLeg);
            
            // Position the entire leg
            legGroup.position.set(x, this.size * 0.6, z);
            this.mesh.add(legGroup);
            
            return {
                group: legGroup,
                upper: upperLeg,
                lower: lowerLeg,
                isFront: isFront,
                originalPosition: legGroup.position.clone()
            };
        };
        
        // Create all four legs
        this.parts.frontLeftLeg = createLeg(this.size * 0.4, this.size * 0.2, true);
        this.parts.frontRightLeg = createLeg(this.size * 0.4, -this.size * 0.2, true);
        this.parts.backLeftLeg = createLeg(-this.size * 0.4, this.size * 0.2, false);
        this.parts.backRightLeg = createLeg(-this.size * 0.4, -this.size * 0.2, false);
        
        // Store original rotations for animation
        this.originalRotations.frontLeftLeg = this.parts.frontLeftLeg.group.rotation.clone();
        this.originalRotations.frontRightLeg = this.parts.frontRightLeg.group.rotation.clone();
        this.originalRotations.backLeftLeg = this.parts.backLeftLeg.group.rotation.clone();
        this.originalRotations.backRightLeg = this.parts.backRightLeg.group.rotation.clone();
    }
    
    createTail() {
        // Create a small tail
        const tailGeometry = new THREE.SphereGeometry(
            this.size * 0.08, 8, 8
        );
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: this.underbellyColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(
            -this.size * 0.6, 
            this.size * 0.8, 
            0
        );
        tail.scale.set(0.7, 0.7, 0.7);
        tail.castShadow = true;
        this.addPart(tail);
        this.parts.tail = tail;
        this.originalPositions.tail = tail.position.clone();
    }
    
    createGlowEffects() {
        if (!this.isMagical) return;
        
        // Create a subtle glow around the antlers if male
        if (this.isMale) {
            const antlerGlowGeometry = new THREE.SphereGeometry(
                this.size * 0.4, 16, 16
            );
            const antlerGlowMaterial = new THREE.MeshStandardMaterial({
                color: this.glowColor,
                transparent: true,
                opacity: 0.2,
                emissive: this.glowColor,
                emissiveIntensity: this.glowIntensity,
                side: THREE.BackSide
            });
            
            const antlerGlow = new THREE.Mesh(antlerGlowGeometry, antlerGlowMaterial);
            antlerGlow.position.set(
                this.size * 0.8, 
                this.size * 1.3, 
                0
            );
            this.addPart(antlerGlow);
            this.parts.antlerGlow = antlerGlow;
        }
        
        // Create glowing eyes
        const eyeGlowGeometry = new THREE.SphereGeometry(
            this.size * 0.05, 8, 8
        );
        const eyeGlowMaterial = new THREE.MeshStandardMaterial({
            color: "#00FFFF", // Cyan
            transparent: true,
            opacity: 0.6,
            emissive: "#00FFFF",
            emissiveIntensity: this.glowIntensity * 0.8
        });
        
        // Left eye glow
        const leftEyeGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial);
        leftEyeGlow.position.set(
            this.size * 0.95, 
            this.size * 1.2, 
            this.size * 0.12
        );
        this.addPart(leftEyeGlow);
        
        // Right eye glow
        const rightEyeGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial);
        rightEyeGlow.position.set(
            this.size * 0.95, 
            this.size * 1.2, 
            -this.size * 0.12
        );
        this.addPart(rightEyeGlow);
        
        // Add some magical particles following the deer
        const numParticles = 15;
        this.particles = [];
        
        for (let i = 0; i < numParticles; i++) {
            const particleSize = this.size * (0.02 + Math.random() * 0.04);
            const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
            const particleColor = i % 2 === 0 ? "#7DF9FF" : "#E6E6FA"; // Alternate colors
            
            const particleMaterial = new THREE.MeshStandardMaterial({
                color: particleColor,
                emissive: particleColor,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random initial position around the deer
            particle.position.set(
                (Math.random() - 0.5) * this.size,
                this.size * (0.5 + Math.random() * 0.7),
                (Math.random() - 0.5) * this.size
            );
            
            this.addPart(particle);
            this.particles.push({
                mesh: particle,
                offset: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 1.5,
                radius: this.size * (0.5 + Math.random() * 0.5),
                height: this.size * (0.1 + Math.random() * 0.6)
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        this.time += deltaTime;
        
        // If we're in an idle state
        if (this.isIdle) {
            this.idleTime += deltaTime;
            this.animateIdle(deltaTime);
            
            // Check if we should end idle
            if (this.idleTime > 5 + Math.random() * 5) {
                this.isIdle = false;
                this.idleTime = 0;
            }
        } else {
            // Walking animation
            this.animateWalk(deltaTime);
        }
        
        // Always animate ear twitches, tail, and breathing
        this.animateEars(deltaTime);
        this.animateTail(deltaTime);
        this.animateBreathing(deltaTime);
        
        // Animate magical effects if present
        if (this.isMagical) {
            this.animateGlowEffects(deltaTime);
        }
    }
    
    animateWalk(deltaTime) {
        // Get current and next target positions from path
        const current = this.walkPath[this.currentPathIndex];
        const nextIndex = (this.currentPathIndex + 1) % this.walkPath.length;
        const next = this.walkPath[nextIndex];
        
        // Check if we should enter idle state at this point
        if (current.idleChance > 0.7 && Math.random() > 0.99) {
            this.isIdle = true;
            this.idleTime = 0;
            return;
        }
        
        // Move toward next position
        const targetX = next.x;
        const targetZ = next.z;
        
        const dx = targetX - this.mesh.position.x;
        const dz = targetZ - this.mesh.position.z;
        const distanceSquared = dx * dx + dz * dz;
        
        // If we've reached the target, move to next waypoint
        if (distanceSquared < 0.5 * 0.5) {
            this.currentPathIndex = nextIndex;
        }
        
        // Direction vector to target
        const direction = new THREE.Vector3(dx, 0, dz).normalize();
        
        // Move in that direction
        const moveSpeed = this.walkSpeed * deltaTime;
        this.mesh.position.x += direction.x * moveSpeed;
        this.mesh.position.z += direction.z * moveSpeed;
        
        // Rotate to face movement direction
        if (distanceSquared > 0.1) {
            const targetRotation = Math.atan2(direction.x, direction.z);
            
            // Smooth rotation
            let currentRotation = this.mesh.rotation.y;
            const rotDiff = targetRotation - currentRotation;
            
            // Handle wrapping
            let shortestRotation = ((rotDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
            this.mesh.rotation.y += shortestRotation * Math.min(1, deltaTime * 3);
        }
        
        // Leg animations for walking
        const walkCycle = this.time * 3;
        
        // Front legs
        
        const frontLegSwing = Math.sin(walkCycle) * 0.3;
        this.parts.frontLeftLeg.group.rotation.x = 
            this.originalRotations.frontLeftLeg.x + frontLegSwing;
        this.parts.frontRightLeg.group.rotation.x = 
            this.originalRotations.frontRightLeg.x - frontLegSwing;
        
        // Back legs (opposite phase)
        const backLegSwing = Math.sin(walkCycle + Math.PI) * 0.3;
        this.parts.backLeftLeg.group.rotation.x = 
            this.originalRotations.backLeftLeg.x + backLegSwing;
        this.parts.backRightLeg.group.rotation.x = 
            this.originalRotations.backRightLeg.x - backLegSwing;
        
        
        // Subtle head bob
        if (this.parts.head) {
            this.parts.head.position.y = 
                this.originalPositions.head.y + Math.sin(walkCycle * 2) * 0.03;
        }
        
        // Neck movement
        if (this.parts.neck) {
            this.parts.neck.rotation.z = 
                this.originalRotations.neck.z + Math.sin(walkCycle) * 0.05;
        }
    }
    
    animateIdle(deltaTime) {
        // Subtle head movement during idle
        if (this.parts.head) {
            // Look around randomly
            if (Math.random() > 0.99) {
                this.headLookDirection = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    0,
                    (Math.random() - 0.5) * 2
                ).normalize();
            }
            
            // Gradually turn head toward look direction
            const currentDir = new THREE.Vector3(
                Math.sin(this.mesh.rotation.y + this.parts.head.rotation.y),
                0,
                Math.cos(this.mesh.rotation.y + this.parts.head.rotation.y)
            );
            
            // Calculate angle between current and target directions
            const targetAngle = Math.atan2(this.headLookDirection.x, this.headLookDirection.z);
            const currentAngle = Math.atan2(currentDir.x, currentDir.z);
            const angleToRotate = targetAngle - currentAngle;
            
            // Apply partial rotation
            this.parts.head.rotation.y += angleToRotate * deltaTime * 0.5;
            this.parts.head.rotation.y = Math.max(
                -0.5, Math.min(0.5, this.parts.head.rotation.y)
            );
            
            // Occasional downward head movement (grazing)
            if (Math.random() > 0.995) {
                this.parts.neck.rotation.z = 
                    this.originalRotations.neck.z + Math.PI * 0.15;
            } else if (Math.random() > 0.995) {
                this.parts.neck.rotation.z = this.originalRotations.neck.z;
            }
        }
    }
    
    animateEars(deltaTime) {
        // Occasional ear twitches
        if (this.parts.leftEar && Math.random() > 0.99) {
            this.parts.leftEar.rotation.z = 
                this.originalRotations.leftEar.z - Math.PI * 0.1;
            
            setTimeout(() => {
                if (this.parts.leftEar) {
                    this.parts.leftEar.rotation.z = this.originalRotations.leftEar.z;
                }
            }, 200);
        }
        
        if (this.parts.rightEar && Math.random() > 0.99) {
            this.parts.rightEar.rotation.z = 
                this.originalRotations.rightEar.z - Math.PI * 0.1;
            
            setTimeout(() => {
                if (this.parts.rightEar) {
                    this.parts.rightEar.rotation.z = this.originalRotations.rightEar.z;
                }
            }, 200);
        }
    }
    
    animateTail(deltaTime) {
        // Occasional tail flicks
        if (this.parts.tail) {
            if (Math.random() > 0.99) {
                this.parts.tail.position.y = this.originalPositions.tail.y + 0.1;
                
                setTimeout(() => {
                    if (this.parts.tail) {
                        this.parts.tail.position.y = this.originalPositions.tail.y;
                    }
                }, 200);
            }
        }
    }
    
    animateBreathing(deltaTime) {
        // Subtle breathing animation
        if (this.parts.body) {
            const breathingCycle = Math.sin(this.time * 0.5) * 0.03;
            this.parts.body.scale.y = 1 + breathingCycle;
            this.parts.body.scale.z = 1 + breathingCycle;
        }
    }
    
    animateGlowEffects(deltaTime) {
        // Animate glow intensity
        if (this.parts.antlerGlow && this.parts.antlerGlow.material) {
            this.parts.antlerGlow.material.emissiveIntensity = 
                this.glowIntensity * (0.7 + Math.sin(this.time) * 0.3);
        }
        
        // Animate magical particles
        if (this.particles) {
            for (const particle of this.particles) {
                // Orbital movement around deer
                const angle = this.time * particle.speed + particle.offset;
                
                particle.mesh.position.x = this.mesh.position.x + 
                    Math.cos(angle) * particle.radius;
                particle.mesh.position.z = this.mesh.position.z + 
                    Math.sin(angle) * particle.radius;
                particle.mesh.position.y = this.size * 0.5 + 
                    particle.height + Math.sin(angle * 2) * 0.1;
                
                // Pulsating glow
                if (particle.mesh.material) {
                    particle.mesh.material.emissiveIntensity = 
                        0.8 * (0.7 + Math.sin(this.time * 2 + particle.offset) * 0.3);
                    particle.mesh.material.opacity = 
                        0.7 * (0.7 + Math.sin(this.time * 3 + particle.offset) * 0.3);
                }
            }
        }
    }
}