class CustomTerrain extends Terrain {
    static type = 'custom';
    
    constructor(scene, options = {}) {
        super(scene, options);
        this.modelPath = options.modelPath || '';
        this.modelType = this.getModelType(this.modelPath);
        this.modelInstance = null;
    }

    getModelType(path) {
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

        try {
            switch (this.modelType) {
                case 'gltf':
                case 'glb':
                    await this.loadGLTFModel();
                    break;
                case 'js':
                    await this.loadJSModel();
                    break;
                default:
                    console.warn(`Unsupported model type: ${this.modelType}`);
                    return false;
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
            loader.load(this.modelPath, resolve, undefined, reject);
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
            // Play the first animation by default
            const action = this.mixer.clipAction(this.animations[0]);
            action.play();
        }
    }

    async loadJSModel() {
        try {
            console.log('Loading JS model:', this.modelPath);
            // Import the model module dynamically
            const modelModule = await import(this.modelPath);
            
            // Create an instance of the model
            if (modelModule.default) {
                this.modelInstance = new modelModule.default(this.scene, this.options);
                await this.modelInstance.init();

                // Remove the placeholder mesh
                if (this.mesh) {
                    this.scene.remove(this.mesh);
                }

                // Use the model's mesh
                this.mesh = this.modelInstance.mesh;
                this.scene.add(this.mesh);

                // Copy over any additional properties or methods
                if (this.modelInstance.update) {
                    this.update = (deltaTime) => this.modelInstance.update(deltaTime);
                }
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

    update(deltaTime) {
        super.update(deltaTime);
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}

// Register the terrain type
if (!Terrain.typeMap) {
    Terrain.typeMap = {};
}
Terrain.typeMap['custom'] = CustomTerrain; 