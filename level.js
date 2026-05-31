/**
 * A class that manages all the level segments and interactive nodes.
 */
class Level {
    /**
     * @param {number} startX - The x-position the first segment starts at.
     * @param {number} startY - The y-position the first segment starts at.
     * @param {number} seed - The seed used for generating the random path.
     */
    constructor(startX, startY, seed) {
        // Initialize the path size.
        this.pathSize = 60;

        // Initialize an empty array to hold segments and interactive nodes.
        this.segments = [];
        this.actionNodes = [];

        // Initialize a Random object that will be used to generate a random path.
        this.randomGenerator = new Random(seed);

        // This represents the starting point for the next segment.
        this.lastX = startX;
        this.lastY = startY;

        // Initialize the current direction to 0 radians.
        this.currentDirection = 0;

        // Initialize the previous direction to 0 radians.
        this.prevDir = 0;
    }

    /**
     * Checks if a new segment intersects with any existing segments.
     * @param {number} x1 - X-position of the first point.
     * @param {number} y1 - Y-position of the first point.
     * @param {number} x2 - X-position of the second point.
     * @param {number} y2 - Y-position of the second point.
     * @returns {boolean} True if an intersection occurs.
     */
    checkIntersect(x1, y1, x2, y2) {
        // Precalculate values for intersection check.
        let B = (y2 - y1);
        let D = (x2 - x1);

        // Loop through all segments except the last one to check for intersection. Exclude the last one because the new segment always touches the last segment.
        for (let i = 0; i < this.segments.length - 1; i++) {
            // If any segment touches the new segment, exit the method and return true.
            if (this.segments[i].touchingSegment(x1, y1, x2, y2, B, D)) {
                return true;
            }
        }
        // If no segment is touching, return false.
        return false;
    }

    /**
     * Spawns a new segment and action node ahead of the current path.
     */
    spawnSegment() {
        let currentX;
        let currentY;

        // Attempt to find a non-intersecting segment direction up to 10 times.
        for (let i = 0; i < 10; i++) {
            let segmentLength;
            let segmentDirection;

            // Randomly choose to turn left or right.
            let side = this.randomGenerator.next() < 0.5 ? -1 : 1;

            // Generate a random direction based on the side.
            segmentDirection = side * this.randomGenerator.range(Math.PI / 4, Math.PI * (7 / 8));

            // Generate a random length using a logarithmic function.
            segmentLength = 150 - Math.log(1 - this.randomGenerator.next()) * 100;

            // Update current direction
            this.currentDirection += segmentDirection;

            // Calculate the end point of the new segment.
            currentX = this.lastX + Math.cos(this.currentDirection) * segmentLength;
            currentY = this.lastY + Math.sin(this.currentDirection) * segmentLength;

            // Exit early if the new path segment is not intersecting the path.
            if (!this.checkIntersect(this.lastX, this.lastY, currentX, currentY)) {
                break;
            } else {
                // Remove the last segment and node and backtrack.
                let lastSegment = this.segments.pop();
                let lastNode = this.actionNodes.pop();
                
                // Reset the position and rotation to previous node and segment.
                this.lastX = lastSegment.x1;
                this.lastY = lastSegment.y1;
                this.currentDirection = lastNode.direction;
            }
        }

        // Create a segment object with the randomly generated data.
        let segment = new Segment(this.lastX, this.lastY, currentX, currentY, this.pathSize);

        // Add the new segment to the segments array
        this.segments.push(segment);

        // Create a new action node at the start of the new segment with the correct direction.
        let actionNode = new ActionNode(this.lastX, this.lastY, this.currentDirection);

        // Add the new action node to the action nodes array.
        this.actionNodes.push(actionNode);

        // For the next segment spawn, set the last position to the current segment's end point.
        this.lastX = currentX;
        this.lastY = currentY;
    }

    /**
     * Finds the nearest unused action node and returns its direction.
     * @param {number} x - X-position to check from.
     * @param {number} y - Y-position to check from.
     * @returns {number} The direction of the closest action node.
     */
    getAction(x, y) {
        let nearestActionNode;
        let minDist = 99999999;

        // Loop through all action nodes to find the closest one that has not been used yet.
        for (let i = 0; i < this.actionNodes.length; i++) {
            // If the node is used, skip the iteration.
            if (this.actionNodes[i].used) {
                continue;
            }

            // Find the distance to the current node.
            let dist = distance([this.actionNodes[i].x, this.actionNodes[i].y], [x, y]);

            // If the current nod is the closest, update the answer.
            if (dist < minDist) {
                // Update minimum distance to the current distance.
                minDist = dist;

                // Update the nearest node to the current node.
                nearestActionNode = this.actionNodes[i];
            }
        }

        // Set the node state to used so it cannot be triggered again.
        nearestActionNode.used = true;

        // Return the nearest node's direction
        return nearestActionNode.direction;
    }

    /**
     * Manages removing old off-screen segments and generating new path segments.
     * @param {Player} player - The player used to check distances.
     */
    update(player) {
        // Delete the oldest segment and node if they move completely offscreen.
        if (this.segments.length > 0 && this.segments[0].isOffScreen(player)) {
            this.segments.shift();
            this.actionNodes.shift();
        }

        // Keep the segments array filled with atleast 50 segements.
        while (this.segments.length < 50) {
            this.spawnSegment();
        }
    }

