class Terrain {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.id = options.id || crypto.randomUUID();
        this.options = {
            position: options.position || new THREE.Vector3(0, 0, 0),
            rotation: options.rotation || new THREE.Vector3(0, 0, 0),
            scale: options.scale || new THREE.Vector3(1, 1, 1),
            visualProperties: options.visualProperties || {
                color: null,
                roughness: 0.9,
                metalness: 0.1,
                opacity: 1.0
            },
            variant: options.variant || 'default',
            tags: options.tags || [],
            properties: options.properties || {},
            showHitboxes: options.showHitboxes || false,
            shape: options.shape || null,
            textureSettings: options.textureSettings || null
        };
        
        this.mesh = null;
        this.hitboxMesh = null;
        
        // Don't automatically initialize - let the caller await init()
    }

    async init() {
        // Create mesh and wait for it to complete
        await this.createMesh();
        
        // Only add to scene if mesh creation was successful
        if (this.mesh) {
            this.addToScene();
            return true;
        }
        return false;
    }

    async createMesh() {
        return Promise.resolve();
    }

    addToScene() {
        if (this.mesh) {
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.applyTransforms();
            
            // Only create automatic hitbox if the terrain type needs one and doesn't already have a custom hitbox
            if (!['fairway', 'rough', 'path', 'tree', 'bush'].includes(this.constructor.type) 
                && !this.hitboxMesh) {
                this.createHitboxFromBounds();
            }
            
            this.scene.add(this.mesh);
        }
    }

    applyTransforms() {
        if (!this.mesh) return;

        // Reset scale before applying new scale
        this.mesh.scale.set(1, 1, 1);

        // Apply position
        this.mesh.position.copy(this.options.position);
        
        // Handle special cases for ground planes
        if (this.constructor.type === 'fairway' || 
            this.constructor.type === 'rough' || 
            this.constructor.type === 'path' ||
            this.constructor.type === 'water' ||
            this.constructor.type === 'sand') {
            // First apply the shape rotation around Y axis
            const shapeRotation = this.options.shape?.rotation || 0;
            this.mesh.rotation.set(-Math.PI / 2, shapeRotation, 0);
        } else {
            // Other objects use full rotation
            this.mesh.rotation.setFromVector3(this.options.rotation);
        }
        
        // Apply scale to entire mesh
        this.mesh.scale.copy(this.options.scale);
    }

    removeFromScene() {
        if (!this.mesh) return;

        // Helper function to dispose of mesh resources
        const disposeMesh = (mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(material => material.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        };

        // Helper function to recursively remove and dispose of meshes
        const disposeHierarchy = (node) => {
            node.traverse((child) => {
                if (child.isMesh) {
                    disposeMesh(child);
                }
            });
        };

        // Handle both Group and Mesh cases
        if (this.mesh.isGroup) {
            disposeHierarchy(this.mesh);
        } else if (this.mesh.isMesh) {
            disposeMesh(this.mesh);
        }

        // Remove from scene
        this.scene.remove(this.mesh);
        this.mesh = null;
    }

    update(deltaTime) {
        // Update animation mixer if it exists
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    applyVisualProperties(material) {
        const visualProps = this.options.visualProperties;
        
        // Apply color if specified, otherwise use default
        if (visualProps.color) {
            material.color.setStyle(visualProps.color);
        }
        
        // Apply other visual properties
        material.roughness = visualProps.roughness;
        material.metalness = visualProps.metalness;
        
        if (visualProps.opacity < 1.0) {
            material.transparent = true;
            material.opacity = visualProps.opacity;
        }
    }

    applyVariant() {
        if (!this.mesh) return;

        switch (this.options.variant) {
            case 'tall':
                this.mesh.scale.y *= 1.5;
                break;
            case 'wide':
                this.mesh.scale.x *= 1.5;
                this.mesh.scale.z *= 1.5;
                break;
        }
    }

    // Convert terrain object to JSON schema format
    toJSON() {
        return {
            id: this.id,
            type: this.constructor.type,
            position: {
                x: this.options.position.x,
                y: this.options.position.y,
                z: this.options.position.z
            },
            rotation: {
                x: this.options.rotation.x,
                y: this.options.rotation.y,
                z: this.options.rotation.z
            },
            scale: {
                x: this.options.scale.x,
                y: this.options.scale.y,
                z: this.options.scale.z
            },
            visualProperties: this.options.visualProperties,
            variant: this.options.variant,
            tags: this.options.tags,
            properties: this.options.properties,
            shape: this.options.shape,
            textureSettings: this.options.textureSettings
        };
    }

    setHitboxVisibility(visible) {
        if (this.hitboxMesh) {
            this.hitboxMesh.visible = visible;
        }
    }

    createHitbox(size = new THREE.Vector3(1, 1, 1), color = 0xffff00) {
        if (this.hitboxMesh) {
            this.mesh.remove(this.hitboxMesh);
        }

        // Create edges geometry instead of box geometry for cleaner visualization
        const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
        const hitboxMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            visible: this.options.showHitboxes
        });

        this.hitboxMesh = new THREE.LineSegments(edgesGeometry, hitboxMaterial);
        if (this.mesh) {
            this.mesh.add(this.hitboxMesh);
        }
    }

    createHitboxFromBounds() {
        // Remove any existing hitbox
        if (this.hitboxMesh) {
            this.mesh.remove(this.hitboxMesh);
            this.hitboxMesh = null;
        }

        // Skip if mesh doesn't exist
        if (!this.mesh) return;

        // Get the bounding box in local space
        const boundingBox = new THREE.Box3();
        this.mesh.traverse((child) => {
            if (child.isMesh && child !== this.hitboxMesh) {
                child.geometry.computeBoundingBox();
                const childBox = child.geometry.boundingBox.clone();
                childBox.applyMatrix4(child.matrixWorld);
                boundingBox.union(childBox);
            }
        });

        const size = new THREE.Vector3();
        boundingBox.getSize(size);

        // Create hitbox with computed size
        const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            visible: this.options.showHitboxes
        });

        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        
        // Scale the hitbox to match the bounding box size
        this.hitboxMesh.scale.copy(size);
        
        // Position the hitbox at the center
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        this.hitboxMesh.position.copy(center);

        // Add hitbox to mesh
        this.mesh.add(this.hitboxMesh);
    }

    async loadGLTF() {
        const loader = new THREE.GLTFLoader();
        
        // Add draco compression support if specified
        if (this.options.properties.useDraco) {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('/js/libs/draco/');
            loader.setDRACOLoader(dracoLoader);
        }

        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = gltf.scene;
        
        // Handle animations if present
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.mesh);
            this.animations = gltf.animations;
            
            // Auto-play first animation if specified
            if (this.options.properties.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadOBJ() {
        const loader = new THREE.OBJLoader();
        
        // If the model URL ends with 'model.obj', try to load the corresponding MTL file
        if (this.options.properties.modelUrl.endsWith('model.obj')) {
            const mtlUrl = this.options.properties.modelUrl.replace('model.obj', 'materials.mtl');
            try {
                const mtlLoader = new THREE.MTLLoader();
                const materials = await new Promise((resolve, reject) => {
                    mtlLoader.load(
                        mtlUrl,
                        resolve,
                        undefined,
                        reject
                    );
                });
                materials.preload();
                loader.setMaterials(materials);
            } catch (error) {
                console.warn('Could not load MTL file:', error);
            }
        }

        const obj = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = obj;
    }

    async loadFBX() {
        const loader = new THREE.FBXLoader();
        const fbx = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = fbx;

        // Handle animations if present
        if (fbx.animations && fbx.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.mesh);
            this.animations = fbx.animations;
            
            // Auto-play first animation if specified
            if (this.options.properties.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadSTL() {
        const loader = new THREE.STLLoader();
        const geometry = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Create default material if none specified
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Apply custom visual properties
        this.applyVisualProperties(material);

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = new THREE.Mesh(geometry, material);
    }

    applyCustomMaterials() {
        if (!this.mesh) return;

        const materials = this.options.properties.materials;
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                // If material is specified for this mesh name
                const materialConfig = materials[child.name];
                if (materialConfig) {
                    child.material = new THREE.MeshStandardMaterial(materialConfig);
                }
            }
        });
    }
}

