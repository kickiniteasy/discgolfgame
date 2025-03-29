export default class AntModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Define colors
        this.bodyColor = options.visualProperties?.bodyColor || 
                        options.properties?.bodyColor || 
                        "#8B4513";
        this.legColor = options.visualProperties?.legColor || 
                       options.properties?.legColor || 
                       "#5C3317";
        
        // Animation properties
        this.legMovementSpeed = options.properties?.legMovementSpeed || 2;
        this.legMovementRange = options.properties?.legMovementRange || 0.2;
        this.legPhases = [0, 0.33, 0.66, 0, 0.33, 0.66]; // Offset phases for natural movement
        
        // Parts references for animation
        this.legs = [];
        this.antennas = [];
    }

    async init() {
        // Create body parts
        this.createBody();
        this.createHead();
        this.createLegs();
        this.createAntennas();
        
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
    
    createBody() {
        // Thorax (middle part)
        const thorax = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshStandardMaterial({ 
                color: this.bodyColor,
                roughness: this.options.visualProperties?.roughness || 0.7,
                metalness: this.options.visualProperties?.metalness || 0.1
            })
        );
        thorax.position.set(0, 0.3, 0);
        thorax.castShadow = true;
        thorax.receiveShadow = true;
        this.addPart(thorax);
        
        // Abdomen (rear part)
        const abdomen = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16),
            new THREE.MeshStandardMaterial({ 
                color: this.bodyColor,
                roughness: this.options.visualProperties?.roughness || 0.7,
                metalness: this.options.visualProperties?.metalness || 0.1
            })
        );
        abdomen.position.set(0, 0.3, 0.6);
        abdomen.castShadow = true;
        abdomen.receiveShadow = true;
        this.addPart(abdomen);
    }
    
    createHead() {
        // Head (front part)
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 16, 16),
            new THREE.MeshStandardMaterial({ 
                color: this.bodyColor,
                roughness: this.options.visualProperties?.roughness || 0.7,
                metalness: this.options.visualProperties?.metalness || 0.1
            })
        );
        head.position.set(0, 0.35, -0.4);
        head.castShadow = true;
        head.receiveShadow = true;
        this.addPart(head);
        
        // Eyes (left)
        const leftEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: "#000000",
                roughness: 0.3,
                metalness: 0.5
            })
        );
        leftEye.position.set(0.12, 0.45, -0.55);
        leftEye.castShadow = true;
        this.addPart(leftEye);
        
        // Eyes (right)
        const rightEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: "#000000",
                roughness: 0.3,
                metalness: 0.5
            })
        );
        rightEye.position.set(-0.12, 0.45, -0.55);
        rightEye.castShadow = true;
        this.addPart(rightEye);
        
        // Mandibles
        this.createMandible(0.08, -0.08);
        this.createMandible(-0.08, -0.08);
    }
    
    createMandible(xPos, yPos) {
        const mandible = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.15, 8),
            new THREE.MeshStandardMaterial({ 
                color: "#3D2B1F",
                roughness: 0.5,
                metalness: 0.3
            })
        );
        mandible.position.set(xPos, 0.35 + yPos, -0.6);
        mandible.rotation.set(Math.PI / 2, 0, 0);
        mandible.castShadow = true;
        this.addPart(mandible);
    }
    
    createLegs() {
        // Create 3 legs on each side
        const legPositions = [
            { x: 0.3, y: 0.25, z: -0.2 },  // Front right
            { x: 0.35, y: 0.25, z: 0.1 },  // Middle right
            { x: 0.3, y: 0.25, z: 0.4 },   // Back right
            { x: -0.3, y: 0.25, z: -0.2 }, // Front left
            { x: -0.35, y: 0.25, z: 0.1 }, // Middle left
            { x: -0.3, y: 0.25, z: 0.4 }   // Back left
        ];
        
        // Create each leg
        for (let i = 0; i < 6; i++) {
            const legGroup = new THREE.Group();
            const pos = legPositions[i];
            
            // Upper leg segment
            const upperLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.02, 0.3, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.legColor,
                    roughness: 0.6,
                    metalness: 0.2
                })
            );
            
            // Position and rotate upper leg
            const isRightSide = i < 3;
            const rotationZ = isRightSide ? -Math.PI / 4 : Math.PI / 4;
            upperLeg.position.set(0, -0.15, 0);
            upperLeg.rotation.set(0, 0, rotationZ);
            upperLeg.castShadow = true;
            legGroup.add(upperLeg);
            
            // Lower leg segment (knee joint)
            const lowerLegGroup = new THREE.Group();
            lowerLegGroup.position.set(isRightSide ? 0.15 : -0.15, -0.3, 0);
            
            const lowerLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.01, 0.4, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.legColor,
                    roughness: 0.6,
                    metalness: 0.2
                })
            );
            
            // Rotate based on which side
            lowerLeg.position.set(0, -0.2, 0);
            lowerLeg.rotation.set(0, 0, isRightSide ? Math.PI / 3 : -Math.PI / 3);
            lowerLeg.castShadow = true;
            lowerLegGroup.add(lowerLeg);
            
            legGroup.add(lowerLegGroup);
            legGroup.position.set(pos.x, pos.y, pos.z);
            
            // Store leg for animation
            this.legs.push({ 
                group: legGroup, 
                lowerGroup: lowerLegGroup,
                originalY: pos.y,
                phase: this.legPhases[i]
            });
            
            this.mesh.add(legGroup);
        }
    }
    
    createAntennas() {
        // Create two antennas
        for (let i = 0; i < 2; i++) {
            const isLeft = i === 0;
            const xPos = isLeft ? -0.12 : 0.12;
            
            const antennaGroup = new THREE.Group();
            antennaGroup.position.set(xPos, 0.5, -0.5);
            
            // Base segment
            const baseSegment = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.01, 0.25, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.legColor,
                    roughness: 0.6,
                    metalness: 0.2
                })
            );
            baseSegment.position.set(0, 0.125, 0);
            baseSegment.rotation.set(Math.PI / 4, 0, isLeft ? -0.2 : 0.2);
            baseSegment.castShadow = true;
            antennaGroup.add(baseSegment);
            
            // Tip segment
            const tipGroup = new THREE.Group();
            tipGroup.position.set(isLeft ? -0.06 : 0.06, 0.25, -0.06);
            
            const tipSegment = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.005, 0.2, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.legColor,
                    roughness: 0.6,
                    metalness: 0.2
                })
            );
            tipSegment.position.set(0, 0.1, 0);
            tipSegment.rotation.set(Math.PI / 6, 0, isLeft ? -0.3 : 0.3);
            tipSegment.castShadow = true;
            tipGroup.add(tipSegment);
            
            antennaGroup.add(tipGroup);
            this.mesh.add(antennaGroup);
            
            // Store for animation
            this.antennas.push({
                group: antennaGroup,
                tipGroup: tipGroup,
                originalRotation: antennaGroup.rotation.clone()
            });
        }
    }
    
    update(deltaTime) {
        // Skip animation if disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Animate legs
        this.legs.forEach((leg, index) => {
            const time = performance.now() * 0.001 * this.legMovementSpeed;
            const offset = leg.phase;
            const legMovement = Math.sin(time + offset) * this.legMovementRange;
            
            // Move leg up and down slightly
            leg.group.position.y = leg.originalY + legMovement;
            
            // Slightly rotate lower leg for more natural movement
            leg.lowerGroup.rotation.x = Math.sin(time + offset) * 0.1;
        });
        
        // Animate antennas
        this.antennas.forEach((antenna, index) => {
            const time = performance.now() * 0.001;
            const swayAmount = 0.05;
            
            // Gentle swaying motion
            antenna.group.rotation.z = Math.sin(time * 1.5 + index) * swayAmount;
            antenna.group.rotation.x = Math.sin(time * 1.2) * swayAmount;
            
            // More pronounced movement at the tip
            antenna.tipGroup.rotation.z = Math.sin(time * 2 + index) * swayAmount * 2;
        });
    }
}
