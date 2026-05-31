/**
 * A low level WebGL class that talks to the GPU, sets up memory, and runs shaders.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API}
 */
class WebGLRenderer {
    /**
     * @param {WebGL2RenderingContext} gl - The webgl2 context.
     * @param {string} vertexShaderSource - The vertex shader source code.
     * @param {string} fragmentShaderSource - The fragment shader source code.
     * @param {number} bufferByteSize - The size of the expected vertex data in bytes.
     */
    constructor(gl, vertexShaderSource, fragmentShaderSource, bufferByteSize) {
        // Save the WebGL context reference to use inside this class instance.
        this.gl = gl;

        // Compile and link the vertex and fragment shaders.
        this.initShaderProgram(vertexShaderSource, fragmentShaderSource);

        // Turn on alpha blending so transparent pixels are not rendered black.
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Use the compiled shader program for all following draw calls.
        gl.useProgram(this.shaderLocations.program);

        // Create a Vertex Array Object to remember the vertex configuration.
        this.vao = gl.createVertexArray();

        // Bind the Vertex Array Object to start recording the vertex configuration.
        gl.bindVertexArray(this.vao);

        // Generate a new empty memory buffer.
        this.vertexBuffer = gl.createBuffer();

        // Tell WebGL to actively look at the new memory buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Allocate a dynamic block of memory.
        gl.bufferData(gl.ARRAY_BUFFER, bufferByteSize, gl.DYNAMIC_DRAW);

        // Find the size of one vertex in bytes: 13 floats per vertex, 4 bytes per float.
        let STRIDE = 13 * 4;


        // --- Define the VAO vertex configuration ---

        // Turn on the position attribute slot in the shader.
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.position);
        // Assign to it the first two floats in the vertex data.
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.position, 2, this.gl.FLOAT, false, STRIDE, 0);

        // Turn on the rotation attribute slot in the shader.
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.rotation);
        // Assign to it the next float in the vertex data.
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.rotation, 1, this.gl.FLOAT, false, STRIDE, 8);

        // Turn on the pivot attribute slot in the shader.
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.pivot);
        // Assign to it the next two floats in the vertex data.
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.pivot, 2, this.gl.FLOAT, false, STRIDE, 12);

        // Turn on the depth attribute slot in the shader.
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.depth);
        // Assign to it the next float in the vertex data.
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.depth, 1, this.gl.FLOAT, false, STRIDE, 20);

        // Turn on the texCoord attribute slot in the shader.
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.texCoord);
        // Assign to it the next two floats in the vertex data.
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.texCoord, 2, this.gl.FLOAT, false, STRIDE, 24);

        // Turn on the colour attribute slot in the shader.
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.colour);
        // Assign to it the next four floats in the vertex data.
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.colour, 4, this.gl.FLOAT, false, STRIDE, 32);

        // Turn on the type attribute slot in the shader.
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.type);
        // Assign to it the next float in the vertex data.
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.type, 1, this.gl.FLOAT, false, STRIDE, 48);

        // Unbind the Vertex Array Object.
        gl.bindVertexArray(null);
    }

    /**
     * Creates and links a new WebGLProgram. Stores the program reference, shader attribute locations and shader uniform locations in the shaderLocations object.
     * @param {string} vertexShaderSource - The vertex shader source code.
     * @param {string} fragmentShaderSource - The fragment shader source code.
     */
    initShaderProgram(vertexShaderSource, fragmentShaderSource) {
        // Create a new WebGLProgram object.
        let program = this.gl.createProgram();

        // Compile and attach the vertex shader code.
        this.gl.attachShader(program, this.loadShader(this.gl.VERTEX_SHADER, vertexShaderSource));

        // Compile and attach the fragment shader code.
        this.gl.attachShader(program, this.loadShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource));

        // Attach the created program
        this.gl.linkProgram(program);

        // Build an object for easy access to the shader
        this.shaderLocations = {
            // Save the program reference.
            program: program,

            // Look up and store the locations of shader attributes (attributes are variables that change on every vertex).
            attributes: {
                position: this.gl.getAttribLocation(program, "a_position"),
                rotation: this.gl.getAttribLocation(program, "a_rotation"),
                pivot: this.gl.getAttribLocation(program, "a_pivot"),
                depth: this.gl.getAttribLocation(program, "a_depth"),
                texCoord: this.gl.getAttribLocation(program, "a_texCoord"),
                colour: this.gl.getAttribLocation(program, "a_colour"),
                type: this.gl.getAttribLocation(program, "a_type")
            },

            // Look up and store the locations of shader uniforms (uniforms are variables that dont change in a single draw call).
            uniforms: {
                resolution: this.gl.getUniformLocation(program, "u_resolution"),
                cameraPos: this.gl.getUniformLocation(program, "u_cameraPos"),
                viewRotation: this.gl.getUniformLocation(program, "u_viewRotation"),
                viewZoom: this.gl.getUniformLocation(program, "u_viewZoom"),
                textures: this.gl.getUniformLocation(program, "u_textures")
            }
        };
    }

    /**
     * Load a shader given the type and source code.
     * @param {GLenum} type - Enum for VERTEX_SHADER or FRAGMENT_SHADER.
     * @param {string} source - The GLSL source code as a string.
     * @returns - The created shader reference.
     */
    loadShader(type, source) {
        // Create a new WebGLShader object.
        let shader = this.gl.createShader(type);

        // Load the GLSL (shader) source code.
        this.gl.shaderSource(shader, source);

        // Compile the loaded source code into machine code.
        this.gl.compileShader(shader);

        // Check for compilation errors.
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            // Print out the shader error in the JavaScript console.
            console.error("Shader Error: " + this.gl.getShaderInfoLog(shader));
        }

        // Return the shader reference.
        return shader;
    }

    /**
     * Sends the current viewport view to the shader uniforms.
     * @param {Viewport} viewport - The viewport used to update the shader view.
     */
    updateView(viewport) {
        // Assign the canvas resolution to the resolution uniform.
        this.gl.uniform2f(this.shaderLocations.uniforms.resolution, canvas.width, canvas.height);

        // Assign the viewport position to the cameraPos uniform.
        this.gl.uniform2f(this.shaderLocations.uniforms.cameraPos, viewport.x, viewport.y);

        // Assign the viewport rotation to the viewRotation uniform.
        this.gl.uniform1f(this.shaderLocations.uniforms.viewRotation, viewport.rotation);

        // Assign the viewport zoom to the viewZoom uniform.
        this.gl.uniform1f(this.shaderLocations.uniforms.viewZoom, viewport.zoomFactor);
    }

    /**
     * Loads an HTML canvas element to a webgl texture slot.
     * @param {HTMLCanvasElement} src - An HTML canvas element to be loaded as a webgl texture.
     */
    loadTextureFromCanvas(src) {
        // Create a new WebGLTexture object.
        let texture = this.gl.createTexture();

        // Set the active texture slot to 0.
        this.gl.activeTexture(this.gl.TEXTURE0);

        // Bind the empty texture to start building the texture.
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Invert texture vertically to match webgl coordinate system.
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        // Create a 2d webgl texture and assign the HTML canvas pixels to it.
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, src);

        // Use linear blending for scaling textures.
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    /**
     * Send the draw call to the GPU given the draw data.
     * @param {Float32Array} data - The vertex data. Each vertex is 13 floats.
     * @param {number} dataLength - The number of floats used in the vertex data.
     */
    draw(data, dataLength) {
        // Bind the dynamic memory block to recieve the vertex data.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

        // Send the vertex data to the memory buffer. Only send the first dataLength floats that are used.
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data, 0, dataLength);

        // Bind the vertex configuration so that the gpu can correctly read and use the vertex data stored in the memory buffer.
        this.gl.bindVertexArray(this.vao);

        // Draw triangles using the vertex data stored in the memory buffer.
        this.gl.drawArrays(this.gl.TRIANGLES, 0, dataLength / 13);

        // Unbind the VAO vertex configuration.
        this.gl.bindVertexArray(null);
    }
}