class GroundTerrain extends Terrain {
    async createMesh() {
        if (!this.options.shape) {
            console.error('Ground terrain requires shape definition:', this.constructor.type, this.id);
            return;
        }

        let geometry;
        const shape = this.options.shape;

        if (shape.type === 'rectangle') {
            geometry = new THREE.PlaneGeometry(shape.width || 1, shape.length || 1);
        } else if (shape.type === 'ellipse') {
            // Create an elliptical shape using shape geometry
            const ellipseCurve = new THREE.EllipseCurve(
                0, 0,                         // Center x, y
                (shape.width || 1) / 2,       // X radius
                (shape.length || 1) / 2,      // Y radius
                0, 2 * Math.PI,               // Start angle, end angle
                false,                        // Clockwise
                0                             // Rotation
            );

            const points = ellipseCurve.getPoints(50);
            const shape2D = new THREE.Shape();
            shape2D.moveTo(points[0].x, points[0].y);
            points.forEach(point => shape2D.lineTo(point.x, point.y));

            geometry = new THREE.ShapeGeometry(shape2D);
        } else {
            console.error('Invalid shape type:', shape.type);
            return;
        }

        // Load and configure textures if specified
        const textureSettings = this.options.textureSettings || {};
        const material = await this.createMaterial(textureSettings);

        this.mesh = new THREE.Mesh(geometry, material);
        
        return Promise.resolve();
    }

