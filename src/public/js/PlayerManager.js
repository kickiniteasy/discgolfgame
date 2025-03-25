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
            'Bob',
            'Cindy',
            'Dave'
        ];
    }
    
    initializePlayers(username = 'You') {
        // Get saved color from localStorage or use default
        let playerColor = this.playerColors[0];
        const savedColor = localStorage.getItem('discGolfPlayerColor');
        if (savedColor) {
            // Parse the hex color string directly
            playerColor = parseInt(savedColor, 16);
        }

        // Create main player with user's name and saved color
        this.addPlayer(username, playerColor);
        
        // Add 3 AI players with unique names
        this.aiNames.forEach((name, index) => {
            this.addPlayer(name, this.playerColors[index + 1]);
        });
        
        // Position players at tee
        if (window.courseManager && window.courseManager.getCurrentCourse()) {
            const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
            const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
            this.positionPlayersAtTeebox(teePosition, holePosition);
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
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.setCurrentTurn(false);
        
        // If current player just completed the hole, position them behind next tee
        if (currentPlayer.hasCompletedHole && window.courseManager && window.courseManager.getCurrentCourse()) {
            // Peek at next hole's teebox position
            const nextHoleSuccess = window.courseManager.getCurrentCourse().nextHole();
            if (nextHoleSuccess) {
                // Get next hole positions
                const nextTeebox = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
                const nextHole = window.courseManager.getCurrentCourse().getCurrentHolePosition();
                
                // Go back to current hole
                window.courseManager.getCurrentCourse().currentHoleIndex--;
                
                // Calculate their position behind the next tee based on how many players have finished
                const completedCount = this.players.filter(p => p.hasCompletedHole).length;
                const backOffset = 2;
                const sideSpread = 0.6;
                const xPosition = nextTeebox.x + ((completedCount - 1) * sideSpread - sideSpread);
                const zPosition = nextTeebox.z + backOffset;
                
                currentPlayer.moveToPosition(new THREE.Vector3(
                    xPosition,
                    0.25, // Lower height for waiting players
                    zPosition
                ));
                
                // Rotate to face next hole
                if (nextHole) {
                    currentPlayer.rotateToFacePosition(new THREE.Vector3(
                        nextHole.x,
                        nextHole.y || 0,
                        nextHole.z
                    ));
                }
            }
        }
        
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
                    
                    // Reset to first player
                    this.currentPlayerIndex = 0;
                    
                    // Update hole number in UI
                    if (window.ui) {
                        window.ui.updateHole(window.courseManager.getCurrentCourse().currentHoleIndex + 1);
                    }
                    
                    // Make sure everyone is facing the new hole
                    const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
                    if (holePosition) {
                        this.players.forEach(player => {
                            player.rotateToFacePosition(new THREE.Vector3(
                                holePosition.x,
                                holePosition.y || 0,
                                holePosition.z
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
                    // Move other players back if they're somehow on the tee
                    this.players.forEach((player, index) => {
                        if (player !== nextPlayer && this.isPlayerOnTeebox(player, teePosition)) {
                            const backOffset = 2;
                            const sideSpread = 0.6;
                            const xPosition = teePosition.x + ((index - 1) * sideSpread - sideSpread);
                            const zPosition = teePosition.z + backOffset;
                            
                            player.moveToPosition(new THREE.Vector3(
                                xPosition,
                                0.25,
                                zPosition
                            ));
                        }
                    });
                    
                    // Move next player to tee
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
        
        // Create a new disc instance with the next player's selected disc
        if (window.gameState) {
            if (window.gameState.currentDisc) {
                window.gameState.currentDisc.remove();
            }
            const selectedDisc = nextPlayer.bag.getSelectedDisc();
            window.gameState.currentDisc = new Disc(this.scene, selectedDisc);
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
            // Update bag button style if BagUI exists
            if (window.ui.bagUI) {
                window.ui.bagUI.updateBagButtonStyle();
            }
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

    // Helper method to position players at teebox in a consistent formation
    positionPlayersAtTeebox(teePosition, holePosition, isNewHole = false) {
        if (!teePosition) return;

        const activePlayer = isNewHole ? this.players[0] : this.getCurrentPlayer();
        
        this.players.forEach((player, index) => {
            if (player === activePlayer) {
                // Active player stays on the tee
                player.moveToPosition(new THREE.Vector3(
                    teePosition.x,
                    0.5, // Standard height
                    teePosition.z
                ));
            } else {
                // Position other players in a relaxed formation behind the tee
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
            
            // Rotate player to face the hole if hole position is provided
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

    // Helper to check if a player is on the teebox
    isPlayerOnTeebox(player, teePosition) {
        const tolerance = 0.1; // Small distance tolerance
        return Math.abs(player.position.x - teePosition.x) < tolerance &&
               Math.abs(player.position.z - teePosition.z) < tolerance;
    }
} 