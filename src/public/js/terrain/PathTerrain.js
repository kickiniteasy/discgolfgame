class PathTerrain extends GroundTerrain {
    static type = 'path';
    
    getDefaultColor() {
        return 0x8B4513;
    }
}

// Register the terrain type
Terrain.typeMap['path'] = PathTerrain; 