    async createMaterial(textureSettings) {
        const material = new THREE.MeshStandardMaterial({
            color: this.getDefaultColor(),
            roughness: this.options.visualProperties?.roughness || 0.8,
            metalness: this.options.visualProperties?.metalness || 0.1,
            side: THREE.DoubleSide,
            flatShading: true
        });

        // Apply color from visual properties if specified
        if (this.options.visualProperties?.color) {
            material.color.setStyle(this.options.visualProperties.color);
        }

        // Get the default texture path based on terrain type
        const defaultTexturePath = this.getDefaultTexturePath();
        const texturePath = textureSettings.textureUrl || defaultTexturePath;

        if (texturePath) {
            try {
                const textureLoader = new THREE.TextureLoader();
                const texture = await new Promise((resolve, reject) => {
                    textureLoader.load(
                        texturePath,
                        resolve,
                        undefined,
                        (error) => {
                            console.warn(`Failed to load texture ${texturePath}:`, error);
                            reject(error);
                        }
                    );
                });

                // Configure texture settings
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                const tileSize = textureSettings.tileSize || 5;
                const repeatX = this.options.shape.width / tileSize;
                const repeatY = this.options.shape.length / tileSize;
                texture.repeat.set(repeatX, repeatY);
                texture.rotation = textureSettings.rotation || 0;

                // Apply texture quality settings
                texture.anisotropy = 4;
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.encoding = THREE.sRGBEncoding;

                material.map = texture;

                // Try to load grayscale map for normal mapping if it exists
                const grayscalePath = texturePath.replace('/tile.png', '/grayscale.png');
                try {
                    const grayscaleMap = await new Promise((resolve, reject) => {
                        textureLoader.load(
                            grayscalePath,
                            resolve,
                            undefined,
                            reject
                        );
                    });

                    // Configure grayscale map settings for normal mapping
                    grayscaleMap.wrapS = grayscaleMap.wrapT = THREE.RepeatWrapping;
                    grayscaleMap.repeat.copy(texture.repeat);
                    grayscaleMap.rotation = textureSettings.rotation || 0;
                    material.normalMap = grayscaleMap;
                    material.normalScale = new THREE.Vector2(0.8, 0.8);
                } catch (error) {
                    // Grayscale map not found - this is fine, just continue without it
                    console.debug(`No grayscale map found at ${grayscalePath}`);
                }
            } catch (error) {
                // If texture fails to load, just continue with the color material
                console.warn(`Using fallback color for ${this.constructor.type} (${this.id}) - texture failed to load`);
            }
        }

        return material;
    }

    getDefaultTexturePath() {
        const type = this.constructor.type;
        switch (type) {
            case 'fairway':
                return 'textures/fairway/tile.png';
            case 'rough':
                return 'textures/rough/tile.png';
            case 'water':
                return 'textures/water/tile.png';
            case 'sand':
                return 'textures/sand/tile.png';
            case 'path':
                return 'textures/path/tile.png';
            default:
                return null;
        }
    }

    getDefaultColor() {
        return 0x808080; // Override in subclasses
    }
}

class FairwayTerrain extends GroundTerrain {
    static type = 'fairway';
    
    getDefaultColor() {
        return 0x90EE90;
    }
}

class RoughTerrain extends GroundTerrain {
    static type = 'rough';
    
    getDefaultColor() {
        return 0x355E3B;
    }
}

class WaterTerrain extends GroundTerrain {
    static type = 'water';
    
    getDefaultColor() {
        return 0x4169E1;
    }

