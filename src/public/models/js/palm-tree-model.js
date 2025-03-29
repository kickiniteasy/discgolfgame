export default class PalmTreeModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Colors
        this.trunkColor = options.visualProperties?.trunkColor || 
                          options.properties?.trunkColor || 
                          "#8B4513"; // Default: brown
        this.leafColor = options.visualProperties?.leafColor || 
                         options.properties?.leafColor || 
                         "#2E8B57"; // Default: sea green
        
        // Tree properties
        this.height = options.properties?.height || 2.5;
        this.trunkSegments = options.properties?.trunkSegments || 5;
        this.leafCount = options.properties?.leafCount || 8;
        
        // Animation properties
        this.windStrength = options.properties?.windStrength || 0.1;
        this.windSpeed = options.properties?.windSpeed || 1;
        
        // References for animation
        this.leaves = [];
        this.coconuts = [];
    }

    async init() {
        // Create tree parts
        this.createTrunk();
        this.createLeaves();
        this.createCoconuts();
        
        // Apply position, rotation, scale from options
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
        
        return true;
    }
    
    createTrunk() {
        // Create trunk group with a slight curve
        const trunkGroup = new THREE.Group();
        const trunkHeight = this.height;
        const segmentHeight = trunkHeight / this.trunkSegments;
        
        // Material for trunk
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: this.trunkColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create trunk segments with a slight curve
        for (let i = 0; i < this.trunkSegments; i++) {
            const radius = 0.15 - (i * 0.02); // Taper the trunk
            const segment = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius + 0.02, segmentHeight, 8),
                trunkMaterial
            );
            
            // Calculate position with a slight curve
            const curveX = Math.sin((i / this.trunkSegments) * Math.PI) * 0.2;
            const y = i * segmentHeight + segmentHeight / 2;
            segment.position.set(curveX, y, 0);
            
            // Apply a slight tilt
            const tiltAngle = (Math.sin((i / this.trunkSegments) * Math.PI) * 0.2) - 0.1;
            segment.rotation.z = tiltAngle;
            
            segment.castShadow = true;
            segment.receiveShadow = true;
            
            trunkGroup.add(segment);
        }
        
        this.mesh.add(trunkGroup);
    }
    
    createLeaves() {
        // Create leaf cluster at the top
        const leafGroup = new THREE.Group();
        leafGroup.position.set(0.2, this.height, 0); // Slightly offset from trunk center
        
        // Leaf material
        const leafMaterial = new THREE.MeshStandardMaterial({ 
            color: this.leafColor,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        // Create leaves in a radial pattern
        for (let i = 0; i < this.leafCount; i++) {
            const leafSubGroup = new THREE.Group();
            
            // Angle and direction for this leaf
            const angle = (i / this.leafCount) * Math.PI * 2;
            const offsetX = Math.sin(angle) * 0.2;
            const offsetZ = Math.cos(angle) * 0.2;
            
            // Main stem
            const stemLength = 1.0 + Math.random() * 0.5;
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.01, stemLength, 5),
                new THREE.MeshStandardMaterial({ 
                    color: this.leafColor,
                    roughness: 0.8,
                    metalness: 0.1
                })
            );
            
            // Position at the base
            stem.position.set(0, stemLength / 2, 0);
            stem.castShadow = true;
            leafSubGroup.add(stem);
            
            // Create leaf segments along the stem
            const segmentCount = 10;
            const segmentWidth = 0.15;
            const segmentLength = 0.4;
            
            for (let j = 0; j < segmentCount; j++) {
                // Create left and right leaf segments
                for (let side = -1; side <= 1; side += 2) {
                    if (side === 0) continue; // Skip center
                    
                    const leafSegment = new THREE.Mesh(
                        new THREE.PlaneGeometry(segmentWidth, segmentLength),
                        leafMaterial
                    );
                    
                    // Position along the stem with proper angle
                    const yPos = (j / segmentCount) * stemLength + 0.1;
                    const xPos = side * segmentWidth / 2;
                    leafSegment.position.set(xPos, yPos, 0);
                    
                    // Rotation to face outward
                    leafSegment.rotation.set(
                        -Math.PI / 8, // Tilt up slightly
                        0,
                        side * (Math.PI / 8 + (j / segmentCount) * (Math.PI / 8)) // Angle based on position
                    );
                    
                    leafSegment.castShadow = true;
                    leafSubGroup.add(leafSegment);
                }
            }
            
            // Tip leaf segment
            const tipLeaf = new THREE.Mesh(
                new THREE.PlaneGeometry(segmentWidth, segmentLength * 1.5),
                leafMaterial
            );
            tipLeaf.position.set(0, stemLength + 0.1, 0);
            tipLeaf.rotation.set(-Math.PI / 8, 0, 0);
            tipLeaf.castShadow = true;
            leafSubGroup.add(tipLeaf);
            
            // Position and rotate the entire leaf
            leafSubGroup.position.set(offsetX, 0, offsetZ);
            leafSubGroup.rotation.set(
                0.3 + Math.random() * 0.2, // Tilt down slightly
                angle, // Radial arrangement
                0
            );
            
            // Store for animation
            this.leaves.push({
                group: leafSubGroup,
                originalRotation: leafSubGroup.rotation.clone(),
                angleOffset: angle,
                animationOffset: Math.random() * Math.PI * 2
            });
            
            leafGroup.add(leafSubGroup);
        }
        
        this.mesh.add(leafGroup);
    }
    
    createCoconuts() {
        // Add coconuts at the top of the trunk
        if (this.options.properties?.includeCoconuts !== false) {
            const coconutCount = Math.floor(Math.random() * 3) + 2; // 2-4 coconuts
            
            for (let i = 0; i < coconutCount; i++) {
                const angle = (i / coconutCount) * Math.PI * 2;
                const radius = 0.2;
                
                const coconut = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 12, 12),
                    new THREE.MeshStandardMaterial({ 
                        color: "#654321", // Dark brown
                        roughness: 0.8,
                        metalness: 0.1
                    })
                );
                
                // Position around the trunk top
                coconut.position.set(
                    Math.sin(angle) * radius + 0.2, // Offset to match trunk curve
                    this.height - 0.1,
                    Math.cos(angle) * radius
                );
                
                coconut.castShadow = true;
                coconut.receiveShadow = true;
                
                this.coconuts.push({
                    mesh: coconut,
                    originalY: coconut.position.y,
                    fallSpeed: 0,
                    onGround: false
                });
                
                this.mesh.add(coconut);
            }
        }
    }
    
    update(deltaTime) {
        // Skip animation if disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        const time = performance.now() * 0.001;
        
        // Animate leaves swaying in the wind
        this.leaves.forEach(leaf => {
            // Add slight rotation sway based on wind
            const windX = Math.sin(time * this.windSpeed + leaf.animationOffset) * this.windStrength;
            const windZ = Math.cos(time * 0.7 * this.windSpeed + leaf.animationOffset) * this.windStrength;
            
            leaf.group.rotation.x = leaf.originalRotation.x + windX;
            leaf.group.rotation.z = leaf.originalRotation.z + windZ;
        });
        
        // Animate falling coconuts if configured
        if (this.options.properties?.coconutsFall === true) {
            this.coconuts.forEach(coconut => {
                if (!coconut.onGround) {
                    // Simulate gravity
                    coconut.fallSpeed += deltaTime * 9.8; // Gravity acceleration
                    coconut.mesh.position.y -= coconut.fallSpeed * deltaTime;
                    
                    // Check if coconut has hit the ground
                    if (coconut.mesh.position.y <= 0.1) {
                        coconut.mesh.position.y = 0.1;
                        coconut.onGround = true;
                        
                        // Add slight random roll
                        const rollDirection = Math.random() * Math.PI * 2;
                        coconut.mesh.position.x += Math.sin(rollDirection) * 0.2;
                        coconut.mesh.position.z += Math.cos(rollDirection) * 0.2;
                    }
                }
            });
        }
    }
    
    // Custom interaction: shake tree when clicked
    handleCollision(point) {
        const collision = super.handleCollision(point);
        
        if (collision.collided && this.options.properties?.interactiveShake) {
            // Temporarily increase wind strength for a shaking effect
            const originalWindStrength = this.windStrength;
            this.windStrength = 0.5;
            
            // Make a coconut fall if enabled
            if (this.options.properties?.coconutsFall === true) {
                // Find a coconut that hasn't fallen yet
                const availableCoconuts = this.coconuts.filter(c => !c.onGround);
                if (availableCoconuts.length > 0) {
                    // Randomly select one coconut to fall
                    const randomIndex = Math.floor(Math.random() * availableCoconuts.length);
                    availableCoconuts[randomIndex].fallSpeed = 0.1; // Start falling
                }
            }
            
            // Reset wind strength after a delay
            setTimeout(() => {
                this.windStrength = originalWindStrength;
            }, 1000);
        }
        
        return collision;
    }
}
