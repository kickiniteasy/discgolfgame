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
        this.createMesh();
    }

    createMesh() {
        // Override in child classes
        console.warn('createMesh() should be implemented by child classes');
    }

    addToScene() {
        if (this.mesh) {
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.applyTransforms();
            this.scene.add(this.mesh);
        }
    }

    applyTransforms() {
        if (!this.mesh) return;

        // Apply position
        this.mesh.position.copy(this.options.position);
        
        // Handle special cases for ground planes
        if (this.constructor.type === 'fairway' || 
            this.constructor.type === 'rough' || 
            this.constructor.type === 'heavyRough' ||
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

        const hitboxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            visible: this.options.showHitboxes
        });

        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        if (this.mesh) {
            this.mesh.add(this.hitboxMesh);
        }
    }
}

class FairwayTerrain extends Terrain {
    static type = 'fairway';
    
    createMesh() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        
        // Load textures
        const textureLoader = new THREE.TextureLoader();
        const fairwayTexture = textureLoader.load(
            'textures/fairway/fairway_diffuse.png',
            undefined,
            undefined,
            (error) => console.error('Error loading fairway texture:', error)
        );
        const fairwayNormal = textureLoader.load(
            'textures/fairway/fairway_normal.png',
            undefined,
            undefined,
            (error) => console.error('Error loading fairway normal map:', error)
        );
        
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
    
    createMesh() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x355E3B,
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.applyVisualProperties(material);
        this.mesh = new THREE.Mesh(geometry, material);
    }
}

class HeavyRoughTerrain extends Terrain {
    static type = 'heavyRough';
    
    createMesh() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x254117, // Very dark green
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Apply custom visual properties
        this.applyVisualProperties(material);
        
        this.mesh = new THREE.Mesh(geometry, material);
    }
}

class WaterTerrain extends Terrain {
    static type = 'water';
    
    createMesh() {
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
        
        // Apply custom visual properties
        this.applyVisualProperties(material);
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        
        // Set water depth from properties
        if (this.options.properties.depth) {
            this.mesh.position.y -= this.options.properties.depth;
        }
    }
}

class SandTerrain extends Terrain {
    static type = 'sand';
    
    createMesh() {
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
    }
}

class TreeTerrain extends Terrain {
    static type = 'tree';
    
    createMesh() {
        // Create a simple tree with trunk and foliage
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
    }
}

class TreeGroupTerrain extends Terrain {
    static type = 'treeGroup';
    
    createMesh() {
        this.mesh = new THREE.Group();
        
        // Create trees based on variant
        switch (this.options.variant) {
            case 'dense':
                this.createDenseVariant();
                break;
            case 'sparse':
                this.createSparseVariant();
                break;
            default:
                this.createDefaultVariant();
                break;
        }
    }

    createDefaultVariant() {
        this.createTrees(Math.floor(Math.random() * 3) + 3);
    }

    createDenseVariant() {
        this.createTrees(Math.floor(Math.random() * 3) + 6);
    }

    createSparseVariant() {
        this.createTrees(Math.floor(Math.random() * 2) + 2);
    }

    createTrees(count) {
        for (let i = 0; i < count; i++) {
            const tree = new TreeTerrain(this.scene, {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    0,
                    (Math.random() - 0.5) * 3
                ),
                scale: new THREE.Vector3(
                    0.7 + Math.random() * 0.6,
                    0.7 + Math.random() * 0.6,
                    0.7 + Math.random() * 0.6
                ),
                visualProperties: this.options.visualProperties
            });
            this.mesh.add(tree.mesh);
        }
    }
}

class BushTerrain extends Terrain {
    static type = 'bush';
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(0.5, 8, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Scale slightly differently in each axis for natural look
        const randomScale = 0.3;
        this.mesh.scale.x *= 1 + (Math.random() * randomScale - randomScale/2);
        this.mesh.scale.y *= 0.8 + (Math.random() * 0.2);
        this.mesh.scale.z *= 1 + (Math.random() * randomScale - randomScale/2);
    }
}

class RockTerrain extends Terrain {
    static type = 'rock';
    
    createMesh() {
        const geometry = new THREE.DodecahedronGeometry(0.5, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.95,
            metalness: 0.05
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Random rotation for variety
        this.mesh.rotation.x = Math.random() * Math.PI;
        this.mesh.rotation.y = Math.random() * Math.PI;
        this.mesh.rotation.z = Math.random() * Math.PI;
    }
}

class ElevationTerrain extends Terrain {
    static type = 'elevation';
    
    createMesh() {
        // Create a box for the elevation
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x355E3B, // Dark green to match ground
            roughness: 1.0,
            metalness: 0.0
        });
        
        this.applyVisualProperties(material);
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Enable shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Mark this mesh as a physical obstacle
        this.mesh.userData.isObstacle = true;
        this.mesh.userData.type = 'elevation';
    }

    applyTransforms() {
        if (!this.mesh) return;

        // Get the height from properties
        const height = this.options.properties.height || 1;
        
        // Apply position
        this.mesh.position.copy(this.options.position);
        
        // Apply rotation
        this.mesh.rotation.setFromVector3(this.options.rotation);
        
        // Apply scale, using height for Y
        this.mesh.scale.x = this.options.scale.x;
        this.mesh.scale.z = this.options.scale.z;
        this.mesh.scale.y = height;

        // Move the mesh up by half its height so it sits on the ground
        this.mesh.position.y = height / 2;

        // Update the collision box
        const box = new THREE.Box3();
        box.setFromObject(this.mesh);
        this.mesh.userData.collisionBox = box;
    }

    // Helper method to get the height at a point
    getHeightAtPoint(x, z) {
        if (!this.mesh || !this.mesh.userData.collisionBox) return 0;

        const box = this.mesh.userData.collisionBox;
        if (x >= box.min.x && x <= box.max.x && 
            z >= box.min.z && z <= box.max.z) {
            return box.max.y;
        }
        return 0;
    }
}

class PathTerrain extends Terrain {
    static type = 'path';
    
    createMesh() {
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
    }
}

// Map of terrain types to their classes
Terrain.typeMap = {
    fairway: FairwayTerrain,
    rough: RoughTerrain,
    heavyRough: HeavyRoughTerrain,
    water: WaterTerrain,
    sand: SandTerrain,
    tree: TreeTerrain,
    treeGroup: TreeGroupTerrain,
    bush: BushTerrain,
    rock: RockTerrain,
    elevation: ElevationTerrain,
    path: PathTerrain
}; 