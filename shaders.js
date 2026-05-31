/**
 * @see {@link https://www.fsynth.com/pdf/webgl2_glsl_1.pdf}
 */

// The vertex shader source code in GLSL. Runs for every vertex.
let vertexShaderSource = `#version 300 es

// --- Declare the variables that are input in the shader and their locations ---

// The position of the vertex.
layout(location = 0) in vec2 a_position;

// The rotation of the vertex.
layout(location = 1) in float a_rotation;

// The pivot point to roate around.
layout(location = 2) in vec2 a_pivot;

// The depth of the vertex in the game parallax.
layout(location = 3) in float a_depth;

// The UV coordinate used to map a texture to the vertex.
layout(location = 4) in vec2 a_texCoord;

// The colour of the vertex.
layout(location = 5) in vec4 a_colour;

// The type of the vertex (0 = texture, 1 = rectangle, 2 = circle)
layout(location = 6) in float a_type;

// The variables to pass to the fragment shader.
out vec2 v_texCoord;
out vec4 v_colour;
out float v_type;

// The uniforms that remain constant for all vertices.
uniform vec2 u_resolution;
uniform vec2 u_cameraPos;
uniform float u_viewRotation;
uniform float u_viewZoom;

void main() {
    // Pass to the fragment shader
    v_texCoord = a_texCoord;
    v_colour = a_colour;
    v_type = a_type;

    // Precalculate sin and cos.
    float cosR = cos(a_rotation);
    float sinR = sin(a_rotation);

    // Translate position so that the pivot point is the origin.
    vec2 localPos = a_position - a_pivot;

    // Rotate the point using trignometry.
    vec2 rotatedLocal = vec2(
        localPos.x * cosR - localPos.y * sinR,
        localPos.x * sinR + localPos.y * cosR
    );

    // Translate rotated point back.
    vec2 worldPos = rotatedLocal + a_pivot;


    // Translate the rotated position so that the viewport position is the origin.
    vec2 delta = worldPos - u_cameraPos;

    // Precalculate sin and cos for the viewport rotation.
    float cosV = cos(u_viewRotation);
    float sinV = sin(u_viewRotation);

    // Rotate the point around the viewport using trignometry.
    vec2 viewRotated = vec2(
        delta.x * cosV - delta.y * sinV,
        delta.x * sinV + delta.y * cosV
    );

    // Adjust for the vertex depth.
    vec2 screenPos = viewRotated * u_viewZoom * a_depth;
    
    // Adjust for resolution.
    vec2 resolutionScaledPos = screenPos / (u_resolution * 0.5);
    
    // Set the final position.
    gl_Position = vec4(resolutionScaledPos.x, resolutionScaledPos.y, 0.0, 1.0);
}`;


// The fragment shader source code in GLSL. Runs for every pixel.
let fragmentShaderSource = `#version 300 es

// High precision floats are not needed. 
precision lowp float;

// The inputs from the vertex shader.
in vec2 v_texCoord;
in vec4 v_colour;
in float v_type;

// Only one texture is needed.
uniform sampler2D u_textures[1];

// The output colour of the pixel.
out vec4 outColour;

void main() {
    // If the type is a texture.
    if (int(v_type) == 0) {
        // Sample the texture given the texture coordinate.
        vec4 texColor;
        texColor = texture(u_textures[0], v_texCoord);

        // Output the texture coulor combined with the tint.
        outColour = texColor * v_colour;
    
    // It the type is a rect.
    } else if (int(v_type) == 1) {
        // Output the given colour.
        outColour = v_colour;

    // If the type is a circle.
    } else {
        // Translate the UV coordinates so that the center of the shape is (0, 0) and not (0.5, 0.5).
        vec2 uv = v_texCoord - vec2(0.5);

        // Get the squared distance from the center to the current pixel.
        float distSq = dot(uv, uv);

        // If the distance between the center of the shape and the current pixel is too far, discard the pixel. This will make a square mesh look like a circle.
        if(distSq > 0.25) discard;

        // Output the given colour.
        outColour = v_colour;
    }
}`;