/**
 * A high level reneder class that manages a WebGLRenderer.
 */
class Renderer {
    /**
     * @param {WebGL2RenderingContext} gl - The webgl2 context.
     */
    constructor(gl) {
        // Hardcode upper bounds limit for total vertices allowed inside single frame draw cycles.
        this.maxBatchPoints = 10000;

        // Createa new WebGLRenderer object.
        this.webGLRenderer = new WebGLRenderer(gl, vertexShaderSource, fragmentShaderSource, this.maxBatchPoints * 13 * 4);

        // Declare a float array with the correct size (13 floats per vertex).
        this.batchData = new Float32Array(this.maxBatchPoints * 13);

        // Initialize the current index for batchData.
        this.offset = 0;


        // --- Viewport tracking ---

        // Initailize the viewport x-position.
        this.viewX = 0;

        // Initailize the viewport y-position.
        this.viewY = 0;

        // Initailize the viewport zoom.
        this.viewZoom = 1;

        // Find the screen diagonal size for culling objects
        this.screenRadius = Math.sqrt((canvas.width * canvas.width + canvas.height * canvas.height) / 4);

        // This is the maximum object size. Any object bigger may be visible on the screen but culled since its center is further than 200 units from the screen.
        this.objectCullRadius = 200;
    }

    /**
     * Determines whether an object is inside the frame.
     * @param {*} x - X-position of the object.
     * @param {*} y - Y-position of the object.
     * @param {*} depth - Depth of the object.
     * @returns {boolean} - True if the object is inside the frame. False otherwise.
     */
    inFrame(x, y, depth) {
        // Calculate overall scale
        let scale = this.viewZoom * depth;

        // Get the difference in x and y. Adjust based on scale.
        let dx = (x - this.viewX) * scale;
        let dy = (y - this.viewY) * scale;

        // Find the squared distance.
        let distSq = dx * dx + dy * dy;

        // Combine screen radius and the object radius.
        let totalRadius = (this.screenRadius + this.objectCullRadius * scale);

        // Square the distance limit to compare with distSq.
        let limitSq = totalRadius * totalRadius;

        // Return true if the object distance is smaller that the limit distance.
        return distSq <= limitSq;
    }