    async createMaterial(textureSettings) {
        const material = await super.createMaterial(textureSettings);
        material.transparent = true;
        material.opacity = this.options.visualProperties?.opacity || 0.8;
        return material;
    }
}

class SandTerrain extends GroundTerrain {
    static type = 'sand';
    
    getDefaultColor() {
        return 0xF4A460;
    }
}

class PathTerrain extends GroundTerrain {
    static type = 'path';
    
    getDefaultColor() {
        return 0xD2B48C;
    }
}

class TreeTerrain extends Terrain {
    static type = 'tree';
    
    async createMesh() {
        // Trunk is a cylinder with radius 0.2 at top, 0.3 at bottom, height 2
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        // Foliage is a cone with radius 1 at base, height 2
        const foliageGeometry = new THREE.ConeGeometry(1, 2, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 1.0
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2;  // Positioned on top of trunk
        
        this.mesh = new THREE.Group();
        this.mesh.add(trunk);
        this.mesh.add(foliage);

        // Create hitbox group - NOT parented to mesh so it can extend independently
        this.hitboxMesh = new THREE.Group();
        
        // Create trunk hitbox - will be resized in updateHitboxes()
        const trunkHitboxGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8); // Height will be dynamic
        const hitboxMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5,
            visible: this.options.showHitboxes
        });

        // Create trunk hitbox
        const trunkHitbox = new THREE.LineSegments(
            new THREE.EdgesGeometry(trunkHitboxGeometry),
            hitboxMaterial
        );
        trunkHitbox.name = 'trunkHitbox';

        // Create foliage hitbox - exactly matching cone
        const foliageHitboxGeometry = new THREE.ConeGeometry(1, 2, 8);
        const foliageHitbox = new THREE.LineSegments(
            new THREE.EdgesGeometry(foliageHitboxGeometry),
            hitboxMaterial
        );
        foliageHitbox.name = 'foliageHitbox';

        // Add hitboxes to group
        this.hitboxMesh.add(trunkHitbox);
        this.hitboxMesh.add(foliageHitbox);
        
        // Add hitbox group to scene (not to mesh)
        this.scene.add(this.hitboxMesh);

        return Promise.resolve();
    }

    updateHitboxes() {
        if (!this.hitboxMesh || !this.mesh) return;

        // Get world position of the tree mesh
        const worldPos = new THREE.Vector3();
        this.mesh.getWorldPosition(worldPos);
        
        // Get world scale
        const worldScale = new THREE.Vector3();
        this.mesh.getWorldScale(worldScale);

        // Update trunk hitbox
        const trunkHitbox = this.hitboxMesh.children.find(c => c.name === 'trunkHitbox');
        const foliageHitbox = this.hitboxMesh.children.find(c => c.name === 'foliageHitbox');
        
        if (trunkHitbox && foliageHitbox) {
            // Position hitbox group at world origin
            this.hitboxMesh.position.set(worldPos.x, 0, worldPos.z);
            
            // Scale hitboxes
            const xzScale = Math.max(worldScale.x, worldScale.z);
            
            // Update trunk hitbox
            trunkHitbox.scale.set(xzScale, 1, xzScale);
            // Make trunk stretch from ground (y=0) to tree position
            const trunkHeight = worldPos.y + (2 * worldScale.y); // Original trunk height was 2
            trunkHitbox.scale.y = trunkHeight;
            trunkHitbox.position.y = trunkHeight / 2; // Center the trunk vertically
            
            // Update foliage hitbox
            foliageHitbox.scale.set(xzScale, worldScale.y, xzScale);
            foliageHitbox.position.y = worldPos.y + (2 * worldScale.y); // Position at top of trunk
        }
    }

    applyTransforms() {
        super.applyTransforms();
        this.updateHitboxes();
    }
}

class BushTerrain extends Terrain {
    static type = 'bush';
    
    async createMesh() {
        const geometry = new THREE.SphereGeometry(0.5, 8, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);

        const hitboxGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            visible: this.options.showHitboxes
        });

        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.hitboxMesh.position.y = -0.25;
        this.mesh.add(this.hitboxMesh);
        
        const randomScale = 0.3;
        this.mesh.scale.x *= 1 + (Math.random() * randomScale - randomScale/2);
        this.mesh.scale.y *= 0.8 + (Math.random() * 0.2);
        this.mesh.scale.z *= 1 + (Math.random() * randomScale - randomScale/2);
        return Promise.resolve();
    }
}

