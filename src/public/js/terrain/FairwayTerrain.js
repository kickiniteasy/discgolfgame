class FairwayTerrain extends GroundTerrain {
    static type = 'fairway';
    
    getDefaultColor() {
        return 0x90EE90;
    }
}

// Register the terrain type
Terrain.typeMap['fairway'] = FairwayTerrain; 