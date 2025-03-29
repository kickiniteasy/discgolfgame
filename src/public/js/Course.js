class Course {
    constructor(scene, courseData) {
        if (!scene || !courseData) {
            throw new Error('Scene and course data are required');
        }

        this.scene = scene;
        this.holes = [];
        this.teeboxes = [];
        this.currentHoleIndex = 0;
        
        // Course metadata
        this.id = courseData.id;
        this.name = courseData.name;
        this.metadata = courseData.metadata || {};
        this.courseSize = courseData.courseSize || { width: 300, length: 400 };
        this.visualSettings = courseData.visualSettings || {};
        
        // Calculate total par from hole data
        this.holePars = courseData.holes.map(hole => hole.par);
        this.par = this.holePars.reduce((total, par) => total + par, 0);
        
        this.initCourse(courseData.holes);
        this.updateArrowVisibility(); // Show arrow for first hole
    }

    initCourse(holesData) {
        if (!Array.isArray(holesData)) {
            console.error('Invalid holes data:', holesData);
            return;
        }

        // Clear any existing holes and teeboxes
        this.holes.forEach(hole => hole.remove());
        this.teeboxes.forEach(teebox => teebox.remove());
        this.holes = [];
        this.teeboxes = [];

        // Create new holes and teeboxes
        holesData.forEach((holeData, index) => {
            if (!holeData.basket || !holeData.basket.position || !holeData.teebox) {
                console.error(`Invalid hole data for hole ${index + 1}:`, holeData);
                return;
            }

            const hole = new Hole(
                this.scene,
                { 
                    x: holeData.basket.position.x || 0, 
                    z: holeData.basket.position.z || 0 
                },
                index + 1
            );
            this.holes.push(hole);

            const teebox = new Teebox(
                this.scene, 
                {
                    x: holeData.teebox.position.x || 0,
                    z: holeData.teebox.position.z || 0
                },
                holeData.teebox.rotation || { x: 0, y: 0, z: 0 }
            );
            this.teeboxes.push(teebox);
        });
    }

    updateArrowVisibility() {
        // Hide all arrows first
        this.holes.forEach(hole => hole.hideArrow());
        // Show only current hole's arrow
        const currentHole = this.getCurrentHole();
        if (currentHole) {
            currentHole.showArrow();
        }
    }

    getCurrentHole() {
        return this.holes[this.currentHoleIndex];
    }

    getCurrentTeebox() {
        return this.teeboxes[this.currentHoleIndex];
    }

    getHoleNumber() {
        return this.currentHoleIndex + 1;
    }

    getCurrentHolePosition() {
        const hole = this.getCurrentHole();
        return hole ? hole.getPosition() : null;
    }

    getCurrentTeeboxPosition() {
        const teebox = this.getCurrentTeebox();
        return teebox ? teebox.getPosition() : null;
    }

    nextHole() {
        if (this.currentHoleIndex < this.holes.length - 1) {
            this.currentHoleIndex++;
            this.updateArrowVisibility(); // Update arrow visibility after changing holes
            return true;
        }
        return false; // No more holes
    }

    resetCourse() {
        this.currentHoleIndex = 0;
        this.updateArrowVisibility(); // Update arrow visibility after reset
    }

    checkDiscCollision(discPosition) {
        return this.getCurrentHole().checkDiscCollision(discPosition);
    }

    isOnCurrentTeebox(position) {
        return this.getCurrentTeebox().isOnTeebox(position);
    }

    getCurrentHolePar() {
        return this.holePars[this.currentHoleIndex];
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            metadata: this.metadata,
            courseSize: this.courseSize,
            holes: this.holes.map((hole, index) => ({
                holeNumber: index + 1,
                par: this.holePars[index],
                basket: {
                    position: hole.getPosition()
                },
                teebox: {
                    position: this.teeboxes[index].getPosition(),
                    rotation: { x: 0, y: 0, z: 0 }
                }
            }))
        };
    }

    // Static method to define available courses
    static getCourseList() {
        return [
            {
                id: 'beginner',
                name: 'Beginner Course',
                par: 9,
                holes: [
                    {
                        holeNumber: 1,
                        par: 3,
                        basket: {
                            position: { x: 0, z: -100 }
                        },
                        teebox: {
                            position: { x: 0, z: -80 },
                            rotation: { x: 0, y: 0, z: 0 }
                        }
                    },
                    {
                        holeNumber: 2,
                        par: 3,
                        basket: {
                            position: { x: 100, z: -50 }
                        },
                        teebox: {
                            position: { x: 80, z: -50 },
                            rotation: { x: 0, y: 0, z: 0 }
                        }
                    },
                    {
                        holeNumber: 3,
                        par: 3,
                        basket: {
                            position: { x: -80, z: -120 }
                        },
                        teebox: {
                            position: { x: -60, z: -120 },
                            rotation: { x: 0, y: 0, z: 0 }
                        }
                    }
                ]
            },
            {
                id: 'forest_valley',
                name: 'Forest Valley',
                par: 12,
                holes: [
                    {
                        holeNumber: 1,
                        par: 3,
                        basket: {
                            position: { x: 0, z: -150 }
                        },
                        teebox: {
                            position: { x: 0, z: -130 },
                            rotation: { x: 0, y: 0, z: 0 }
                        }
                    },
                    {
                        holeNumber: 2,
                        par: 3,
                        basket: {
                            position: { x: 120, z: -80 }
                        },
                        teebox: {
                            position: { x: 100, z: -80 },
                            rotation: { x: 0, y: 0, z: 0 }
                        }
                    },
                    {
                        holeNumber: 3,
                        par: 3,
                        basket: {
                            position: { x: -100, z: -200 }
                        },
                        teebox: {
                            position: { x: -80, z: -200 },
                            rotation: { x: 0, y: 0, z: 0 }
                        }
                    },
                    {
                        holeNumber: 4,
                        par: 3,
                        basket: {
                            position: { x: 50, z: -250 }
                        },
                        teebox: {
                            position: { x: 30, z: -250 },
                            rotation: { x: 0, y: 0, z: 0 }
                        }
                    }
                ]
            }
        ];
    }

    // Static method to get a specific course by ID
    static getCourseById(id) {
        return Course.getCourseList().find(course => course.id === id);
    }
} 