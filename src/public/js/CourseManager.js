class CourseManager {
    constructor(scene) {
        this.scene = scene;
        this.currentCourse = null;
        this.prebuiltCourses = ['beginner', 'forest_valley', 'honey_i_shrunk', 'meme_course', 'morley_field', 'whispering_pines'];
        // Use existing TerrainManager if available, otherwise create new one
        this.terrainManager = window.terrainManager || new TerrainManager(scene);
        // Ensure global terrainManager is set
        if (!window.terrainManager) {
            window.terrainManager = this.terrainManager;
        }
    }

    async loadCourseFromJSON(courseData) {
        try {
            // Validate course data
            if (!this.validateCourseData(courseData)) {
                throw new Error('Invalid course data format');
            }

            // Ensure we always use 'id' property (convert from course_id if needed)
            if (courseData.course_id && !courseData.id) {
                courseData.id = courseData.course_id;
            }

            // Clear current course if it exists
            this.clearCurrentCourse();

            // Create new course instance
            this.currentCourse = new Course(this.scene, courseData);
            
            // Show success message for course load
            ToasterMessage.success(`Now playing ${this.currentCourse.name}!`);
            
            // Update sky with new course size if it exists
            console.log("Load course from JSON:", window.sky, courseData.visualSettings);
            if (window.sky && courseData.courseSize) {
                window.sky.updateCourseSize(courseData.courseSize);
                this.applyVisualSettings(courseData.visualSettings);
            }
            
            // Load terrain if available
            if (courseData.terrain) {
                await this.terrainManager.loadFromCourseData(courseData);
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

    applyVisualSettings(visualSettings) {
        if (typeof window.sky !== 'undefined') {
            window.sky.applyVisualSettings(visualSettings);
        }
    }

    async loadCourseFromFile(courseId) {
        try {
            // Try loading from the new directory structure first
            const response = await fetch(`./data/course/${courseId}/course.json`);
            if (!response.ok) {
                console.warn(`Failed to load course from ./data/course/${courseId}/, trying ../data/course/${courseId}/`);
                // Try alternative path as fallback
                const altResponse = await fetch(`../data/course/${courseId}/course.json`);
                if (!altResponse.ok) throw new Error(`Failed to load course: ${courseId}`);
                const courseData = await altResponse.json();
                // Ensure course ID is set
                courseData.id = courseId;
                return await this.loadCourseFromJSON(courseData);
            }
            const courseData = await response.json();
            // Ensure course ID is set
            courseData.id = courseId;
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
        // Basic validation - must have a name and holes array
        if (!courseData.name || !Array.isArray(courseData.holes)) {
            return false;
        }

        // Must have either id or course_id
        if (!courseData.id && !courseData.course_id) {
            return false;
        }

        return true;
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

        // Clear terrain using TerrainManager's method
        if (this.terrainManager) {
            this.terrainManager.clearTerrain();
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

        // Reset game state object
        window.gameState = {
            throwing: false,
            power: 0,
            powerIncreasing: true,
            discInHand: true,
            showHitboxes: window.gameState?.showHitboxes || false
        };
    }

    clearCourse() {
        // Remove all terrain
        if (window.terrainManager) {
            window.terrainManager.clearTerrain();
        }

        // Remove all baskets
        this.baskets.forEach(basket => {
            if (basket.mesh) {
                this.scene.remove(basket.mesh);
            }
        });
        this.baskets = [];

        // Remove all teeboxes
        this.teeboxes.forEach(teebox => {
            if (teebox.mesh) {
                this.scene.remove(teebox.mesh);
            }
        });
        this.teeboxes = [];

        // Reset hole number
        window.gameState.currentHole = 1;
        this.updateUI();
    }
} 