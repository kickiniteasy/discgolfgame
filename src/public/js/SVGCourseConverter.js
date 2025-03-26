class SVGCourseConverter {
    constructor() {
        // Tree scale mapping
        this.treeScales = {
            '#00ff00': { x: 3, y: 3, z: 3 },        // Single tree
            '#d9ead3': { x: 5, y: 3, z: 5 },        // Small wide tree
            '#b6d7a8': { x: 5, y: 5, z: 5 },        // Medium tree
            '#93c47d': { x: 8, y: 3, z: 8 },        // Wide tree cluster
            '#6aa84f': { x: 8, y: 5, z: 8 },        // Tall tree cluster
            '#38761d': { x: 12, y: 5, z: 12 },      // Small forest
            '#274e13': { x: 15, y: 8, z: 15 }       // Dense forest
        };
    }

    /**
     * Convert SVG content to a course JSON object
     * @param {string} svgContent - The SVG file content
     * @param {Object} options - Conversion options
     * @param {boolean} options.limitSize - Whether to limit course size to 500 units
     * @param {Object} options.metadata - Optional metadata to override defaults
     * @returns {Object} The converted course data
     */
    convertSVGToCourse(svgContent, options = {}) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        // Get SVG viewBox for course size
        const svgElement = svgDoc.querySelector('svg');
        const viewBox = svgElement.getAttribute('viewBox');
        let [, , width, height] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 1000, 1000];

        // Scale down if size limiting is enabled
        let scale = 1;
        if (options.limitSize && (width > 500 || height > 500)) {
            const maxDimension = Math.max(width, height);
            scale = 500 / maxDimension;
            width *= scale;
            height *= scale;
        }

        // Initialize course data
        const course = this._initializeCourseData(width, height, options.metadata);

        // Process SVG elements
        const { teeboxes, baskets, trees } = this._processElements(svgDoc, scale, width, height);

        // Create holes
        course.holes = this._createHoles(teeboxes, baskets);

        // Add terrain
        course.terrain = trees.map((tree, index) => ({
            id: `tree_${index}`,
            type: "tree",
            position: tree.position,
            scale: tree.scale
        }));

        return course;
    }

    /**
     * Initialize base course data
     * @private
     */
    _initializeCourseData(width, height, customMetadata = {}) {
        return {
            course_id: 'course_' + Math.random().toString(36).substr(2, 9),
            name: "Converted SVG Course",
            metadata: {
                description: "Course converted from SVG file",
                location: {
                    latitude: 0,
                    longitude: 0,
                    address: "Unknown"
                },
                difficulty: 3,
                source: "SVG Converter",
                author: "SVG Converter",
                version: "1.0.0",
                creationDate: new Date().toISOString(),
                ...customMetadata
            },
            courseSize: {
                width: width,
                length: height
            },
            holes: [],
            terrain: []
        };
    }

    /**
     * Process SVG elements and extract positions
     * @private
     */
    _processElements(svgDoc, scale, width, height) {
        const paths = svgDoc.querySelectorAll('path');
        const teeboxes = [];
        const baskets = [];
        const trees = [];

        paths.forEach(path => {
            const fill = path.getAttribute('fill')?.toLowerCase();
            const coords = this._extractFirstCoordinate(path.getAttribute('d'));
            if (!coords) return;

            const [svgX, svgZ] = coords;
            const x = (svgX * scale) - (width / 2);
            const z = (svgZ * scale) - (height / 2);

            if (fill === '#0000ff') {
                teeboxes.push({
                    position: { x, y: 0, z },
                    holeNumber: teeboxes.length + 1
                });
            } else if (fill === '#ffff00') {
                baskets.push({
                    position: { x, y: 0, z },
                    holeNumber: baskets.length + 1
                });
            } else if (fill in this.treeScales) {
                trees.push({
                    position: { x, y: 0, z },
                    scale: this.treeScales[fill]
                });
            }
        });

        return { teeboxes, baskets, trees };
    }

    /**
     * Create holes from teeboxes and baskets
     * @private
     */
    _createHoles(teeboxes, baskets) {
        const holes = [];
        
        for (let i = 0; i < Math.min(teeboxes.length, baskets.length); i++) {
            const teebox = teeboxes[i];
            const basket = baskets[i];
            
            const dx = basket.position.x - teebox.position.x;
            const dz = basket.position.z - teebox.position.z;
            const rotation = Math.atan2(dx, dz);
            
            holes.push({
                holeNumber: i + 1,
                par: 3,
                teebox: {
                    position: teebox.position,
                    rotation: { x: 0, y: rotation, z: 0 },
                    type: "recreational"
                },
                basket: {
                    position: basket.position
                },
                outOfBounds: [],
                fairway: {
                    shape: [
                        { x: teebox.position.x, z: teebox.position.z },
                        { x: basket.position.x, z: basket.position.z }
                    ],
                    width: 10
                }
            });
        }

        return holes;
    }

    /**
     * Extract first coordinate from SVG path data
     * @private
     */
    _extractFirstCoordinate(d) {
        if (!d) return null;
        
        const cleaned = d.trim().replace(/^[Mm]/, '').trim();
        const firstCoordPair = cleaned.split(/[A-Za-z]/, 1)[0].trim();
        
        const [x, z] = firstCoordPair.split(/[\s,]+/).map(Number);
        return [x, z];
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGCourseConverter;
} else if (typeof window !== 'undefined') {
    window.SVGCourseConverter = SVGCourseConverter;
} 