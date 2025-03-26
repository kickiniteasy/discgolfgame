class PortalTerrain extends Terrain {
    static type = 'portal';

    createMesh() {
        // Create portal group
        this.mesh = new THREE.Group();

        // Get portal-specific options
        const portalType = this.options.properties.portalType || 'exit';
        const color = portalType === 'exit' ? 0x00ff00 : 0xff0000;
        const label = this.options.properties.label || '';
        const targetUrl = this.options.properties.targetUrl || '';
        const ref = this.options.properties.ref || '';

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
            // Create particles in a ring around the portal
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.5 + (Math.random() - 0.5) * 0.2;
            positions[i] = Math.cos(angle) * radius;
            positions[i + 1] = Math.sin(angle) * radius;
            positions[i + 2] = (Math.random() - 0.5) * 0.2;

            // Set particle color
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

        // Add label if it's an exit portal
        if (portalType === 'exit' && label) {
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
            this.label = new THREE.Mesh(labelGeometry, labelMaterial);
            this.label.position.y = 2;
            this.mesh.add(this.label);
        }

        // Create hitbox
        const hitboxSize = new THREE.Vector3(2, 3, 1);
        const hitboxGeometry = new THREE.BoxGeometry(hitboxSize.x, hitboxSize.y, hitboxSize.z);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            visible: window.gameState?.showHitboxes || false
        });
        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.mesh.add(this.hitboxMesh);

        // Store portal properties
        this.portalType = portalType;
        this.targetUrl = targetUrl;
        this.ref = ref;
    }

    update(deltaTime) {
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

        // Pulse hitbox opacity if visible
        if (this.hitboxMesh && this.hitboxMesh.visible) {
            this.hitboxMesh.material.opacity = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
        }
    }

    checkDiscCollision(discPosition) {
        if (!this.hitboxMesh) return false;

        // Create collision box from hitbox
        const box = new THREE.Box3().setFromObject(this.hitboxMesh);
        const collided = box.containsPoint(discPosition);

        if (collided) {
            console.log('Portal collision detected:', this.portalType);
            this.handlePortalCollision(window.gameState?.currentDisc);
        }

        return collided;
    }

    handlePortalCollision(disc) {
        console.log('Handling portal collision:', {
            type: this.portalType,
            ref: this.ref,
            disc: disc
        });

        if (this.portalType === 'exit' && disc) {
            // Get portal parameters
            const params = this.getPortalParameters(disc);
            
            // Construct target URL
            const targetUrl = this.targetUrl || 'https://portal.pieter.com';
            const fullUrl = targetUrl + (params.toString() ? '?' + params.toString() : '');
            
            // Log full URL and parameters to console
            console.log('Portal URL:', {
                baseUrl: targetUrl,
                fullUrl: fullUrl,
                parameters: Object.fromEntries(params.entries()),
                discState: {
                    position: disc.position ? {
                        x: disc.position.x.toFixed(2),
                        y: disc.position.y.toFixed(2),
                        z: disc.position.z.toFixed(2)
                    } : null,
                    velocity: disc.velocity ? {
                        x: disc.velocity.x.toFixed(2),
                        y: disc.velocity.y.toFixed(2),
                        z: disc.velocity.z.toFixed(2)
                    } : null
                }
            });

            // Redirect to target URL
            window.location.href = fullUrl;

        } else if (this.portalType === 'entry' && this.ref) {
            console.log('Returning through portal to:', this.ref);
            window.location.href = this.ref;
        }
    }

    getPortalParameters(disc) {
        // Get current disc properties
        const velocity = disc?.velocity?.clone() || new THREE.Vector3();
        const speed = velocity.length();
        const currentParams = new URLSearchParams(window.location.search);
        const newParams = new URLSearchParams();

        // Log current player info
        console.log('Current Player:', {
            name: window.playerManager?.getCurrentPlayer()?.name || 'Player',
            color: window.playerManager?.getCurrentPlayer()?.color || 0xffffff,
            colorHex: (window.playerManager?.getCurrentPlayer()?.color || 0xffffff).toString(16)
        });

        // Log disc state
        console.log('Disc State:', {
            position: disc?.position ? {
                x: disc.position.x.toFixed(2),
                y: disc.position.y.toFixed(2),
                z: disc.position.z.toFixed(2)
            } : 'No position',
            velocity: {
                x: velocity.x.toFixed(2),
                y: velocity.y.toFixed(2),
                z: velocity.z.toFixed(2),
                speed: speed.toFixed(2)
            }
        });

        // Add and log each parameter
        const params = {
            portal: 'true',
            username: window.playerManager?.getCurrentPlayer()?.name || 'Player',
            color: (window.playerManager?.getCurrentPlayer()?.color || 0xffffff).toString(16),
            speed: speed.toFixed(2),
            speed_x: velocity.x.toFixed(2),
            speed_y: velocity.y.toFixed(2),
            speed_z: velocity.z.toFixed(2),
            ref: window.location.href
        };

        console.log('Portal Parameters:', {
            individual: params,
            existing: Object.fromEntries(currentParams.entries())
        });

        // Add parameters to URLSearchParams
        Object.entries(params).forEach(([key, value]) => {
            newParams.append(key, value);
            console.log(`Setting ${key}:`, value);
        });

        // Add any existing parameters that weren't overwritten
        for (const [key, value] of currentParams) {
            if (!newParams.has(key)) {
                newParams.append(key, value);
                console.log(`Keeping existing ${key}:`, value);
            }
        }

        // Log final URL parameters
        console.log('Final URL parameters:', newParams.toString());

        return newParams;
    }

    setHitboxVisibility(visible) {
        if (this.hitboxMesh) {
            this.hitboxMesh.visible = visible;
        }
    }
}

// Register PortalTerrain with Terrain's type map
Terrain.typeMap = Terrain.typeMap || {};
Terrain.typeMap['portal'] = PortalTerrain; 