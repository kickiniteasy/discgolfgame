class Sky {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            type: options.type || 'gradient',
            topColor: options.topColor || new THREE.Color(0x0077ff), // Sky blue
            bottomColor: options.bottomColor || new THREE.Color(0xffffff), // White
            sunPosition: options.sunPosition || new THREE.Vector3(100, 2, 0),
            intensity: options.intensity || 1.0
        };

        this.createSky();
    }

    createSky() {
        if (this.options.type === 'gradient') {
            this.createGradientSky();
        }
    }

    createGradientSky() {
        // Create a simple color gradient background
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0077ff'); // Sky blue at top
        gradient.addColorStop(1, '#ffffff'); // White at bottom

        // Fill with gradient
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2, 512);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Set scene background
        this.scene.background = texture;
    }

    setIntensity(value) {
        this.options.intensity = value;
    }

    setSunPosition(position) {
        this.options.sunPosition.copy(position);
    }

    dispose() {
        if (this.scene.background) {
            this.scene.background.dispose();
            this.scene.background = null;
        }
    }
} 