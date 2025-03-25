class SettingsUI {
    constructor(playerManager) {
        this.playerManager = playerManager;
        this.courseManager = window.courseManager;
        
        // Cache DOM elements
        this.settingsButton = document.getElementById('settings-button');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeButton = this.settingsModal.querySelector('.close-button');
        this.playerSettingsList = document.getElementById('player-settings-list');
        this.savePlayersButton = document.getElementById('save-players-button');
        
        // Course management elements
        this.courseSelect = document.getElementById('course-select');
        this.courseUrlInput = document.getElementById('course-url');
        this.loadUrlButton = document.getElementById('load-course-url');
        this.courseJsonInput = document.getElementById('course-json');
        this.loadJsonButton = document.getElementById('load-course-json');
        this.copyCourseButton = document.getElementById('copy-course');
        this.saveCourseButton = document.getElementById('save-course');
        
        // Bind event listeners
        this.initializeEventListeners();
        this.initializeCourseSelect();
    }

    initializeEventListeners() {
        // Settings button
        this.settingsButton.addEventListener('click', () => this.showModal());
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.settingsModal.addEventListener('click', e => {
            if (e.target === this.settingsModal) this.hideModal();
        });

        // Tab switching
        this.tabButtons = this.settingsModal.querySelectorAll('.tab-button');
        this.tabs = this.settingsModal.querySelectorAll('.tab');
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Save players button
        this.savePlayersButton.addEventListener('click', () => {
            console.log('Save button clicked');
            this.savePlayerSettings();
        });

        // Course management listeners
        this.courseSelect.addEventListener('change', () => this.handleCourseSelect());
        this.loadUrlButton.addEventListener('click', () => this.handleLoadCourseUrl());
        this.loadJsonButton.addEventListener('click', () => this.handleLoadCourseJson());
        this.copyCourseButton.addEventListener('click', () => this.handleCopyCourse());
        this.saveCourseButton.addEventListener('click', () => this.handleSaveCourse());
    }

    validateTwitterHandle(name) {
        // Remove @ if present
        name = name.replace(/^@/, '');
        // Keep only alphanumeric and underscore characters
        name = name.replace(/[^a-zA-Z0-9_]/g, '');
        // Ensure it's no longer than 15 characters
        name = name.slice(0, 15);
        return name;
    }

    updatePlayersList() {
        if (!this.playerSettingsList) return;
        
        this.playerSettingsList.innerHTML = '';
        const players = this.playerManager.players;
        
        players.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = `player-settings-row${player.isCurrentTurn ? ' current' : ''}`;
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'name-input';
            nameInput.value = player.name;
            nameInput.placeholder = '@username';
            nameInput.title = 'Enter Twitter username (without @)';
            nameInput.spellcheck = false;
            nameInput.autocomplete = 'off';
            nameInput.dataset.playerIndex = index;
            
            // Add live validation for Twitter handle
            nameInput.addEventListener('input', (e) => {
                const validHandle = this.validateTwitterHandle(e.target.value);
                if (validHandle !== e.target.value) {
                    e.target.value = validHandle;
                }
            });
            
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = '#' + player.color.toString(16).padStart(6, '0');
            colorInput.title = 'Choose player color';
            colorInput.dataset.playerIndex = index;
            
            // Live color preview
            colorInput.addEventListener('input', (e) => {
                const color = parseInt(e.target.value.substring(1), 16);
                player.updateColor(color);
                row.style.borderColor = e.target.value;
                
                // If this is the main player, save the color immediately
                if (index === 0) {
                    localStorage.setItem('discGolfPlayerColor', e.target.value.substring(1));
                }
                
                // If this is the current player, update UI elements immediately
                if (player.isCurrentTurn) {
                    // Update button borders
                    const bagButton = document.getElementById('bag-button');
                    const playersButton = document.getElementById('players-button');
                    if (bagButton) {
                        bagButton.style.outline = `3px solid ${e.target.value}`;
                        bagButton.style.outlineOffset = '2px';
                    }
                    if (playersButton) {
                        playersButton.style.outline = `3px solid ${e.target.value}`;
                        playersButton.style.outlineOffset = '2px';
                    }
                }

                // Update scoreboard immediately
                if (window.ui) {
                    window.ui.updateScoreboard(this.playerManager.getScorecard());
                }
            });
            
            row.appendChild(nameInput);
            row.appendChild(colorInput);
            this.playerSettingsList.appendChild(row);
        });
    }

    savePlayerSettings() {
        console.log('savePlayerSettings called');
        const nameInputs = this.playerSettingsList.querySelectorAll('.name-input');
        const colorInputs = this.playerSettingsList.querySelectorAll('input[type="color"]');
        let anyChanges = false;
        
        nameInputs.forEach((input, i) => {
            const player = this.playerManager.players[i];
            const newName = this.validateTwitterHandle(input.value);
            if (newName && newName !== player.name) {
                player.name = newName;
                if (i === 0) { // If it's the main player
                    console.log('Saving name:', newName);
                    localStorage.setItem('discGolfPlayerName', newName);
                }
                anyChanges = true;
            }
        });
        
        colorInputs.forEach((input, i) => {
            const player = this.playerManager.players[i];
            const newColor = parseInt(input.value.substring(1), 16);
            console.log('Processing color input:', input.value, 'for player', i);
            if (newColor !== player.color) {
                player.updateColor(newColor);
                if (i === 0) { // If it's the main player
                    const colorToSave = input.value.substring(1);
                    console.log('Saving color to localStorage:', colorToSave);
                    localStorage.setItem('discGolfPlayerColor', colorToSave);
                    // Verify it was saved
                    const savedColor = localStorage.getItem('discGolfPlayerColor');
                    console.log('Immediately after saving, color in localStorage:', savedColor);
                }
                anyChanges = true;
            }
        });

        // Update all UI elements that show player information
        if (anyChanges) {
            // Update scoreboard
            if (window.ui) {
                window.ui.updateScoreboard(this.playerManager.getScorecard());
                
                // Update button borders for current player
                const currentPlayer = this.playerManager.getCurrentPlayer();
                if (currentPlayer) {
                    const colorHex = currentPlayer.color.toString(16).padStart(6, '0');
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
                }
            }

            // Update player models and labels in the game
            this.playerManager.players.forEach(player => {
                // Update the player's name label if it exists
                if (player.nameSprite) {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 256;
                    canvas.height = 64;
                    
                    // Set up text style
                    context.textAlign = 'center';
                    context.font = '24px Arial';
                    
                    // Measure text width for background
                    const textMetrics = context.measureText(player.name);
                    const textWidth = textMetrics.width;
                    const padding = 20;
                    const cornerRadius = 12;
                    
                    // Draw rounded rectangle background
                    const bgWidth = textWidth + padding * 2;
                    const bgHeight = 40;
                    const bgX = (canvas.width - bgWidth) / 2;
                    const bgY = (canvas.height - bgHeight) / 2;
                    
                    context.beginPath();
                    context.moveTo(bgX + cornerRadius, bgY);
                    context.lineTo(bgX + bgWidth - cornerRadius, bgY);
                    context.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + cornerRadius);
                    context.lineTo(bgX + bgWidth, bgY + bgHeight - cornerRadius);
                    context.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - cornerRadius, bgY + bgHeight);
                    context.lineTo(bgX + cornerRadius, bgY + bgHeight);
                    context.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - cornerRadius);
                    context.lineTo(bgX, bgY + cornerRadius);
                    context.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
                    context.closePath();
                    
                    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    context.fill();
                    
                    // Draw text
                    context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                    context.lineWidth = 3;
                    context.strokeText(player.name, canvas.width / 2, canvas.height / 2 + 2);
                    context.fillStyle = 'white';
                    context.fillText(player.name, canvas.width / 2, canvas.height / 2 + 2);
                    
                    // Update the sprite texture
                    player.nameSprite.material.map.dispose(); // Clean up old texture
                    player.nameSprite.material.map = new THREE.CanvasTexture(canvas);
                    player.nameSprite.material.needsUpdate = true;
                }
            });
        }
        
        this.hideModal();
        if (anyChanges) {
            this.showMessage('Player settings saved!', 'success');
        }
    }

    switchTab(tabId) {
        // Update tab buttons
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });

        // Update tab content
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabId}-tab`);
        });
    }

    initializeCourseSelect() {
        // Clear existing options except the first one
        while (this.courseSelect.options.length > 1) {
            this.courseSelect.remove(1);
        }

        // Add pre-built courses
        const prebuiltCourses = this.courseManager.getPrebuiltCourses();
        prebuiltCourses.forEach(courseId => {
            const option = document.createElement('option');
            option.value = courseId;
            option.textContent = courseId.charAt(0).toUpperCase() + courseId.slice(1).replace(/_/g, ' ');
            this.courseSelect.appendChild(option);
        });
    }

    async handleCourseSelect() {
        const courseId = this.courseSelect.value;
        if (!courseId) return;

        const success = await this.courseManager.loadCourseFromFile(courseId);
        if (success) {
            this.showMessage('Course loaded successfully!', 'success');
            this.hideModal();
        } else {
            this.showMessage('Failed to load course.', 'error');
        }
    }

    async handleLoadCourseUrl() {
        const url = this.courseUrlInput.value.trim();
        if (!url) {
            this.showMessage('Please enter a valid URL.', 'error');
            return;
        }

        const success = await this.courseManager.loadCourseFromURL(url);
        if (success) {
            this.showMessage('Course loaded successfully!', 'success');
            this.hideModal();
        } else {
            this.showMessage('Failed to load course from URL.', 'error');
        }
    }

    async handleLoadCourseJson() {
        const jsonText = this.courseJsonInput.value.trim();
        if (!jsonText) {
            this.showMessage('Please enter valid course JSON.', 'error');
            return;
        }

        const success = await this.courseManager.loadCourseFromJSON(jsonText);
        if (success) {
            this.showMessage('Course loaded successfully!', 'success');
            this.hideModal();
        } else {
            this.showMessage('Failed to load course from JSON.', 'error');
        }
    }

    handleCopyCourse() {
        const success = this.courseManager.copyCourseToClipboard();
        if (success) {
            this.showMessage('Course copied to clipboard!', 'success');
        } else {
            this.showMessage('Failed to copy course.', 'error');
        }
    }

    async handleSaveCourse() {
        const success = await this.courseManager.saveCourse();
        if (success) {
            this.showMessage('Course saved successfully!', 'success');
        } else {
            this.showMessage('Failed to save course.', 'error');
        }
    }

    showModal() {
        this.updatePlayersList();
        
        // Update version display
        const versionElement = document.getElementById('app-version');
        if (versionElement && window.APP_VERSION) {
            versionElement.textContent = window.APP_VERSION;
        }
        
        this.settingsModal.style.display = 'block';
    }

    hideModal() {
        this.settingsModal.style.display = 'none';
        
        // Clear course inputs
        this.courseSelect.value = '';
        this.courseUrlInput.value = '';
        this.courseJsonInput.value = '';
    }

    showMessage(message, type = 'info') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
} 