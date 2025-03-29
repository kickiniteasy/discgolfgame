export default class MysticalPond extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.waterColor = options.visualProperties?.waterColor || 
                           options.properties?.waterColor || 
                           "#1E90FF"; // Dodger blue
        this.pondEdgeColor = options.visualProperties?.pondEdgeColor || 
                              options.properties?.pondEdgeColor || 
                              "#8B4513"; // Saddle brown
        this.lilyPadColor = options.visualProperties?.lilyPadColor || 
                             options.properties?.lilyPadColor || 
                             "#228B22"; // Forest green
        this.flowerColor = options.visualProperties?.flowerColor || 
                            options.properties?.flowerColor || 
                            "#FFB6C1"; // Light pink
        
        // Properties
        this.size = options.properties?.size || 5;
        this.depth = options.properties?.depth || 1;
        this.lilyPadCount = options.properties?.lilyPadCount || 5;
        this.rippleSpeed = options.properties?.rippleSpeed || 0.5;
        this.rippleIntensity = options.properties?.rippleIntensity || 0.2;
        
        // Animation
        this.waterVertices = [];
        this.lilyPads = [];
        this.time = 0;
    }

    async init() {
        this.createPondBase();
        this.createWater();
        this.createLilyPads();
        this.createDecorations();
        
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
    
    createPondBase() {
        // Create the pond basin
        const basinGeometry = new THREE.CylinderGeometry(
            this.size, this.size * 1.2, this.depth, 24, 1, false
        );
        const basinMaterial = new THREE.MeshStandardMaterial({
            color: "#654321", // Brown
            roughness: 0.9,
            metalness: 0.1
        });
        
        const basin = new THREE.Mesh(basinGeometry, basinMaterial);
        basin.position.y = -this.depth / 2;
        basin.receiveShadow = true;
        this.addPart(basin);
        
        // Create the pond edge
        const edgeGeometry = new THREE.TorusGeometry(
            this.size, this.size * 0.15, 16, 32
        );
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: this.pondEdgeColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const edge = new THREE.Mesh(
            edgeGeometry, edgeMaterial
        );
        edge.rotation.x = Math.PI / 2;
        edge.position.y = 0.05;
        edge.receiveShadow = true;
        edge.castShadow = true;
        this.addPart(edge);
        
        // Add some rocks around the edge
        const numRocks = 8;
        for (let i = 0; i < numRocks; i++) {
            const angle = (i / numRocks) * Math.PI * 2;
            
            // Skip some positions randomly
            if (Math.random() < 0.3) continue;
            
            const rockSize = this.size * (0.1 + Math.random() * 0.15);
            const rockGeometry = new THREE.BoxGeometry(
                rockSize, rockSize * 0.7, rockSize
            );
            
            // Distort the rock geometry
            const positionAttribute = rockGeometry.getAttribute('position');
            const positions = positionAttribute.array;
            
            for (let j = 0; j < positions.length; j += 3) {
                positions[j] += (Math.random() - 0.5) * 0.2;
                positions[j + 1] += (Math.random() - 0.5) * 0.2;
                positions[j + 2] += (Math.random() - 0.5) * 0.2;
            }
            
            positionAttribute.needsUpdate = true;
            
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: "#808080", // Gray
                roughness: 0.8,
                metalness: 0.2
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                Math.cos(angle) * (this.size + rockSize / 2),
                rockSize * 0.3,
                Math.sin(angle) * (this.size + rockSize / 2)
            );
            
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.addPart(rock);
        }
    }
    
    createWater() {
        // Create the water surface with more segments for wave animation
        const waterGeometry = new THREE.CircleGeometry(this.size * 0.98, 32, 16);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: this.waterColor,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.3
        });
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.05;
        water.receiveShadow = true;
        this.addPart(water);
        this.water = water;
        
        // Store original positions of water vertices for ripple animation
        const positionAttribute = waterGeometry.getAttribute('position');
        const positions = positionAttribute.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Skip center vertex
            if (positions[i] === 0 && positions[i+2] === 0) continue;
            
            this.waterVertices.push({
                index: i,
                x: positions[i],
                y: positions[i+1],
                z: positions[i+2],
                distanceFromCenter: Math.sqrt(positions[i]**2 + positions[i+2]**2) / this.size,
                angle: Math.atan2(positions[i+2], positions[i])
            });
        }
    }
    
    createLilyPads() {
        // Create lily pads with flowers
        for (let i = 0; i < this.lilyPadCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = this.size * (0.2 + Math.random() * 0.6);
            const size = this.size * (0.15 + Math.random() * 0.2);
            
            // Create lily pad
            const lilyPadGeometry = new THREE.CircleGeometry(size, 8);
            
            // Make the lily pad not perfectly circular
            const positionAttribute = lilyPadGeometry.getAttribute('position');
            const positions = positionAttribute.array;
            
            for (let j = 3; j < positions.length; j += 3) { // Skip center vertex
                const vertexAngle = Math.atan2(positions[j+2], positions[j]);
                const distortion = 0.2 * Math.sin(vertexAngle * 4);
                
                const distance = Math.sqrt(positions[j]**2 + positions[j+2]**2);
                const newDistance = distance * (1 + distortion);
                
                positions[j] = Math.cos(vertexAngle) * newDistance;
                positions[j+2] = Math.sin(vertexAngle) * newDistance;
            }
            
            positionAttribute.needsUpdate = true;
            
            const lilyPadMaterial = new THREE.MeshStandardMaterial({
                color: this.lilyPadColor,
                roughness: 0.7,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
            
            const lilyPad = new THREE.Mesh(lilyPadGeometry, lilyPadMaterial);
            lilyPad.rotation.x = -Math.PI / 2;
            lilyPad.position.set(
                Math.cos(angle) * radius,
                0.1,
                Math.sin(angle) * radius
            );
            
            // Add subtle rotation
            lilyPad.rotation.z = Math.random() * Math.PI * 2;
            lilyPad.castShadow = true;
            this.addPart(lilyPad);
            
            // Store for animation
            this.lilyPads.push({
                mesh: lilyPad,
                initialY: lilyPad.position.y,
                phase: Math.random() * Math.PI * 2
            });
            
            // Add flower to some lily pads
            if (Math.random() > 0.5) {
                this.createFlower(lilyPad.position.x, lilyPad.position.y, lilyPad.position.z, size);
            }
        }
    }
    
    createFlower(x, y, z, padSize) {
        const flowerSize = padSize * 0.3;
        
        // Flower stem
        const stemGeometry = new THREE.CylinderGeometry(
            flowerSize * 0.05, flowerSize * 0.08, flowerSize * 2, 8
        );
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: "#006400", // Dark green
            roughness: 0.7,
            metalness: 0.1
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.set(x, y + flowerSize, z);
        stem.castShadow = true;
        this.addPart(stem);
        
        // Flower petals
        const petalCount = 5;
        const petalGroup = new THREE.Group();
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            
            const petalGeometry = new THREE.SphereGeometry(
                flowerSize * 0.5, 8, 8, 0, Math.PI * 0.5
            );
            const petalMaterial = new THREE.MeshStandardMaterial({
                color: this.flowerColor,
                roughness: 0.6,
                metalness: 0.1,
                side: THREE.DoubleSide
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            // Position and rotate petal
            petal.rotation.x = Math.PI / 2;
            petal.rotation.y = angle;
            petal.position.y = flowerSize * 0.2;
            
            petalGroup.add(petal);
            this.addPart(petal);
        }
        
        // Flower center
        const centerGeometry = new THREE.SphereGeometry(flowerSize * 0.3, 8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: "#FFD700", // Gold
            roughness: 0.5,
            metalness: 0.3,
            emissive: "#FFD700",
            emissiveIntensity: 0.2
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = flowerSize * 0.3;
        petalGroup.add(center);
        this.addPart(center);
        
        // Position the whole flower
        petalGroup.position.set(x, y + flowerSize * 2, z);
        this.mesh.add(petalGroup);
        
        // Store for animation
        this.lilyPads.push({
            mesh: petalGroup,
            isFlower: true,
            initialY: petalGroup.position.y,
            phase: Math.random() * Math.PI * 2
        });
    }
    
    createDecorations() {
        // Add glowing fireflies/particles around the pond
        const numParticles = 12;
        for (let i = 0; i < numParticles; i++) {
            const particleSize = this.size * 0.05;
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(particleSize, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: "#FFFF00", // Yellow
                    emissive: "#FFFF00",
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Random position around the pond
            const angle = Math.random() * Math.PI * 2;
            const radius = this.size * (0.8 + Math.random() * 0.8);
            const height = this.size * (0.2 + Math.random() * 0.5);
            
            particle.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            this.addPart(particle);
            
            // Store for animation
            this.lilyPads.push({
                mesh: particle,
                isParticle: true,
                initialPosition: particle.position.clone(),
                radius: this.size * 0.3,
                height: height,
                speed: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        // Add small fish in the pond (just simple shapes)
        const numFish = 3;
        for (let i = 0; i < numFish; i++) {
            const fishSize = this.size * 0.15;
            
            // Fish body
            const fishGeometry = new THREE.ConeGeometry(
                fishSize * 0.5, fishSize, 8
            );
            
            const fishColor = Math.random() > 0.5 ? "#FF6347" : "#4682B4"; // Tomato or Steel Blue
            const fishMaterial = new THREE.MeshStandardMaterial({
                color: fishColor,
                roughness: 0.6,
                metalness: 0.3
            });
            
            const fish = new THREE.Mesh(fishGeometry, fishMaterial);
            fish.rotation.x = Math.PI / 2;
            
            // Randomize position under water
            const angle = Math.random() * Math.PI * 2;
            const radius = this.size * (0.2 + Math.random() * 0.5);
            
            fish.position.set(
                Math.cos(angle) * radius,
                -this.size * 0.1 * Math.random(),
                Math.sin(angle) * radius
            );
            
            this.addPart(fish);
            
            // Store for animation
            this.lilyPads.push({
                mesh: fish,
                isFish: true,
                initialPosition: fish.position.clone(),
                initialRotation: fish.rotation.clone(),
                radius: radius,
                speed: 0.5 + Math.random(),
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        this.time += deltaTime;
        
        // Animate water ripples
        if (this.water && this.waterVertices.length > 0) {
            const positions = this.water.geometry.getAttribute('position').array;
            
            for (const vertex of this.waterVertices) {
                // Create ripple effect
                const rippleOffset = Math.sin(
                    this.time * this.rippleSpeed + 
                    vertex.distanceFromCenter * 10 +
                    vertex.angle * 2
                ) * this.rippleIntensity * (1 - vertex.distanceFromCenter);
                
                positions[vertex.index + 1] = vertex.y + rippleOffset;
            }
            
            this.water.geometry.getAttribute('position').needsUpdate = true;
        }
        
        // Animate lily pads and other elements
        this.lilyPads.forEach(item => {
            if (item.isParticle) {
                // Firefly/particle movement
                const initialPos = item.initialPosition;
                const time = this.time * item.speed;
                
                item.mesh.position.x = initialPos.x + Math.sin(time + item.phase) * item.radius;
                item.mesh.position.y = item.height + Math.sin(time * 1.5) * (item.radius * 0.3);
                item.mesh.position.z = initialPos.z + Math.cos(time + item.phase) * item.radius;
                
                // Pulsating glow
                if (item.mesh.material && item.mesh.material.emissiveIntensity) {
                    item.mesh.material.emissiveIntensity = 0.8 * (0.7 + Math.sin(time * 2) * 0.3);
                    item.mesh.material.opacity = 0.7 * (0.7 + Math.sin(time * 3) * 0.3);
                }
            } else if (item.isFish) {
                // Fish swimming
                const initialPos = item.initialPosition;
                const time = this.time * item.speed;
                const angle = time + item.phase;
                
                // Swimming in a figure-8 pattern
                item.mesh.position.x = initialPos.x + Math.sin(angle) * item.radius;
                item.mesh.position.z = initialPos.z + Math.sin(angle * 2) * (item.radius * 0.5);
                
                // Fish rotation follows movement direction
                const direction = new THREE.Vector2(
                    Math.cos(angle) * item.radius,
                    Math.cos(angle * 2) * (item.radius * 0.5)
                ).normalize();
                
                item.mesh.rotation.y = item.initialRotation.y - Math.atan2(direction.y, direction.x);
            } else {
                // Lily pads and flowers bobbing
                item.mesh.position.y = item.initialY + Math.sin(this.time * 0.5 + item.phase) * 0.03;
                
                // Flowers sway slightly
                if (item.isFlower) {
                    item.mesh.rotation.x = Math.sin(this.time * 0.3 + item.phase) * 0.05;
                    item.mesh.rotation.z = Math.sin(this.time * 0.4 + item.phase) * 0.05;
                }
            }
        });
    }
}