class Windmill {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = options;
        this.mesh = null;
        this.blades = null;
        this.parts = [];
    }

    async init() {
        await this.createMesh();
        if (this.mesh) {
            this.scene.add(this.mesh);
        }
        return true;
    }

    addPart(mesh) {
        this.parts.push(mesh);
        if (this.mesh) {
            this.mesh.add(mesh);
        }
    }

    async createMesh() {
        this.mesh = new THREE.Group();

        // Base
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2, 6, 8),
            new THREE.MeshStandardMaterial({ color: '#8b4513' })
        );
        base.position.y = 3;
        this.addPart(base);

        // Roof
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(1.7, 2, 8),
            new THREE.MeshStandardMaterial({ color: '#654321' })
        );
        roof.position.y = 7;
        this.addPart(roof);

        // Window
        const window = new THREE.Mesh(
            new THREE.CircleGeometry(0.5, 16),
            new THREE.MeshStandardMaterial({ 
                color: '#87ceeb',
                transparent: true,
                opacity: 0.7
            })
        );
        window.position.set(0, 4, 1.5);
        this.addPart(window);

        // Door
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 0.1),
            new THREE.MeshStandardMaterial({ color: '#654321' })
        );
        door.position.set(0, 1, 1.5);
        this.addPart(door);

        // Blade mount
        const mount = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16),
            new THREE.MeshStandardMaterial({ color: '#8b4513' })
        );
        mount.rotation.x = Math.PI / 2;
        mount.position.set(0, 5, 2);
        this.addPart(mount);

        // Blades
        this.blades = new THREE.Group();
        this.blades.position.copy(mount.position);

        // Create 4 blades
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 3, 0.1),
                new THREE.MeshStandardMaterial({ color: '#8b4513' })
            );
            blade.position.y = 1.5;
            blade.rotation.z = (i * Math.PI) / 2;
            this.blades.add(blade);
            this.addPart(blade);
        }

        this.mesh.add(this.blades);
        return true;
    }

    update(deltaTime) {
        if (this.blades) {
            const windSpeed = this.options.windSpeed || 1;
            this.blades.rotation.z += deltaTime * windSpeed;
        }
    }

    handleCollision(point) {
        const box = new THREE.Box3().setFromObject(this.mesh);
        return {
            collided: box.containsPoint(point),
            point: point.clone()
        };
    }

    cleanup() {
        // Remove all parts and dispose of geometries/materials
        this.parts.forEach(part => {
            if (part.geometry) {
                part.geometry.dispose();
            }
            if (part.material) {
                if (Array.isArray(part.material)) {
                    part.material.forEach(m => m.dispose());
                } else {
                    part.material.dispose();
                }
            }
        });

        // Remove main mesh from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }

        this.parts = [];
    }
}

export default Windmill; 