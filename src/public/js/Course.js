class Course {
    constructor(scene, courseData) {
        this.scene = scene;
        this.holes = [];
        this.teeboxes = [];
        this.currentHoleIndex = 0;
        this.name = courseData.name;
        this.par = courseData.par;
        
        this.initCourse(courseData.holes);
    }

    initCourse(holesData) {
        // Clear any existing holes and teeboxes
        this.holes.forEach(hole => hole.remove());
        this.teeboxes.forEach(teebox => teebox.remove());
        this.holes = [];
        this.teeboxes = [];

        // Create new holes and teeboxes
        holesData.forEach((holeData, index) => {
            const hole = new Hole(
                this.scene,
                { x: holeData.x, z: holeData.z },
                index + 1
            );
            this.holes.push(hole);

            // Create teebox 20 units away from hole in opposite direction
            const teeboxOffset = 20;
            const teeboxPosition = {
                x: holeData.teeX !== undefined ? holeData.teeX : holeData.x + teeboxOffset,
                z: holeData.teeZ !== undefined ? holeData.teeZ : holeData.z + teeboxOffset
            };
            
            const teebox = new Teebox(this.scene, teeboxPosition);
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
        return this.getCurrentHole().getPosition();
    }

    getCurrentTeeboxPosition() {
        return this.getCurrentTeebox().getPosition();
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

    // Check if a position is on the current teebox
    isOnCurrentTeebox(position) {
        return this.getCurrentTeebox().isOnTeebox(position);
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