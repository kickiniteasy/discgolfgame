class SandTerrain extends GroundTerrain {
    static type = 'sand';
    
    getDefaultColor() {
        return 0xc2b280;
    }
}

// Register the terrain type
Terrain.typeMap['sand'] = SandTerrain; 