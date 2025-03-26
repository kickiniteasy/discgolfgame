class PortalManager {
    constructor(scene) {
        this.scene = scene;
        this.portals = [];
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) {
            console.log('Portal manager already initialized');
            return;
        }
        this.initialized = true;

        // Check if we came from a portal
        const urlParams = new URLSearchParams(window.location.search);
        console.log('Checking portal parameters:', Object.fromEntries(urlParams));
        
        if (urlParams.get('portal') === 'true') {
            console.log('Portal entry detected');
            // Create entry portal based on ref parameter
            const ref = urlParams.get('ref');
            const username = urlParams.get('username');
            const color = urlParams.get('color');
            const speed = parseFloat(urlParams.get('speed'));
            const speedX = parseFloat(urlParams.get('speed_x'));
            const speedY = parseFloat(urlParams.get('speed_y'));
            const speedZ = parseFloat(urlParams.get('speed_z'));

            console.log('Portal parameters:', {
                ref, username, color, speed,
                velocity: { x: speedX, y: speedY, z: speedZ }
            });

            if (ref) {
                this.createEntryPortal(ref);
            }
        }

        // Create exit portal
        this.createExitPortal();
    }

    createEntryPortal(ref) {
        console.log('Creating entry portal with ref:', ref);
        // Create entry portal behind the first hole
        const course = window.courseManager.getCurrentCourse();
        if (!course) {
            console.warn('No course available for entry portal');
            return;
        }

        const holePosition = course.getCurrentHolePosition();
        if (!holePosition) {
            console.warn('No hole position for entry portal');
            return;
        }

        // Position portal behind and to the left of the hole
        const portalPosition = new THREE.Vector3(
            holePosition.x - 5, // 5 units to the left of hole
            1.5, // Floating above ground
            holePosition.z + 8 // 8 units behind hole
        );

        // Create entry portal
        const entryPortal = new PortalTerrain(this.scene, {
            position: portalPosition,
            rotation: new THREE.Vector3(0, Math.PI / 6, 0), // 30 degrees
            properties: {
                portalType: 'entry',
                ref: ref
            }
        });

        // Add portal mesh to scene
        if (entryPortal.mesh) {
            entryPortal.mesh.position.copy(portalPosition);
            entryPortal.mesh.rotation.setFromVector3(new THREE.Vector3(0, Math.PI / 6, 0));
            this.scene.add(entryPortal.mesh);
            console.log('Entry portal added to scene at position:', portalPosition);
        } else {
            console.warn('Entry portal mesh not created');
        }

        this.portals.push(entryPortal);
    }

    createExitPortal() {
        // Create exit portal near the current hole
        const course = window.courseManager.getCurrentCourse();
        if (!course) {
            console.warn('No course available for exit portal');
            return;
        }

        const holePosition = course.getCurrentHolePosition();
        if (!holePosition) {
            console.warn('No hole position for exit portal');
            return;
        }

        // Position portal behind and to the right of the hole
        const portalPosition = new THREE.Vector3(
            holePosition.x + 5, // 5 units to the right of hole
            1.5, // Floating above ground
            holePosition.z + 8 // 8 units behind hole
        );

        // Create exit portal
        const exitPortal = new PortalTerrain(this.scene, {
            position: portalPosition,
            rotation: new THREE.Vector3(0, -Math.PI / 6, 0), // -30 degrees
            properties: {
                portalType: 'exit',
                label: 'VIBEVERSE PORTAL'
            }
        });

        // Add portal mesh to scene
        if (exitPortal.mesh) {
            exitPortal.mesh.position.copy(portalPosition);
            exitPortal.mesh.rotation.setFromVector3(new THREE.Vector3(0, -Math.PI / 6, 0));
            this.scene.add(exitPortal.mesh);
            console.log('Exit portal added to scene at position:', portalPosition);
        } else {
            console.warn('Exit portal mesh not created');
        }

        this.portals.push(exitPortal);
    }

    checkPortalCollisions(disc) {
        if (!disc || !disc.isFlying) return;

        for (const portal of this.portals) {
            if (portal.checkDiscCollision(disc.position)) {
                return true;
            }
        }

        return false;
    }

    removeAllPortals() {
        for (const portal of this.portals) {
            if (portal.mesh) {
                this.scene.remove(portal.mesh);
                console.log('Removed portal from scene');
            }
        }
        this.portals = [];
    }
} 