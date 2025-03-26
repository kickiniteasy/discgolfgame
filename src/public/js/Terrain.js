/*
Required CDN scripts (add these to your HTML before this script):
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js"></script>
*/

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
            customProperties: options.customProperties || {},
            showHitboxes: options.showHitboxes || false
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
            // Ground planes are rotated -90 degrees on X axis and use only Y rotation
            this.mesh.rotation.set(-Math.PI / 2, this.options.rotation.y, 0);
        } else {
            // Other objects use full rotation
            this.mesh.rotation.setFromVector3(this.options.rotation);
        }
        
        // Apply scale
        this.mesh.scale.copy(this.options.scale);

        // Update hitbox scale if it exists
        if (this.hitboxMesh) {
            // For custom hitboxes (like trees and bushes), we want to scale them proportionally
            if (['tree', 'bush'].includes(this.constructor.type)) {
                const scale = Math.max(this.options.scale.x, this.options.scale.y, this.options.scale.z);
                this.hitboxMesh.scale.multiplyScalar(scale);
            }
        }
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
        // Override in child classes if needed
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
            case 'dense':
                // For vegetation types
                if (this instanceof TreeGroupTerrain) {
                    this.createDenseVariant();
                }
                break;
            case 'sparse':
                // For vegetation types
                if (this instanceof TreeGroupTerrain) {
                    this.createSparseVariant();
                }
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
            customProperties: this.options.customProperties
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
}

class FairwayTerrain extends Terrain {
    static type = 'fairway';
    
    async createMesh() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const fairwayTexture = await new Promise((resolve) => {
            textureLoader.load(
                'textures/fairway/fairway_diffuse.png',
                resolve,
                undefined,
                (error) => console.error('Error loading fairway texture:', error)
            );
        });
        
        const fairwayNormal = await new Promise((resolve) => {
            textureLoader.load(
                'textures/fairway/fairway_normal.png',
                resolve,
                undefined,
                (error) => console.error('Error loading fairway normal map:', error)
            );
        });
        
        // Configure texture settings
        fairwayTexture.wrapS = fairwayTexture.wrapT = THREE.RepeatWrapping;
        fairwayTexture.repeat.set(1, 1);
        fairwayTexture.anisotropy = 4;
        fairwayTexture.magFilter = THREE.LinearFilter;
        fairwayTexture.minFilter = THREE.LinearMipmapLinearFilter;
        fairwayTexture.encoding = THREE.sRGBEncoding;
        
        fairwayNormal.wrapS = fairwayNormal.wrapT = THREE.RepeatWrapping;
        fairwayNormal.repeat.set(1, 1);
        fairwayNormal.anisotropy = 4;
        fairwayNormal.magFilter = THREE.LinearFilter;
        fairwayNormal.minFilter = THREE.LinearMipmapLinearFilter;
        
        const material = new THREE.MeshStandardMaterial({
            map: fairwayTexture,
            normalMap: fairwayNormal,
            normalScale: new THREE.Vector2(0.8, 0.8),
            color: 0x90EE90,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.applyVisualProperties(material);
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Update texture repeat based on scale
        this.updateTextureRepeat();
        return Promise.resolve();
    }
    
    applyTransforms() {
        super.applyTransforms();
        this.updateTextureRepeat();
    }
    
    updateTextureRepeat() {
        if (!this.mesh?.material?.map || !this.mesh?.material?.normalMap) return;
        
        // Set repeat based on scale (1 repeat per 5 units, similar to ground plane)
        const repeatX = this.options.scale.x / 5;
        const repeatY = this.options.scale.z / 5;
        
        this.mesh.material.map.repeat.set(repeatX, repeatY);
        this.mesh.material.normalMap.repeat.set(repeatX, repeatY);
    }
}

class RoughTerrain extends Terrain {
    static type = 'rough';
    
    async createMesh() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x355E3B,
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.applyVisualProperties(material);
        this.mesh = new THREE.Mesh(geometry, material);
        return Promise.resolve();
    }
}

