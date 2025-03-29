/*
 * Rocket Ship Model for Three.js
 * To be loaded by CustomTerrain class as a JS model
 */

export default class RocketShipModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        this.engineGlow = null;
        
        // Animation properties
        this.hovering = 0;
        this.engineFlicker = 0;
        
        // Configure rocket properties
        this.animated = options.properties?.animated !== false; // Default to true unless explicitly disabled
        this.hoverSpeed = options.properties?.hoverSpeed || 2.0;
        this.rotationSpeed = options.properties?.rotationSpeed || 0.2;
        
        // Use visualProperties for colors if available, otherwise use custom properties or defaults
        this.mainColor = options.visualProperties?.color || 
                         options.properties?.mainColor || 
                         "#3498db"; // Blue body
                         
        this.secondaryColor = options.visualProperties?.secondaryColor || 
                              options.properties?.secondaryColor || 
                              "#e74c3c"; // Red accents
                              
        this.windowColor = options.visualProperties?.windowColor || 
                          options.properties?.windowColor || 
                          "#f1c40f"; // Yellow windows
                          
        this.engineColor = options.visualProperties?.engineColor || 
                           options.properties?.engineColor || 
                           "#e67e22"; // Orange engine glow

        this.blastingOff = false;
        this.blastOffSpeed = 0.1;
        this.blastOffY = 0;

        this.landing = false;
        this.landingSpeed = 0.1;

    }

    async init() {
        // Create rocket parts
        this.createRocketBody();
        this.createRocketWindows();
        this.createRocketFins();
        this.createRocketNose();
        this.createRocketEngine();
        
        // Set position from options
        if (this.options.position) {
            this.mesh.position.set(
                this.options.position.x || 0,
                this.options.position.y || 0,
                this.options.position.z || 0
            );
        }
        
        // Set rotation from options
        if (this.options.rotation) {
            this.mesh.rotation.set(
                this.options.rotation.x || 0,
                this.options.rotation.y || 0,
                this.options.rotation.z || 0
            );
        }
        
        // Set scale from options
        if (this.options.scale) {
            this.mesh.scale.set(
                this.options.scale.x || 1,
                this.options.scale.y || 1,
                this.options.scale.z || 1
            );
        }
        
        // Store original Y position for hover animation
        this.originalY = this.mesh.position.y;
        
        return true;
    }
    
    createRocketBody() {
        // Main rocket body - cylinder
        const bodyGeometry = new THREE.CylinderGeometry(1, 1, 4, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.mainColor,
            metalness: this.options.visualProperties?.metalness || 0.3,
            roughness: this.options.visualProperties?.roughness || 0.5,
            opacity: this.options.visualProperties?.opacity || 1.0,
            transparent: this.options.visualProperties?.opacity < 1.0
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        this.addPart(body);
        
        // Add some details to the body
        const stripe1Geometry = new THREE.CylinderGeometry(1.01, 1.01, 0.3, 16);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: this.secondaryColor,
            metalness: 0.3,
            roughness: 0.5
        });
        
        const stripe1 = new THREE.Mesh(stripe1Geometry, stripeMaterial);
        stripe1.position.y = 1;
        stripe1.castShadow = true;
        this.mesh.add(stripe1);
        this.addPart(stripe1);
        
        const stripe2 = new THREE.Mesh(stripe1Geometry, stripeMaterial);
        stripe2.position.y = -1;
        stripe2.castShadow = true;
        this.mesh.add(stripe2);
        this.addPart(stripe2);
    }
    
    createRocketWindows() {
        // Windows
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: this.windowColor,
            metalness: 0.8,
            roughness: 0.2,
            emissive: this.windowColor,
            emissiveIntensity: 0.5
        });
        
        // Main porthole window
        const windowGeometry = new THREE.SphereGeometry(0.3, 12, 12);
        const mainWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        mainWindow.position.set(0, 0.5, 1.05);
        this.mesh.add(mainWindow);
        this.addPart(mainWindow);
        
        // Small portholes
        for (let i = 0; i < 3; i++) {
            const smallWindowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const smallWindow = new THREE.Mesh(smallWindowGeometry, windowMaterial);
            smallWindow.position.set(0, -0.5 - (i * 0.5), 1.05);
            this.mesh.add(smallWindow);
            this.addPart(smallWindow);
        }
    }
    
    createRocketFins() {
        // Rocket fins - 3 fins around the bottom
        const finMaterial = new THREE.MeshStandardMaterial({
            color: this.secondaryColor,
            metalness: 0.4,
            roughness: 0.6
        });
        
        for (let i = 0; i < 3; i++) {
            const finGeometry = new THREE.BoxGeometry(0.2, 1.2, 1);
            
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.y = -2;
            
            // Position the fins around the rocket body
            const angle = (Math.PI * 2 / 3) * i;
            fin.position.x = Math.sin(angle) * 1.1;
            fin.position.z = Math.cos(angle) * 1.1;
            
            // Rotate the fins to point outward
            fin.rotation.y = Math.PI / 2 - angle;
            
            fin.castShadow = true;
            this.mesh.add(fin);
            this.addPart(fin);
        }
    }
    
    createRocketNose() {
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(1, 2, 16);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: this.mainColor,
            metalness: 0.3,
            roughness: 0.5
        });
        
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.y = 3;
        nose.castShadow = true;
        this.mesh.add(nose);
        this.addPart(nose);
        
        // Top beacon light
        const beaconGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const beaconMaterial = new THREE.MeshStandardMaterial({
            color: '#ff0000',
            emissive: '#ff0000',
            emissiveIntensity: 1
        });
        
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = 4.1;
        this.mesh.add(beacon);
        this.addPart(beacon);
    }
    
    createRocketEngine() {
        // Engine nozzle
        const nozzleGeometry = new THREE.CylinderGeometry(0.8, 1.2, 0.5, 16);
        const nozzleMaterial = new THREE.MeshStandardMaterial({
            color: '#7f8c8d',
            metalness: 0.8,
            roughness: 0.2
        });
        
        const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.position.y = -2.25;
        nozzle.castShadow = true;
        this.mesh.add(nozzle);
        this.addPart(nozzle);
        
        // Engine glow
        const glowGeometry = new THREE.SphereGeometry(0.9, 16, 16);
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: this.engineColor,
            transparent: true,
            opacity: 0.7,
            emissive: this.engineColor,
            emissiveIntensity: 1
        });
        
        this.engineGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.engineGlow.position.y = -2.5;
        this.engineGlow.scale.set(1, 0.5, 1);
        this.mesh.add(this.engineGlow);
        this.addPart(this.engineGlow);
    }
    
    // Called by CustomTerrain's update method
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (!this.animated) {
            return;
        }
        
        // Hovering animation
        this.hovering += deltaTime * this.hoverSpeed;
        const hoverOffset = Math.sin(this.hovering) * 0.1;
        this.mesh.position.y = this.originalY + hoverOffset;
        
        // Gentle rotation
        this.mesh.rotation.y += deltaTime * this.rotationSpeed;
        
        // Engine glow animation
        this.engineFlicker += deltaTime * 10;
        if (this.engineGlow) {
            const flicker = 0.8 + Math.sin(this.engineFlicker) * 0.2;
            this.engineGlow.scale.set(1 * flicker, 0.5 * flicker, 1 * flicker);
            
            const material = this.engineGlow.material;
            material.emissiveIntensity = 1 + Math.sin(this.engineFlicker * 2) * 0.3;
        }

        if (this.blastingOff) {
            console.log("blasting off in loop", this.blastOffSpeed, this.mesh.position.y);
            this.mesh.position.y += this.blastOffSpeed;
            this.originalY = this.mesh.position.y;
        }
        if (this.landing) {
            console.log("landing in loop", this.landingSpeed, this.mesh.position.y);
            this.mesh.position.y -= this.landingSpeed;
            this.originalY = this.mesh.position.y;
            if (this.mesh.position.y <= this.blastOffY) {
                this.landing = false;
                this.landingSpeed = 0;
            }
        }
        
    }
    
    // Custom collision detection for the rocket
    handleCollision(point) {
        const collision = super.handleCollision(point);
        collision.isRocket = true;
        if (collision.collided) {
            // make the rocket blast off!
            this.blastOff();
        }
        return collision;
    }
    
    // Make the rocket blast off!
    blastOff() {
        this.blastingOff = true;
        this.blastOffY = this.mesh.position.y;
        
        // make the rocket move up
        this.blastOffSpeed += 0.02;
        this.originalY = this.mesh.position.y;
        setTimeout(() => {
            this.blastingOff = false;
            this.blastOffSpeed = 0;
            // start the landing animation
            this.landing = true;
            this.landingSpeed = 0.2;
        }, 5000);
        
    }
}