class SettingsUI {
    constructor(playerManager) {
        this.playerManager = playerManager;
        this.courseManager = window.courseManager;
        
        // Cache DOM elements
        this.settingsButton = document.getElementById('settings-button');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeButton = this.settingsModal.querySelector('.close-button');
        this.settingsForm = document.getElementById('settings-form');
        
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

        // Form submission
        this.settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Color input preview
        const colorInput = document.getElementById('player-color');
        colorInput.addEventListener('input', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.playerManager.getCurrentPlayer().updateColor(color);
        });

        // Course management listeners
        this.courseSelect.addEventListener('change', () => this.handleCourseSelect());
        this.loadUrlButton.addEventListener('click', () => this.handleLoadCourseUrl());
        this.loadJsonButton.addEventListener('click', () => this.handleLoadCourseJson());
        this.copyCourseButton.addEventListener('click', () => this.handleCopyCourse());
        this.saveCourseButton.addEventListener('click', () => this.handleSaveCourse());
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
        const currentPlayer = this.playerManager.getCurrentPlayer();
        
        // Set current values
        document.getElementById('player-name').value = currentPlayer.name;
        document.getElementById('player-color').value = '#' + currentPlayer.color.toString(16).padStart(6, '0');
        
        this.settingsModal.style.display = 'block';
    }

    hideModal() {
        this.settingsModal.style.display = 'none';
        
        // Clear course inputs
        this.courseSelect.value = '';
        this.courseUrlInput.value = '';
        this.courseJsonInput.value = '';
    }

    saveSettings() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const newName = document.getElementById('player-name').value.trim();
        const newColor = parseInt(document.getElementById('player-color').value.substring(1), 16);

        if (newName) {
            currentPlayer.name = newName;
            localStorage.setItem('discGolfPlayerName', newName);
        }

        currentPlayer.updateColor(newColor);
        this.hideModal();
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