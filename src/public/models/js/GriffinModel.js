/*
 * Griffin Model for Three.js
 * Features eagle head/wings with lion body/tail
 * 
 * To be loaded by CustomTerrain class as a JS model
 */

export default class GriffinModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Animation parameters
        this.wingFlapSpeed = 0.08;
        this.wingFlapDirection = 1;
        this.wingFlapAmount = 0;
        this.tailSwayAmount = 0;
        this.tailSwaySpeed = 0.06;
        this.breathingAmount = 0;
        this.breathingSpeed = 0.03;
        this.headMovementAmount = 0;
        this.headMovementSpeed = 0.02;
        
        // Store griffin parts for animation
        this.griffinParts = {};
        
        // Get colors from visualProperties or fall back to defaults
        this.bodyColor = options.visualProperties?.bodyColor || 
                         options.properties?.bodyColor || 
                         "#c2a36c"; // Golden tan for lion body
                         
        this.featherColor = options.visualProperties?.featherColor || 
                           options.properties?.featherColor || 
                           "#6e452e"; // Brown for feathers
                           
        this.beakColor = options.visualProperties?.beakColor || 
                        options.properties?.beakColor || 
                        "#e6b800"; // Gold for beak
                        
        this.eyeColor = options.visualProperties?.eyeColor || 
                       options.properties?.eyeColor || 
                       "#ffdd00"; // Yellow for eyes
    }

    async init() {
        // Create griffin parts
        this.createGriffinBody();
        this.createGriffinLegs();
        this.createGriffinTail();
        this.createGriffinNeck();
        this.createGriffinHead();
        this.createGriffinWings();
        
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
    
    createGriffinBody() {
        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create body group
        const bodyGroup = new THREE.Group();
        
        // Main body (lion part)
        const bodyGeo = new THREE.SphereGeometry(2, 16, 16);
        const body = new THREE.Mesh(bodyGeo, bodyMaterial);
        body.scale.set(1.2, 1, 1.8);
        body.castShadow = true;
        bodyGroup.add(body);
        this.addPart(body);
        
        // Add fur-like texture (small cone shapes all over the body)
        const furCount = 40;
        const furMaterial = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            roughness: 1.0,
            metalness: 0.0
        });
        
        for (let i = 0; i < furCount; i++) {
            const size = Math.random() * 0.2 + 0.1;
            const furGeo = new THREE.ConeGeometry(size, size * 2, 4);
            const fur = new THREE.Mesh(furGeo, furMaterial);
            
            // Position on the body surface with random rotation
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            // Adjust position to account for the scaled sphere
            const x = Math.sin(phi) * Math.cos(theta) * 2.4;
            const y = Math.cos(phi) * 2;
            const z = Math.sin(phi) * Math.sin(theta) * 3.6;
            
            fur.position.set(x, y, z);
            
            // Aim away from the center
            fur.lookAt(fur.position.clone().multiplyScalar(2));
            
            // Only add fur to the back half (lion part)
            if (z > -0.5) {
                bodyGroup.add(fur);
                this.addPart(fur);
            }
        }
        
        // Chest/shoulders area (transition to eagle front)
        const chestGeo = new THREE.SphereGeometry(1.8, 16, 16);
        const chest = new THREE.Mesh(chestGeo, bodyMaterial);
        chest.position.set(0, 0.5, -2);
        chest.scale.set(1.3, 1, 0.8);
        chest.castShadow = true;
        bodyGroup.add(chest);
        this.addPart(chest);
        
        this.griffinParts.body = bodyGroup;
        this.mesh.add(bodyGroup);
    }
    
    createGriffinLegs() {
        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const clawMaterial = new THREE.MeshStandardMaterial({ 
            color: this.beakColor,
            roughness: 0.5,
            metalness: 0.4
        });
        
        // Create legs group
        const legsGroup = new THREE.Group();
        
        // Function to create a leg
        const createLeg = (isLeft, isBack) => {
            const legGroup = new THREE.Group();
            const side = isLeft ? 1 : -1;
            
            // Position based on front/back
            const zPos = isBack ? 1 : -1.5;
            
            // Upper leg
            const upperLegGeo = new THREE.CylinderGeometry(0.4, 0.3, 1.8, 8);
            const upperLeg = new THREE.Mesh(upperLegGeo, bodyMaterial);
            upperLeg.position.y = -0.9;
            
            // Different angles for front (eagle) and back (lion) legs
            if (isBack) {
                // Lion back leg
                upperLeg.rotation.x = Math.PI * 0.1;
            } else {
                // Eagle front leg/talon
                upperLeg.rotation.x = Math.PI * 0.05;
            }
            
            upperLeg.castShadow = true;
            legGroup.add(upperLeg);
            this.addPart(upperLeg);
            
            // Lower leg
            const lowerLegGeo = new THREE.CylinderGeometry(0.3, 0.2, 1.5, 8);
            const lowerLeg = new THREE.Mesh(lowerLegGeo, bodyMaterial);
            
            if (isBack) {
                // Lion back lower leg
                lowerLeg.position.set(0, -2, 0.3);
                lowerLeg.rotation.x = -Math.PI * 0.4;
            } else {
                // Eagle lower leg/talon
                lowerLeg.position.set(0, -1.8, 0.2);
                lowerLeg.rotation.x = Math.PI * 0.15;
            }
            
            lowerLeg.castShadow = true;
            legGroup.add(lowerLeg);
            this.addPart(lowerLeg);
            
            // Paws for back legs, talons for front
            if (isBack) {
                // Lion paw
                const pawGeo = new THREE.SphereGeometry(0.35, 8, 8);
                const paw = new THREE.Mesh(pawGeo, bodyMaterial);
                paw.position.set(0, -2.8, 0.8);
                paw.scale.set(1, 0.6, 1.2);
                paw.castShadow = true;
                legGroup.add(paw);
                this.addPart(paw);
                
                // Toe beans
                for (let i = 0; i < 4; i++) {
                    const toeGeo = new THREE.SphereGeometry(0.1, 6, 6);
                    const toe = new THREE.Mesh(toeGeo, bodyMaterial);
                    toe.position.set((i - 1.5) * 0.15, -3, 1.2);
                    toe.scale.set(1, 0.5, 1);
                    toe.castShadow = true;
                    legGroup.add(toe);
                    this.addPart(toe);
                }
                
                // Claws
                for (let i = 0; i < 4; i++) {
                    const clawGeo = new THREE.ConeGeometry(0.05, 0.2, 8);
                    const claw = new THREE.Mesh(clawGeo, clawMaterial);
                    claw.position.set((i - 1.5) * 0.15, -3, 1.35);
                    claw.rotation.x = Math.PI / 2;
                    claw.castShadow = true;
                    legGroup.add(claw);
                    this.addPart(claw);
                }
            } else {
                // Eagle talons
                const footGeo = new THREE.SphereGeometry(0.25, 8, 8);
                const foot = new THREE.Mesh(footGeo, bodyMaterial);
                foot.position.set(0, -2.7, 0.5);
                foot.scale.set(1, 0.6, 1);
                foot.castShadow = true;
                legGroup.add(foot);
                this.addPart(foot);
                
                // Talons
                for (let i = 0; i < 3; i++) {
                    const talonGeo = new THREE.ConeGeometry(0.1, 0.5, 8);
                    const talon = new THREE.Mesh(talonGeo, clawMaterial);
                    const angle = (i - 1) * Math.PI / 6;
                    
                    talon.position.set(Math.sin(angle) * 0.3, -2.9, Math.cos(angle) * 0.3 + 0.7);
                    talon.rotation.x = Math.PI / 2;
                    talon.rotation.z = -angle;
                    talon.castShadow = true;
                    legGroup.add(talon);
                    this.addPart(talon);
                }
                
                // Back talon
                const backTalonGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
                const backTalon = new THREE.Mesh(backTalonGeo, clawMaterial);
                backTalon.position.set(0, -2.7, 0.2);
                backTalon.rotation.x = -Math.PI / 2;
                backTalon.castShadow = true;
                legGroup.add(backTalon);
                this.addPart(backTalon);
            }
            
            // Position leg
            legGroup.position.set(side * 1.3, 0, zPos);
            
            return legGroup;
        };
        
        // Create four legs (front eagle legs, back lion legs)
        const frontLeftLeg = createLeg(true, false);
        this.griffinParts.frontLeftLeg = frontLeftLeg;
        legsGroup.add(frontLeftLeg);
        
        const frontRightLeg = createLeg(false, false);
        this.griffinParts.frontRightLeg = frontRightLeg;
        legsGroup.add(frontRightLeg);
        
        const backLeftLeg = createLeg(true, true);
        this.griffinParts.backLeftLeg = backLeftLeg;
        legsGroup.add(backLeftLeg);
        
        const backRightLeg = createLeg(false, true);
        this.griffinParts.backRightLeg = backRightLeg;
        legsGroup.add(backRightLeg);
        
        this.mesh.add(legsGroup);
    }
    
    createGriffinTail() {
        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.bodyColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const tuftMaterial = new THREE.MeshStandardMaterial({ 
            color: this.featherColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create tail group
        const tailGroup = new THREE.Group();
        
        // Create main tail parts
        const segments = 5;
        const tailParts = [];
        
        for (let i = 0; i < segments; i++) {
            const segSize = 0.35 - i * 0.02;
            const tailSegGeo = new THREE.SphereGeometry(segSize, 8, 8);
            const tailSeg = new THREE.Mesh(tailSegGeo, bodyMaterial);
            
            // Position each segment
            const offset = i * 0.4;
            tailSeg.position.set(0, 0, 3 + offset);
            tailSeg.castShadow = true;
            
            tailParts.push(tailSeg);
            tailGroup.add(tailSeg);
            this.addPart(tailSeg);
        }
        
        // Tail tuft at the end
        const tuftGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const tuft = new THREE.Mesh(tuftGeo, tuftMaterial);
        tuft.position.set(0, 0, 5);
        tuft.scale.set(1, 1, 1.2);
        tuft.castShadow = true;
        tailGroup.add(tuft);
        this.addPart(tuft);
        
        // Add tail hair strands
        for (let i = 0; i < 15; i++) {
            const hairGeo = new THREE.CylinderGeometry(0.03, 0.01, 0.8, 4);
            const hair = new THREE.Mesh(hairGeo, tuftMaterial);
            
            // Random position within the tuft
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.2;
            hair.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                5.2 + Math.random() * 0.3
            );
            
            // Random orientation
            hair.rotation.x = (Math.random() - 0.5) * 0.5;
            hair.rotation.z = (Math.random() - 0.5) * 0.5;
            
            hair.castShadow = true;
            tailGroup.add(hair);
            this.addPart(hair);
        }
        
        this.griffinParts.tail = tailGroup;
        this.griffinParts.tailSegments = tailParts;
        this.mesh.add(tailGroup);
    }
    
    createGriffinNeck() {
        // Materials
        const featherMaterial = new THREE.MeshStandardMaterial({ 
            color: this.featherColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create neck group
        const neckGroup = new THREE.Group();
        
        // Create curved neck using multiple segments
        const segments = 4;
        const neckParts = [];
        
        for (let i = 0; i < segments; i++) {
            const progress = i / (segments - 1);
            const segSize = 0.7 - progress * 0.2;
            
            const neckSegGeo = new THREE.SphereGeometry(segSize, 12, 12);
            const neckSeg = new THREE.Mesh(neckSegGeo, featherMaterial);
            
            // Position along a curve
            const xPos = 0;
            const yPos = 0.5 + progress * 3;
            const zPos = -2.5 - progress * 1.5;
            
            neckSeg.position.set(xPos, yPos, zPos);
            neckSeg.scale.set(1, 1, 1.2); // Slightly elongated
            neckSeg.castShadow = true;
            
            neckParts.push(neckSeg);
            neckGroup.add(neckSeg);
            this.addPart(neckSeg);
        }
        
        this.griffinParts.neck = neckGroup;
        this.griffinParts.neckSegments = neckParts;
        this.mesh.add(neckGroup);
    }
    
    createGriffinHead() {
        // Materials
        const featherMaterial = new THREE.MeshStandardMaterial({ 
            color: this.featherColor,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const beakMaterial = new THREE.MeshStandardMaterial({ 
            color: this.beakColor,
            roughness: 0.4,
            metalness: 0.6
        });
        
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: this.eyeColor,
            roughness: 0.3,
            metalness: 0.7,
            emissive: this.eyeColor,
            emissiveIntensity: 0.3
        });
        
        // Create head group
        const headGroup = new THREE.Group();
        
        // Eagle head - main sphere
        const headGeo = new THREE.SphereGeometry(0.9, 16, 16);
        const head = new THREE.Mesh(headGeo, featherMaterial);
        head.scale.set(1, 0.9, 1.2);
        head.castShadow = true;
        headGroup.add(head);
        this.addPart(head);
        
        // Eagle beak - upper
        const upperBeakGeo = new THREE.ConeGeometry(0.4, 1, 8);
        const upperBeak = new THREE.Mesh(upperBeakGeo, beakMaterial);
        upperBeak.rotation.x = Math.PI / 2;
        upperBeak.position.set(0, -0.1, 1);
        upperBeak.scale.set(1, 1, 0.5);
        upperBeak.castShadow = true;
        headGroup.add(upperBeak);
        this.addPart(upperBeak);
        
        // Eagle beak - lower
        const lowerBeakGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
        const lowerBeak = new THREE.Mesh(lowerBeakGeo, beakMaterial);
        lowerBeak.rotation.x = Math.PI / 2.5;
        lowerBeak.position.set(0, -0.4, 0.8);
        lowerBeak.scale.set(0.8, 1, 0.4);
        lowerBeak.castShadow = true;
        headGroup.add(lowerBeak);
        this.griffinParts.lowerBeak = lowerBeak;
        this.addPart(lowerBeak);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.15, 12, 12);
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
        leftEye.position.set(0.4, 0.2, 0.8);
        headGroup.add(leftEye);
        this.addPart(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
        rightEye.position.set(-0.4, 0.2, 0.8);
        headGroup.add(rightEye);
        this.addPart(rightEye);
        
        // Pupils
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pupilGeo = new THREE.SphereGeometry(0.07, 8, 8);
        
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
        leftPupil.position.set(0.41, 0.21, 0.94);
        headGroup.add(leftPupil);
        this.addPart(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
        rightPupil.position.set(-0.41, 0.21, 0.94);
        headGroup.add(rightPupil);
        this.addPart(rightPupil);
        
        // Ear tufts
        const createEarTuft = (isLeft) => {
            const tuftGroup = new THREE.Group();
            const side = isLeft ? 1 : -1;
            
            // Main ear tuft
            const tuftGeo = new THREE.ConeGeometry(0.1, 0.7, 8);
            const tuft = new THREE.Mesh(tuftGeo, featherMaterial);
            tuft.position.set(0, 0, 0);
            tuft.rotation.x = Math.PI * 0.1;
            tuft.rotation.z = side * Math.PI * 0.1;
            tuftGroup.add(tuft);
            this.addPart(tuft);
            
            // Position the group
            tuftGroup.position.set(side * 0.5, 0.7, 0);
            
            return tuftGroup;
        };
        
        const leftEarTuft = createEarTuft(true);
        headGroup.add(leftEarTuft);
        
        const rightEarTuft = createEarTuft(false);
        headGroup.add(rightEarTuft);
        
        // Position the entire head
        headGroup.position.set(0, 3.5, -4);
        
        this.griffinParts.head = headGroup;
        this.mesh.add(headGroup);
    }
    
    createGriffinWings() {
        // Materials
        const featherMaterial = new THREE.MeshStandardMaterial({ 
            color: this.featherColor,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        
        // Create wing function
        const createWing = (isLeft) => {
            const wingGroup = new THREE.Group();
            const side = isLeft ? 1 : -1;
            
            // Wing structure
            // Main shape for the wing
            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.lineTo(0, 2);
            wingShape.bezierCurveTo(2, 4, 6, 3, 8, 0);
            wingShape.lineTo(6, -1);
            wingShape.bezierCurveTo(4, -0.5, 2, -0.5, 0, 0);
            
            const wingGeo = new THREE.ShapeGeometry(wingShape);
            const wing = new THREE.Mesh(wingGeo, featherMaterial);
            wing.castShadow = true;
            wingGroup.add(wing);
            this.addPart(wing);
            
            // Add primary feathers
            for (let i = 0; i < 8; i++) {
                const featherGeo = new THREE.PlaneGeometry(2.5, 0.5);
                const feather = new THREE.Mesh(featherGeo, featherMaterial);
                
                // Position along the wing edge
                const progress = i / 7;
                const angle = progress * Math.PI * 0.3;
                
                feather.position.set(
                    2 + progress * 5,
                    -0.5 - progress * 0.5,
                    0.01 // Slight offset to prevent z-fighting
                );
                
                feather.rotation.z = -angle;
                feather.castShadow = true;
                wingGroup.add(feather);
                this.addPart(feather);
            }
            
            // Secondary feathers at the top edge
            for (let i = 0; i < 5; i++) {
                const secFeatherGeo = new THREE.PlaneGeometry(1.5, 0.4);
                const secFeather = new THREE.Mesh(secFeatherGeo, featherMaterial);
                
                const progress = i / 4;
                const xPos = 1 + progress * 4;
                
                secFeather.position.set(
                    xPos,
                    1.5 + Math.sin(progress * Math.PI) * 1.5,
                    0.02 // Slight offset
                );
                
                secFeather.rotation.z = Math.PI * 0.1;
                secFeather.castShadow = true;
                wingGroup.add(secFeather);
                this.addPart(secFeather);
            }
            
            // Apply side-specific transformations
            if (!isLeft) {
                // Mirror the wing for the right side
                wingGroup.scale.x = -1;
            }
            
            // Position the wing at the shoulder
            wingGroup.position.set(side * 1.5, 1.5, -1.5);
            wingGroup.rotation.y = side * Math.PI / 2;
            wingGroup.rotation.z = Math.PI / 6 * side;
            
            return wingGroup;
        };
        
        // Create left and right wings
        const leftWing = createWing(true);
        this.griffinParts.leftWing = leftWing;
        this.mesh.add(leftWing);
        
        const rightWing = createWing(false);
        this.griffinParts.rightWing = rightWing;
        this.mesh.add(rightWing);
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
        if (this.griffinParts.leftWing && this.griffinParts.rightWing) {
            this.griffinParts.leftWing.rotation.z = Math.PI / 6 + this.wingFlapAmount;
            this.griffinParts.rightWing.rotation.z = -Math.PI / 6 - this.wingFlapAmount;
        }
        
        // Tail swaying animation
        this.tailSwayAmount += this.tailSwaySpeed;
        
        if (this.griffinParts.tail) {
            this.griffinParts.tail.rotation.y = Math.sin(this.tailSwayAmount) * 0.3;
            
            // Animate individual tail segments to create a wave
            if (this.griffinParts.tailSegments) {
                this.griffinParts.tailSegments.forEach((segment, i) => {
                    const delay = i * 0.2;
                    segment.position.x = Math.sin(this.tailSwayAmount - delay) * 0.2;
                });
            }
        }
        
        // Head movement animation
        this.headMovementAmount += this.headMovementSpeed;
        
        if (this.griffinParts.head) {
            this.griffinParts.head.rotation.y = Math.sin(this.headMovementAmount) * 0.2;
            this.griffinParts.head.rotation.x = Math.sin(this.headMovementAmount * 0.5) * 0.1;
            
            // Beak animation (subtle opening/closing)
            if (this.griffinParts.lowerBeak) {
                this.griffinParts.lowerBeak.rotation.x = Math.PI / 2.5 + Math.sin(this.headMovementAmount * 2) * 0.05;
            }
        }
        
        // Breathing animation
        this.breathingAmount += this.breathingSpeed;
        
        if (this.griffinParts.body) {
            this.griffinParts.body.scale.y = 1 + Math.sin(this.breathingAmount) * 0.04;
            this.griffinParts.body.scale.x = 1 + Math.sin(this.breathingAmount) * 0.02;
        }
        
        // Neck segments slight movement
        if (this.griffinParts.neckSegments) {
            this.griffinParts.neckSegments.forEach((segment, i) => {
                const progress = i / (this.griffinParts.neckSegments.length - 1);
                const delay = progress * 0.2;
                
                // Add subtle wave-like motion to the neck
                segment.position.x = Math.sin(this.headMovementAmount - delay) * 0.1 * progress;
            });
        }
        
        // Slight bobbing movement for entire griffin
        if (this.mesh) {
            // Store the original Y position if not already saved
            this.originalY = this.originalY !== undefined ? this.originalY : this.mesh.position.y;
            
            // Apply breathing animation while maintaining the original position
            this.mesh.position.y = this.originalY + Math.sin(this.breathingAmount * 0.5) * 0.1;
        }
    }
    
    // Custom collision detection for the griffin
    handleCollision(point) {
        // Create a bounding box for the griffin
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Check if point is inside the bounding box
        const isInside = boundingBox.containsPoint(point);
        
        return {
            collided: isInside,
            point: point.clone()
        };
    }
}