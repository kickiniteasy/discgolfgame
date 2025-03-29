/*
 * Mechanical Robot Model for Three.js
 * Features articulated joints and mechanical details
 * 
 * To be loaded by CustomTerrain class as a JS model
 */

export default class RobotModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Animation parameters
        this.walkCycle = 0;
        this.walkSpeed = 0.05;
        this.armSwingAmount = 0;
        this.armSwingSpeed = 0.03;
        this.headTurnAmount = 0;
        this.headTurnSpeed = 0.01;
        this.eyeGlowAmount = 0;
        this.eyeGlowSpeed = 0.02;
        
        // Store robot parts for animation
        this.robotParts = {};
        
        // Get colors from visualProperties or fall back to defaults
        this.mainColor = options.visualProperties?.color || 
                         options.properties?.color || 
                         "#4a4a4a"; // Metal gray
                         
        this.accentColor = options.visualProperties?.accentColor || 
                           options.properties?.accentColor || 
                           "#cc3300"; // Red accent
                           
        this.jointColor = options.visualProperties?.jointColor || 
                         options.properties?.jointColor || 
                         "#222222"; // Dark gray for joints
                         
        this.glowColor = options.visualProperties?.glowColor || 
                        options.properties?.glowColor || 
                        "#66aaff"; // Blue glow
    }

    async init() {
        // Create robot parts
        this.createRobotTorso();
        this.createRobotHead();
        this.createRobotArms();
        this.createRobotLegs();
        this.createRobotDetails();
        
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
    
    createRobotTorso() {
        // Materials
        const mainMaterial = new THREE.MeshStandardMaterial({ 
            color: this.mainColor,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({ 
            color: this.accentColor,
            roughness: 0.5,
            metalness: 0.6
        });
        
        // Create torso group
        const torsoGroup = new THREE.Group();
        
        // Main torso box
        const torsoGeo = new THREE.BoxGeometry(3, 4, 2);
        const torso = new THREE.Mesh(torsoGeo, mainMaterial);
        torso.castShadow = true;
        torsoGroup.add(torso);
        this.addPart(torso);
        
        // Chest plate
        const chestPlateGeo = new THREE.BoxGeometry(2.5, 2, 0.5);
        const chestPlate = new THREE.Mesh(chestPlateGeo, accentMaterial);
        chestPlate.position.set(0, 0.5, 1);
        chestPlate.castShadow = true;
        torsoGroup.add(chestPlate);
        this.addPart(chestPlate);
        
        // Back plate
        const backPlateGeo = new THREE.BoxGeometry(2.5, 3, 0.5);
        const backPlate = new THREE.Mesh(backPlateGeo, accentMaterial);
        backPlate.position.set(0, 0, -1);
        backPlate.castShadow = true;
        torsoGroup.add(backPlate);
        this.addPart(backPlate);
        
        // Shoulder mounts
        const shoulderGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16);
        
        const leftShoulder = new THREE.Mesh(shoulderGeo, mainMaterial);
        leftShoulder.rotation.z = Math.PI / 2;
        leftShoulder.position.set(1.8, 1.5, 0);
        leftShoulder.castShadow = true;
        torsoGroup.add(leftShoulder);
        this.addPart(leftShoulder);
        
        const rightShoulder = new THREE.Mesh(shoulderGeo, mainMaterial);
        rightShoulder.rotation.z = Math.PI / 2;
        rightShoulder.position.set(-1.8, 1.5, 0);
        rightShoulder.castShadow = true;
        torsoGroup.add(rightShoulder);
        this.addPart(rightShoulder);
        
        // Hip joints
        const hipGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 16);
        
        const leftHip = new THREE.Mesh(hipGeo, mainMaterial);
        leftHip.rotation.z = Math.PI / 2;
        leftHip.position.set(1, -1.8, 0);
        leftHip.castShadow = true;
        torsoGroup.add(leftHip);
        this.addPart(leftHip);
        
        const rightHip = new THREE.Mesh(hipGeo, mainMaterial);
        rightHip.rotation.z = Math.PI / 2;
        rightHip.position.set(-1, -1.8, 0);
        rightHip.castShadow = true;
        torsoGroup.add(rightHip);
        this.addPart(rightHip);
        
        // Add mechanical details
        this.addMechanicalDetails(torsoGroup, 0, 0, 1.1, 2, 1); // Front panel details
        this.addMechanicalDetails(torsoGroup, 0, -1, 1.1, 1.5, 0.7); // Lower panel details
        
        this.robotParts.torso = torsoGroup;
        this.mesh.add(torsoGroup);
    }
    
    createRobotHead() {
        // Materials
        const mainMaterial = new THREE.MeshStandardMaterial({ 
            color: this.mainColor,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({ 
            color: this.accentColor,
            roughness: 0.5,
            metalness: 0.6
        });
        
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: this.glowColor,
            emissive: this.glowColor,
            emissiveIntensity: 1,
            roughness: 0.3,
            metalness: 0.5
        });
        
        // Create head group
        const headGroup = new THREE.Group();
        
        // Main head box
        const headGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
        const head = new THREE.Mesh(headGeo, mainMaterial);
        head.castShadow = true;
        headGroup.add(head);
        this.addPart(head);
        
        // Face plate
        const faceGeo = new THREE.BoxGeometry(1.8, 1.3, 0.3);
        const face = new THREE.Mesh(faceGeo, accentMaterial);
        face.position.z = 0.8;
        face.castShadow = true;
        headGroup.add(face);
        this.addPart(face);
        
        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.2, 16, 16);
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
        leftEye.position.set(0.5, 0.2, 1);
        headGroup.add(leftEye);
        this.robotParts.leftEye = leftEye;
        this.addPart(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
        rightEye.position.set(-0.5, 0.2, 1);
        headGroup.add(rightEye);
        this.robotParts.rightEye = rightEye;
        this.addPart(rightEye);
        
        // Antenna
        const antennaBaseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
        const antennaBase = new THREE.Mesh(antennaBaseGeo, mainMaterial);
        antennaBase.position.set(0, 0.9, 0);
        antennaBase.castShadow = true;
        headGroup.add(antennaBase);
        this.addPart(antennaBase);
        
        const antennaRodGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const antennaRod = new THREE.Mesh(antennaRodGeo, mainMaterial);
        antennaRod.position.set(0, 1.45, 0);
        antennaRod.castShadow = true;
        headGroup.add(antennaRod);
        this.addPart(antennaRod);
        
        const antennaTipGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const antennaTip = new THREE.Mesh(antennaTipGeo, eyeMaterial);
        antennaTip.position.set(0, 1.9, 0);
        antennaTip.castShadow = true;
        headGroup.add(antennaTip);
        this.robotParts.antennaTip = antennaTip;
        this.addPart(antennaTip);
        
        // Ear-like sensors
        const sensorGeo = new THREE.BoxGeometry(0.2, 0.6, 0.3);
        
        const leftSensor = new THREE.Mesh(sensorGeo, accentMaterial);
        leftSensor.position.set(1, 0, 0);
        leftSensor.castShadow = true;
        headGroup.add(leftSensor);
        this.addPart(leftSensor);
        
        const rightSensor = new THREE.Mesh(sensorGeo, accentMaterial);
        rightSensor.position.set(-1, 0, 0);
        rightSensor.castShadow = true;
        headGroup.add(rightSensor);
        this.addPart(rightSensor);
        
        // Mouth grill
        const mouthGeo = new THREE.BoxGeometry(1, 0.2, 0.1);
        const mouth = new THREE.Mesh(mouthGeo, mainMaterial);
        mouth.position.set(0, -0.3, 1);
        mouth.castShadow = true;
        headGroup.add(mouth);
        this.addPart(mouth);
        
        // Create mouth grill lines
        for (let i = 0; i < 5; i++) {
            const lineGeo = new THREE.BoxGeometry(0.8, 0.03, 0.12);
            const line = new THREE.Mesh(lineGeo, this.jointColor);
            line.position.set(0, -0.3, 1.05);
            line.position.y += (i - 2) * 0.05;
            headGroup.add(line);
            this.addPart(line);
        }
        
        // Neck joint (cylinder)
        const neckGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
        const neck = new THREE.Mesh(neckGeo, mainMaterial);
        neck.position.set(0, -0.75, 0);
        neck.castShadow = true;
        headGroup.add(neck);
        this.addPart(neck);
        
        // Position the entire head
        headGroup.position.set(0, 3, 0);
        
        this.robotParts.head = headGroup;
        this.mesh.add(headGroup);
    }
    
    createRobotArms() {
        // Materials
        const mainMaterial = new THREE.MeshStandardMaterial({ 
            color: this.mainColor,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const jointMaterial = new THREE.MeshStandardMaterial({ 
            color: this.jointColor,
            roughness: 0.5,
            metalness: 0.7
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({ 
            color: this.accentColor,
            roughness: 0.5,
            metalness: 0.6
        });
        
        // Create arms function
        const createArm = (isLeft) => {
            const armGroup = new THREE.Group();
            const side = isLeft ? 1 : -1;
            
            // Upper arm
            const upperArmGeo = new THREE.BoxGeometry(0.8, 2, 0.8);
            const upperArm = new THREE.Mesh(upperArmGeo, mainMaterial);
            upperArm.position.set(0, -1, 0);
            upperArm.castShadow = true;
            armGroup.add(upperArm);
            this.addPart(upperArm);
            
            // Elbow joint
            const elbowGeo = new THREE.SphereGeometry(0.4, 16, 16);
            const elbow = new THREE.Mesh(elbowGeo, jointMaterial);
            elbow.position.set(0, -2, 0);
            elbow.castShadow = true;
            armGroup.add(elbow);
            this.addPart(elbow);
            
            // Forearm
            const forearmGeo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
            const forearm = new THREE.Mesh(forearmGeo, mainMaterial);
            forearm.position.set(0, -3, 0);
            forearm.castShadow = true;
            armGroup.add(forearm);
            this.addPart(forearm);
            
            // Wrist joint
            const wristGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
            const wrist = new THREE.Mesh(wristGeo, jointMaterial);
            wrist.rotation.x = Math.PI / 2;
            wrist.position.set(0, -4, 0);
            wrist.castShadow = true;
            armGroup.add(wrist);
            this.addPart(wrist);
            
            // Hand
            const handGroup = new THREE.Group();
            
            // Palm
            const palmGeo = new THREE.BoxGeometry(0.7, 0.5, 1);
            const palm = new THREE.Mesh(palmGeo, mainMaterial);
            palm.position.z = 0.5;
            palm.castShadow = true;
            handGroup.add(palm);
            this.addPart(palm);
            
            // Fingers
            for (let i = 0; i < 3; i++) {
                const fingerGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
                const finger = new THREE.Mesh(fingerGeo, accentMaterial);
                finger.position.set((i - 1) * 0.25, 0, 1.1);
                finger.castShadow = true;
                handGroup.add(finger);
                this.addPart(finger);
            }
            
            // Thumb
            const thumbGeo = new THREE.BoxGeometry(0.2, 0.2, 0.5);
            const thumb = new THREE.Mesh(thumbGeo, accentMaterial);
            thumb.position.set(side * 0.45, 0, 0.7);
            thumb.rotation.y = side * Math.PI / 4;
            thumb.castShadow = true;
            handGroup.add(thumb);
            this.addPart(thumb);
            
            // Add hand to arm
            handGroup.position.set(0, -4, 0);
            armGroup.add(handGroup);
            if (isLeft) {
                this.robotParts.leftHand = handGroup;
            } else {
                this.robotParts.rightHand = handGroup;
            }
            
            // Position and rotate entire arm
            armGroup.position.set(side * 2.1, 1.5, 0);
            
            return armGroup;
        };
        
        // Create left and right arms
        const leftArm = createArm(true);
        this.robotParts.leftArm = leftArm;
        this.mesh.add(leftArm);
        
        const rightArm = createArm(false);
        this.robotParts.rightArm = rightArm;
        this.mesh.add(rightArm);
    }
    
    createRobotLegs() {
        // Materials
        const mainMaterial = new THREE.MeshStandardMaterial({ 
            color: this.mainColor,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const jointMaterial = new THREE.MeshStandardMaterial({ 
            color: this.jointColor,
            roughness: 0.5,
            metalness: 0.7
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({ 
            color: this.accentColor,
            roughness: 0.5,
            metalness: 0.6
        });
        
        // Create leg function
        const createLeg = (isLeft) => {
            const legGroup = new THREE.Group();
            const side = isLeft ? 1 : -1;
            
            // Upper leg
            const upperLegGeo = new THREE.BoxGeometry(1, 2.5, 1);
            const upperLeg = new THREE.Mesh(upperLegGeo, mainMaterial);
            upperLeg.position.set(0, -1.25, 0);
            upperLeg.castShadow = true;
            legGroup.add(upperLeg);
            this.addPart(upperLeg);
            
            // Knee joint
            const kneeGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const knee = new THREE.Mesh(kneeGeo, jointMaterial);
            knee.position.set(0, -2.5, 0);
            knee.castShadow = true;
            legGroup.add(knee);
            this.addPart(knee);
            
            // Lower leg
            const lowerLegGeo = new THREE.BoxGeometry(0.9, 2, 0.9);
            const lowerLeg = new THREE.Mesh(lowerLegGeo, mainMaterial);
            lowerLeg.position.set(0, -3.5, 0);
            lowerLeg.castShadow = true;
            legGroup.add(lowerLeg);
            this.addPart(lowerLeg);
            
            // Ankle joint
            const ankleGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
            const ankle = new THREE.Mesh(ankleGeo, jointMaterial);
            ankle.rotation.x = Math.PI / 2;
            ankle.position.set(0, -4.5, 0);
            ankle.castShadow = true;
            legGroup.add(ankle);
            this.addPart(ankle);
            
            // Foot
            const footGeo = new THREE.BoxGeometry(1, 0.5, 1.5);
            const foot = new THREE.Mesh(footGeo, accentMaterial);
            foot.position.set(0, -4.75, 0.5);
            foot.castShadow = true;
            legGroup.add(foot);
            this.addPart(foot);
            
            // Boot front
            const toeGeo = new THREE.BoxGeometry(0.9, 0.4, 0.3);
            const toe = new THREE.Mesh(toeGeo, accentMaterial);
            toe.position.set(0, -4.75, 1.5);
            toe.castShadow = true;
            legGroup.add(toe);
            this.addPart(toe);
            
            // Leg details
            const detailGeo = new THREE.BoxGeometry(0.4, 1, 0.1);
            const detail = new THREE.Mesh(detailGeo, accentMaterial);
            detail.position.set(0, -3.5, 0.5);
            detail.castShadow = true;
            legGroup.add(detail);
            this.addPart(detail);
            
            // Position entire leg
            legGroup.position.set(side * 1, -2, 0);
            
            return legGroup;
        };
        
        // Create left and right legs
        const leftLeg = createLeg(true);
        this.robotParts.leftLeg = leftLeg;
        this.mesh.add(leftLeg);
        
        const rightLeg = createLeg(false);
        this.robotParts.rightLeg = rightLeg;
        this.mesh.add(rightLeg);
    }
    
    createRobotDetails() {
        // Materials
        const detailMaterial = new THREE.MeshStandardMaterial({ 
            color: this.accentColor,
            roughness: 0.4,
            metalness: 0.7
        });
        
        const glowMaterial = new THREE.MeshStandardMaterial({ 
            color: this.glowColor,
            emissive: this.glowColor,
            emissiveIntensity: 0.8,
            roughness: 0.3
        });
        
        // Add details to the robot
        const detailsGroup = new THREE.Group();
        
        // Power core in chest (glowing)
        const coreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        const core = new THREE.Mesh(coreGeo, glowMaterial);
        core.rotation.x = Math.PI / 2;
        core.position.set(0, 0.5, 1.25);
        core.castShadow = true;
        detailsGroup.add(core);
        this.robotParts.core = core;
        this.addPart(core);
        
        // Back unit (power pack)
        const backUnitGeo = new THREE.BoxGeometry(2, 2, 0.8);
        const backUnit = new THREE.Mesh(backUnitGeo, detailMaterial);
        backUnit.position.set(0, 0.5, -1.3);
        backUnit.castShadow = true;
        detailsGroup.add(backUnit);
        this.addPart(backUnit);
        
        // Vents on back
        for (let i = 0; i < 3; i++) {
            const ventGeo = new THREE.BoxGeometry(1.5, 0.2, 0.1);
            const vent = new THREE.Mesh(ventGeo, this.jointColor);
            vent.position.set(0, 0.2 + i * 0.5, -1.7);
            vent.castShadow = true;
            detailsGroup.add(vent);
            this.addPart(vent);
        }
        
        // Shoulder pauldrons
        const pauldronGeo = new THREE.BoxGeometry(1, 0.5, 1.2);
        
        const leftPauldron = new THREE.Mesh(pauldronGeo, detailMaterial);
        leftPauldron.position.set(1.8, 1.8, 0);
        leftPauldron.castShadow = true;
        detailsGroup.add(leftPauldron);
        this.addPart(leftPauldron);
        
        const rightPauldron = new THREE.Mesh(pauldronGeo, detailMaterial);
        rightPauldron.position.set(-1.8, 1.8, 0);
        rightPauldron.castShadow = true;
        detailsGroup.add(rightPauldron);
        this.addPart(rightPauldron);
        
        // Belt
        const beltGeo = new THREE.BoxGeometry(3.2, 0.4, 2.2);
        const belt = new THREE.Mesh(beltGeo, detailMaterial);
        belt.position.set(0, -1.6, 0);
        belt.castShadow = true;
        detailsGroup.add(belt);
        this.addPart(belt);
        
        // Belt buckle
        const buckleGeo = new THREE.BoxGeometry(1, 0.6, 0.1);
        const buckle = new THREE.Mesh(buckleGeo, glowMaterial);
        buckle.position.set(0, -1.6, 1.1);
        buckle.castShadow = true;
        detailsGroup.add(buckle);
        this.robotParts.buckle = buckle;
        this.addPart(buckle);
        
        this.mesh.add(detailsGroup);
    }
    
    // Helper function to add mechanical details
    addMechanicalDetails(targetGroup, x, y, z, width, height) {
        const detailGroup = new THREE.Group();
        detailGroup.position.set(x, y, z);
        
        // Panel
        const panelGeo = new THREE.PlaneGeometry(width, height);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: this.jointColor,
            roughness: 0.5,
            metalness: 0.7
        });
        
        const panel = new THREE.Mesh(panelGeo, panelMaterial);
        panel.castShadow = true;
        detailGroup.add(panel);
        this.addPart(panel);
        
        // Add rivets at corners
        const rivetGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8);
        const rivetMat = new THREE.MeshStandardMaterial({
            color: this.mainColor,
            roughness: 0.3,
            metalness: 0.9
        });
        
        const rivetPositions = [
            [width/2 - 0.15, height/2 - 0.15, 0.05],
            [-(width/2 - 0.15), height/2 - 0.15, 0.05],
            [width/2 - 0.15, -(height/2 - 0.15), 0.05],
            [-(width/2 - 0.15), -(height/2 - 0.15), 0.05]
        ];
        
        rivetPositions.forEach(pos => {
            const rivet = new THREE.Mesh(rivetGeo, rivetMat);
            rivet.position.set(pos[0], pos[1], pos[2]);
            rivet.rotation.x = Math.PI / 2;
            rivet.castShadow = true;
            detailGroup.add(rivet);
            this.addPart(rivet);
        });
        
        // Add small details
        const buttonGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
        const buttonMat = new THREE.MeshStandardMaterial({
            color: this.glowColor,
            emissive: this.glowColor,
            emissiveIntensity: 0.5
        });
        
        const button = new THREE.Mesh(buttonGeo, buttonMat);
        button.position.set(width/4, 0, 0.05);
        button.rotation.x = Math.PI / 2;
        detailGroup.add(button);
        this.addPart(button);
        
        // Add slot/vent
        const slotGeo = new THREE.BoxGeometry(width/2, height/4, 0.05);
        const slotMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.8
        });
        
        const slot = new THREE.Mesh(slotGeo, slotMat);
        slot.position.set(-width/4, 0, 0.05);
        detailGroup.add(slot);
        this.addPart(slot);
        
        // Add to target group
        targetGroup.add(detailGroup);
    }
    
    // Called by CustomTerrain's update method
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Update walk cycle
        this.walkCycle += this.walkSpeed;
        if (this.walkCycle > Math.PI * 2) {
            this.walkCycle = 0;
        }
        
        // Animate legs for walking
        if (this.robotParts.leftLeg && this.robotParts.rightLeg) {
            // Left leg forward, right leg back
            this.robotParts.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.5;
            this.robotParts.rightLeg.rotation.x = Math.sin(this.walkCycle + Math.PI) * 0.5;
        }
        
        // Animate arms swinging oppositely to legs
        this.armSwingAmount += this.armSwingSpeed;
        
        if (this.robotParts.leftArm && this.robotParts.rightArm) {
            this.robotParts.leftArm.rotation.x = Math.sin(this.walkCycle + Math.PI) * 0.3;
            this.robotParts.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.3;
        }
        
        // Head turning animation
        this.headTurnAmount += this.headTurnSpeed;
        if (this.robotParts.head) {
            this.robotParts.head.rotation.y = Math.sin(this.headTurnAmount) * 0.2;
        }
        
        // Eye glow pulsing
        this.eyeGlowAmount += this.eyeGlowSpeed;
        const glowIntensity = (Math.sin(this.eyeGlowAmount) * 0.3) + 0.7; // Range from 0.4 to 1.0
        
        if (this.robotParts.leftEye && this.robotParts.rightEye) {
            this.robotParts.leftEye.material.emissiveIntensity = glowIntensity;
            this.robotParts.rightEye.material.emissiveIntensity = glowIntensity;
        }
        
        if (this.robotParts.antennaTip) {
            this.robotParts.antennaTip.material.emissiveIntensity = glowIntensity;
        }
        
        if (this.robotParts.core) {
            this.robotParts.core.material.emissiveIntensity = glowIntensity * 0.8;
        }
        
        if (this.robotParts.buckle) {
            this.robotParts.buckle.material.emissiveIntensity = glowIntensity * 0.5;
        }
        
        // Add slight body bounce to walk
        if (this.mesh) {
            // Store the original Y position if not already saved
            this.originalY = this.originalY !== undefined ? this.originalY : this.mesh.position.y;
            
            // Apply walking bounce while maintaining the original position
            this.mesh.position.y = this.originalY + Math.abs(Math.sin(this.walkCycle * 2)) * 0.2;
        }
    }
    
    // Custom collision detection for the robot
    handleCollision(point) {
        // Create a bounding box for the robot
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Check if point is inside the bounding box
        const isInside = boundingBox.containsPoint(point);
        
        return {
            collided: isInside,
            point: point.clone()
        };
    }
}