    /**
     * Renders segments and nodes outward from the player's current position.
     * @param {Renderer} renderer - The game renderer.
     * @param {Player} player - The player.
     */
    render(renderer, player) {
        // Render everything if the game is over.
        if (gameOver) {
            this.segments.forEach((segment) => {
                segment.render(renderer)
            });
            this.actionNodes.forEach((node) => {
                node.render(renderer)
            });

            // Exit method since everything is rendered
            return;
        }

        // Find the index of the segment the player is currently on.
        let centerSegmentIndex = 0;

        // Loop through all segments.
        for (let i = 0; i < this.segments.length; i++) {
            // Use the precalcluted property from the player's onPath check to check if the player is on the segment.
            if (this.segments[i].playerOnSegment) {
                // Set the index and exit loop.
                centerSegmentIndex = i;
                break;
            }
        }

        // Render the segment the player is on.
        this.segments[centerSegmentIndex].render(renderer);

        // Loop backward from the center to render visible segments.
        let currentIndex = centerSegmentIndex;
        while (true) {
            currentIndex--;

            // If the segments run out or go offscreen, exit the loop.
            if (currentIndex == -1 || this.segments[currentIndex].isOffScreen(player)) {
                break;
            }

            // Render the current segment.
            this.segments[currentIndex].render(renderer);
        }

        // Loop forward from the center to render visible segments.
        currentIndex = centerSegmentIndex;
        while (true) {
            currentIndex++;

            // If the segments run out or go offscreen, exit the loop.
            if (currentIndex == this.segments.length || this.segments[currentIndex].isOffScreen(player)) {
                break;
            }

            // Render the current segment.
            this.segments[currentIndex].render(renderer);
        }

        // Render the center node.
        this.actionNodes[centerSegmentIndex].render(renderer);

        // Loop backward from the player to render visible action nodes.
        currentIndex = centerSegmentIndex;
        while (true) {
            currentIndex--;

            // If the nodes run out or go offscreen, exit the loop.
            if (currentIndex == -1 || this.segments[currentIndex].isOffScreen(player)) {
                break;
            }

            // Render the current node.
            this.actionNodes[currentIndex].render(renderer);
        }

        // Loop forward from the player to render visible action nodes.
        currentIndex = centerSegmentIndex;
        while (true) {
            currentIndex++;

            // If the nodes run out or go offscreen, exit the loop.
            if (currentIndex == this.segments.length || this.segments[currentIndex].isOffScreen(player)) {
                break;
            }

            // Render the current node.
            this.actionNodes[currentIndex].render(renderer);
        }
    }
}


/**
 * A class that handles individual segment properties and intersection math.
 */
class Segment {
    /**
     * @param {number} x1 - The starting x-position of the segment.
     * @param {number} y1 - The starting y-position of the segment.
     * @param {number} x2 - The ending x-position of the segment.
     * @param {number} y2 - The ending y-position of the segment.
     * @param {number} width - The width of the segment path.
     */
    constructor(x1, y1, x2, y2, width) {
        // Initialize the two segment points.
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        // Initialize segment width.
        this.width = width;

        // Pre-calculate values for intersection calculation.
        this.A = (this.x2 - this.x1);
        this.C = (this.y2 - this.y1);

        this.playerOnSegment = false;
    }

    /**
     * Checks if Segment is touching another segment.
     * @returns {boolean} True if lines cross within the allowed interval range.
     */
    touchingSegment(x1, y1, x2, y2, B, D) {
        // Calculate values for intersection math.
        let E = (this.y1 - y1);
        let F = (x1 - this.x1);

        // The intersection formula is derived by making four linear interpolation equations where a and b are the decimal percent of lerp from point 1 to point 2:
        // intersectX = this.x1 + (this.x2 - this.x1) * a
        // intersectY = this.y1 + (this.y2 - this.y1) * a
        // intersectX = x1 + (x2 - x1) * b
        // intersectY = y1 + (y2 - y1) * b

        // Set them equal:
        // this.x1 + (this.x2 - this.x1) * a = x1 + (x2 - x1) * b
        // this.y1 + (this.y2 - this.y1) * a = y1 + (y2 - y1) * b

        // Then, solve for a in terms of b -> Get two a=...
        // Set the two derived equations to each other and solve for b only in terms of the line segment coordinates.
        // Do this exact same process to solve for "a" only in terms of the line segment coordinates.
        // Simplify to find that the denominator for both the equations of a and b are the same. Set this to c.

        // A = (this.x2 - this.x1)
        // B = (y2 - y1)
        // C = (this.y2 - this.y1)
        // D = (x2 - x1)
        // E = (this.y1 - y1)
        // F = (x1 - this.x1)

        // c = A * B - C * D
        // a = (D * E + B * F) / c
        // b = (C * F + A * E) / c

        // If both a and b are in the interval (0, 1), an intersection has occured.

        let c = this.A * B - this.C * D;
        let a = (D * E + B * F) / c;
        let b = (this.C * F + this.A * E) / c;

        // Return true if both intersection values fall within the padded scale range. This is because the segments have a thickness too.
        return a >= -0.4 && a <= 1.4 && b >= -0.4 && b <= 1.4;
    }

