class PlayerManager {
    constructor(scene) {
        this.scene = scene;
        this.players = [];
        this.currentPlayerIndex = 0;
        
        // Default player colors
        this.playerColors = [
            0x4CAF50, // Green
            0x2196F3, // Blue
            0xF44336, // Red
            0xFF9800  // Orange
        ];

        // AI player names
        this.aiNames = [
            'Sarah',
            'Mike',
            'Alex'
        ];
    }
    
    initializePlayers(username = 'You') {
        // Create main player with user's name
        this.addPlayer(username, this.playerColors[0]);
        
        // Add 3 AI players with unique names
        this.aiNames.forEach((name, index) => {
            this.addPlayer(name, this.playerColors[index + 1]);
        });
        
        // Set first player as current
        this.getCurrentPlayer().setCurrentTurn(true);
    }
    
    addPlayer(name, color) {
        const player = new Player(this.players.length, name, color);
        player.addToScene(this.scene);
        this.players.push(player);
        return player;
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    nextTurn() {
        // Remove current player highlight
        this.getCurrentPlayer().setCurrentTurn(false);
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Highlight new current player
        this.getCurrentPlayer().setCurrentTurn(true);
        
        return this.getCurrentPlayer();
    }
    
    resetPlayerPositions() {
        const spacing = 1; // Space between players
        const startX = -((this.players.length - 1) * spacing) / 2;
        
        this.players.forEach((player, index) => {
            player.moveToPosition(new THREE.Vector3(
                startX + (index * spacing),
                0.5,
                0
            ));
        });
    }
    
    updateScores() {
        return this.players.map(player => ({
            name: player.name,
            score: player.score,
            throws: player.throws
        }));
    }
    
    getPlayerById(id) {
        return this.players.find(player => player.id === id);
    }
} 