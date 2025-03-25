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
        
        // Calculate total par from hole data
        this.holePars = courseData.holes.map(hole => hole.par);
        this.par = this.holePars.reduce((total, par) => total + par, 0);
        
        this.initCourse(courseData.holes);
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
            if (!holeData.basket || !holeData.basket.position || !holeData.teeboxes || !holeData.teeboxes[0]) {
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
                    x: holeData.teeboxes[0].position.x || 0,
                    z: holeData.teeboxes[0].position.z || 0
                }
            );
            this.teeboxes.push(teebox);
        });
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
            return true;
        }
        return false; // No more holes
    }

    resetCourse() {
        this.currentHoleIndex = 0;
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
                teeboxes: [{
                    position: this.teeboxes[index].getPosition(),
                    rotation: { x: 0, y: 0, z: 0 },
                    type: "recreational"
                }]
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
                    { x: 0, z: -100, teeX: 0, teeZ: -80 },    // Hole 1
                    { x: 100, z: -50, teeX: 80, teeZ: -50 },   // Hole 2
                    { x: -80, z: -120, teeX: -60, teeZ: -120 }   // Hole 3
                ]
            },
            {
                id: 'intermediate',
                name: 'Forest Valley',
                par: 12,
                holes: [
                    { x: 0, z: -150, teeX: 0, teeZ: -130 },    // Hole 1
                    { x: 120, z: -80, teeX: 100, teeZ: -80 },   // Hole 2
                    { x: -100, z: -200, teeX: -80, teeZ: -200 },  // Hole 3
                    { x: 50, z: -250, teeX: 30, teeZ: -250 }    // Hole 4
                ]
            }
            // Add more courses here
        ];
    }

    // Static method to get a specific course by ID
    static getCourseById(id) {
        return Course.getCourseList().find(course => course.id === id);
    }
} 