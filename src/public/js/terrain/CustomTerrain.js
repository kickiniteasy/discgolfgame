class CustomTerrain extends Terrain {
    static type = 'custom';

    constructor(scene, options = {}) {
        super(scene, options);
        this.modelUrl = options.properties?.modelUrl || '';
        this.modelType = this.getModelType(this.modelUrl);
        this.modelInstance = null;
    }

    getModelType(path) {
        if (!path) return '';
        const extension = path.split('.').pop().toLowerCase();
        return extension;
    }

    async createMesh() {
        // Create a temporary placeholder mesh while loading
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;

        if (!this.modelUrl) {
            console.warn('No modelUrl provided for custom terrain');
            return false;
        }

        try {
            switch (this.modelType) {
                case 'gltf':
                case 'glb':
                    await this.loadGLTFModel();
                    break;
                case 'js':
                    await this.loadJSModel();
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
                    console.warn(`Unsupported model type: ${this.modelType}`);
                    return false;
            }

            // Apply visual properties after loading
            if (this.options.properties?.visualProperties) {
                this.applyVisualProperties(this.mesh.material);
            }

            // Apply transform
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
        } catch (error) {
            console.error('Error loading model:', error);
            return false;
        }
    }

    async loadGLTFModel() {
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
            loader.load(this.modelUrl, resolve, undefined, reject);
        });

        // Remove the placeholder mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = gltf.scene;
        this.scene.add(this.mesh);

        // Handle animations if present
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.mesh);
            this.animations = gltf.animations;
            if (this.options.properties?.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadJSModel() {
        try {
            console.log('Loading JS model:', this.modelUrl);
            if (this.modelUrl.startsWith('./')) {
                this.modelUrl = this.modelUrl.replace('./', '../../');
            }

            const modelModule = await import(this.modelUrl);

            // Create an instance of the model
            console.log('modelModule:', modelModule.default);
            if (modelModule.default) {
                // Remove the placeholder mesh if it exists
                if (this.mesh) {
                    this.scene.remove(this.mesh);
                    this.mesh = null;
                }

                // Create and initialize the model instance
                this.modelInstance = new modelModule.default(this.scene, this.options);
                await this.modelInstance.init();
                console.log('modelInstance:', this.modelInstance);
                // Ensure we have the model's mesh
                if (!this.modelInstance.mesh) {
                    throw new Error('Model instance did not create a mesh');
                }

                // Store the mesh reference
                this.mesh = this.modelInstance.mesh;

                // Copy over any additional properties
                if (this.modelInstance.handleCollision) {
                    this.handleCollision = (point) => this.modelInstance.handleCollision(point);
                }
                if (this.modelInstance.animations) {
                    this.animations = this.modelInstance.animations;
                }
                if (this.modelInstance.mixer) {
                    this.mixer = this.modelInstance.mixer;
                }
            } else {
                throw new Error('Model module does not have a default export');
            }
        } catch (error) {
            console.error('Error loading JS model:', error);
            throw error;
        }
    }

    async loadOBJ() {
        const loader = new THREE.OBJLoader();

        if (this.modelUrl.endsWith('model.obj')) {
            const mtlUrl = this.modelUrl.replace('model.obj', 'materials.mtl');
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
                this.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = obj;
        this.scene.add(this.mesh);
    }

    async loadFBX() {
        const loader = new THREE.FBXLoader();
        const fbx = await new Promise((resolve, reject) => {
            loader.load(
                this.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = fbx;
        this.scene.add(this.mesh);

        if (fbx.animations && fbx.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.mesh);
            this.animations = fbx.animations;

            if (this.options.properties?.autoPlayAnimation) {
                const action = this.mixer.clipAction(this.animations[0]);
                action.play();
            }
        }
    }

    async loadSTL() {
        const loader = new THREE.STLLoader();
        const geometry = await new Promise((resolve, reject) => {
            loader.load(
                this.modelUrl,
                resolve,
                undefined,
                reject
            );
        });

        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });

        if (this.options.properties?.visualProperties) {
            this.applyVisualProperties(material);
        }

        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }

    // In CustomTerrain.js, update the removeFromScene method:

    removeFromScene() {
        // First handle JS model cleanup if it exists
        if (this.modelInstance) {
            // If the model has a cleanup method, use it
            if (typeof this.modelInstance.cleanup === 'function') {
                this.modelInstance.cleanup();
            } else {
                // If not, ensure we handle basic cleanup
                if (this.modelInstance.mesh) {
                    this.scene.remove(this.modelInstance.mesh);

                    // Recursively dispose of geometries and materials
                    this.modelInstance.mesh.traverse((child) => {
                        if (child.geometry) {
                            child.geometry.dispose();
                        }

                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(material => material.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    });
                }
            }

            // Explicitly disconnect the modelInstance
            this.modelInstance = null;
        }

        // Then call parent cleanup which will handle mesh removal
        super.removeFromScene();
    }

    // In CustomTerrain.js, update the update method:
    // In CustomTerrain.js, update the update method:
    update(deltaTime) {
        // First call the parent class update (handles mixers)
        super.update(deltaTime);

        // Then handle JS model updates if we have one
        // Important change: Don't check for animated property unless it's explicitly false
        if (this.modelInstance?.update && this.options.properties?.animated == true) {
            this.modelInstance.update(deltaTime);
        }
    }
}

// Register the terrain type
if (!Terrain.typeMap) {
    Terrain.typeMap = {};
}
Terrain.typeMap['custom'] = CustomTerrain; 