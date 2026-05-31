/**
 * A class that handles the placement and generation of the Tree objects and textures.
 */
class Background {
    /**
     * @param {Renderer} renderer - The renderer to save the tree textures to.
     * @param {number} seed - The seed used for random tree generation and placement.
     */
    constructor(renderer, seed) {
        // Declare graphic presets.
        this.backgroundGraphics = {
            treeRes: 250,
            treeLayers: 5,
            treeSpacing: 500,
            treeSize: 1000,
            treeGridSize: 6,
            leafVertCount: 100
        };

        // Create a new Random class with the given seed.
        this.randomGen = new Random(seed);

        // Generate the tree texture canvas and save it as a texture in the renderer.
        renderer.loadTextureFromCanvas(generateTree(this.backgroundGraphics.treeLayers, this.backgroundGraphics.treeRes, this.backgroundGraphics.leafVertCount, seed));

        // Initialize an array that will hold Tree objects.
        this.trees = [];

        // Trees will be placed in a grid with 80% random placement witin their grid position.
        let randomSpacing = this.backgroundGraphics.treeSpacing * 0.8;

        // Generate a grid of trees
        for (let i = 0; i < this.backgroundGraphics.treeGridSize; i++) {
            for (let j = 0; j < this.backgroundGraphics.treeGridSize; j++) {
                // Construct a Tree object and push it to the array.
                // Use i and j to determine the position in the grid, then add random spacing to make it look natural.
                // The size and number of layers are used from backgroundGraphics.
                // The tree seed is randomized using randomGen.
                this.trees.push(new Tree(i * this.backgroundGraphics.treeSpacing + this.randomGen.intRange(-randomSpacing / 2, randomSpacing / 2), j * this.backgroundGraphics.treeSpacing + this.randomGen.intRange(-randomSpacing / 2, randomSpacing / 2), this.backgroundGraphics.treeSize, this.backgroundGraphics.treeLayers, this.randomGen.intRange(0, 1000000000)));
            }
        }

        // The warp size is the size of the entire tree grid, including spacing.
        this.warpSize = this.backgroundGraphics.treeSpacing * this.backgroundGraphics.treeGridSize;
    }

    /**
     * Creates an infinite scrolling effect.
     * @param {Viewport} viewport - The viewport used to create the infinite scroll effect
     */
    update(viewport) {
        // Loop through each tree.
        this.trees.forEach(tree => {
            // If the tree is too far to the left.
            if (tree.x < viewport.x - this.warpSize / 2) {
                // Translate to the right side of the grid.
                tree.x += this.warpSize;
            }

            // If the tree is too far to the right.
            if (tree.x > viewport.x + this.warpSize / 2) {
                // Translate to the left side of the grid.
                tree.x -= this.warpSize;
            }

            // If the tree is too far down.
            if (tree.y < viewport.y - this.warpSize / 2) {
                // Translate to the top of the grid.
                tree.y += this.warpSize;
            }

            // If the tree is too far up.
            if (tree.y > viewport.y + this.warpSize / 2) {
                // Translate to the bottom of the grid.
                tree.y -= this.warpSize;
            }
        });
    }

    /**
     * Adds the background trees to the renderer draw call.
     * @param {Renderer} renderer - The renderer to add the draw call to.
     */
    render(renderer) {
        // Set the background to black
        renderer.setBackground([0, 0, 0, 1]);

        // Loop through all tree layer numbers.
        for (let i = 0; i < this.backgroundGraphics.treeLayers; i++) {
            // Loop through all trees.
            this.trees.forEach(tree => {
                // Render the current layer for the current tree.
                tree.renderLayer(renderer, i);
            });
        }
    }
}


/**
 * A class that handles the position, size, height and depth of a tree.
 */
class Tree {
    /**
     * @param {number} x - X-position of the tree.
     * @param {number} y - Y-position of the tree.
     * @param {number} size - Size of the tree.
     * @param {number} numLayers - Number of layer in the tree.
     * @param {number} seed - The seed used to generate the tree properties.
     */
    constructor(x, y, size, numLayers, seed) {
        // Create a Random class to generate the tree properties
        let randomGen = new Random(seed);

        // Initailize position.
        this.x = x;
        this.y = y;

        // Generate a random scale.
        let scale = randomGen.range(0.5, 1);

        // Initialize the size based on the random scale.
        this.sizeX = size * scale;
        this.sizeY = size * scale;

        // Initailize the number of layers
        this.numLayers = numLayers;

        // Randomize the depth of the starting tree layer.
        this.baseDepth = randomGen.range(0.25, 0.35);

        // Randomize the height of the tree.
        this.height = randomGen.range(0.1, 0.2);
    }

    /**
     * Add the tree layer to the renderer draw call.
     * @param {Renderer} renderer - The renderer to add the draw call to.
     * @param {number} layerIndex - The layer index to draw.
     */
    renderLayer(renderer, layerIndex) {
        // Draw the texture.
        renderer.drawTexture({
            // Position
            x: this.x,
            y: this.y,

            // Size
            width: this.sizeX,
            height: this.sizeY,

            // Depth calculated based on the height and layer index.
            depth: this.baseDepth + ((this.height * layerIndex) / (this.numLayers - 1)),

            // Textures are stored in a row. Each layer has a width of (1/this.numLayers) and a height of 1.
            // The starting texture coordinate. Can be accessed using the layer index.
            u: (1 / this.numLayers) * layerIndex,
            v: 0,

            // The width of the texture sample
            uWidth: (1 / this.numLayers),
            vHeight: 1
        });
    }
}