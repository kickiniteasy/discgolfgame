export default class MushroomCluster extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.stemColor = options.visualProperties?.stemColor || 
                          options.properties?.stemColor || 
                          "#F5F5DC"; // Beige
        this.capColor = options.visualProperties?.capColor || 
                         options.properties?.capColor || 
                         "#FF69B4"; // Hot Pink
        this.glowColor = options.visualProperties?.glowColor || 
                         options.properties?.glowColor || 
                         "#FFFFFF";
        this.spotsColor = options.visualProperties?.spotsColor || 
                          options.properties?.spotsColor || 
                          "#FFFFFF";
        
        // Properties
        this.size = options.properties?.size || 2;
        this.count = options.properties?.count || 8;
        this.glowIntensity = options.properties?.glowIntensity || 0.8;
        this.variation = options.properties?.variation || 0.3; // How much mushrooms vary
        
        // Animation
        this.mushrooms = [];
        this.time = 0;
    }

    async init() {
        this.createGround();
        this.createMushrooms();
        
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
    
    createGround() {
        // Create a small patch of ground with moss
        const groundRadius = this.size * 1.2;
        const groundGeometry = new THREE.CylinderGeometry(
            groundRadius, groundRadius, this.size * 0.2, 16
        );
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: "#2E4600", // Dark green
            roughness: 0.9,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = this.size * 0.1;
        ground.receiveShadow = true;
        this.addPart(ground);
        
        // Add some grass/moss details on top
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = groundRadius * Math.random() * 0.9;
            
            const grassHeight = this.size * (0.1 + Math.random() * 0.15);
            const grassWidth = grassHeight * 0.2;
            
            const grassGeometry = new THREE.ConeGeometry(
                grassWidth, grassHeight, 4, 1
            );
            const grassMaterial = new THREE.MeshStandardMaterial({
                color: "#7CFC00", // Lawn green
                roughness: 0.8,
                metalness: 0.1
            });
            
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            grass.position.set(
                Math.cos(angle) * radius,
                this.size * 0.2,
                Math.sin(angle) * radius
            );
            
            // Random rotation and slight tilt
            grass.rotation.y = Math.random() * Math.PI * 2;
            grass.rotation.x = (Math.random() - 0.5) * 0.3;
            grass.rotation.z = (Math.random() - 0.5) * 0.3;
            
            grass.castShadow = true;
            this.addPart(grass);
        }
    }
    
    createMushrooms() {
        // Create a cluster of mushrooms at various sizes and positions
        for (let i = 0; i < this.count; i++) {
            const angle = (i / this.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const radius = this.size * (0.3 + Math.random() * 0.7);
            
            // Size variation for this mushroom
            const sizeVariation = 1 + (Math.random() - 0.5) * this.variation * 2;
            const height = this.size * 0.8 * sizeVariation;
            const stemRadius = height * 0.15;
            const capRadius = height * 0.3;
            
            // Create mushroom stem
            const stemGeometry = new THREE.CylinderGeometry(
                stemRadius, stemRadius * 1.2, height * 0.7, 8
            );
            const stemMaterial = new THREE.MeshStandardMaterial({
                color: this.stemColor,
                roughness: 0.7,
                metalness: 0.2
            });
            
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.set(
                Math.cos(angle) * radius,
                height * 0.35 + this.size * 0.2, // Offset by ground height
                Math.sin(angle) * radius
            );
            
            // Create mushroom cap
            const capGeometry = new THREE.SphereGeometry(
                capRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6
            );
            
            // Determine if this mushroom should glow
            const shouldGlow = Math.random() > 0.3;
            const capMaterial = new THREE.MeshStandardMaterial({
                color: this.capColor,
                roughness: 0.6,
                metalness: 0.3,
                emissive: shouldGlow ? this.capColor : "#000000",
                emissiveIntensity: shouldGlow ? this.glowIntensity * 0.5 : 0
            });
            
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.copy(stem.position);
            cap.position.y += height * 0.35 + capRadius * 0.3;
            cap.rotation.x = Math.PI;
            
            // Add some spots on the cap
            if (Math.random() > 0.3) {
                const numSpots = Math.floor(3 + Math.random() * 5);
                for (let j = 0; j < numSpots; j++) {
                    const spotSize = capRadius * (0.1 + Math.random() * 0.15);
                    const spotGeometry = new THREE.SphereGeometry(spotSize, 8, 8);
                    const spotMaterial = new THREE.MeshStandardMaterial({
                        color: this.spotsColor,
                        roughness: 0.5,
                        metalness: 0.2
                    });
                    
                    const spot = new THREE.Mesh(spotGeometry, spotMaterial);
                    
                    // Position on the cap's surface
                    const spotTheta = Math.random() * Math.PI * 2;
                    const spotPhi = (Math.random() * 0.5) * Math.PI;
                    
                    spot.position.x = capRadius * 0.9 * Math.sin(spotPhi) * Math.cos(spotTheta);
                    spot.position.y = -capRadius * 0.9 * Math.cos(spotPhi);
                    spot.position.z = capRadius * 0.9 * Math.sin(spotPhi) * Math.sin(spotTheta);
                    
                    cap.add(spot);
                    this.addPart(spot);
                }
            }
            
            // Add gills under the cap
            const gillsGeometry = new THREE.CylinderGeometry(
                capRadius * 0.9, stemRadius, capRadius * 0.3, 16, 1, true
            );
            const gillsMaterial = new THREE.MeshStandardMaterial({
                color: "#FFE4E1", // Misty rose
                roughness: 0.7,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
            
            const gills = new THREE.Mesh(gillsGeometry, gillsMaterial);
            gills.position.copy(cap.position);
            gills.position.y -= capRadius * 0.15;
            
            // Add glowing particles around glowing mushrooms
            if (shouldGlow) {
                const numParticles = Math.floor(3 + Math.random() * 5);
                for (let j = 0; j < numParticles; j++) {
                    const particleSize = this.size * 0.05 * (0.5 + Math.random() * 0.5);
                    const particle = new THREE.Mesh(
                        new THREE.SphereGeometry(particleSize, 8, 8),
                        new THREE.MeshStandardMaterial({
                            color: this.glowColor,
                            emissive: this.glowColor,
                            emissiveIntensity: this.glowIntensity,
                            transparent: true,
                            opacity: 0.7
                        })
                    );
                    
                    // Position around the mushroom cap
                    const theta = Math.random() * Math.PI * 2;
                    const radius = capRadius * (1.2 + Math.random() * 0.5);
                    
                    particle.position.copy(cap.position);
                    particle.position.x += Math.cos(theta) * radius;
                    particle.position.z += Math.sin(theta) * radius;
                    particle.position.y += (Math.random() - 0.3) * radius;
                    
                    this.addPart(particle);
                    
                    // Store for animation
                    this.mushrooms.push({
                        mesh: particle,
                        isParticle: true,
                        center: cap.position.clone(),
                        initialY: particle.position.y,
                        radius: radius * 0.3,
                        phaseOffset: Math.random() * Math.PI * 2,
                        speed: 1 + Math.random()
                    });
                }
            }
            
            // Add mushroom parts to the scene
            stem.castShadow = true;
            cap.castShadow = true;
            gills.castShadow = true;
            
            this.addPart(stem);
            this.addPart(cap);
            this.addPart(gills);
            
            // Store for animation
            this.mushrooms.push({
                stem: stem,
                cap: cap,
                isGlowing: shouldGlow,
                initialY: {
                    stem: stem.position.y,
                    cap: cap.position.y
                },
                phaseOffset: Math.random() * Math.PI * 2
            });
            
            // Occasionally add a smaller mushroom nearby
            if (Math.random() > 0.6) {
                const smallRadius = radius * 0.8;
                const smallAngle = angle + (Math.random() - 0.5) * 0.5;
                
                const smallMushroom = this.createSmallMushroom(
                    Math.cos(smallAngle) * smallRadius,
                    Math.sin(smallAngle) * smallRadius,
                    height * 0.6,
                    shouldGlow
                );
                
                // Store for animation
                this.mushrooms.push(smallMushroom);
            }
        }
    }
    
    createSmallMushroom(x, z, height, isGlowing) {
        const stemRadius = height * 0.12;
        const capRadius = height * 0.25;
        
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(
            stemRadius, stemRadius * 1.2, height * 0.7, 8
        );
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: this.stemColor,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(
            x,
            height * 0.35 + this.size * 0.2,
            z
        );
        
        // Create cap
        const capGeometry = new THREE.SphereGeometry(
            capRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6
        );
        const capMaterial = new THREE.MeshStandardMaterial({
            color: this.capColor,
            roughness: 0.6,
            metalness: 0.3,
            emissive: isGlowing ? this.capColor : "#000000",
            emissiveIntensity: isGlowing ? this.glowIntensity * 0.4 : 0
        });
        
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.copy(stem.position);
        cap.position.y += height * 0.35 + capRadius * 0.3;
        cap.rotation.x = Math.PI;
        
        // Add parts to scene
        stem.castShadow = true;
        cap.castShadow = true;
        
        this.addPart(stem);
        this.addPart(cap);
        
        return {
            stem: stem,
            cap: cap,
            isGlowing: isGlowing,
            initialY: {
                stem: stem.position.y,
                cap: cap.position.y
            },
            phaseOffset: Math.random() * Math.PI * 2
        };
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        this.time += deltaTime;
        
        // Animate mushrooms
        this.mushrooms.forEach(mushroom => {
            if (mushroom.isParticle) {
                // Floating particles motion
                const center = mushroom.center;
                mushroom.mesh.position.x = center.x + Math.sin(this.time * mushroom.speed + mushroom.phaseOffset) * mushroom.radius;
                mushroom.mesh.position.y = mushroom.initialY + Math.cos(this.time * mushroom.speed + mushroom.phaseOffset) * (mushroom.radius * 0.5);
                mushroom.mesh.position.z = center.z + Math.cos(this.time * mushroom.speed + mushroom.phaseOffset) * mushroom.radius;
                
                // Pulsating glow
                if (mushroom.mesh.material && mushroom.mesh.material.emissiveIntensity) {
                    mushroom.mesh.material.emissiveIntensity = 
                        this.glowIntensity * (0.7 + Math.sin(this.time * 2 + mushroom.phaseOffset) * 0.3);
                }
            } else {
                // Gentle swaying for mushrooms
                if (mushroom.stem && mushroom.cap) {
                    const swayAmount = 0.05;
                    
                    // Stem sway
                    mushroom.stem.position.y = mushroom.initialY.stem + 
                        Math.sin(this.time * 0.7 + mushroom.phaseOffset) * swayAmount;
                    
                    // Cap follows stem
                    mushroom.cap.position.y = mushroom.initialY.cap + 
                        Math.sin(this.time * 0.7 + mushroom.phaseOffset) * swayAmount;
                    
                    // Glow pulsating for glowing mushrooms
                    if (mushroom.isGlowing && mushroom.cap.material && mushroom.cap.material.emissiveIntensity) {
                        mushroom.cap.material.emissiveIntensity = 
                            this.glowIntensity * 0.5 * (0.8 + Math.sin(this.time * 1.5 + mushroom.phaseOffset) * 0.2);
                    }
                }
            }
        });
    }
}