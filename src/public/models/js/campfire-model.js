export default class CampfireModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Default colors
        this.logColor = options.visualProperties?.logColor || 
                        options.properties?.logColor || 
                        "#8B4513"; // Saddle Brown
                        
        this.stoneColor = options.visualProperties?.stoneColor || 
                         options.properties?.stoneColor || 
                         "#808080"; // Gray
                         
        this.fireColor1 = options.visualProperties?.fireColor1 || 
                         options.properties?.fireColor1 || 
                         "#FF4500"; // OrangeRed
                         
        this.fireColor2 = options.visualProperties?.fireColor2 || 
                         options.properties?.fireColor2 || 
                         "#FFD700"; // Gold
        
        // Fire properties
        this.fireIntensity = options.properties?.fireIntensity || 1.0;
        this.fireSize = options.properties?.fireSize || 1.0;
        this.fireParticles = options.properties?.fireParticles || 30;
        
        // Store fire particles for animation
        this.flames = [];
        this.embers = [];
    }

    async init() {
        this.createFirePit();
        this.createLogs();
        this.createFire();
        
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
            const scale = this.options.scale.x || this.options.scale || 1;
            this.mesh.scale.set(scale, scale, scale);
        }
        
        // Add a point light for the fire glow
        this.createFireLight();
        
        return true;
    }
    
    createFirePit() {
        // Create a circle of stones
        const stoneCount = 8;
        const pitRadius = 1.0 * this.fireSize;
        
        for (let i = 0; i < stoneCount; i++) {
            const angle = (i / stoneCount) * Math.PI * 2;
            const x = Math.cos(angle) * pitRadius;
            const z = Math.sin(angle) * pitRadius;
            
            // Create a stone with random size variations
            const stoneSize = 0.3 * this.fireSize * (0.8 + Math.random() * 0.4);
            
            const stone = new THREE.Mesh(
                new THREE.SphereGeometry(stoneSize, 6, 4),
                new THREE.MeshStandardMaterial({ 
                    color: this.stoneColor,
                    roughness: 0.9,
                    metalness: 0.1
                })
            );
            
            // Position stone in a circle
            stone.position.set(x, stoneSize * 0.5, z);
            
            // Slightly random rotation
            stone.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Flatten the stone slightly
            stone.scale.y = 0.6;
            
            stone.castShadow = true;
            stone.receiveShadow = true;
            
            this.addPart(stone);
        }
        
        // Add a flat dark circle for the pit floor
        const pitFloor = new THREE.Mesh(
            new THREE.CircleGeometry(pitRadius * 0.9, 16),
            new THREE.MeshStandardMaterial({ 
                color: "#1A1A1A", // Almost black
                roughness: 0.9,
                metalness: 0.0
            })
        );
        
        pitFloor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        pitFloor.position.y = 0.01; // Slightly above ground to prevent z-fighting
        
        pitFloor.receiveShadow = true;
        
        this.addPart(pitFloor);
    }
    
    createLogs() {
        // Create a few crossed logs in the fire pit
        const logCount = 4;
        const logRadius = 0.15 * this.fireSize;
        const logLength = 1.4 * this.fireSize;
        
        for (let i = 0; i < logCount; i++) {
            const angle = (i / logCount) * Math.PI;
            
            const log = new THREE.Mesh(
                new THREE.CylinderGeometry(logRadius, logRadius, logLength, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.logColor,
                    roughness: 0.8,
                    metalness: 0.1
                })
            );
            
            // Position logs crossed in the pit
            log.position.y = logRadius + 0.05;
            
            // Rotate logs to be horizontal and arranged in a star pattern
            log.rotation.x = Math.PI / 2; // Make horizontal
            log.rotation.z = angle; // Arrange in star pattern
            
            log.castShadow = true;
            log.receiveShadow = true;
            
            this.addPart(log);
        }
    }
    
    createFire() {
        // Create a container for the fire effects
        const fireContainer = new THREE.Group();
        this.mesh.add(fireContainer);
        this.fireContainer = fireContainer;
        
        // Base flame (central cone)
        const baseFlame = new THREE.Mesh(
            new THREE.ConeGeometry(0.5 * this.fireSize, 1.0 * this.fireSize, 8, 1, true),
            new THREE.MeshBasicMaterial({ 
                color: this.fireColor1,
                transparent: true,
                opacity: 0.7
            })
        );
        
        baseFlame.position.y = 0.5 * this.fireSize;
        this.addPart(baseFlame);
        this.baseFlame = baseFlame;
        
        // Create smaller flames
        for (let i = 0; i < this.fireParticles; i++) {
            this.createFlame();
        }
        
        // Create embers (small glowing particles)
        for (let i = 0; i < Math.floor(this.fireParticles * 0.5); i++) {
            this.createEmber();
        }
    }
    
    createFlame() {
        // Create a flame with random variations
        const flameHeight = (0.3 + Math.random() * 0.7) * this.fireSize;
        const flameWidth = (0.1 + Math.random() * 0.3) * this.fireSize;
        
        // Use either a cone or a tetrahedron for variation
        let geometry;
        if (Math.random() > 0.5) {
            geometry = new THREE.ConeGeometry(flameWidth, flameHeight, 6, 1, true);
        } else {
            geometry = new THREE.TetrahedronGeometry(flameWidth);
            // Scale to make it more flame-like
            geometry.scale(1, 2, 1);
        }
        
        // Interpolate between the two fire colors
        const t = Math.random();
        const color = new THREE.Color(this.fireColor1).lerp(new THREE.Color(this.fireColor2), t);
        
        const flame = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.5
            })
        );
        
        // Random position within the fire area
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.3 * this.fireSize;
        flame.position.set(
            Math.cos(angle) * radius,
            (0.3 + Math.random() * 0.5) * this.fireSize,
            Math.sin(angle) * radius
        );
        
        // Store original position and additional animation properties
        flame.userData = {
            originalY: flame.position.y,
            speed: 0.5 + Math.random() * 1.5,
            flickerPhase: Math.random() * Math.PI * 2
        };
        
        this.addPart(flame);
        this.flames.push(flame);
    }
    
    createEmber() {
        // Create a small glowing ember particle
        const emberSize = (0.02 + Math.random() * 0.05) * this.fireSize;
        
        const ember = new THREE.Mesh(
            new THREE.SphereGeometry(emberSize, 4, 4),
            new THREE.MeshBasicMaterial({ 
                color: this.fireColor2,
                transparent: true,
                opacity: 0.7 + Math.random() * 0.3
            })
        );
        
        // Random starting position near the base of the fire
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.3 * this.fireSize;
        ember.position.set(
            Math.cos(angle) * radius,
            0.2 * this.fireSize,
            Math.sin(angle) * radius
        );
        
        // Store animation properties
        ember.userData = {
            speed: 0.3 + Math.random() * 0.9,
            angle: angle,
            radius: radius,
            phase: Math.random() * Math.PI * 2,
            maxHeight: (1.0 + Math.random() * 1.5) * this.fireSize
        };
        
        this.addPart(ember);
        this.embers.push(ember);
    }
    
    createFireLight() {
        // Add a flickering point light to illuminate surroundings
        const light = new THREE.PointLight(
            this.fireColor1,
            1.5 * this.fireIntensity,
            10 * this.fireSize,
            2 // Light falloff
        );
        
        light.position.set(0, 0.7 * this.fireSize, 0);
        light.castShadow = true;
        
        // Configure shadow properties
        if (light.shadow) {
            light.shadow.bias = -0.003;
            light.shadow.mapSize.width = 512;
            light.shadow.mapSize.height = 512;
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 10;
        }
        
        this.mesh.add(light);
        this.light = light;
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        const time = Date.now() * 0.001;
        
        // Animate base flame with subtle scaling
        if (this.baseFlame) {
            const scaleY = 0.9 + Math.sin(time * 2) * 0.1;
            const scaleXZ = 1.0 + Math.sin(time * 3 + 1) * 0.1;
            
            this.baseFlame.scale.set(scaleXZ, scaleY, scaleXZ);
        }
        
        // Animate individual flames
        this.flames.forEach(flame => {
            const { speed, flickerPhase, originalY } = flame.userData;
            
            // Subtle vertical movement
            flame.position.y = originalY + Math.sin(time * speed + flickerPhase) * 0.1;
            
            // Flickering opacity
            flame.material.opacity = 0.5 + Math.sin(time * speed * 2 + flickerPhase) * 0.3;
            
            // Subtle rotation for movement effect
            flame.rotation.y = time * speed * 0.5;
        });
        
        // Animate embers rising up
        this.embers.forEach(ember => {
            const { speed, angle, radius, phase, maxHeight } = ember.userData;
            
            // Move ember upward
            ember.position.y += deltaTime * speed;
            
            // Spiral movement
            const currentAngle = angle + time * speed;
            const currentRadius = radius * (1 - ember.position.y / maxHeight);
            
            ember.position.x = Math.cos(currentAngle) * currentRadius;
            ember.position.z = Math.sin(currentAngle) * currentRadius;
            
            // Flickering opacity
            ember.material.opacity = 0.9 * (1 - ember.position.y / maxHeight);
            
            // Reset ember position when it reaches max height
            if (ember.position.y > maxHeight) {
                ember.position.y = 0.2 * this.fireSize;
                ember.userData.angle = Math.random() * Math.PI * 2;
                ember.userData.radius = Math.random() * 0.3 * this.fireSize;
                ember.position.x = Math.cos(ember.userData.angle) * ember.userData.radius;
                ember.position.z = Math.sin(ember.userData.angle) * ember.userData.radius;
            }
        });
        
        // Animate the point light for flickering effect
        if (this.light) {
            // Flickering intensity
            this.light.intensity = (1.3 + Math.sin(time * 5) * 0.2 + Math.sin(time * 11) * 0.1) * this.fireIntensity;
            
            // Subtle position changes
            this.light.position.x = Math.sin(time * 3) * 0.1;
            this.light.position.z = Math.cos(time * 2) * 0.1;
        }
    }
}