    /**
     * Loads an HTML canvas element to a webgl texture slot.
     * @param {HTMLCanvasElement} src - An HTML canvas element to be loaded as a webgl texture.
     */
    loadTextureFromCanvas(src) {
        // Send the canvas to the WebGLRenderer.
        this.webGLRenderer.loadTextureFromCanvas(src);
    }

    /**
     * Writes the 13 vertex properties to the batch array.
     */
    addVertex(x, y, rotation, rotationPivotX, rotationPivotY, depth, u, v, r, g, b, a, type) {
        // this.offset++ returns the previous value of this.offset and then increments this.offset.

        // This configuration is the same as defined in the WebGLRenderer for the vertex data. This data is recieved by the shader.

        // Position
        this.batchData[this.offset++] = x;
        this.batchData[this.offset++] = y;

        // Rotation and pivot point.
        this.batchData[this.offset++] = rotation;
        this.batchData[this.offset++] = rotationPivotX;
        this.batchData[this.offset++] = rotationPivotY;

        // Depth
        this.batchData[this.offset++] = depth;

        // Texture coordinate.
        this.batchData[this.offset++] = u;
        this.batchData[this.offset++] = v;

        // Colour
        this.batchData[this.offset++] = r;
        this.batchData[this.offset++] = g;
        this.batchData[this.offset++] = b;
        this.batchData[this.offset++] = a;

        // Type
        this.batchData[this.offset++] = type;
    }

    /**
     * Pushes a texture to the draw call given the settings.
     */
    drawTexture(options) {
        // Set defaults. If options does not contain a property, it defaults to these values.
        let {
            x = 0,
            y = 0,
            width = 100,
            height = 100,
            rotation = 0,
            rotationPivotX = x,
            rotationPivotY = y,
            depth = 1,
            u = 0,
            v = 0,
            uWidth = 1,
            vHeight = 1,
            tint = [1, 1, 1, 1]
        } = options;

        // Check if the object is offscreen.
        if (!this.inFrame(x, y, depth)) {
            // Exit early without adding the object.
            return;
        }

        // Deconstruct the tint array into r, g, b, a colour channels.
        let [r, g, b, a] = tint;

        // Find the half size of the object. This will be used to center the object at (x, y).
        let halfWidth = width / 2;
        let halfHeight = height / 2;


        // Add the first triangle with the correct settings.

        // Bottom-left
        this.addVertex(x - halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, u, v, r, g, b, a, 0);
        // Bottom-right
        this.addVertex(x + halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, u + uWidth, v, r, g, b, a, 0);
        // Top-left
        this.addVertex(x - halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, u, v + vHeight, r, g, b, a, 0);


        // Add the second triangle with the correct settings.

        // Top-left
        this.addVertex(x - halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, u, v + vHeight, r, g, b, a, 0);
        // Bottom-right
        this.addVertex(x + halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, u + uWidth, v, r, g, b, a, 0);
        // Top-right
        this.addVertex(x + halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, u + uWidth, v + vHeight, r, g, b, a, 0);
    }

