/**
 * Draws a single leaf given all the settings.
 * @param {CanvasRenderingContext2D} tempCtx - The temporary context to draw on.
 * @param {number} progress - A value from 0 to 1 that represents how far up the tree the current layer is.
 * @param {string} colourBase - The base colour of the leaf.
 * @param {string} colourHighlight - The highlight colour of the leaf.
 * @param {number} canvasLayerSize - The size of one layer on the canvas.
 * @param {number} layerIndex - The current layer number.
 * @param {number} leafVertCount - The number of vertices per leaf.
 * @param {number} seed - The seed used to generate the leaf transformations.
 */
function drawLeaf(tempCtx, progress, colourBase, colourHighlight, canvasLayerSize, layerIndex, leafVertCount, seed) {
    // Create a new Random object based on the seed.
    let randomGen = new Random(seed);

    // Generate a random angle.
    let angle = randomGen.next() * Math.PI * 2;

    // Generate a random distance from the center. Further away for bottom layers.
    let distance = randomGen.range(0, -62 * progress + 62);

    // Translate to the correct layer area and center of that layer area.
    let canvasOffsetX = canvasLayerSize * (layerIndex + 0.5);

    // Translate to the y-center.
    let canvasOffsetY = canvasLayerSize * 0.5;

    // Get the placement of the leaf using polar coordiantes. Add the canvas offsets.
    let x = Math.cos(angle) * distance + canvasOffsetX;
    let y = Math.sin(angle) * distance + canvasOffsetY;


    // Save the current canvas settings before applying new settings
    tempCtx.save();

    // Translate the canvas coordinate system to the origin of the leaf.
    tempCtx.translate(x, y);

    // Rotate the canvas coordinate system to the rotation of the leaf. Add a small random variation to look natural.
    tempCtx.rotate(angle + randomGen.range(-0.3, 0.3));


    // The length of the leaf. The bottom layer is 40 and the top layer is 14. The middle layers are in between.
    let sizeX = -26 * progress + 40;

    // The width of the leaf is one twelfth the length.
    let sizeY = sizeX / 12;

    // Start drawing the polygon.
    tempCtx.beginPath();

    // Loop for the number of leaf vertices defined.
    for (let i = 0; i < leafVertCount; i++) {
        // As i increases, the angle will complete one full rotation.
        let angle = (i / leafVertCount) * Math.PI * 2;

        // Randomize the distance from the center of the leaf.
        let distance = randomGen.range(0.3, 1.8);

        // Get the x and y using polar coordinates, then scale by the correct x and y size.
        // This is essentially an oval where each of the vertices are a random distance away.
        tempCtx.lineTo(
            Math.cos(angle) * distance * sizeX,
            Math.sin(angle) * distance * sizeY
        );
    }

    // End drawing the polygon.
    tempCtx.closePath();

    // Create a gradient that spans the entire leaf.
    let gradient = tempCtx.createLinearGradient(-1.8 * sizeX, 0, 1.8 * sizeX, 0);

    // Add the two colour stops. These location of the colour stops was determined experimentally based on visuals.
    gradient.addColorStop(0.65, colourBase);
    gradient.addColorStop(0.8, colourHighlight);

    // Fill the leaf using the gradient.
    tempCtx.fillStyle = gradient;
    tempCtx.fill();

    // Restore saved settings of the canvas.
    tempCtx.restore();
}


/**
 * Generates a tree and returns a canvas containing all the tree layers arranged in a row.
 * @param {number} numLayers - The number of tree layers to generate.
 * @param {number} canvasLayerSize - The canvas size for one layer.
 * @param {number} leafVertCount - The number of vertices per leaf.
 * @param {number} seed - The seed used to generate the tree.
 * @returns {HTMLCanvasElement} - The canvas containing all the tree layers arranged in a row.
 */
function generateTree(numLayers, canvasLayerSize, leafVertCount, seed) {
    // Create a Random variable to randomize the leafs.
    let randomGen = new Random(seed);

    // Create a temporary canvas to draw on. This will not be displayed.
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Set the canvas size. The width is larger because the layers are arranged in a row.
    tempCanvas.width = canvasLayerSize * numLayers;
    tempCanvas.height = canvasLayerSize;

    // Loop that goes through every layer.
    for (let i = 0; i < numLayers; i++) {
        // A value from 0 to 1 that represents how far up the tree the current layer is.
        let progress = i / (numLayers - 1);

        // The bottom layer has 100 leaves while the top layer has 40. The middle layers are in between.
        let leafCount = Math.floor(-60 * progress + 100);

        // Set the overall colour darker for bottom layers and lighter for top layers. Use linear equations based on the progress. All values were determined expermentally based on visuals
        let colourBase = `hsl(${-70 * progress + 150}, ${85 * progress + 10}%, ${70 * progress + 5}%)`;
        let colourHighlight = `hsl(${-70 * progress + 162}, ${75 * progress + 20}%, ${Math.min(75 * progress + 30, 98)}%)`;
        
        // Generate leaves with a loop.
        for (let j = 0; j < leafCount; j++) {
            // Draw the leaf on the temporary canvas. Pass the required parameters with a randomized seed.
            drawLeaf(
                tempCtx,
                progress,
                colourBase,
                colourHighlight,
                canvasLayerSize,
                i,
                leafVertCount,
                randomGen.intRange(0, 1000000000)
            );
        }
    }

    // Return the canvas containing all the tree layers arranged in a row.
    return tempCanvas;
}