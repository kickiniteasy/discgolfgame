class Course {
    constructor(scene, courseData) {
        this.scene = scene;
        this.holes = [];
        this.currentHoleIndex = 0;
        this.name = courseData.name;
        this.par = courseData.par;
        
        this.initCourse(courseData.holes);
    }

    initCourse(holesData) {
        // Clear any existing holes
        this.holes.forEach(hole => hole.remove());
        this.holes = [];

        // Create new holes
        holesData.forEach((holeData, index) => {
            const hole = new Hole(
                this.scene,
                { x: holeData.x, z: holeData.z },
                index + 1
            );
            this.holes.push(hole);
        });
    }

    getCurrentHole() {
        return this.holes[this.currentHoleIndex];
    }

    getHoleNumber() {
        return this.currentHoleIndex + 1;
    }

    getTotalHoles() {
        return this.holes.length;
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

    // Static method to define available courses
    static getCourseList() {
        return [
            {
                id: 'beginner',
                name: 'Beginner Course',
                par: 9,
                holes: [
                    { x: 0, z: -100 },    // Hole 1
                    { x: 100, z: -50 },   // Hole 2
                    { x: -80, z: -120 }   // Hole 3
                ]
            },
            {
                id: 'intermediate',
                name: 'Forest Valley',
                par: 12,
                holes: [
                    { x: 0, z: -150 },    // Hole 1
                    { x: 120, z: -80 },   // Hole 2
                    { x: -100, z: -200 },  // Hole 3
                    { x: 50, z: -250 }    // Hole 4
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