class WaterTerrain extends Terrain {
    static type = 'water';
    
    async createMesh() {
        const geometry = new THREE.PlaneGeometry(
            this.options.scale.x,
            this.options.scale.z
        );
        const material = new THREE.MeshStandardMaterial({
            color: 0x4169E1,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        });
        
        this.applyVisualProperties(material);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        
        if (this.options.properties.depth) {
            this.mesh.position.y -= this.options.properties.depth;
        }
        return Promise.resolve();
    }
}

class SandTerrain extends Terrain {
    static type = 'sand';
    
    async createMesh() {
        const geometry = new THREE.PlaneGeometry(
            this.options.scale.x,
            this.options.scale.z
        );
        const material = new THREE.MeshStandardMaterial({
            color: 0xF4A460,
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        return Promise.resolve();
    }
}

class TreeTerrain extends Terrain {
    static type = 'tree';
    
    async createMesh() {
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        const foliageGeometry = new THREE.ConeGeometry(1, 2, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 1.0
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2;
        
        this.mesh = new THREE.Group();
        this.mesh.add(trunk);
        this.mesh.add(foliage);

        // Create a compound hitbox for the tree
        // Trunk hitbox
        const trunkHitboxGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
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
        trunkHitbox.position.y = 1;

        // Create foliage hitbox (cone-shaped)
        const foliageHitboxGeometry = new THREE.CylinderGeometry(0.2, 0.8, 2, 8);
        const foliageHitbox = new THREE.LineSegments(
            new THREE.EdgesGeometry(foliageHitboxGeometry),
            hitboxMaterial
        );
        foliageHitbox.position.y = 2.5;

        // Create a group for hitboxes
        this.hitboxMesh = new THREE.Group();
        this.hitboxMesh.add(trunkHitbox);
        this.hitboxMesh.add(foliageHitbox);
        this.mesh.add(this.hitboxMesh);

        return Promise.resolve();
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

class PathTerrain extends Terrain {
    static type = 'path';
    
    async createMesh() {
        const geometry = new THREE.PlaneGeometry(
            this.options.scale.x,
            this.options.scale.z
        );
        const material = new THREE.MeshStandardMaterial({
            color: 0xD2B48C,
            roughness: 0.9,
            metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        return Promise.resolve();
    }
}

class CustomTerrain extends Terrain {
    static type = 'custom';
    
    async createMesh() {
        if (!this.options.customProperties?.modelUrl) {
            console.error('CustomTerrain requires a modelUrl in customProperties');
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
            const fileExt = this.options.customProperties.modelUrl.split('.').pop().toLowerCase();
            
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
            if (this.options.customProperties.materials) {
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
        if (this.options.customProperties.useDraco) {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('/js/libs/draco/');
            loader.setDRACOLoader(dracoLoader);
        }

        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                this.options.customProperties.modelUrl,
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
            if (this.options.customProperties.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadOBJ() {
        const loader = new THREE.OBJLoader();
        
        // If the model URL ends with 'model.obj', try to load the corresponding MTL file
        if (this.options.customProperties.modelUrl.endsWith('model.obj')) {
            const mtlUrl = this.options.customProperties.modelUrl.replace('model.obj', 'materials.mtl');
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
                this.options.customProperties.modelUrl,
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
                this.options.customProperties.modelUrl,
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
            if (this.options.customProperties.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadSTL() {
        const loader = new THREE.STLLoader();
        const geometry = await new Promise((resolve, reject) => {
            loader.load(
                this.options.customProperties.modelUrl,
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

        const materials = this.options.customProperties.materials;
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
        super.update(deltaTime);
        
        // Update animation mixer if it exists
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}

// Update the terrain types mapping
Terrain.typeMap = {
    fairway: FairwayTerrain,
    rough: RoughTerrain,
    water: WaterTerrain,
    sand: SandTerrain,
    tree: TreeTerrain,
    bush: BushTerrain,
    rock: RockTerrain,
    path: PathTerrain,
    custom: CustomTerrain
}; 