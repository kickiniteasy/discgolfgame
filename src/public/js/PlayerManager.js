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
    
    // Helper method to convert various color formats to numeric color value
    parseColor(color) {
        if (!color) return this.playerColors[0];

        // If it's already a number, return it
        if (typeof color === 'number') return color;

        // Remove hash if present
        const colorString = color.replace('#', '');

        // Check if it's a valid hex color
        if (/^[0-9A-F]{6}$/i.test(colorString)) {
            return parseInt(colorString, 16);
        }

        // Try parsing as a CSS color name
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        
        // If it's a valid CSS color, ctx.fillStyle will be converted to hex
        if (ctx.fillStyle !== '#000000' || color.toLowerCase() === 'black') {
            // Remove the # and convert to number
            return parseInt(ctx.fillStyle.slice(1), 16);
        }

        // If all else fails, return default color
        return this.playerColors[0];
    }
    
    initializePlayers(defaultUsername = 'You') {
        // Check for portal parameters
        const urlParams = new URLSearchParams(window.location.search);
        const portalUsername = urlParams.get('username');
        const portalColor = urlParams.get('color');
        const fromPortal = urlParams.get('portal') === 'true';
        const refUrl = urlParams.get('ref');

        // Get saved color from localStorage or use portal color or default
        let playerColor = this.playerColors[0];
        if (portalColor) {
            // Parse the color from portal parameter
            playerColor = this.parseColor(portalColor);
        } else {
            const savedColor = localStorage.getItem('discGolfPlayerColor');
            if (savedColor) {
                playerColor = parseInt(savedColor, 16);
            }
        }

        // Create main player with portal name or default
        const username = portalUsername || defaultUsername;
        this.addPlayer(username, playerColor, 'human');
        
        // Get saved player count or default to 4
        const savedPlayerCount = parseInt(localStorage.getItem('discGolfPlayerCount')) || 4;
        const aiPlayerCount = Math.min(Math.max(savedPlayerCount - 1, 0), 3); // Ensure between 0 and 3 AI players
        
        // Load saved AI player data or use defaults
        const savedAIPlayers = JSON.parse(localStorage.getItem('discGolfAIPlayers') || '[]');
        
        // Add AI players with saved or default names/colors
        for (let i = 0; i < aiPlayerCount; i++) {
            const savedAIPlayer = savedAIPlayers[i];
            if (savedAIPlayer) {
                this.addPlayer(savedAIPlayer.name, parseInt(savedAIPlayer.color, 16), savedAIPlayer.type || 'ai');
            } else {
                this.addPlayer(this.aiNames[i], this.playerColors[i + 1], 'ai');
            }
        }
        
        // Position players at tee
        if (window.courseManager && window.courseManager.getCurrentCourse()) {
            const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
            const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
            this.positionPlayersAtTeebox(teePosition, holePosition);

            // If we came from a portal, create an entry portal behind the player
            if (fromPortal && refUrl && window.terrainManager) {
                const playerPos = this.getCurrentPlayer().position.clone();
                // Position portal further back behind player
                const portalPos = playerPos.clone().add(new THREE.Vector3(0, 0, -5)); // Changed from -2 to -5 units back
                
                // Create entry portal
                const portalOptions = {
                    position: portalPos,
                    rotation: new THREE.Vector3(0, 0, 0), // Face away from player
                    scale: new THREE.Vector3(1, 1, 1),
                    properties: {
                        isEntry: true,
                        ref: refUrl
                    }
                };
                
                window.terrainManager.addTerrain('portal', portalOptions);
            }
        }
        
        // Set first player as current and notify
        const firstPlayer = this.getCurrentPlayer();
        firstPlayer.setCurrentTurn(true);
        if (this.onPlayerChange) {
            this.onPlayerChange(firstPlayer);
        }

        // Set initial button outlines for first player
        if (window.ui) {
            const colorHex = firstPlayer.color.toString(16).padStart(6, '0');
            const playersButton = document.getElementById('players-button');
            if (playersButton) {
                playersButton.style.outline = `3px solid #${colorHex}`;
                playersButton.style.outlineOffset = '2px';
            }
            // Also update the bag button if BagUI exists
            if (window.ui.bagUI) {
                window.ui.bagUI.updateBagButtonStyle();
            }
            // Update scoreboard to ensure everything is in sync
            window.ui.updateScoreboard(this.getScorecard());
        }

        // Log portal parameters if they exist
        if (fromPortal) {
            console.log('Initialized player from portal:', {
                username: username,
                color: '#' + playerColor.toString(16).padStart(6, '0'),
                refUrl: refUrl
            });
        }
    }
    
    addPlayer(name, color, type = 'ai') {
        const player = new Player(this.players.length, name, color, type);
        player.addToScene(this.scene);
        this.players.push(player);

        // If we're adding a player mid-game, position them appropriately
        if (window.courseManager && window.courseManager.getCurrentCourse()) {
            const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
            const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
            
            // Position new player behind teebox with other non-active players
            const backOffset = 2;
            const sideSpread = 0.6;
            const xPosition = teePosition.x + ((this.players.length - 2) * sideSpread - sideSpread);
            const zPosition = teePosition.z + backOffset;
            
            player.moveToPosition(new THREE.Vector3(
                xPosition,
                0.5, // Base height when not on teebox
                zPosition
            ));

            // Make them face the hole
            if (holePosition) {
                player.rotateToFacePosition(new THREE.Vector3(
                    holePosition.x,
                    holePosition.y || 0,
                    holePosition.z
                ));
            }
        }

        // Update the scoreboard whenever a player is added
        if (window.ui) {
            window.ui.updateScoreboard(this.getScorecard());
        }
        
        // Save AI player data when adding a new player (except for first player)
        if (this.players.length > 1) {
            this.saveAIPlayerData();
            localStorage.setItem('discGolfPlayerCount', this.players.length.toString());
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
                    0.5, // Base height when not on teebox
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
                        const totalHoles = window.courseManager.getCurrentCourse().holes.length;
                        window.ui.updateHole(window.courseManager.getCurrentCourse().currentHoleIndex + 1, totalHoles);
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
                const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
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
                                0.5, // Base height when not on teebox
                                zPosition
                            ));
                        }
                    });
                    
                    // Move next player to tee
                    nextPlayer.moveToPosition(new THREE.Vector3(
                        teePosition.x,
                        0.7, // Position player above teebox (0.2 teebox height + 0.5 base height)
                        teePosition.z
                    ));

                    // Update distance to hole for new player at tee
                    if (holePosition && window.ui) {
                        const distance = Math.ceil(new THREE.Vector2(
                            holePosition.x - teePosition.x,
                            holePosition.z - teePosition.z
                        ).length());
                        window.ui.updateDistance(distance);
                    }
                }
            }
        } else if (nextPlayer.lastDiscPosition) {
            // Not first throw - move to last disc position but maintain player height
            const discPos = nextPlayer.lastDiscPosition.clone();
            discPos.y = 0.5; // Base height when not on teebox
            nextPlayer.moveToPosition(discPos);

            // Update distance from last disc position
            if (window.courseManager && window.courseManager.getCurrentCourse()) {
                const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
                if (holePosition && window.ui) {
                    const distance = Math.ceil(new THREE.Vector2(
                        holePosition.x - discPos.x,
                        holePosition.z - discPos.z
                    ).length());
                    window.ui.updateDistance(distance);
                }
            }
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
                0.5, // Base height when not on teebox
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
        
        // Calculate direction from tee to hole
        const teeToHole = new THREE.Vector2(
            holePosition.x - teePosition.x,
            holePosition.z - teePosition.z
        ).normalize();
        
        // Calculate the back direction (opposite of tee-to-hole)
        const backDirection = teeToHole.clone().multiplyScalar(-1);
        
        this.players.forEach((player, index) => {
            if (player === activePlayer) {
                // Active player stays on the tee
                player.moveToPosition(new THREE.Vector3(
                    teePosition.x,
                    0.7, // Position player above teebox (0.2 teebox height + 0.5 base height)
                    teePosition.z
                ));

                // Update initial distance to hole for active player
                if (holePosition && window.ui) {
                    const distance = Math.ceil(new THREE.Vector2(
                        holePosition.x - teePosition.x,
                        holePosition.z - teePosition.z
                    ).length());
                    window.ui.updateDistance(distance);
                }
            } else {
                // Position other players in a relaxed formation behind the tee
                const backOffset = 2; // Fixed distance behind the tee
                const sideSpread = 0.6; // Gentle side spread
                
                // Calculate position behind the tee based on direction to hole
                const xOffset = ((index - 1) * sideSpread - sideSpread);
                const xPosition = teePosition.x + (backDirection.x * backOffset) + xOffset;
                const zPosition = teePosition.z + (backDirection.y * backOffset);
                
                player.moveToPosition(new THREE.Vector3(
                    xPosition,
                    0.5, // Base height when not on teebox
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

    removePlayer(playerIndex) {
        if (playerIndex <= 0 || playerIndex >= this.players.length) return false; // Can't remove player 1 or invalid index
        
        const player = this.players[playerIndex];
        const wasCurrentPlayer = player.isCurrentTurn;
        
        // Remove player from scene
        player.removeFromScene(this.scene);
        
        // Remove player from array
        this.players.splice(playerIndex, 1);
        
        // Update player IDs
        this.players.forEach((p, idx) => p.id = idx);
        
        // Check if all remaining players have completed the hole
        const allPlayersCompleted = this.players.every(p => p.hasCompletedHole);
        
        // If all players have completed the hole, advance to next hole
        if (allPlayersCompleted && window.courseManager && window.courseManager.getCurrentCourse()) {
            const nextHoleSuccess = window.courseManager.getCurrentCourse().nextHole();
            if (nextHoleSuccess) {
                // Reset all players for next hole
                this.players.forEach(p => {
                    p.hasCompletedHole = false;
                    p.throws = 0;
                });
                
                // Reset to first player
                this.currentPlayerIndex = 0;
                const firstPlayer = this.getCurrentPlayer();
                firstPlayer.setCurrentTurn(true);
                
                // Update hole number in UI
                if (window.ui) {
                    const totalHoles = window.courseManager.getCurrentCourse().holes.length;
                    window.ui.updateHole(window.courseManager.getCurrentCourse().currentHoleIndex + 1, totalHoles);
                }
                
                // Position players at new teebox
                const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
                const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
                
                // Position first player at teebox
                firstPlayer.moveToPosition(new THREE.Vector3(
                    teePosition.x,
                    0.7, // Position player above teebox (0.2 teebox height + 0.5 base height)
                    teePosition.z
                ));
                
                // Make them face the hole
                if (holePosition) {
                    firstPlayer.rotateToFacePosition(new THREE.Vector3(
                        holePosition.x,
                        holePosition.y || 0,
                        holePosition.z
                    ));
                }
                
                // Create new disc for first player
                if (window.gameState) {
                    if (window.gameState.currentDisc) {
                        window.gameState.currentDisc.remove();
                    }
                    const selectedDisc = firstPlayer.bag.getSelectedDisc();
                    window.gameState.currentDisc = new Disc(this.scene, selectedDisc);
                    window.gameState.currentDisc.setPosition(firstPlayer.position.clone().add(new THREE.Vector3(0, 1, 0)));
                    window.gameState.discInHand = true;
                }
                
                // Update camera to focus on first player and new hole
                if (window.cameraController) {
                    window.cameraController.focusOnPlayer(firstPlayer);
                }
                
                // Update UI elements
                if (window.ui) {
                    const colorHex = firstPlayer.color.toString(16).padStart(6, '0');
                    const bagButton = document.getElementById('bag-button');
                    const playersButton = document.getElementById('players-button');
                    if (bagButton) {
                        bagButton.style.outline = `3px solid #${colorHex}`;
                        bagButton.style.outlineOffset = '2px';
                    }
                    if (playersButton) {
                        playersButton.style.outline = `3px solid #${colorHex}`;
                        playersButton.style.outlineOffset = '2px';
                    }
                    if (window.ui.bagUI) {
                        window.ui.bagUI.updateBagButtonStyle();
                    }
                    window.ui.updateScoreboard(this.getScorecard());
                }
                
                // Notify of player change
                if (this.onPlayerChange) {
                    this.onPlayerChange(firstPlayer);
                }
                
                // Save state
                localStorage.setItem('discGolfPlayerCount', this.players.length.toString());
                this.saveAIPlayerData();
                return true;
            }
        }
        
        // If it was the current player's turn, advance to next player
        if (wasCurrentPlayer) {
            // Adjust currentPlayerIndex if needed
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            }
            const nextPlayer = this.getCurrentPlayer();
            nextPlayer.setCurrentTurn(true);
            
            // Only reposition to teebox if:
            // 1. The removed player was at the teebox (throws === 0)
            // 2. The next player hasn't thrown yet (throws === 0)
            // 3. We have course information
            if (player.throws === 0 && nextPlayer.throws === 0 && 
                window.courseManager && window.courseManager.getCurrentCourse()) {
                const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
                const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
                
                // Move other players back if they're on the tee
                this.players.forEach((p, index) => {
                    if (p !== nextPlayer && this.isPlayerOnTeebox(p, teePosition)) {
                        const backOffset = 2;
                        const sideSpread = 0.6;
                        const xPosition = teePosition.x + ((index - 1) * sideSpread - sideSpread);
                        const zPosition = teePosition.z + backOffset;
                        
                        p.moveToPosition(new THREE.Vector3(
                            xPosition,
                            0.5, // Base height when not on teebox
                            zPosition
                        ));
                    }
                });
                
                // Position next player at teebox
                nextPlayer.moveToPosition(new THREE.Vector3(
                    teePosition.x,
                    0.7, // Position player above teebox (0.2 teebox height + 0.5 base height)
                    teePosition.z
                ));
                
                // Create new disc for next player
                if (window.gameState) {
                    if (window.gameState.currentDisc) {
                        window.gameState.currentDisc.remove();
                    }
                    const selectedDisc = nextPlayer.bag.getSelectedDisc();
                    window.gameState.currentDisc = new Disc(this.scene, selectedDisc);
                    window.gameState.currentDisc.setPosition(nextPlayer.position.clone().add(new THREE.Vector3(0, 1, 0)));
                    window.gameState.discInHand = true;
                }
                
                // Update distance to hole for new player
                if (holePosition && window.ui) {
                    const distance = Math.ceil(new THREE.Vector2(
                        holePosition.x - teePosition.x,
                        holePosition.z - teePosition.z
                    ).length());
                    window.ui.updateDistance(distance);
                }
            } else {
                // If not repositioning to teebox, just adjust height and create new disc
                const currentPos = nextPlayer.position.clone();
                currentPos.y = 0.5; // Base height when not on teebox
                nextPlayer.moveToPosition(currentPos);
                
                if (window.gameState) {
                    if (window.gameState.currentDisc) {
                        window.gameState.currentDisc.remove();
                    }
                    const selectedDisc = nextPlayer.bag.getSelectedDisc();
                    window.gameState.currentDisc = new Disc(this.scene, selectedDisc);
                    window.gameState.currentDisc.setPosition(nextPlayer.position.clone().add(new THREE.Vector3(0, 1, 0)));
                    window.gameState.discInHand = true;
                }
            }

            // Update button outlines for next player
            if (window.ui) {
                const colorHex = nextPlayer.color.toString(16).padStart(6, '0');
                const bagButton = document.getElementById('bag-button');
                const playersButton = document.getElementById('players-button');
                if (bagButton) {
                    bagButton.style.outline = `3px solid #${colorHex}`;
                    bagButton.style.outlineOffset = '2px';
                }
                if (playersButton) {
                    playersButton.style.outline = `3px solid #${colorHex}`;
                    playersButton.style.outlineOffset = '2px';
                }
                // Also update the bag button if BagUI exists
                if (window.ui.bagUI) {
                    window.ui.bagUI.updateBagButtonStyle();
                }
            }
            
            // Update camera to focus on new current player
            if (window.cameraController) {
                window.cameraController.focusOnPlayer(nextPlayer);
            }

            // Notify of player change
            if (this.onPlayerChange) {
                this.onPlayerChange(nextPlayer);
            }
        } else if (playerIndex < this.currentPlayerIndex) {
            // Adjust currentPlayerIndex if we removed a player before the current player
            this.currentPlayerIndex--;
        }
        
        // Save new player count and AI player data
        localStorage.setItem('discGolfPlayerCount', this.players.length.toString());
        this.saveAIPlayerData();
        
        return true;
    }

    // Helper method to save AI player data
    saveAIPlayerData() {
        // Skip player 1 (human player) and save the rest
        const aiPlayers = this.players.slice(1).map(player => ({
            name: player.name,
            color: player.color.toString(16).padStart(6, '0'),
            type: player.type
        }));
        localStorage.setItem('discGolfAIPlayers', JSON.stringify(aiPlayers));
    }

    resetPlayers() {
        // Reset all players to initial state
        this.players.forEach(player => {
            player.score = 0;
            player.throws = 0;
            player.hasCompletedHole = false;
            player.lastDiscPosition = null;
            player.setCurrentTurn(false);
        });

        // Reset current player index
        this.currentPlayerIndex = 0;
        
        // Set first player as current
        const firstPlayer = this.getCurrentPlayer();
        if (firstPlayer) {
            firstPlayer.setCurrentTurn(true);
        }

        // Position players at teebox if course is available
        if (window.courseManager && window.courseManager.getCurrentCourse()) {
            const teePosition = window.courseManager.getCurrentCourse().getCurrentTeeboxPosition();
            const holePosition = window.courseManager.getCurrentCourse().getCurrentHolePosition();
            if (teePosition && holePosition) {
                this.positionPlayersAtTeebox(teePosition, holePosition, true);
            }
        }

        // Update UI
        if (window.ui) {
            window.ui.updateScoreboard(this.getScorecard());
        }
    }
} 