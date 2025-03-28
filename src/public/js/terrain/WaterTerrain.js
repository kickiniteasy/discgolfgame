class WaterTerrain extends GroundTerrain {
    static type = 'water';
    
    getDefaultColor() {
        return 0x4169E1;
    }

    async createMaterial(textureSettings) {
        const material = await super.createMaterial(textureSettings);
        material.transparent = true;
        material.opacity = this.options.visualProperties?.opacity || 0.8;
        return material;
    }
}

// Register the terrain type
Terrain.typeMap['water'] = WaterTerrain; 