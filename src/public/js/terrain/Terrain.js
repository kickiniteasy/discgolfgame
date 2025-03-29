class Terrain {
    static typeMap = {};
    
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
    }

    async init() {
        await this.createMesh();
        
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
            
            if (!['fairway', 'rough', 'path', 'tree', 'bush'].includes(this.constructor.type) 
                && !this.hitboxMesh) {
                this.createHitboxFromBounds();
            }
            
            this.scene.add(this.mesh);
        }
    }

    applyTransforms() {
        if (!this.mesh) return;

        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.copy(this.options.position);
        
        if (this.constructor.type === 'fairway' || 
            this.constructor.type === 'rough' || 
            this.constructor.type === 'path' ||
            this.constructor.type === 'water' ||
            this.constructor.type === 'sand') {
            const shapeRotation = this.options.shape?.rotation || 0;
            this.mesh.rotation.set(-Math.PI / 2, shapeRotation, 0);
        } else {
            this.mesh.rotation.setFromVector3(this.options.rotation);
        }
        
        this.mesh.scale.copy(this.options.scale);
    }

    removeFromScene() {
        if (!this.mesh) return;

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

        const disposeHierarchy = (node) => {
            node.traverse((child) => {
                if (child.isMesh) {
                    disposeMesh(child);
                }
            });
        };

        if (this.mesh.isGroup) {
            disposeHierarchy(this.mesh);
        } else if (this.mesh.isMesh) {
            disposeMesh(this.mesh);
        }

        this.scene.remove(this.mesh);
        this.mesh = null;
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    applyVisualProperties(material) {
        const visualProps = this.options.visualProperties;
        
        if (visualProps.color) {
            material.color.setStyle(visualProps.color);
        }
        
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
        // CustomTerrain with type 'custom' and modelType 'js' have a hitboxMesh but are made of many children meshes
        if (this.hitboxMesh) {
            this.hitboxMesh.visible = visible;
        }
    }

    createHitbox(size = new THREE.Vector3(1, 1, 1), color = 0xffff00) {
        if (this.hitboxMesh) {
            this.mesh.remove(this.hitboxMesh);
        }

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

    createHitboxFromBounds(showIndividualParts = true) {
        // Remove existing hitbox visualization
        this.mesh.traverse((child) => {
            if (child.isHitboxVisualization) {
                if (child.parent) {
                    child.parent.remove(child);
                }
            }
        });
        
        if (!this.mesh) return;
        
        if (!showIndividualParts) {
            // Original full-model hitbox code
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            
            const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const hitboxMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                wireframe: true,
                transparent: true,
                opacity: 0.3,
                visible: this.options.showHitboxes
            });
            
            const hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitboxMesh.isHitboxVisualization = true;
            hitboxMesh.scale.copy(size);
            
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            
            // Calculate position relative to the mesh
            const worldCenter = center.clone();
            const localCenter = worldCenter.clone().sub(this.mesh.position);
            hitboxMesh.position.copy(localCenter);
            
            this.mesh.add(hitboxMesh);
        } else {
            // Individual part hitboxes
            this.mesh.traverse((child) => {
                if (child.isMesh && !child.isHitboxVisualization && child.geometry) {
                    // Create a bounding box for this part's geometry
                    child.geometry.computeBoundingBox();
                    const geometryBox = child.geometry.boundingBox.clone();
                    
                    // Calculate size
                    const size = new THREE.Vector3();
                    geometryBox.getSize(size);
                    
                    // Create wireframe box to represent hitbox
                    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
                    const boxMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00ff00, // Green for part hitboxes
                        wireframe: true,
                        transparent: true,
                        opacity: 0.3,
                        visible: this.options.showHitboxes
                    });
                    
                    const hitboxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
                    hitboxMesh.isHitboxVisualization = true;
                    hitboxMesh.scale.copy(size);
                    
                    // Center in local coordinates of the geometry
                    const center = new THREE.Vector3();
                    geometryBox.getCenter(center);
                    hitboxMesh.position.copy(center);
                    
                    // Add directly to the part
                    child.add(hitboxMesh);
                }
            });
        }
    }
} 