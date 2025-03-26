class CourseManager {
    constructor(scene) {
        this.scene = scene;
        this.currentCourse = null;
        this.prebuiltCourses = ['beginner', 'forest_valley', 'whispering_pines'];
    }

    async loadCourseFromJSON(courseData) {
        try {
            // Validate course data
            if (!this.validateCourseData(courseData)) {
                throw new Error('Invalid course data format');
            }

            // Convert course data to expected format
            const convertedCourseData = {
                id: courseData.course_id,
                name: courseData.name,
                metadata: courseData.metadata,
                courseSize: courseData.courseSize,
                holes: courseData.holes.map(hole => ({
                    number: hole.holeNumber,
                    par: hole.par,
                    description: hole.description,
                    basket: {
                        position: hole.basket.position || { x: 0, y: 0, z: 0 },
                        rotation: hole.basket.rotation || { x: 0, y: 0, z: 0 }
                    },
                    teeboxes: [{
                        position: hole.teeboxes[0].position || { x: 0, y: 0, z: 0 },
                        rotation: hole.teeboxes[0].rotation || { x: 0, y: 0, z: 0 },
                        type: hole.teeboxes[0].type || 'recreational'
                    }]
                }))
            };

            // Clear current course if it exists
            this.clearCurrentCourse();

            // Create new course instance
            this.currentCourse = new Course(this.scene, convertedCourseData);
            
            // Load terrain
            if (window.terrainManager) {
                window.terrainManager.clearTerrain(); // Ensure terrain is cleared first
                window.terrainManager.loadFromCourseData(courseData);
            }

            // Reset game state
            this.resetGameState();

            // Update UI with new hole count
            if (window.ui && this.currentCourse) {
                const totalHoles = this.currentCourse.holes.length;
                window.ui.updateHole(this.currentCourse.currentHoleIndex + 1, totalHoles);
            }

            return true;
        } catch (error) {
            console.error('Error loading course:', error);
            return false;
        }
    }

    async loadCourseFromFile(courseId) {
        try {
            // Use relative path from the current page location
            const response = await fetch(`./data/course/${courseId}.json`);
            if (!response.ok) {
                console.warn(`Failed to load course from ./data/course/, trying ../data/course/`);
                // Try alternative path as fallback
                const altResponse = await fetch(`../data/course/${courseId}.json`);
                if (!altResponse.ok) throw new Error(`Failed to load course: ${courseId}`);
                const courseData = await altResponse.json();
                return await this.loadCourseFromJSON(courseData);
            }
            const courseData = await response.json();
            return await this.loadCourseFromJSON(courseData);
        } catch (error) {
            console.error('Error loading course file:', error);
            return false;
        }
    }

    async loadCourseFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load course from URL: ${url}`);
            const courseData = await response.json();
            return await this.loadCourseFromJSON(courseData);
        } catch (error) {
            console.error('Error loading course from URL:', error);
            return false;
        }
    }

    validateCourseData(courseData) {
        // Basic validation - check required fields
        const requiredFields = ['course_id', 'name', 'metadata', 'courseSize', 'holes', 'terrain'];
        return requiredFields.every(field => courseData.hasOwnProperty(field));
    }

    getCurrentCourse() {
        return this.currentCourse;
    }

    getPrebuiltCourses() {
        return this.prebuiltCourses;
    }

    copyCourseToClipboard() {
        if (!this.currentCourse) return false;
        
        try {
            const courseData = {
                course_id: this.currentCourse.id,
                name: this.currentCourse.name,
                metadata: this.currentCourse.metadata,
                courseSize: this.currentCourse.courseSize,
                holes: this.currentCourse.holes.map(hole => hole.toJSON()),
                terrain: window.terrainManager ? window.terrainManager.toJSON() : []
            };

            const courseJSON = JSON.stringify(courseData, null, 2);
            navigator.clipboard.writeText(courseJSON);
            return true;
        } catch (error) {
            console.error('Error copying course data:', error);
            return false;
        }
    }

    async saveCourse() {
        if (!this.currentCourse) return false;

        try {
            const courseData = {
                course_id: this.currentCourse.id,
                name: this.currentCourse.name,
                metadata: this.currentCourse.metadata,
                courseSize: this.currentCourse.courseSize,
                holes: this.currentCourse.holes.map(hole => hole.toJSON()),
                terrain: window.terrainManager ? window.terrainManager.toJSON() : []
            };

            const response = await fetch(`./api/courses/${courseData.course_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            return response.ok;
        } catch (error) {
            console.error('Error saving course:', error);
            return false;
        }
    }

    clearCurrentCourse() {
        // Remove existing course objects from scene
        if (this.currentCourse) {
            this.currentCourse.holes.forEach(hole => {
                hole.remove();
            });
            this.currentCourse.teeboxes.forEach(teebox => {
                teebox.remove();
            });
        }

        // Clear terrain
        if (window.terrainManager) {
            window.terrainManager.clearTerrain();
        }

        this.currentCourse = null;
    }

    resetGameState() {
        // Reset course to first hole
        if (this.currentCourse) {
            this.currentCourse.currentHoleIndex = 0;
            
            // Get first hole position
            const firstHolePosition = this.currentCourse.getCurrentHolePosition();
            const teePosition = this.currentCourse.getCurrentTeeboxPosition();
            
            // Reset all players
            if (window.playerManager) {
                window.playerManager.resetPlayers();
                
                // Position players at first tee
                if (teePosition && firstHolePosition) {
                    window.playerManager.positionPlayersAtTeebox(teePosition, firstHolePosition, true);
                    
                    // Create initial disc for first player
                    const firstPlayer = window.playerManager.getCurrentPlayer();
                    if (firstPlayer && firstPlayer.bag) {
                        // Clean up any existing disc
                        if (window.gameState.currentDisc) {
                            window.gameState.currentDisc.remove();
                        }
                        // Create new disc for first player
                        const selectedDisc = firstPlayer.bag.getSelectedDisc();
                        window.gameState.currentDisc = new Disc(this.scene, selectedDisc);
                        window.gameState.currentDisc.setPosition(firstPlayer.position.clone().add(new THREE.Vector3(0, 1, 0)));
                        window.gameState.discInHand = true;
                    }
                }
            }
            
            // Update UI
            if (window.ui) {
                window.ui.updateHole(1, this.currentCourse.holes.length);
            }
        }

        // Reset camera
        if (window.cameraController && this.currentCourse) {
            const currentPlayer = window.playerManager.getCurrentPlayer();
            const firstHolePosition = this.currentCourse.getCurrentHolePosition();
            if (currentPlayer && firstHolePosition) {
                const holePos = new THREE.Vector3(
                    firstHolePosition.x,
                    firstHolePosition.y || 0,
                    firstHolePosition.z
                );
                window.cameraController.positionBehindPlayer(currentPlayer.position, holePos);
            }
        }

        // Reset UI elements
        const scoreElement = document.getElementById('score');
        const throwsElement = document.getElementById('throws');
        
        if (scoreElement) scoreElement.textContent = '0';
        if (throwsElement) throwsElement.textContent = '0';

        // Reset game state object
        window.gameState = {
            throwing: false,
            power: 0,
            powerIncreasing: true,
            discInHand: true
        };

        // Reinitialize portals
        if (window.portalManager) {
            window.portalManager.removeAllPortals();
            window.portalManager.initialize();
        }
    }
} 