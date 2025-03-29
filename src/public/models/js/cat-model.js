export default class CatModel extends BaseModel {
    constructor(scene, options = {}) {
        super(scene, options);
        this.scene = scene;
        this.options = options;
        this.mesh = new THREE.Group();
        
        // Cat colors
        this.furColor = options.visualProperties?.furColor || 
                        options.properties?.furColor || 
                        "#E8B17D"; // Default: orange tabby
        this.eyeColor = options.visualProperties?.eyeColor || 
                        options.properties?.eyeColor || 
                        "#00FF00"; // Default: green
        this.noseColor = options.visualProperties?.noseColor || 
                        options.properties?.noseColor || 
                        "#FF9AA2"; // Default: pink
        
        // Animation properties
        this.tailWagSpeed = options.properties?.tailWagSpeed || 1.5;
        this.earTwitchSpeed = options.properties?.earTwitchSpeed || 0.8;
        this.tailWagAmount = options.properties?.tailWagAmount || 0.3;
        
        // Store parts for animation
        this.tail = null;
        this.ears = [];
    }

    async init() {
        // Create body parts
        this.createBody();
        this.createHead();
        this.createLegs();
        this.createTail();
        
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
        // Main body
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.furColor,
            roughness: this.options.visualProperties?.roughness || 0.9,
            metalness: this.options.visualProperties?.metalness || 0.1
        });
        
        // Torso (main body)
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 16, 16),
            bodyMaterial
        );
        body.position.set(0, 0.45, 0);
        body.scale.set(1, 0.8, 1.5);
        body.castShadow = true;
        body.receiveShadow = true;
        this.addPart(body);
    }
    
    createHead() {
        // Head material
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: this.furColor,
            roughness: this.options.visualProperties?.roughness || 0.9,
            metalness: this.options.visualProperties?.metalness || 0.1
        });
        
        // Head (basic sphere)
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            headMaterial
        );
        head.position.set(0, 0.75, -0.55);
        head.castShadow = true;
        head.receiveShadow = true;
        this.addPart(head);
        
        // Eyes
        this.createEye(0.1, 0.85, -0.75);  // Right eye
        this.createEye(-0.1, 0.85, -0.75); // Left eye
        
        // Nose
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: this.noseColor,
                roughness: 0.6,
                metalness: 0.1
            })
        );
        nose.position.set(0, 0.75, -0.85);
        nose.castShadow = true;
        this.addPart(nose);
        
        // Mouth
        this.createMouthLine(0.05, 0.68, -0.85, 0, 0.65, -0.83);   // Right side
        this.createMouthLine(-0.05, 0.68, -0.85, 0, 0.65, -0.83);  // Left side
        
        // Whiskers
        this.createWhiskers();
        
        // Ears
        this.createEars();
    }
    
    createEye(x, y, z) {
        // Eye white
        const eyeWhite = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: "#FFFFFF",
                roughness: 0.2,
                metalness: 0.1
            })
        );
        eyeWhite.position.set(x, y, z);
        eyeWhite.castShadow = true;
        this.addPart(eyeWhite);
        
        // Pupil
        const pupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: "#000000",
                roughness: 0.1,
                metalness: 0.1,
                emissive: this.eyeColor,
                emissiveIntensity: 0.5
            })
        );
        pupil.position.set(x, y, z - 0.03);
        this.addPart(pupil);
    }
    
    createMouthLine(x1, y1, z1, x2, y2, z2) {
        // Create a thin cylinder to represent a line
        const direction = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
        const length = direction.length();
        
        const mouthLine = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, length, 4),
            new THREE.MeshBasicMaterial({ color: "#000000" })
        );
        
        // Position and rotate the cylinder to match the line segment
        mouthLine.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
        
        // Align the cylinder to the direction vector
        if (direction.y === 0) {
            mouthLine.rotation.z = Math.PI / 2;
        } else {
            mouthLine.lookAt(new THREE.Vector3(x2, y2, z2));
            mouthLine.rotateX(Math.PI / 2);
        }
        
        this.addPart(mouthLine);
    }
    
    createWhiskers() {
        // Create 3 whiskers on each side
        const whiskerPositions = [
            // Right side whiskers
            { start: { x: 0.15, y: 0.7, z: -0.8 }, end: { x: 0.45, y: 0.72, z: -0.75 } },
            { start: { x: 0.15, y: 0.68, z: -0.8 }, end: { x: 0.45, y: 0.68, z: -0.8 } },
            { start: { x: 0.15, y: 0.66, z: -0.8 }, end: { x: 0.45, y: 0.64, z: -0.85 } },
            
            // Left side whiskers
            { start: { x: -0.15, y: 0.7, z: -0.8 }, end: { x: -0.45, y: 0.72, z: -0.75 } },
            { start: { x: -0.15, y: 0.68, z: -0.8 }, end: { x: -0.45, y: 0.68, z: -0.8 } },
            { start: { x: -0.15, y: 0.66, z: -0.8 }, end: { x: -0.45, y: 0.64, z: -0.85 } }
        ];
        
        whiskerPositions.forEach(pos => {
            const start = pos.start;
            const end = pos.end;
            
            const direction = new THREE.Vector3(
                end.x - start.x,
                end.y - start.y,
                end.z - start.z
            );
            const length = direction.length();
            
            const whisker = new THREE.Mesh(
                new THREE.CylinderGeometry(0.003, 0.001, length, 3),
                new THREE.MeshStandardMaterial({ 
                    color: "#FFFFFF",
                    roughness: 0.3,
                    metalness: 0.7
                })
            );
            
            // Position at midpoint
            whisker.position.set(
                (start.x + end.x) / 2,
                (start.y + end.y) / 2,
                (start.z + end.z) / 2
            );
            
            // Orient along the direction
            whisker.lookAt(new THREE.Vector3(end.x, end.y, end.z));
            whisker.rotateX(Math.PI / 2);
            
            whisker.castShadow = true;
            this.addPart(whisker);
        });
    }
    
    createEars() {
        // Create two triangular ears
        const earPositions = [
            { x: 0.17, y: 1.0, z: -0.5, rotationY: 0.3 }, // Right ear
            { x: -0.17, y: 1.0, z: -0.5, rotationY: -0.3 } // Left ear
        ];
        
        earPositions.forEach((pos, index) => {
            const earGroup = new THREE.Group();
            earGroup.position.set(pos.x, pos.y, pos.z);
            
            // Outer ear
            const earGeometry = new THREE.ConeGeometry(0.12, 0.2, 4);
            const ear = new THREE.Mesh(
                earGeometry,
                new THREE.MeshStandardMaterial({ 
                    color: this.furColor,
                    roughness: 0.9,
                    metalness: 0.1
                })
            );
            
            // Inner ear (slightly smaller, different color)
            const innerEar = new THREE.Mesh(
                new THREE.ConeGeometry(0.07, 0.15, 4),
                new THREE.MeshStandardMaterial({ 
                    color: this.noseColor,
                    roughness: 0.7,
                    metalness: 0.1
                })
            );
            innerEar.position.set(0, 0.01, 0);
            
            ear.add(innerEar);
            earGroup.add(ear);
            
            // Rotate to correct orientation
            earGroup.rotation.set(
                -Math.PI / 8, // Tilt forward slightly
                pos.rotationY,
                0
            );
            
            this.ears.push({
                group: earGroup,
                originalRotation: earGroup.rotation.clone()
            });
            
            this.mesh.add(earGroup);
        });
    }
    
    createLegs() {
        // Four legs
        const legPositions = [
            { x: 0.25, y: 0, z: -0.3 },  // Front right
            { x: -0.25, y: 0, z: -0.3 }, // Front left
            { x: 0.25, y: 0, z: 0.4 },   // Back right
            { x: -0.25, y: 0, z: 0.4 }   // Back left
        ];
        
        legPositions.forEach(pos => {
            const legGroup = new THREE.Group();
            legGroup.position.set(pos.x, pos.y, pos.z);
            
            // Upper leg
            const upperLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.06, 0.4, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.furColor,
                    roughness: 0.9,
                    metalness: 0.1
                })
            );
            upperLeg.position.set(0, 0.2, 0);
            upperLeg.castShadow = true;
            upperLeg.receiveShadow = true;
            legGroup.add(upperLeg);
            
            // Paw
            const paw = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshStandardMaterial({ 
                    color: this.furColor,
                    roughness: 0.9,
                    metalness: 0.1
                })
            );
            paw.position.set(0, 0, 0);
            paw.scale.set(1, 0.5, 1);
            paw.castShadow = true;
            paw.receiveShadow = true;
            legGroup.add(paw);
            
            this.mesh.add(legGroup);
        });
    }
    
    createTail() {
        // Create a tail with several segments for animation
        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 0.5, 0.7);
        
        // Tail base
        const tailBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.06, 0.2, 8),
            new THREE.MeshStandardMaterial({ 
                color: this.furColor,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        tailBase.rotation.set(Math.PI / 2, 0, 0);
        tailBase.castShadow = true;
        tailGroup.add(tailBase);
        
        // Tail middle segment
        const tailMiddle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.04, 0.3, 8),
            new THREE.MeshStandardMaterial({ 
                color: this.furColor,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        tailMiddle.position.set(0, 0, 0.25);
        tailMiddle.rotation.set(Math.PI / 2, 0, 0);
        tailMiddle.castShadow = true;
        tailGroup.add(tailMiddle);
        
        // Tail tip
        const tailTip = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.02, 0.3, 8),
            new THREE.MeshStandardMaterial({ 
                color: this.furColor,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        tailTip.position.set(0, 0, 0.55);
        tailTip.rotation.set(Math.PI / 2, 0, 0);
        tailTip.castShadow = true;
        tailGroup.add(tailTip);
        
        this.tail = tailGroup;
        this.mesh.add(tailGroup);
    }
    
    update(deltaTime) {
        // Skip animation if disabled
        if (this.options.properties?.animated === false) {
            return;
        }
        
        // Animate tail wagging
        if (this.tail) {
            const time = performance.now() * 0.001 * this.tailWagSpeed;
            this.tail.rotation.y = Math.sin(time) * this.tailWagAmount;
            
            // Slight up/down motion
            this.tail.rotation.x = Math.sin(time * 0.5) * 0.1;
        }
        
        // Animate ear twitching (occasional random twitches)
        this.ears.forEach((ear, index) => {
            const time = performance.now() * 0.001;
            const randomTwitch = Math.sin(time * this.earTwitchSpeed + index * 2) > 0.7;
            
            if (randomTwitch) {
                const twitchAmount = Math.sin(time * 10) * 0.1;
                ear.group.rotation.z = ear.originalRotation.z + twitchAmount;
            } else {
                // Return to original position
                ear.group.rotation.z = ear.originalRotation.z;
            }
        });
    }
}
