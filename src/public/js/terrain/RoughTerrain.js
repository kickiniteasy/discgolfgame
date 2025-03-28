class RoughTerrain extends GroundTerrain {
    static type = 'rough';
    
    getDefaultColor() {
        return 0x355E3B;
    }
}

// Register the terrain type
Terrain.typeMap['rough'] = RoughTerrain; 