/**
 * A class that manages the position, rotation and zoom of the viewport.
 */
class Viewport {
	/**
	 * @param {number} x - The initial x-position of the viewport.
	 * @param {number} y - The initial y-position of the viewport.
	 */
	constructor(x, y) {
		// Initialize the viewport position.
		this.x = x;
		this.y = y;

		// Initial zoom is 1x.
		this.zoomFactor = 1;

		// Initial rotation is 0 radians.
		this.rotation = 0;

		// The viewport linearly interpolates its movement towards the player target values using these strength values.
		this.lerpStrengths = {
			// Quick centering of player on the screen.
			pos: 7.0,

			// Slow rotation of viewport.
			rot: 0.25,

			// Medium zoom of viewport.
			zoom: 1.1
		};
	}

	/**
	 * Updates the position, rotation and zoom of the viewport given a target player.
	 * @param {number} deltaTime - The time elapsed since the last frame in seconds.
	 * @param {Player} player - The player the viewport must follow.
	 */
	update(deltaTime, player) {
		// Use a natural exponent function to apply framerate independence to linear interpolation. A simple linear adjustment would not work here since linear interpolation moves based on percentage. 
		let lerpAmountPos = 1 - Math.exp(-this.lerpStrengths.pos * deltaTime);

		// Apply linear interpolation to the position.
		this.x += (player.x - this.x) * lerpAmountPos;
		this.y += (player.y - this.y) * lerpAmountPos;


		// Adjust strength for framerate independence.
		let lerpAmountRot = 1 - Math.exp(-this.lerpStrengths.rot * deltaTime);

		// Find the difference in rotations
		let diff = player.viewportTargetRotation - this.rotation;

		// Clamp the difference angle to a coterminal angle in the range of [-Math.PI, Math.PI]. This is to ensure the camera is taking the shortest path towards the target rotation.
		while (diff < -Math.PI) diff += Math.PI*2;
		while (diff > Math.PI) diff -= Math.PI*2;

		// Apply linear interpolation to the rotation.
		this.rotation += diff * lerpAmountRot;


		// Adjust strength for framerate independence.
		let lerpAmountZoom = 1 - Math.exp(-this.lerpStrengths.zoom * deltaTime);

		// Apply linear interpolation to the zoom.
		this.zoomFactor += (player.viewportTargetZoom - this.zoomFactor) * lerpAmountZoom;
	}
}