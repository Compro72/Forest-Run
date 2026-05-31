/**
 * A class that manages the movement and rendering of the player.
 */
class Player {
	/**
	 * @param {number} x - The initial x-position of the viewport.
	 * @param {number} y - The initial y-position of the viewport.
	 * @param {number} seed - The seed for random viewport rotation and zoom.
	 */
	constructor(x, y, seed) {
		// Initialize position
		this.x = x;
		this.y = y;

		// Initialize depth and size
		this.depth = 1;
		this.size = 40;

		// Initialize the direction of movement
		this.dirX = 0;
		this.dirY = 0;

		// Initialize speed
		this.speed = 200;

		// A boolean that stores the spaceKey state from the previous frame.
		this.prevSpaceKey = false;

		// Initialize the viewport target rotation and zoom (reached by linear interpolation).
		this.viewportTargetRotation = 0;
		this.viewportTargetZoom = 1;

		// Create a Random object to randomize the viewport target rotation and zoom.
		this.randomCamMovement = new Random(seed);
	}

	/**
	 * Updates the player's position and depth. Also updates the gameOver state.
	 * @param {number} deltaTime - The time elapsed since the last frame in seconds.
	 * @param {Level} level - The current level.
	 */
	update(deltaTime, level) {
		// If the game is not over, do the game over check
		if (!gameOver) {
			// Default that the player is off the path
			let onPath = false;

			// Loop through all level segments to check if the player is on a path.
			for (let i = 0; i < level.segments.length; i++) {
				// Check if the current segment is touching the player.
				if (level.segments[i].touchingPlayer(this.x, this.y)) {
					onPath = true;

					// The player is on the path so exit the loop early.
					break;
				}
			}

			// If the player is not on the path, set the gameOver state to true.
			if (!onPath) {
				gameOver = true;

				// Update the UI to show the restart message.
				needsUiUpdate = true;
			}
		}

		// Update player movement based on the gameOver state. If the game is over, do the fall animation. If the game is not over, continue moving and interacting with the level.
		if (gameOver) {
			// Slow down the speed as the player falls.
			this.speed *= 0.95;

			// Update the player position based on the direction of movement and make this movement framerate independent by multiplying by the delta time.
			this.x += this.dirX * this.speed * deltaTime;
			this.y += this.dirY * this.speed * deltaTime;

			// Decrease the depth to show the player falling.
			this.depth *= 0.96;

		} else {
			// Update the player position based on the direction of movement and make this movement framerate independent by multiplying by the delta time.
			this.x += this.dirX * this.speed * deltaTime;
			this.y += this.dirY * this.speed * deltaTime;

			// This runs the first time the player presses the space key after not pressing it. It does not run when the space key is held.
			if (spaceKey && !this.prevSpaceKey) {
				// Get the direction of  movement from the level. This is the direction of the closest unused turning node.
				let direction = level.getAction(this.x, this.y);

				// Split the direction into an x and y component using cos and sin.
				this.dirX = Math.cos(direction);
				this.dirY = Math.sin(direction);

				// Increment the score.
				score++;

				// Generate a random target rotation within the range of [-Math.PI, Math.PI).
				this.viewportTargetRotation = this.randomCamMovement.range(-Math.PI, Math.PI);

				// Generate a random target zoom within the range of [0.8, 1.3).
				this.viewportTargetZoom = this.randomCamMovement.range(0.8, 1.3);
			}

			// This function scales speed based on the current score. A reciprocal function is used to create and asymptote at speed=500 and a sin wave is used to create some variance. The range is [200, 510).
			this.speed = -(1 / (0.00005 * score + (1 / 300))) + 500 + 10 * Math.sin(0.1 * score);

			// Store this frame's spaceKey state to be used in the next frame.
			this.prevSpaceKey = spaceKey;
		}
	}

	/**
	 * Adds the player to the renderer draw call.
	 * @param {Renderer} renderer - The renderer to add the draw call to.
	 */
	render(renderer) {
		// Draw a red circle at using the player's position, size and depth.
		renderer.drawCircle({
			x: this.x,
			y: this.y,
			width: this.size,
			height: this.size,
			depth: this.depth,
			colour: [1, 0, 0, 1]
		})
	}
}