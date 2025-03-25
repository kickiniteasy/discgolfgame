class PlayerManager {
    constructor(scene) {
        this.scene = scene;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.onPlayerChange = null; // Callback for player changes
        
        // Default player colors
        this.playerColors = [
            0x4CAF50, // Green
            0x2196F3, // Blue
            0xF44336, // Red
            0xFF9800  // Orange
        ];

        // AI player names
        this.aiNames = [
            'Cindy',
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
        
        // Position first player at tee, others slightly behind
        if (window.courseManager && window.courseManager.getCurrentCourse()) {
            const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
            const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
            
            if (teePosition) {
                this.players.forEach((player, index) => {
                    if (index === 0) {
                        // First player stays on the tee
                        player.moveToPosition(new THREE.Vector3(
                            teePosition.x,
                            0.5, // Standard height
                            teePosition.z
                        ));
                    } else {
                        // Position other players in a relaxed formation behind the tee
                        // They are lower to the ground as if sitting/crouching
                        const backOffset = 2; // Fixed distance behind the tee
                        const sideSpread = 0.6; // Gentler side spread
                        
                        // Spread players slightly side to side behind the tee
                        const xPosition = teePosition.x + ((index - 1) * sideSpread - sideSpread);
                        const zPosition = teePosition.z + backOffset;
                        
                        player.moveToPosition(new THREE.Vector3(
                            xPosition,
                            0.25, // Lower height to simulate sitting/crouching
                            zPosition
                        ));
                    }
                    
                    // Rotate player to face the hole
                    if (holePosition) {
                        const holePos = new THREE.Vector3(
                            holePosition.x,
                            holePosition.y || 0,
                            holePosition.z
                        );
                        player.rotateToFacePosition(holePos);
                    }
                });
            }
        }
        
        // Set first player as current and notify
        const firstPlayer = this.getCurrentPlayer();
        firstPlayer.setCurrentTurn(true);
        if (this.onPlayerChange) {
            this.onPlayerChange(firstPlayer);
        }
    }
    
    addPlayer(name, color) {
        const player = new Player(this.players.length, name, color);
        player.addToScene(this.scene);
        this.players.push(player);
        // Update the scoreboard whenever a player is added
        if (window.ui) {
            window.ui.updateScoreboard(this.getScorecard());
        }
        return player;
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    nextTurn() {
        // Remove current player highlight
        this.getCurrentPlayer().setCurrentTurn(false);
        
        // Check if all players have completed the hole
        const allPlayersCompleted = this.players.every(player => player.hasCompletedHole);
        if (allPlayersCompleted) {
            // Move to next hole or end game
            if (window.courseManager && window.courseManager.getCurrentCourse()) {
                const nextHoleSuccess = window.courseManager.getCurrentCourse().nextHole();
                if (nextHoleSuccess) {
                    // Reset all players for next hole
                    this.players.forEach(player => {
                        player.hasCompletedHole = false;
                        player.throws = 0;
                    });
                    // Update hole number in UI
                    if (window.ui) {
                        window.ui.updateHole(window.courseManager.getCurrentCourse().currentHoleIndex + 1);
                    }
                    // Position all players at the new tee
                    const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
                    if (teePosition) {
                        this.players.forEach((player, index) => {
                            player.moveToPosition(new THREE.Vector3(
                                teePosition.x,
                                0.5, // Fixed player height
                                teePosition.z + (index * 1)
                            ));
                        });
                    }
                } else {
                    // Game complete - show final scores and winner
                    const sortedPlayers = [...this.players].sort((a, b) => a.score - b.score);
                    const winner = sortedPlayers[0];
                    
                    // Update and show the game completion modal
                    const modal = document.getElementById('game-complete-modal');
                    const winnerDisplay = document.getElementById('winner-display');
                    const finalScoresDisplay = document.getElementById('final-scores');
                    const playAgainButton = document.getElementById('play-again-button');
                    
                    // Set winner text
                    winnerDisplay.textContent = `${winner.name} wins with a score of ${winner.score}!`;
                    
                    // Set final scores
                    finalScoresDisplay.innerHTML = sortedPlayers
                        .map((p, i) => `${i + 1}. ${p.name}: ${p.score}`)
                        .join('<br>');
                    
                    // Set up play again button
                    playAgainButton.onclick = () => window.location.reload();
                    
                    // Show the modal
                    modal.style.display = 'block';
                    
                    return; // End the game
                }
            }
        }
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Skip players who have completed the hole
        let checkedAllPlayers = false;
        const startIndex = this.currentPlayerIndex;
        while (this.players[this.currentPlayerIndex].hasCompletedHole && !checkedAllPlayers) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            if (this.currentPlayerIndex === startIndex) {
                checkedAllPlayers = true;
            }
        }
        
        // Get the new current player
        const nextPlayer = this.getCurrentPlayer();
        
        // Highlight new current player
        nextPlayer.setCurrentTurn(true);
        
        // Notify of player change
        if (this.onPlayerChange) {
            this.onPlayerChange(nextPlayer);
        }
        
        // Position player based on their state
        if (nextPlayer.throws === 0) {
            // First throw - position at tee
            if (window.courseManager && window.courseManager.getCurrentCourse()) {
                const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
                if (teePosition) {
                    nextPlayer.moveToPosition(new THREE.Vector3(
                        teePosition.x,
                        0.5,
                        teePosition.z
                    ));
                }
            }
        } else if (nextPlayer.lastDiscPosition) {
            // Not first throw - move to last disc position but maintain player height
            const discPos = nextPlayer.lastDiscPosition.clone();
            discPos.y = 0.5; // Keep player at consistent height above ground
            nextPlayer.moveToPosition(discPos);
        }
        
        // Update distance to hole
        if (window.courseManager && window.courseManager.getCurrentCourse() && window.ui) {
            const collision = window.courseManager.getCurrentCourse().checkDiscCollision(nextPlayer.position);
            window.ui.updateDistance(collision.distance);
        }
        
        // Position the disc at the player's position
        if (window.gameState && window.gameState.currentDisc) {
            window.gameState.currentDisc.setPosition(nextPlayer.position.clone().add(new THREE.Vector3(0, 1, 0)));
            window.gameState.discInHand = true;
        }
        
        // Update camera to focus on new current player
        if (window.cameraController) {
            window.cameraController.focusOnPlayer(nextPlayer);
        }

        // Update the scoreboard
        if (window.ui) {
            window.ui.updateScoreboard(this.getScorecard());
        }
        
        return nextPlayer;
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

    getScorecard() {
        return this.players.map(player => ({
            name: player.name,
            score: player.score,
            throws: player.throws,
            isCurrentTurn: player.isCurrentTurn,
            hasCompletedHole: player.hasCompletedHole,
            color: player.color
        }));
    }
} 