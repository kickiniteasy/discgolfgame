export default class UfoModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // UFO colors
        this.bodyColor = options.visualProperties?.bodyColor || 
                         options.properties?.bodyColor || 
                         "#A9A9A9"; // Default: metallic gray
        this.domeColor = options.visualProperties?.domeColor || 
                        options.properties?.domeColor || 
                        "#88CCFF"; // Default: light blue
        this.lightColor = options.visualProperties?.lightColor || 
                         options.properties?.lightColor || 
                         "#FFFF00"; // Default: yellow
        
        // Animation properties
        this.rotationSpeed = options.properties?.rotationSpeed || 0.5;
        this.hoverAmount = options.properties?.hoverAmount || 0.1;
        this.hoverSpeed = options.properties?.hoverSpeed || 0.8;
        this.lightPulseSpeed = options.properties?.lightPulseSpeed || 2;
        
        // Parts references for animation
        this.lights = [];
        this.beamGroup = null;
        this.originalY = 0;
    }

    async init() {
        // Create UFO parts
        this.createBody();
        this.createDome();
        this.createLights();
        this.createBeam();
        
        // Apply position, rotation, scale from options
        if (this.options.position) {
            this.mesh.position.set(
                this.options.position.x || 0,
                this.options.position.y || 0,
                this.options.position.z || 0
            );
            this.originalY = this.mesh.position.y;
        } else {
            this.originalY = 0;
        }
        
        if (this.options.rotation) {
            this.mesh.rotation.set(
                this.options.rotation.x || 0,
                this.options.rotation.y || 0,
                this.options.rotation.z || 0
            );
        }
        
        if (this.options.scale) {
            const scale = this.options.scale.x || this.options.scale || 1;
            this.mesh.scale.set(scale, scale, scale);
        }
        
        return true;
    }
    
    createBody() {
        // Main saucer body
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.7, 32, 32),
            new THREE.MeshStandardMaterial({ 
                color: this.bodyColor,
                roughness: this.options.visualProperties?.roughness || 0.3,
                metalness: this.options.visualProperties?.metalness || 0.8
            })
        );
        body.position.set(0, 0, 0);
        body.scale.set(1, 0.25, 1); // Flatten into a saucer shape
        body.castShadow = true;
        body.receiveShadow = true;
        this.addPart(body);
        
        // Bottom rim
        const bottomRim = new THREE.Mesh(
            new THREE.TorusGeometry(0.6, 0.12, 16, 32),
            new THREE.MeshStandardMaterial({ 
                color: this.bodyColor,
                roughness: this.options.visualProperties?.roughness || 0.3,
                metalness: this.options.visualProperties?.metalness || 0.7
            })
        );
        bottomRim.position.set(0, -0.1, 0);
        bottomRim.rotation.set(Math.PI / 2, 0, 0);
        bottomRim.castShadow = true;
        bottomRim.receiveShadow = true;
        this.addPart(bottomRim);
    }
    
    createDome() {
        // Transparent dome on top
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ 
                color: this.domeColor,
                roughness: 0.1,
                metalness: 0.2,
                transparent: true,
                opacity: 0.7
            })
        );
        dome.position.set(0, 0.15, 0);
        dome.castShadow = true;
        this.addPart(dome);
        
        // Alien inside dome (simple shape)
        if (this.options.properties?.showAlien !== false) {
            const alien = new THREE.Group();
            alien.position.set(0, 0.2, 0);
            
            // Alien head
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 16, 16),
                new THREE.MeshStandardMaterial({ 
                    color: "#33CC33", // Green
                    roughness: 0.6,
                    metalness: 0.1
                })
            );
            head.castShadow = true;
            alien.add(head);
            
            // Alien eyes (large black eyes)
            const leftEye = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshBasicMaterial({ color: "#000000" })
            );
            leftEye.position.set(0.06, 0.02, 0.08);
            leftEye.scale.set(1, 1.5, 1);
            alien.add(leftEye);
            
            const rightEye = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshBasicMaterial({ color: "#000000" })
            );
            rightEye.position.set(-0.06, 0.02, 0.08);
            rightEye.scale.set(1, 1.5, 1);
            alien.add(rightEye);
            
            this.mesh.add(alien);
        }
    }
    
    createLights() {
        // Create multiple lights around the rim
        const lightCount = 8;
        const radius = 0.65;
        
        for (let i = 0; i < lightCount; i++) {
            const angle = (i / lightCount) * Math.PI * 2;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.lightColor,
                    roughness: 0.2,
                    metalness: 0.5,
                    emissive: this.lightColor,
                    emissiveIntensity: 0.8
                })
            );
            light.position.set(x, -0.05, z);
            light.castShadow = true;
            
            this.lights.push({
                mesh: light,
                originalIntensity: 0.8,
                phaseOffset: i / lightCount * Math.PI * 2
            });
            
            this.addPart(light);
        }
    }
    
    createBeam() {
        // Create abduction beam (optional, can be toggled)
        if (this.options.properties?.showBeam === true) {
            this.beamGroup = new THREE.Group();
            
            // Cylinder for the beam
            const beam = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.2, 2, 16, 1, true),
                new THREE.MeshStandardMaterial({ 
                    color: this.lightColor,
                    emissive: this.lightColor,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                })
            );
            beam.position.set(0, -1, 0);
            this.beamGroup.add(beam);
            
            this.mesh.add(this.beamGroup);
        }
    }
    
    update(deltaTime) {
        // Skip animation if disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        const time = performance.now() * 0.001;
        
        // Rotate the UFO slowly
        this.mesh.rotation.y += deltaTime * this.rotationSpeed;
        
        // Hover up and down slightly
        this.mesh.position.y = this.originalY + Math.sin(time * this.hoverSpeed) * this.hoverAmount;
        
        // Animate lights (pulsing)
        this.lights.forEach(light => {
            const pulseValue = (Math.sin(time * this.lightPulseSpeed + light.phaseOffset) + 1) / 2;
            light.mesh.material.emissiveIntensity = light.originalIntensity * (0.5 + pulseValue * 0.5);
            
            // Slightly scale the lights for more effect
            const scaleFactor = 0.8 + pulseValue * 0.4;
            light.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        });
        
        // Animate beam (if present)
        if (this.beamGroup && this.options.properties?.showBeam === true) {
            // Rotate beam opposite to the UFO to create stable beam effect
            this.beamGroup.rotation.y = -this.mesh.rotation.y;
            
            // Pulse beam opacity
            const beamOpacity = 0.2 + Math.sin(time * 2) * 0.1;
            this.beamGroup.children[0].material.opacity = beamOpacity;
        }
    }
    
    // Override collision detection for more precise interaction
    handleCollision(point) {
        const collision = super.handleCollision(point);
        
        if (collision.collided) {
            // Add special effect on collision (e.g., brighten lights)
            this.lights.forEach(light => {
                light.mesh.material.emissiveIntensity = 1.5;
                
                // Reset after a short delay
                setTimeout(() => {
                    light.mesh.material.emissiveIntensity = light.originalIntensity;
                }, 500);
            });
            
            // Toggle beam on click if configured
            if (this.options.properties?.toggleBeamOnClick === true) {
                if (this.beamGroup) {
                    this.beamGroup.visible = !this.beamGroup.visible;
                } else {
                    this.createBeam();
                }
            }
        }
        
        return collision;
    }
}