    /**
     * Checks if the segment distance has gone above 1.5x the canvas width.
     * @param {Player} player - The player used for the distance.
     * @returns {boolean} True if the segment is far off-screen.
     */
    isOffScreen(player) {
        // Take the maximum absolute x difference and the maximum absolute y differnce to find the distance. This value should be above 1.5x the canvas width to be considered offscreen.
        return Math.hypot(Math.max(Math.abs(this.x1 - player.x), Math.abs(this.x2 - player.x)), Math.max(Math.abs(this.y1 - player.y), Math.abs(this.y2 - player.y))) > canvas.width * 1.5;
    }

    /**
     * Gets the closest point on this segment relative to a given coordinate. Formula sourced from Wikipedia.
     * @see {@link https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line}
     * @param {[number, number]} point - The point to check from.
     * @returns {[number, number]} The closest coordinates on the line segment.
     */
    getClosestPoint(point) {
        // Translate points so this.x1 and this.y1 is the origin.
        let pointX = point[0] - this.x1;
        let pointY = point[1] - this.y1;
        let lineDeltaX = this.x2 - this.x1;
        let lineDeltaY = this.y2 - this.y1;

        // Project point onto line segment.
        let t = (pointX * lineDeltaX + pointY * lineDeltaY) / (lineDeltaX * lineDeltaX + lineDeltaY * lineDeltaY);

        // Clamp the value to make sure the point doesn't extend past the segment ends.
        t = Math.max(0, Math.min(1, t));

        // Return the nearest point.
        return [this.x1 + t * lineDeltaX, this.y1 + t * lineDeltaY];
    }

    /**
     * Checks if a point is close enough to be considered touching the path.
     * @param {number} x - X-position of the point.
     * @param {number} y - Y-position of the point.
     * @returns {boolean} True if the distance is within the path width bounds.
     */
    touchingPlayer(x, y) {
        // Get the nearest point on the line from the point.
        let nearPoint = this.getClosestPoint([x, y]);

        // Get the nearest distance from the point to the line.
        let dist = distance(nearPoint, [x, y]);

        // Set the flag true if the player is within two-thirds of the path width.
        this.playerOnSegment = dist < this.width * (2 / 3);
        return this.playerOnSegment;
    }

    /**
     * Renders the segment line.
     * @param {Renderer} renderer - The renderer to add the draw call to.
     */
    render(renderer) {
        // Draw a white line with the correct position and thickness.
        renderer.drawLine({
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
            depth: 1,
            thickness: this.width,
            colour: [1, 1, 1, 1]
        });

        // Draw a circle at the start of the segment to make curved line corners.
        renderer.drawCircle({
            x: this.x1,
            y: this.y1,
            width: this.width,
            height: this.width,
            colour: [1, 1, 1, 1]
        });
    }
}


/**
 * A class for interactive turning nodes generated at the start of each segment.
 */
class ActionNode {
    /**
     * @param {number} x - The x-position of the node.
     * @param {number} y - The y-position of the node.
     * @param {number} direction - The turning direction in radians.
     */
    constructor(x, y, direction) {
        // Initialize the position of the node.
        this.x = x;
        this.y = y;

        // Initialize the direction of the node.
        this.direction = direction;

        // Initialize the node used to false.
        this.used = false;

        // Initialize the size to 40.
        this.size = 40;
    }

    /**
     * Checks if the node's distance from the player is greater than the canvas width.
     * @param {Player} player - The player reference.
     * @returns {boolean} True if the node is off-screen.
     */
    isOffScreen(player) {
        return distance([player.x, player.y], [this.x, this.y]) > canvas.width;
    }

    /**
     * Renders the node as either a green circle or grey circle
     * @param {Renderer} renderer - The renderer to add the draw call to.
     */
    render(renderer) {
        // Check if the node is not used.
        if (!this.used) {
            // Draw a dark green circle at the correct position and size.
            renderer.drawCircle({
                x: this.x,
                y: this.y,
                width: this.size,
                height: this.size,
                colour: [0, 0.5, 0, 1]
            });

            // The node is used.
        } else {
            // Draw a grey circle at the correct position and size.
            renderer.drawCircle({
                x: this.x,
                y: this.y,
                width: this.size,
                height: this.size,
                colour: [0.5, 0.5, 0.5, 1]
            });
        }
    }
}


/**
 * Helper function to find the absolute distance between two points.
 * @param {[number, number]} point1 - The first point array.
 * @param {[number, number]} point2 - The second point array.
 * @returns {number} The distance between point1 and point2.
 */
function distance(point1, point2) {
    // Unpack point1 into two variables.
    let [x1, y1] = point1;

    // Unpack point2 into two variables.
    let [x2, y2] = point2;

    // Return the distance between the two points.
    return Math.hypot(x1 - x2, y1 - y2);
}