class RockTerrain extends Terrain {
    static type = 'rock';
    
    async createMesh() {
        const geometry = new THREE.DodecahedronGeometry(0.5, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.95,
            metalness: 0.05
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.mesh.rotation.x = Math.random() * Math.PI;
        this.mesh.rotation.y = Math.random() * Math.PI;
        this.mesh.rotation.z = Math.random() * Math.PI;
        return Promise.resolve();
    }
}

class CustomTerrain extends Terrain {
    static type = 'custom';
    
    async createMesh() {
        if (!this.options.properties?.modelUrl) {
            console.error('CustomTerrain requires a modelUrl in properties');
            return;
        }

        // Create a temporary mesh while loading
        const tempGeometry = new THREE.BoxGeometry(1, 1, 1);
        const tempMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x888888,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        this.mesh = new THREE.Mesh(tempGeometry, tempMaterial);

        try {
            // Determine file extension
            const fileExt = this.options.properties.modelUrl.split('.').pop().toLowerCase();
            
            // Load the appropriate model based on file type
            switch (fileExt) {
                case 'gltf':
                case 'glb':
                    await this.loadGLTF();
                    break;
                case 'obj':
                    await this.loadOBJ();
                    break;
                case 'fbx':
                    await this.loadFBX();
                    break;
                case 'stl':
                    await this.loadSTL();
                    break;
                default:
                    console.error(`Unsupported file format: ${fileExt}`);
                    return;
            }

            // Apply any custom materials if specified
            if (this.options.properties.materials) {
                this.applyCustomMaterials();
            }

            // Create hitbox from loaded geometry
            this.createHitboxFromBounds();

        } catch (error) {
            console.error('Error loading custom model:', error);
        }
    }

    async loadGLTF() {
        const loader = new THREE.GLTFLoader();
        
        // Add draco compression support if specified
        if (this.options.properties.useDraco) {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('/js/libs/draco/');
            loader.setDRACOLoader(dracoLoader);
        }

        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = gltf.scene;
        
        // Handle animations if present
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.mesh);
            this.animations = gltf.animations;
            
            // Auto-play first animation if specified
            if (this.options.properties.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadOBJ() {
        const loader = new THREE.OBJLoader();
        
        // If the model URL ends with 'model.obj', try to load the corresponding MTL file
        if (this.options.properties.modelUrl.endsWith('model.obj')) {
            const mtlUrl = this.options.properties.modelUrl.replace('model.obj', 'materials.mtl');
            try {
                const mtlLoader = new THREE.MTLLoader();
                const materials = await new Promise((resolve, reject) => {
                    mtlLoader.load(
                        mtlUrl,
                        resolve,
                        undefined,
                        reject
                    );
                });
                materials.preload();
                loader.setMaterials(materials);
            } catch (error) {
                console.warn('Could not load MTL file:', error);
            }
        }

        const obj = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = obj;
    }

    async loadFBX() {
        const loader = new THREE.FBXLoader();
        const fbx = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = fbx;

        // Handle animations if present
        if (fbx.animations && fbx.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.mesh);
            this.animations = fbx.animations;
            
            // Auto-play first animation if specified
            if (this.options.properties.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadSTL() {
        const loader = new THREE.STLLoader();
        const geometry = await new Promise((resolve, reject) => {
            loader.load(
                this.options.properties.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        // Create default material if none specified
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Apply custom visual properties
        this.applyVisualProperties(material);

        // Remove temporary mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = new THREE.Mesh(geometry, material);
    }

    applyCustomMaterials() {
        if (!this.mesh) return;

        const materials = this.options.properties.materials;
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                // If material is specified for this mesh name
                const materialConfig = materials[child.name];
                if (materialConfig) {
                    child.material = new THREE.MeshStandardMaterial(materialConfig);
                }
            }
        });
    }

    update(deltaTime) {
        // Update animation mixer if it exists
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}

// Initialize the terrain types mapping if it doesn't exist
if (!Terrain.typeMap) {
    Terrain.typeMap = {};
}

// Register all base terrain types
Object.assign(Terrain.typeMap, {
    fairway: FairwayTerrain,
    rough: RoughTerrain,
    water: WaterTerrain,
    sand: SandTerrain,
    tree: TreeTerrain,
    bush: BushTerrain,
    rock: RockTerrain,
    path: PathTerrain,
    custom: CustomTerrain
}); 