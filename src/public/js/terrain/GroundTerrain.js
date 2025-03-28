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
            side: THREE.FrontSide,
            transparent: true,
            opacity: 1.0,
            depthWrite: true,
            depthTest: true,
            alphaTest: 0.01,
            flatShading: true
        });

        if (this.options.visualProperties?.color) {
            material.color.setStyle(this.options.visualProperties.color);
        }

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

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                const tileSize = textureSettings.tileSize || 5;
                const repeatX = this.options.shape.width / tileSize;
                const repeatY = this.options.shape.length / tileSize;
                texture.repeat.set(repeatX, repeatY);
                texture.rotation = textureSettings.rotation || 0;

                texture.anisotropy = 4;
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.encoding = THREE.sRGBEncoding;

                material.map = texture;

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

                    grayscaleMap.wrapS = grayscaleMap.wrapT = THREE.RepeatWrapping;
                    grayscaleMap.repeat.copy(texture.repeat);
                    grayscaleMap.rotation = textureSettings.rotation || 0;
                    material.normalMap = grayscaleMap;
                    material.normalScale = new THREE.Vector2(0.8, 0.8);
                } catch (error) {
                    console.debug(`No grayscale map found at ${grayscalePath}`);
                }
            } catch (error) {
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