// Register all terrain types
Object.assign(Terrain.typeMap, {
    fairway: FairwayTerrain,
    rough: RoughTerrain,
    water: WaterTerrain,
    sand: SandTerrain,
    tree: TreeTerrain,
    bush: BushTerrain,
    rock: RockTerrain,
    path: PathTerrain,
    custom: CustomTerrain
}); 