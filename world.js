/**
 * A high level class that manages the updates and rendering of all the elements in the game.
 */
class World {
    /**
     * @param {number} seed - The seed used to generate anything random in the game.
     */
    constructor(seed) {
        // Create a new Level at the origin. Pass the seed for random path generation.
        this.level = new Level(0, 0, seed);

        // Create a new Player at the origin. Pass the seed for generating random camera movements.
        this.player = new Player(0, 0, seed);

        // Create a new Viewport at the origin.
        this.mainViewport = new Viewport(0, 0);

        // Create a new Renderer using the opengl2 context.
        this.renderer = new Renderer(gl);

        // Create a new background. Pass the seed for random tree generation and placement.
        this.background = new Background(this.renderer, seed);
    }

    /**
     * Updates the state of all game elements.
     * Delta time is passed into an element only if the element needs to be framerate independent.
     * @param {number} deltaTime - The time elapsed since the last frame in seconds.
     */
    update(deltaTime) {
        // Pass the player into the level's update method so that the level can delete the paths that are too far away.
        this.level.update(this.player);

        // Pass the level into the player's update method so that the player can interact with the level and check for falling.
        this.player.update(deltaTime, this.level);

        // Pass the player into the viewport's update method so that the viewport can follow the player.
        this.mainViewport.update(deltaTime, this.player);

        // Pass the viewport into the background's update method so that the background can create the infinite scroll effect.
        this.background.update(this.mainViewport);

        // Pass the viewport into the renderer's update method so that the renderer can create the parallax effect.
        this.renderer.update(this.mainViewport);
    }

    /**
     * Renders all game elements and submits a draw call to the renderer.
     */
    render() {
        // Render the tree background first.
        this.background.render(this.renderer);

        // If the player has fallen off the path.
        if (this.player.depth < 0.8) {
            // Render player first.
            this.player.render(this.renderer);

            // Then layer the level on top
            this.level.render(this.renderer, this.player);

        // Player is still on path.
        } else {
            // Render the level first.
            this.level.render(this.renderer, this.player);

            // Then place the player on top.
            this.player.render(this.renderer);
        }

        // Submit the draw call to the renderer.
        this.renderer.render();
    }
}