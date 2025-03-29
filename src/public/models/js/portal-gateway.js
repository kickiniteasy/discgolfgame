/*
 * Mystical Portal Gateway Model for Three.js
 * A magical portal with swirling energy and floating runes
 */

export default class PortalGatewayModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Portal properties
        this.archHeight = options.properties?.archHeight || 4;
        this.archWidth = options.properties?.archWidth || 3;
        this.runeCount = options.properties?.runeCount || 6;
        this.portalActive = options.properties?.portalActive !== false; // Default true
        
        // Animation properties
        this.animationTime = 0;
        this.portalEnergy = null;
        this.portalCore = null;
        this.floatingRunes = [];
        
        // Portal colors
        this.stoneColor = options.visualProperties?.stoneColor || 
                         options.properties?.stoneColor || 
                         "#505050"; // Dark stone
                         
        this.portalColor = options.visualProperties?.color || 
                          options.properties?.portalColor || 
                          "#8A2BE2"; // Vibrant purple
                          
        this.energyColor = options.visualProperties?.energyColor || 
                          options.properties?.energyColor || 
                          "#FF00FF"; // Magenta energy
                          
        this.runeColor = options.visualProperties?.runeColor || 
                         options.properties?.runeColor || 
                         "#00FFFF"; // Cyan runes
    }

    async init() {
        // Create stone archway
        this.createArchway();
        
        // Create portal energy
        this.createPortalEnergy();
        
        // Create floating runes
        this.createFloatingRunes();
        
        // Add base platform
        this.createBasePlatform();
        
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
    
    createArchway() {
        // Create stone archway using a torus with partial segment
        const archThickness = 0.4;
        const archGeometry = new THREE.TorusGeometry(
            this.archWidth / 2,  // Radius
            archThickness,      // Tube radius
            16,                 // Radial segments
            16,                 // Tubular segments
            Math.PI            // Arc - half circle
        );
        
        const archMaterial = new THREE.MeshStandardMaterial({
            color: this.stoneColor,
            roughness: 0.9,
            metalness: 0.2
        });
        
        const arch = new THREE.Mesh(archGeometry, archMaterial);
        arch.rotation.x = Math.PI / 2; // Rotate to vertical arch
        arch.rotation.z = Math.PI; // Rotate to face forward
        arch.position.y = this.archHeight / 2; // Move up to center
        arch.castShadow = true;
        arch.receiveShadow = true;
        this.mesh.add(arch);
        this.addPart(arch);
        
        // Add stone pillars on each side of the arch
        const pillarHeight = this.archHeight;
        const pillarWidth = archThickness * 1.5;
        
        const pillarGeometry = new THREE.BoxGeometry(
            pillarWidth,
            pillarHeight,
            pillarWidth
        );
        
        // Left pillar
        const leftPillar = new THREE.Mesh(pillarGeometry, archMaterial);
        leftPillar.position.set(
            -this.archWidth / 2,
            pillarHeight / 2,
            0
        );
        leftPillar.castShadow = true;
        leftPillar.receiveShadow = true;
        this.mesh.add(leftPillar);
        this.addPart(leftPillar);
        
        // Right pillar
        const rightPillar = new THREE.Mesh(pillarGeometry, archMaterial);
        rightPillar.position.set(
            this.archWidth / 2,
            pillarHeight / 2,
            0
        );
        rightPillar.castShadow = true;
        rightPillar.receiveShadow = true;
        this.mesh.add(rightPillar);
        this.addPart(rightPillar);
        
        // Add carved runes on the pillars
        this.addRuneCarving(leftPillar, -pillarWidth/2 - 0.01, 0.7, 0);
        this.addRuneCarving(leftPillar, -pillarWidth/2 - 0.01, 0, 0);
        this.addRuneCarving(leftPillar, -pillarWidth/2 - 0.01, -0.7, 0);
        
        this.addRuneCarving(rightPillar, pillarWidth/2 + 0.01, 0.7, 0);
        this.addRuneCarving(rightPillar, pillarWidth/2 + 0.01, 0, 0);
        this.addRuneCarving(rightPillar, pillarWidth/2 + 0.01, -0.7, 0);
    }
    
    addRuneCarving(pillar, x, y, z) {
        // Create rune carving as a simple glowing symbol
        const runeSize = 0.3;
        const runeGeometry = new THREE.PlaneGeometry(runeSize, runeSize);
        const runeMaterial = new THREE.MeshStandardMaterial({
            color: this.runeColor,
            emissive: this.runeColor,
            emissiveIntensity: 0.5,
            roughness: 0.5,
            metalness: 0.3
        });
        
        const rune = new THREE.Mesh(runeGeometry, runeMaterial);
        rune.position.set(x, y, z);
        
        // Orient rune to face outward from pillar
        if (x < 0) {
            rune.rotation.y = Math.PI / 2; // Left pillar
        } else {
            rune.rotation.y = -Math.PI / 2; // Right pillar
        }
        
        pillar.add(rune);
        this.addPart(rune);
    }
    
    createPortalEnergy() {
        if (!this.portalActive) return;
        
        // Create spinning energy disk
        const energyGeometry = new THREE.CircleGeometry(
            this.archWidth / 2 - 0.2, // Slightly smaller than arch
            32
        );
        
        const energyMaterial = new THREE.MeshStandardMaterial({
            color: this.portalColor,
            emissive: this.portalColor,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.portalEnergy = new THREE.Mesh(energyGeometry, energyMaterial);
        this.portalEnergy.position.set(0, this.archHeight / 2, 0);
        this.portalEnergy.rotation.y = Math.PI / 2; // Face front
        this.mesh.add(this.portalEnergy);
        this.addPart(this.portalEnergy);
        
        // Create central core energy
        const coreGeometry = new THREE.SphereGeometry(
            0.5, // Core size
            16,
            16
        );
        
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: this.energyColor,
            emissive: this.energyColor,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        
        this.portalCore = new THREE.Mesh(coreGeometry, coreMaterial);
        this.portalCore.position.set(0, this.archHeight / 2, 0);
        this.mesh.add(this.portalCore);
        this.addPart(this.portalCore);
    }
    
    createFloatingRunes() {
        if (!this.portalActive) return;
        
        // Create floating rune symbols
        const runeShapes = [
            new THREE.BoxGeometry(0.3, 0.3, 0.05),          // Square rune
            new THREE.CircleGeometry(0.15, 5),              // Pentagon rune
            new THREE.CircleGeometry(0.15, 3),              // Triangle rune
            new THREE.RingGeometry(0.1, 0.15, 16)           // Ring rune
        ];
        
        const runeMaterial = new THREE.MeshStandardMaterial({
            color: this.runeColor,
            emissive: this.runeColor,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < this.runeCount; i++) {
            // Select random rune shape
            const shapeIndex = Math.floor(Math.random() * runeShapes.length);
            const runeGeometry = runeShapes[shapeIndex];
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial.clone());
            
            // Position rune around the portal in a circle
            const angle = (i / this.runeCount) * Math.PI * 2;
            const radius = this.archWidth / 2 + 0.2 + Math.random() * 0.3;
            
            rune.position.set(
                Math.cos(angle) * radius,
                this.archHeight / 2 + (Math.random() - 0.5) * this.archHeight * 0.6,
                Math.sin(angle) * radius
            );
            
            // Face toward center
            rune.lookAt(new THREE.Vector3(0, rune.position.y, 0));
            
            rune.castShadow = true;
            this.mesh.add(rune);
            this.addPart(rune);
            
            // Store rune for animation
            this.floatingRunes.push({
                mesh: rune,
                angle: angle,
                radius: radius,
                baseY: rune.position.y,
                bobOffset: Math.random() * Math.PI * 2,
                bobSpeed: 0.5 + Math.random()
            });
        }
    }
    
    createBasePlatform() {
        // Create a circular platform beneath the portal
        const platformGeometry = new THREE.CylinderGeometry(
            this.archWidth / 2 + 1, // Top radius
            this.archWidth / 2 + 1.3, // Bottom radius (slightly wider)
            0.3, // Height
            16 // Segments
        );
        
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: this.stoneColor,
            roughness: 0.9,
            metalness: 0.2
        });
        
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = -0.15; // Half height
        platform.receiveShadow = true;
        this.mesh.add(platform);
        this.addPart(platform);
        
        // Add glowing circular runes on the platform
        const runeRingGeometry = new THREE.RingGeometry(
            this.archWidth / 2 - 0.3,
            this.archWidth / 2,
            32
        );
        
        const runeRingMaterial = new THREE.MeshStandardMaterial({
            color: this.runeColor,
            emissive: this.runeColor,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const runeRing = new THREE.Mesh(runeRingGeometry, runeRingMaterial);
        runeRing.position.y = 0.01; // Just above platform
        runeRing.rotation.x = -Math.PI / 2; // Flat on platform
        platform.add(runeRing);
        this.addPart(runeRing);
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false || !this.portalActive) {
            return;
        }
        
        // Update animation time
        this.animationTime += deltaTime;
        
        // Animate portal energy
        if (this.portalEnergy) {
            // Slow rotation
            this.portalEnergy.rotation.z += deltaTime * 0.5;
            
            // Pulsing opacity
            const energyPulse = Math.sin(this.animationTime * 2) * 0.1 + 0.8;
            this.portalEnergy.material.opacity = energyPulse;
        }
        
        // Animate portal core
        if (this.portalCore) {
            // Pulsing scale
            const corePulse = Math.sin(this.animationTime * 3) * 0.2 + 1;
            this.portalCore.scale.set(corePulse, corePulse, corePulse);
            
            // Slight position wobble
            this.portalCore.position.x = Math.sin(this.animationTime * 1.5) * 0.1;
            this.portalCore.position.z = Math.cos(this.animationTime * 1.5) * 0.1;
        }
        
        // Animate floating runes
        this.floatingRunes.forEach(rune => {
            // Orbital movement
            const orbitSpeed = 0.2;
            const newAngle = rune.angle + deltaTime * orbitSpeed;
            rune.angle = newAngle;
            
            rune.mesh.position.x = Math.cos(newAngle) * rune.radius;
            rune.mesh.position.z = Math.sin(newAngle) * rune.radius;
            
            // Bobbing up and down
            const bobAmount = 0.15;
            rune.mesh.position.y = rune.baseY + Math.sin(this.animationTime * rune.bobSpeed + rune.bobOffset) * bobAmount;
            
            // Always face center
            rune.mesh.lookAt(new THREE.Vector3(0, rune.mesh.position.y, 0));
            
            // Subtle rotation
            rune.mesh.rotation.z += deltaTime;
        });
    }
    
    // Activate/deactivate portal
    togglePortal() {
        this.portalActive = !this.portalActive;
        
        if (this.portalEnergy) {
            this.portalEnergy.visible = this.portalActive;
        }
        
        if (this.portalCore) {
            this.portalCore.visible = this.portalActive;
        }
        
        this.floatingRunes.forEach(rune => {
            rune.mesh.visible = this.portalActive;
        });
        
        return this.portalActive;
    }
    
    // Teleport something
    teleport(targetPosition) {
        if (!this.portalActive) return false;
        
        console.log('Portal teleporting to', targetPosition);
        // This would integrate with game teleportation system
        // Flash portal effect, etc.
        
        return true;
    }
    
    handleCollision(point) {
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        const isInside = boundingBox.containsPoint(point);
        
        // Special collision for portal energy
        let isInPortal = false;
        if (this.portalActive && this.portalEnergy) {
            // Check if point is within portal disk (simplified)
            const portalCenter = new THREE.Vector3(0, this.archHeight / 2, 0).add(this.mesh.position);
            const distanceToCenter = point.distanceTo(portalCenter);
            isInPortal = distanceToCenter < this.archWidth / 2 - 0.2;
        }
        
        return {
            collided: isInside,
            isInPortal: isInPortal,
            point: point.clone(),
            portalActive: this.portalActive
        };
    }
}