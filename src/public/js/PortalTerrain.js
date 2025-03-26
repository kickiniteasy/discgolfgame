class PortalTerrain extends Terrain {
    static type = 'portal';

    createMesh() {
        // Determine if this is an entry or exit portal
        const isEntry = this.options.properties.isEntry || false;
        const color = isEntry ? 0xff0000 : 0x00ff00; // Red for entry, green for exit
        
        // Create portal group
        this.mesh = new THREE.Group();

        // Create portal ring
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 16, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.mesh.add(ring);

        // Create portal inner surface
        const innerGeometry = new THREE.CircleGeometry(1.4, 32);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.inner = new THREE.Mesh(innerGeometry, innerMaterial);
        this.mesh.add(this.inner);

        // Create particle system
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorObj = new THREE.Color(color);
        for (let i = 0; i < particleCount * 3; i += 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.5 + (Math.random() - 0.5) * 0.2;
            positions[i] = Math.cos(angle) * radius;
            positions[i + 1] = Math.sin(angle) * radius;
            positions[i + 2] = (Math.random() - 0.5) * 0.2;

            colors[i] = colorObj.r;
            colors[i + 1] = colorObj.g;
            colors[i + 2] = colorObj.b;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(particles, particleMaterial);
        this.mesh.add(this.particles);

        // Add label for exit portals
        if (!isEntry) {
            const label = this.options.properties.label || 'VIBEVERSE PORTAL';
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512;
            canvas.height = 64;
            context.fillStyle = '#' + color.toString(16).padStart(6, '0');
            context.font = 'bold 32px Arial';
            context.textAlign = 'center';
            context.fillText(label, canvas.width/2, canvas.height/2);
            
            const texture = new THREE.CanvasTexture(canvas);
            const labelGeometry = new THREE.PlaneGeometry(3, 0.4);
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
            labelMesh.position.y = 2;
            this.mesh.add(labelMesh);
        }

        // Create hitbox
        const hitboxSize = new THREE.Vector3(2, 3, 1);
        const hitboxGeometry = new THREE.BoxGeometry(hitboxSize.x, hitboxSize.y, hitboxSize.z);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            visible: this.options.showHitboxes
        });
        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.mesh.add(this.hitboxMesh);
    }

    update() {
        // Animate particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += 0.005 * Math.sin(Date.now() * 0.001 + i);
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // Rotate inner portal slightly
        if (this.inner) {
            this.inner.rotation.z += 0.001;
        }
    }

    checkDiscCollision(disc) {
        if (!disc || !disc.isFlying || !this.hitboxMesh) return false;

        const box = new THREE.Box3().setFromObject(this.hitboxMesh);
        box.expandByScalar(0.5);

        if (box.containsPoint(disc.position)) {
            this.handlePortalCollision();
            return true;
        }

        return false;
    }

    handlePortalCollision() {
        const isEntry = this.options.properties.isEntry;
        if (isEntry && this.options.properties.ref) {
            // Entry portal - redirect to ref
            window.location.href = this.options.properties.ref;
        } else if (!isEntry && this.options.properties.targetUrl) {
            // Exit portal - redirect with parameters
            const params = new URLSearchParams();
            params.append('portal', 'true');
            params.append('username', window.playerManager?.getCurrentPlayer()?.name || 'Player');
            params.append('color', (window.playerManager?.getCurrentPlayer()?.color || '#ffffff').replace('#', ''));
            params.append('ref', window.location.href);
            window.location.href = this.options.properties.targetUrl + '?' + params.toString();
        }
    }
}

// Register with terrain system
Terrain.typeMap = Terrain.typeMap || {};
Terrain.typeMap['portal'] = PortalTerrain; 