    /**
     * Pushes a rectangle to the draw call given the settings.
     */
    drawRect(options) {
        // Set defaults. If options does not contain a property, it defaults to these values.
        let {
            x = 0,
            y = 0,
            width = 100,
            height = 100,
            rotation = 0,
            rotationPivotX = x,
            rotationPivotY = y,
            depth = 1,
            colour = [1, 1, 1, 1]
        } = options;

        // Check if the object is offscreen.
        if (!this.inFrame(x, y, depth)) {
            // Exit early without adding the object.
            return;
        }

        // Deconstruct the tint array into r, g, b, a colour channels.
        let [r, g, b, a] = colour;

        // Find the half size of the object. This will be used to center the object at (x, y).
        let halfWidth = width / 2;
        let halfHeight = height / 2;


        // Add the first triangle with the correct settings.

        // Bottom-left
        this.addVertex(x - halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 0, 0, r, g, b, a, 1);
        // Bottom-right
        this.addVertex(x + halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 1, 0, r, g, b, a, 1);
        // Top-left
        this.addVertex(x - halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 0, 1, r, g, b, a, 1);


        // Add the second triangle with the correct settings.

        // Top-left
        this.addVertex(x - halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 0, 1, r, g, b, a, 1);
        // Bottom-right
        this.addVertex(x + halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 1, 0, r, g, b, a, 1);
        // Top-right
        this.addVertex(x + halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 1, 1, r, g, b, a, 1);
    }

    /**
     * Pushes a circle to the draw call given the settings.
     */
    drawCircle(options) {
        // Set defaults. If options does not contain a property, it defaults to these values.
        let {
            x = 0,
            y = 0,
            width = 100,
            height = 100,
            rotation = 0,
            rotationPivotX = x,
            rotationPivotY = y,
            depth = 1,
            colour = [1, 1, 1, 1]
        } = options;

        // Check if the object is offscreen.
        if (!this.inFrame(x, y, depth)) {
            // Exit early without adding the object.
            return;
        }

        // Deconstruct the tint array into r, g, b, a colour channels.
        let [r, g, b, a] = colour;

        // Find the half size of the object. This will be used to center the object at (x, y).
        let halfWidth = width / 2;
        let halfHeight = height / 2;


        // Add the first triangle with the correct settings.

        // Bottom-left
        this.addVertex(x - halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 0, 0, r, g, b, a, 2);
        // Bottom-right
        this.addVertex(x + halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 1, 0, r, g, b, a, 2);
        // Top-left
        this.addVertex(x - halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 0, 1, r, g, b, a, 2);


        // Add the second triangle with the correct settings.

        // Top-left
        this.addVertex(x - halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 0, 1, r, g, b, a, 2);
        // Bottom-right
        this.addVertex(x + halfWidth, y - halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 1, 0, r, g, b, a, 2);
        // Top-right
        this.addVertex(x + halfWidth, y + halfHeight, rotation, rotationPivotX, rotationPivotY, depth, 1, 1, r, g, b, a, 2);
    }

    /**
     * Pushes a line to the draw call given the settings.
     */
    drawLine(options) {
        // Set defaults. If options does not contain a property, it defaults to these values.
        let {
            x1 = 0,
            y1 = 0,
            x2 = 100,
            y2 = 100,
            thickness = 1,
            depth = 1,
            colour = [1, 1, 1, 1],
        } = options;

        // Find the midpoint of the line
        let lineCenterX = (x1 + x2) / 2;
        let lineCenterY = (y1 + y2) / 2;

        // A line is simply a rotated rectangle.
        this.drawRect({
            // Rectangle position should be line midpoint
            x: lineCenterX,
            y: lineCenterY,

            // Rectangle width should be the width of the line. 
            width: Math.hypot(x2 - x1, y2 - y1),

            // Rectangle height should be the thickness of the line
            height: thickness,

            // Use trignometry to find the correct angle to rotate the rectangle.
            rotation: Math.atan2(y2 - y1, x2 - x1),

            // Rotate from the line midpoint.
            rotationPivotX: lineCenterX,
            rotationPivotY: lineCenterY,

            // Depth remains the same.
            depth: depth,

            // Colour remains the same.
            colour: colour
        });
    }

    /**
     * Sets the backgroud colour
     * @param colour - the colour of the background as an array (RGBA).
     */
    setBackground(colour) {
        // Set the background colour.
        this.webGLRenderer.gl.clearColor(...colour);
        this.webGLRenderer.gl.clear(this.webGLRenderer.gl.COLOR_BUFFER_BIT);
    }

    /**
     * Updates the renderer's internal viewport.
     * @param {Viewport} viewport - The viewport used to update the renderer view.
     */
    update(viewport) {
        // Save the viewport position for culling.
        this.viewX = viewport.x;
        this.viewY = viewport.y;

        // Save the viewport zoom for culling.
        this.viewZoom = viewport.zoomFactor;

        // Send the view to the WebGLRenderer to update the shaders.
        this.webGLRenderer.updateView(viewport);
    }

    /**
     * Sends the draw call to the GPU.
     */
    render() {
        // Send the batchData to the GPU.
        this.webGLRenderer.draw(this.batchData, this.offset);

        // Reset the batchData index for next frame.
        this.offset = 0;
    }
}