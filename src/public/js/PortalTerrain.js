class PortalTerrain extends Terrain {
    static type = 'portal';

    async createMesh() {
        // Determine if this is an entry or exit portal
        const isEntry = this.options.properties.isEntry || false;
        
        // Use custom color if provided, otherwise use default red/green
        let color;
        if (this.options.visualProperties?.color) {
            // Handle both hex string and number formats
            if (typeof this.options.visualProperties.color === 'string') {
                color = new THREE.Color(this.options.visualProperties.color);
            } else {
                color = this.options.visualProperties.color;
            }
        } else {
            color = isEntry ? 0xff0000 : 0x00ff00; // Default: Red for entry, green for exit
        }
        
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
            side: THREE.DoubleSide,
            depthWrite: false,  // Prevent depth buffer issues
            blending: THREE.AdditiveBlending,  // Better blending for transparent surfaces
            alphaTest: 0.1  // Help with transparency sorting
        });
        this.inner = new THREE.Mesh(innerGeometry, innerMaterial);
        this.inner.position.z = 0.01;  // Slight offset to prevent z-fighting
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
            context.fillStyle = '#' + (typeof color === 'number' ? color.toString(16) : colorObj.getHexString()).padStart(6, '0');
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

        return true; // Indicate successful mesh creation
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

    handlePortalCollision() {
        const isEntry = this.options.properties.isEntry;
        
        if (isEntry && this.options.properties.ref) {
            window.location.href = this.options.properties.ref;
        } else if (!isEntry && this.options.properties.targetUrl) {
            // Exit portal - redirect with parameters
            const params = new URLSearchParams();
            params.append('portal', 'true');
            
            // Safely get player name
            const currentPlayer = window.playerManager?.getCurrentPlayer();
            const playerName = currentPlayer?.name || 'Player';
            params.append('username', playerName);
            
            // Safely get player color and convert to hex string
            let playerColor = '#ffffff';
            if (currentPlayer?.color) {
                // Handle both string and THREE.Color objects
                if (typeof currentPlayer.color === 'string') {
                    playerColor = currentPlayer.color;
                } else if (currentPlayer.color.isColor) {
                    playerColor = '#' + currentPlayer.color.getHexString();
                }
            }
            params.append('color', playerColor.replace('#', ''));
            
            params.append('ref', window.location.href);

            // Parse the target URL to handle existing query params and fragments
            const targetUrlObj = new URL(this.options.properties.targetUrl);
            
            // Get existing search params if any
            const existingParams = new URLSearchParams(targetUrlObj.search);
            
            // Merge our new params with existing ones
            for (const [key, value] of params) {
                existingParams.append(key, value);
            }
            
            // Reconstruct the URL with all parameters and any existing fragment
            targetUrlObj.search = existingParams.toString();
            window.location.href = targetUrlObj.toString();
        } else {
            console.warn('Portal collision but no valid ref/targetUrl found:', this.options.properties);
        }
    }
}

// Register with terrain system
if (!Terrain.typeMap) {
    Terrain.typeMap = {};
}
// Only register if not already registered
if (!Terrain.typeMap['portal']) {
    Terrain.typeMap['portal'] = PortalTerrain;
} 