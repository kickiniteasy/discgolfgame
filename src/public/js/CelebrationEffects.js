class CelebrationEffects {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.getObjectByProperty('type', 'PerspectiveCamera');
    }

    celebrate(player, strokesOverPar, onComplete) {
        // Set celebration state
        if (window.gameState) {
            window.gameState.celebrationInProgress = true;
        }

        const startY = player.position.y;
        const startTime = Date.now();
        const celebrationDuration = 2000;

        // Create particle systems for fireworks
        const particles = [];
        const colors = [0xFF0000, 0x00FF00, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFA500];

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / celebrationDuration;

            if (progress < 1) {
                if (strokesOverPar === -3) { // Hole in One!
                    // Dramatic double jump with rainbow fireworks
                    const jumpProgress = (progress * 2) % 1;
                    const jumpHeight = Math.sin(jumpProgress * Math.PI) * 3;
                    player.position.y = startY + jumpHeight;

                    // Create multicolor firework bursts
                    if (Math.random() < 0.3) {
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        this.createFireworkBurst(
                            player.position.clone().add(new THREE.Vector3(
                                (Math.random() - 0.5) * 4,
                                2 + Math.random() * 2,
                                (Math.random() - 0.5) * 4
                            )),
                            color,
                            15
                        );
                    }
                } else if (strokesOverPar <= -2) { // Eagle
                    // Single high jump with gold fireworks
                    const jumpHeight = Math.sin(progress * Math.PI) * 2;
                    player.position.y = startY + jumpHeight;

                    // Create gold firework bursts
                    if (Math.random() < 0.2) {
                        this.createFireworkBurst(
                            player.position.clone().add(new THREE.Vector3(
                                (Math.random() - 0.5) * 3,
                                2 + Math.random() * 2,
                                (Math.random() - 0.5) * 3
                            )),
                            0xFFD700, // Gold color
                            12
                        );
                    }
                } else if (strokesOverPar <= 0) { // Birdie or Par
                    // Happy hop with white fireworks
                    const jumpHeight = Math.sin(progress * Math.PI) * 1;
                    player.position.y = startY + jumpHeight;

                    // Create white firework bursts
                    if (Math.random() < 0.2) {
                        this.createFireworkBurst(
                            player.position.clone().add(new THREE.Vector3(
                                (Math.random() - 0.5) * 2,
                                1.5 + Math.random() * 1.5,
                                (Math.random() - 0.5) * 2
                            )),
                            0xFFFFFF, // White color
                            10
                        );
                    }
                } else { // Over par
                    // Single sad squish
                    const squishProgress = Math.sin(progress * Math.PI);
                    const squishFactor = 1 - squishProgress * 0.2;
                    player.model.scale.y = squishFactor;
                    player.model.scale.x = 1 + (1 - squishFactor) * 0.5;
                    player.model.scale.z = 1 + (1 - squishFactor) * 0.5;

                    // Create dark cloud
                    if (Math.random() < 0.1) {
                        const cloud = this.createCloud(0x666666);
                        cloud.position.copy(player.position).add(new THREE.Vector3(0, 1.5, 0));
                        this.scene.add(cloud);
                        particles.push({
                            mesh: cloud,
                            created: Date.now()
                        });
                    }
                }

                // Update all particles to face camera
                particles.forEach(p => this.billboardToCamera(p.mesh));

                // Clean up old particles
                const now = Date.now();
                for (let i = particles.length - 1; i >= 0; i--) {
                    if (now - particles[i].created > 800) {
                        this.scene.remove(particles[i].mesh);
                        particles.splice(i, 1);
                    }
                }

                requestAnimationFrame(animate);
            } else {
                // Reset player
                player.model.scale.set(1, 1, 1);
                player.position.y = startY;

                // Clean up remaining particles
                particles.forEach(p => this.scene.remove(p.mesh));
                particles.length = 0;

                // Reset celebration state
                if (window.gameState) {
                    window.gameState.celebrationInProgress = false;
                }

                // Call completion callback
                if (onComplete) onComplete();
            }
        };

        animate();
    }

    billboardToCamera(mesh) {
        if (!this.camera) return;
        
        // Make the mesh face the camera
        const meshPosition = mesh.position.clone();
        const cameraPosition = this.camera.position.clone();
        
        // Calculate direction to camera
        const direction = cameraPosition.sub(meshPosition);
        
        // Update mesh rotation to face camera
        mesh.lookAt(cameraPosition);
        
        // For stars and flat objects, rotate them to be perpendicular to view direction
        if (mesh.geometry instanceof THREE.BufferGeometry) {
            mesh.rotateX(Math.PI / 2);
        }
    }

    createFireworkBurst(position, color, particleCount) {
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createSparkle(color);
            const angle = (Math.random() * Math.PI * 2);
            const radius = 0.5 + Math.random() * 1.5;
            const speed = 0.05;
            
            particle.position.copy(position);
            this.scene.add(particle);

            // Animate particle
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < 1000) {
                    const progress = elapsed / 1000;
                    particle.position.x += Math.cos(angle) * speed;
                    particle.position.y += Math.sin(angle) * speed - (progress * 0.05); // Gravity effect
                    particle.position.z += (Math.random() - 0.5) * speed;
                    particle.material.opacity = 1 - progress;
                    
                    // Make particle face camera
                    this.billboardToCamera(particle);
                    
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(particle);
                }
            };
            animate();
        }
    }

    createSparkle(color) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        return new THREE.Mesh(geometry, material);
    }

    createStar(color) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const starPoints = 5;
        const innerRadius = 0.05;
        const outerRadius = 0.15;

        for (let i = 0; i < starPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (starPoints * 2)) * Math.PI * 2;
            vertices.push(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({ color: color });
        return new THREE.LineLoop(geometry, material);
    }

    createCloud(color) {
        const group = new THREE.Group();
        const sphereGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6
        });

        const positions = [
            [0, 0, 0],
            [-0.15, 0.1, 0],
            [0.15, 0.1, 0],
            [0, 0.15, 0]
        ];

        positions.forEach(pos => {
            const sphere = new THREE.Mesh(sphereGeometry, material);
            sphere.position.set(pos[0], pos[1], pos[2]);
            group.add(sphere);
        });

        return group;
    }
} 