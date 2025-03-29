/*
 * Weather Control Device Model for Three.js
 * A futuristic machine that generates different weather effects
 */

export default class WeatherControlDeviceModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Weather controller properties
        this.deviceRadius = options.properties?.deviceRadius || 1.5;
        this.deviceHeight = options.properties?.deviceHeight || 3;
        this.currentWeather = options.properties?.defaultWeather || "clear"; // clear, rain, snow, storm
        this.active = options.properties?.active !== false; // Default active
        
        // Weather particle systems
        this.raindrops = [];
        this.snowflakes = [];
        this.lightningBolts = [];
        this.cloudParticles = [];
        
        // Animation properties
        this.animationTime = 0;
        this.weatherChangeTime = 0;
        this.energyRing = null;
        this.weatherCore = null;
        
        // Colors
        this.deviceColor = options.visualProperties?.deviceColor || 
                          options.properties?.deviceColor || 
                          "#555555"; // Dark gray
                          
        this.energyColor = options.visualProperties?.color || 
                          options.properties?.energyColor || 
                          "#00FFFF"; // Cyan
                          
        this.lightningColor = options.visualProperties?.lightningColor || 
                             options.properties?.lightningColor || 
                             "#FFFF00"; // Yellow
                             
        this.weatherColors = {
            clear: "#87CEEB",   // Sky blue
            rain: "#4682B4",    // Steel blue
            snow: "#F0F8FF",    // Alice blue
            storm: "#4B0082"    // Indigo
        };
    }

    async init() {
        // Create device base and platform
        this.createDeviceBase();
        
        // Create central control column
        this.createControlColumn();
        
        // Create weather generator dome and mechanism
        this.createWeatherGenerator();
        
        // Create initial weather effects
        this.createWeatherEffects();
        
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
    
    createDeviceBase() {
        // Create a platform base
        const baseGeometry = new THREE.CylinderGeometry(
            this.deviceRadius + 0.5,
            this.deviceRadius + 0.8,
            0.3,
            16
        );
        
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: this.deviceColor,
            roughness: 0.7,
            metalness: 0.5
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.15; // Half height
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        this.addPart(base);
        
        // Add glowing energy ring in the base
        const ringGeometry = new THREE.RingGeometry(
            this.deviceRadius - 0.2,
            this.deviceRadius,
            32
        );
        
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: this.energyColor,
            emissive: this.energyColor,
            emissiveIntensity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.energyRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.energyRing.position.y = 0.01; // Just above base
        this.energyRing.rotation.x = -Math.PI / 2; // Horizontal
        base.add(this.energyRing);
        this.addPart(this.energyRing);
    }
    
    createControlColumn() {
        // Central control column
        const columnGeometry = new THREE.CylinderGeometry(
            0.4,
            0.5,
            this.deviceHeight - 1,
            8
        );
        
        const columnMaterial = new THREE.MeshStandardMaterial({
            color: this.deviceColor,
            roughness: 0.6,
            metalness: 0.7
        });
        
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.y = (this.deviceHeight - 1) / 2;
        column.castShadow = true;
        this.mesh.add(column);
        this.addPart(column);
        
        // Add control panels on the column
        this.addControlPanel(column, 0, 0, 0.51); // Front
        this.addControlPanel(column, Math.PI, 0, 0.51); // Back
        this.addControlPanel(column, Math.PI/2, 0, 0.51); // Right
        this.addControlPanel(column, -Math.PI/2, 0, 0.51); // Left
    }
    
    addControlPanel(column, rotationY, posY, posZ) {
        // Control panel with buttons/screens
        const panelGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: "#222222",
            roughness: 0.5,
            metalness: 0.8
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, posY, posZ);
        panel.rotation.y = rotationY;
        column.add(panel);
        this.addPart(panel);
        
        // Add display screen
        const screenGeometry = new THREE.PlaneGeometry(0.4, 0.2);
        const screenMaterial = new THREE.MeshStandardMaterial({
            color: this.weatherColors[this.currentWeather],
            emissive: this.weatherColors[this.currentWeather],
            emissiveIntensity: 0.5
        });
        
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0.05, 0.03);
        screen.rotation.x = 0;
        screen.rotation.y = 0;
        panel.add(screen);
        this.addPart(screen);
        
        // Store screen reference for color updates
        if (rotationY === 0) { // Only track front panel
            this.weatherScreen = screen;
        }
        
        // Add control buttons
        const buttonGeometry = new THREE.CircleGeometry(0.04, 16);
        
        const weatherTypes = ["clear", "rain", "snow", "storm"];
        const buttonColors = [
            "#87CEEB", // Sky blue
            "#4682B4", // Steel blue
            "#F0F8FF", // Alice blue
            "#4B0082"  // Indigo
        ];
        
        for (let i = 0; i < weatherTypes.length; i++) {
            const buttonMaterial = new THREE.MeshStandardMaterial({
                color: buttonColors[i],
                emissive: buttonColors[i],
                emissiveIntensity: this.currentWeather === weatherTypes[i] ? 0.8 : 0.2
            });
            
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(-0.15 + i * 0.1, -0.1, 0.03);
            button.rotation.x = 0;
            button.rotation.y = 0;
            panel.add(button);
            this.addPart(button);
            
            // Store button reference for active state updates
            if (rotationY === 0) { // Only track front panel
                if (!this.weatherButtons) {
                    this.weatherButtons = {};
                }
                this.weatherButtons[weatherTypes[i]] = button;
            }
        }
    }
    
    createWeatherGenerator() {
        // Weather generation dome
        const domeGeometry = new THREE.SphereGeometry(
            0.8,
            16,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );
        
        const domeMaterial = new THREE.MeshStandardMaterial({
            color: "#A9A9A9", // Dark gray
            transparent: true,
            opacity: 0.6,
            roughness: 0.2,
            metalness: 0.9
        });
        
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = this.deviceHeight - 0.8;
        dome.castShadow = true;
        this.mesh.add(dome);
        this.addPart(dome);
        
        // Weather core - the energy source that generates weather
        const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: this.weatherColors[this.currentWeather],
            emissive: this.weatherColors[this.currentWeather],
            emissiveIntensity: 0.9
        });
        
        this.weatherCore = new THREE.Mesh(coreGeometry, coreMaterial);
        this.weatherCore.position.y = this.deviceHeight - 0.8;
        this.mesh.add(this.weatherCore);
        this.addPart(this.weatherCore);
        
        // Add circling energy rings around the core
        this.createEnergyRings();
    }
    
    createEnergyRings() {
        // Create three orbital rings around the core
        const ringColors = [
            this.energyColor,
            this.weatherColors[this.currentWeather],
            this.energyColor
        ];
        
        this.energyRings = [];
        
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(
                0.5 + i * 0.15,
                0.03,
                8,
                32
            );
            
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: ringColors[i],
                emissive: ringColors[i],
                emissiveIntensity: 0.7
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = this.deviceHeight - 0.8;
            
            // Initial orientation
            ring.rotation.x = Math.PI / 3 * i;
            ring.rotation.y = Math.PI / 4 * i;
            
            this.mesh.add(ring);
            this.addPart(ring);
            
            this.energyRings.push({
                mesh: ring,
                speed: 0.5 - i * 0.1,
                axis: new THREE.Vector3(
                    Math.cos(i * Math.PI/3),
                    Math.sin(i * Math.PI/4),
                    Math.sin(i * Math.PI/3)
                ).normalize()
            });
        }
    }
    
    createWeatherEffects() {
        if (!this.active) return;
        
        // Create appropriate weather particles based on current weather
        switch(this.currentWeather) {
            case "rain":
                this.createRain();
                break;
            case "snow":
                this.createSnow();
                break;
            case "storm":
                this.createStorm();
                break;
            case "clear":
            default:
                this.createClearSky();
                break;
        }
    }
    
    createRain() {
        // Create rain droplets
        const dropCount = 20;
        const dropGeometry = new THREE.BoxGeometry(0.03, 0.2, 0.03);
        const dropMaterial = new THREE.MeshStandardMaterial({
            color: "#6495ED", // Cornflower blue
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < dropCount; i++) {
            const drop = new THREE.Mesh(dropGeometry, dropMaterial);
            
            // Position above dome in a random distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.7;
            drop.position.set(
                Math.cos(angle) * radius,
                this.deviceHeight,
                Math.sin(angle) * radius
            );
            
            // Tilt slightly for rain effect
            drop.rotation.x = 0.2;
            
            this.mesh.add(drop);
            this.addPart(drop);
            
            // Store for animation
            this.raindrops.push({
                mesh: drop,
                speed: 2 + Math.random() * 3,
                originalY: this.deviceHeight + 1 + Math.random()
            });
        }
    }
    
    createSnow() {
        // Create snowflakes
        const flakeCount = 15;
        const flakeGeometries = [
            new THREE.BoxGeometry(0.08, 0.08, 0.08),
            new THREE.CircleGeometry(0.04, 6) // Hexagon
        ];
        
        const flakeMaterial = new THREE.MeshStandardMaterial({
            color: "#FFFFFF",
            transparent: true,
            opacity: 0.9
        });
        
        for (let i = 0; i < flakeCount; i++) {
            // Alternate geometries
            const geomIndex = i % flakeGeometries.length;
            const flake = new THREE.Mesh(flakeGeometries[geomIndex], flakeMaterial.clone());
            
            // Position above dome in a random distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.8;
            flake.position.set(
                Math.cos(angle) * radius,
                this.deviceHeight,
                Math.sin(angle) * radius
            );
            
            // Random scale for variety
            const scale = 0.5 + Math.random() * 0.5;
            flake.scale.set(scale, scale, scale);
            
            if (geomIndex === 1) {
                flake.rotation.x = -Math.PI / 2; // Flat snowflakes
            }
            
            this.mesh.add(flake);
            this.addPart(flake);
            
            // Store for animation
            this.snowflakes.push({
                mesh: flake,
                speed: 0.3 + Math.random() * 0.5,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.5 + Math.random() * 0.5,
                originalY: this.deviceHeight + 1 + Math.random()
            });
        }
    }
    
    createStorm() {
        // Create lightning bolts and clouds
        
        // Cloud formations
        const cloudCount = 4;
        const cloudGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: "#696969", // Dim gray
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < cloudCount; i++) {
            // Create cloud cluster (multiple spheres)
            const cloudCluster = new THREE.Group();
            
            // Position cloud group
            const angle = (i / cloudCount) * Math.PI * 2;
            const radius = 0.6;
            cloudCluster.position.set(
                Math.cos(angle) * radius,
                this.deviceHeight + 0.2,
                Math.sin(angle) * radius
            );
            
            // Add 3-5 cloud puffs per cluster
            const puffCount = 3 + Math.floor(Math.random() * 3);
            
            for (let p = 0; p < puffCount; p++) {
                const puff = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
                
                // Position puffs around cluster center
                puff.position.set(
                    (Math.random() - 0.5) * 0.4,
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.4
                );
                
                // Random scale for variety
                const scale = 0.6 + Math.random() * 0.4;
                puff.scale.set(scale, scale * 0.7, scale);
                
                cloudCluster.add(puff);
            }
            
            this.mesh.add(cloudCluster);
            this.addPart(cloudCluster);
            
            // Store for animation
            this.cloudParticles.push({
                mesh: cloudCluster,
                rotationSpeed: 0.05 + Math.random() * 0.05,
                originalPos: cloudCluster.position.clone()
            });
        }
        
        // Lightning bolts
        this.createLightningBolt = () => {
            // Create jagged line for lightning
            const points = [];
            let currentY = this.deviceHeight + 0.3;
            const endY = this.deviceHeight - 1.5;
            const segmentCount = 4;
            const segmentHeight = (currentY - endY) / segmentCount;
            
            // Random position for this bolt
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4;
            const startX = Math.cos(angle) * radius;
            const startZ = Math.sin(angle) * radius;
            
            points.push(new THREE.Vector3(startX, currentY, startZ));
            
            // Create jagged segments
            for (let i = 0; i < segmentCount; i++) {
                currentY -= segmentHeight;
                const jag = 0.1 + Math.random() * 0.2;
                const newX = startX + (Math.random() - 0.5) * jag;
                const newZ = startZ + (Math.random() - 0.5) * jag;
                points.push(new THREE.Vector3(newX, currentY, newZ));
            }
            
            // Create the lightning geometry
            const boltGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const boltMaterial = new THREE.LineBasicMaterial({
                color: this.lightningColor,
                transparent: true,
                opacity: 0.9
            });
            
            const bolt = new THREE.Line(boltGeometry, boltMaterial);
            this.mesh.add(bolt);
            this.addPart(bolt);
            
            // Store with life timer
            this.lightningBolts.push({
                mesh: bolt,
                life: 0,
                maxLife: 0.1 + Math.random() * 0.2
            });
        };
    }
    
    createClearSky() {
        // Create subtle light rays/sparkles for clear weather
        const rayCount = 8;
        const rayGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4);
        const rayMaterial = new THREE.MeshStandardMaterial({
            color: "#FFFACD", // Light yellow
            emissive: "#FFFACD",
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.4
        });
        
        for (let i = 0; i < rayCount; i++) {
            const ray = new THREE.Mesh(rayGeometry, rayMaterial.clone());
            
            // Position rays around dome
            const angle = (i / rayCount) * Math.PI * 2;
            const radius = 0.6;
            
            ray.position.set(
                Math.cos(angle) * radius,
                this.deviceHeight,
                Math.sin(angle) * radius
            );
            
            // Angle rays outward
            ray.rotation.x = Math.PI / 4;
            ray.rotation.y = angle;
            
            this.mesh.add(ray);
            this.addPart(ray);
            
            // Store for animation
            this.lightningBolts.push({
                mesh: ray,
                life: 0,
                maxLife: 1000 // Very long life
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if explicitly disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Update animation time
        this.animationTime += deltaTime;
        this.weatherChangeTime += deltaTime;
        
        // Animate energy ring in base
        if (this.energyRing) {
            const ringPulse = Math.sin(this.animationTime * 2) * 0.3 + 0.7;
            this.energyRing.material.emissiveIntensity = ringPulse;
        }
        
        // Animate weather core
        if (this.weatherCore) {
            const corePulse = Math.sin(this.animationTime * 3) * 0.1 + 1;
            this.weatherCore.scale.set(corePulse, corePulse, corePulse);
            
            // If weather is changing, blend the colors
            if (this.targetWeatherColor) {
                const blendFactor = Math.min(this.weatherChangeTime / 2, 1); // Blend over 2 seconds
                this.weatherCore.material.color.lerp(this.targetWeatherColor, blendFactor * deltaTime * 5);
                this.weatherCore.material.emissive.copy(this.weatherCore.material.color);
                
                // Update screen color too
                if (this.weatherScreen) {
                    this.weatherScreen.material.color.copy(this.weatherCore.material.color);
                    this.weatherScreen.material.emissive.copy(this.weatherCore.material.color);
                }
                
                // Finish color transition
                if (blendFactor >= 1) {
                    this.targetWeatherColor = null;
                    this.weatherChangeTime = 0;
                }
            }
        }
        
        // Animate energy rings
        if (this.energyRings) {
            this.energyRings.forEach(ring => {
                // Rotate the ring around its local axis
                ring.mesh.rotateOnAxis(ring.axis, deltaTime * ring.speed);
            });
        }
        
        // Animate weather effects based on current type
        if (this.active) {
            switch(this.currentWeather) {
                case "rain":
                    this.updateRain(deltaTime);
                    break;
                case "snow":
                    this.updateSnow(deltaTime);
                    break;
                case "storm":
                    this.updateStorm(deltaTime);
                    break;
                case "clear":
                default:
                    this.updateClearSky(deltaTime);
                    break;
            }
        }
    }
    
    updateRain(deltaTime) {
        // Update raindrops
        this.raindrops.forEach(drop => {
            // Move down
            drop.mesh.position.y -= drop.speed * deltaTime;
            
            // Reset if too low
            if (drop.mesh.position.y < this.deviceHeight - 2) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.7;
                
                drop.mesh.position.set(
                    Math.cos(angle) * radius,
                    drop.originalY,
                    Math.sin(angle) * radius
                );
            }
        });
    }
    
    updateSnow(deltaTime) {
        // Update snowflakes
        this.snowflakes.forEach(flake => {
            // Move down slowly
            flake.mesh.position.y -= flake.speed * deltaTime;
            
            // Wobble side to side
            flake.wobble += deltaTime * flake.wobbleSpeed;
            flake.mesh.position.x += Math.sin(flake.wobble) * 0.01;
            flake.mesh.position.z += Math.cos(flake.wobble) * 0.01;
            
            // Rotate
            flake.mesh.rotation.y += deltaTime;
            if (flake.mesh.geometry.type !== "CircleGeometry") {
                flake.mesh.rotation.x += deltaTime * 0.5;
            }
            
            // Reset if too low
            if (flake.mesh.position.y < this.deviceHeight - 2) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.8;
                
                flake.mesh.position.set(
                    Math.cos(angle) * radius,
                    flake.originalY,
                    Math.sin(angle) * radius
                );
            }
        });
    }
    
    updateStorm(deltaTime) {
        // Update cloud formations
        this.cloudParticles.forEach(cloud => {
            // Rotate clouds
            cloud.mesh.rotation.y += deltaTime * cloud.rotationSpeed;
            
            // Subtle movement
            const cloudWobble = Math.sin(this.animationTime + cloud.rotationSpeed * 10) * 0.05;
            cloud.mesh.position.y = cloud.originalPos.y + cloudWobble;
        });
        
        // Update lightning bolts
        this.lightningBolts.forEach((bolt, index) => {
            bolt.life += deltaTime;
            
            // Fade out based on life
            const remainingLife = 1 - (bolt.life / bolt.maxLife);
            bolt.mesh.material.opacity = remainingLife * 0.9;
            
            // Remove if expired
            if (bolt.life >= bolt.maxLife) {
                this.mesh.remove(bolt.mesh);
                this.lightningBolts.splice(index, 1);
            }
        });
        
        // Random chance to create new lightning
        if (Math.random() < deltaTime * 2 && this.lightningBolts.length < 3) {
            this.createLightningBolt();
        }
    }
    
    updateClearSky(deltaTime) {
        // Update light rays
        this.lightningBolts.forEach(ray => {
            // Subtle pulsing
            const pulse = Math.sin(this.animationTime * 2 + ray.mesh.rotation.y) * 0.3 + 0.7;
            ray.mesh.material.emissiveIntensity = pulse;
            ray.mesh.material.opacity = 0.4 * pulse;
        });
    }
    
    // Change weather type
    setWeather(weatherType) {
        if (!["clear", "rain", "snow", "storm"].includes(weatherType)) {
            return false;
        }
        
        // Already this weather
        if (weatherType === this.currentWeather) {
            return true;
        }
        
        // Set new weather type and start color transition
        this.currentWeather = weatherType;
        this.weatherChangeTime = 0;
        
        // Target color for transition
        this.targetWeatherColor = new THREE.Color(this.weatherColors[weatherType]);
        
        // Update button active states
        if (this.weatherButtons) {
            Object.keys(this.weatherButtons).forEach(type => {
                this.weatherButtons[type].material.emissiveIntensity = type === weatherType ? 0.8 : 0.2;
            });
        }
        
        // Clear existing weather particles
        this.clearWeatherEffects();
        
        // Create new weather effects
        this.createWeatherEffects();
        
        return true;
    }
    
    clearWeatherEffects() {
        // Remove raindrops
        this.raindrops.forEach(drop => {
            this.mesh.remove(drop.mesh);
        });
        this.raindrops = [];
        
        // Remove snowflakes
        this.snowflakes.forEach(flake => {
            this.mesh.remove(flake.mesh);
        });
        this.snowflakes = [];
        
        // Remove lightning bolts
        this.lightningBolts.forEach(bolt => {
            this.mesh.remove(bolt.mesh);
        });
        this.lightningBolts = [];
        
        // Remove clouds
        this.cloudParticles.forEach(cloud => {
            this.mesh.remove(cloud.mesh);
        });
        this.cloudParticles = [];
    }
    
    toggleActive() {
        this.active = !this.active;
        
        if (this.active) {
            // Restart weather effects
            this.createWeatherEffects();
        } else {
            // Clear weather effects
            this.clearWeatherEffects();
        }
        
        return this.active;
    }
    
    handleCollision(point) {
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        const isInside = boundingBox.containsPoint(point);
        
        return {
            collided: isInside,
            point: point.clone(),
            weatherType: this.currentWeather,
            active: this.active
        };
    }
}