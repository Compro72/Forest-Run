/**
 * Umar Ahmed
 * June 2026
 * Forest Run - An infinite runner game
 */


// --- Declare canvas global variables ---

// Get the main canvas element.
const canvas = document.getElementById("mainCanvas");

// Set the webgl canvas internal resolution to half the monitor resolution. This will make webgl faster since there are less pixels to proccess.
canvas.width = screen.width / 2;
canvas.height = screen.height / 2;

// Get the webgl2 context for the main canvas.
const gl = canvas.getContext("webgl2", { alpha: false });

// Set the webgl viewport size to the canvas resolution.
gl.viewport(0, 0, canvas.width, canvas.height);

// Get the UI canvas element.
const uiCanvas = document.getElementById("uiCanvas");

// Get the 2d context for the UI canvas.
const ctx = uiCanvas.getContext("2d");

// Set the UI canvas internal resolution to half the monitor resolution. This will make the text rendering faster.
uiCanvas.width = screen.width / 2;
uiCanvas.height = screen.height / 2;


// --- Declare time global variables ---

// A variable to track the  time of the previous frame.
let prevTime = 0;

// A variable to track the change in time between frames.
let deltaTime = 0;


// --- Declare game state global variables ---

// A boolean to track if the game has started.
let gameStart = false;

// A boolean to track if the game has ended.
let gameOver = false;

// A boolean to track if the uiCanvas needs an update.
let needsUiUpdate = true;


// --- Declare game global variables ---

/** @type {World} */
let world;

// A boolean to track if the space key is currently down.
let spaceKey = false;

// A variable to track the player's current score.
let score = 0;


// --- Declare music global variables ---

// An array of notes that will be used to play randomly.
const notes = ["C", "D", "E", "G", "A"];

// An array of note lengths that will be used to play randomly.
const lengths = ["2n", "4n", "8n"];

/** @type {Tone.PolySynth} */
let synth;

/** @type {Tone.Reverb} */
let reverb;

/** @type {Random} */
let musicRandom;


// Add an event listener for the space key that will only run once when the game has not started yet.
// It will initialize tone.js and background audio without any security restrictions (because the user has interacted).
document.body.addEventListener("keydown", async function (event) {
    // Check if the game has not started and the space key is pressed.
    if (!gameStart && event.key === " ") {
        // Get the background audio element.
        let audio = document.getElementById("bgAudio");

        // Start the forest background sound at a random timestamp
        let randomTime = musicRandom.next() * audio.duration;
        audio.currentTime = randomTime;

        // Set the background audio to 60% volume to make it not overpower the tone.js sounds
        audio.volume = 0.6;

        // Start the audio.
        audio.play();

        // Await the initialization of tone.js. This is why this function is asynchronous.
        await Tone.start();

        // Initialize the reverb effect. This creates an ambience and echo of the tone rather than playing a pure tone
        // The roomSize is the simulated room size. It controls how long the reverb effect lasts.
        // The wet variable is the percentage of reverb effect as compared to the original tone.
        reverb = new Tone.Reverb({ roomSize: 0.8, wet: 0.45 }).toDestination();

        // Initialize the synth variable which will be used to play the tones.
        // Use PolySynth to layer tones. Previous tones will not stop if a new tone is played.
        // The oscillator defines the type of sound wave. A sine wave is the simplest option.
        // The envelope defines how the tone starts, decays and ends.
        // The connect() method can be used to add the reverb modifier.
        synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: {
                // Start quickly
                attack: 0.05,

                // Decay slowly 
                decay: 1.5,

                // Don't sustain a tone
                sustain: 0,

                // End slowly
                release: 2.2
            }
        }).connect(reverb);

        // Set the game to started so this code does not run again.
        gameStart = true;
    }
});

/**
 * This is called on a keydown event listener. It will handle the space bar input.
 * @param {KeyboardEvent} event - The browser keyboard event.
 */
function handleKeyDown(event) {
    // Check if the key that is down is the space bar.
    if (event.key === " ") {
        // If the game is over and the player fall animation has ended.
        if (gameOver && world.player.depth < 0.1) {
            // Restart the game (reload the page).
            location.reload();
        }

        // If the synth has initialized correctly, the space key is pressed (first time not held) and the game is not over then play the tone.
        if (synth && spaceKey == false && !gameOver) {
            // There is a 50% chance of octave 4 or 5. Octave 5 is double the frequency of octave 4.
            let octave = 4;
            if (musicRandom.next() < 0.5) {
                octave = 5;
            }

            // Set the volume of the note.
            let velocity;

            if (octave == 4) {
                // If the octave is 4, volume range from 0.85 to 1.
                velocity = musicRandom.next() * 0.15 + 0.85;
            } else {
                // If the octave is 5, volume range from 0.1 to 0.25.
                velocity = musicRandom.next() * 0.15 + 0.1;
            }

            // Pick a random length from the lengths array.
            let randomLen = lengths[musicRandom.intRange(0, 3)];

            // Pick a random note from the notes array.
            const baseNote = notes[Math.floor(musicRandom.next() * notes.length)];

            // Attach the octave to the note.
            const finalNote = baseNote + octave;

            // Play the tone with all the generated settings.
            synth.triggerAttackRelease(finalNote, randomLen, Tone.now(), velocity);
        }

        spaceKey = true;

        // Update the UI (score counter).
        needsUiUpdate = true;
    }
}

/**
 * This is called on a keyup event listener. It will handle the space bar input.
 * @param {KeyboardEvent} event - The browser keyboard event.
 */
function handleKeyUp(event) {
    // Check if the key that is up is the space key.
    if (event.key === " ") {
        spaceKey = false;
    }
}

/**
 * This is called when the program starts. It will add event listeners, initialize the game and start the game loop.
 */
function initialize() {
    // Add event listeners for keyup and keydown. This is the space bar input.
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Use the current time as the seed for the entire game.
    let seed = Date.now();

    // Pass the seed into the world constructor. Anything random in the game will use this seed. The World contains the entire game except the UI and sound effects.
    world = new World(seed);

    // Construct a Random object specifically for generating the notes.
    musicRandom = new Random(seed);

    // Start the main game loop.
    requestAnimationFrame(loop);
}

/**
 * The main game loop. Runs every frame through requestAnimationFrame.
 * @param {DOMHighResTimeStamp} currentTime - The current timestamp provided by the browser.
 */
function loop(currentTime) {
    // Calculate the change in time between the previous frame and the current frame.
    deltaTime = currentTime - prevTime;

    // Set previous time to the current time to use in the next frame;
    prevTime = currentTime;

    // Upadate the world. Pass the deltaTime in seconds to make the updates framerate independent.
    world.update(deltaTime/1000);

    // Render the the world.
    world.render();

    // If a UI uptate is needed, draw the UI.
    if (needsUiUpdate) {
        // Erase the area with the score text.
        ctx.clearRect(10, 10, uiCanvas.width / 4, 30);

        // Erase the area with the UI instruction.
        ctx.clearRect(uiCanvas.width - 300, uiCanvas.height - 58, 300, 58);

        // Set the font and white colour of the text.
        ctx.font = "20px arial";
        ctx.fillStyle = "#ffffff";

        // Render the score text.
        ctx.fillText("Score: " + score, 10, 30);

        // If the game has not started, display instruction.
        if (!gameStart) {
            // Draw a white background for the instruction message.
            ctx.fillRect(uiCanvas.width - 300, uiCanvas.height - 58, 300, 58);

            // Set correct font and colour of the text.
            ctx.font = "30px arial";
            ctx.fillStyle = "#000000";

            // Render the start instruction.
            ctx.fillText("Press Space to play", uiCanvas.width - 283, uiCanvas.height - 19);
        }

        // If the game ended, display instruction.
        if (gameOver) {
            // Draw a white background for the instruction message.
            ctx.fillRect(uiCanvas.width - 300, uiCanvas.height - 58, 300, 58);

            // Set correct font and colour of the text.
            ctx.font = "27px arial";
            ctx.fillStyle = "#000000";

            // Render the restart instruction.
            ctx.fillText("Press Space to restart", uiCanvas.width - 283, uiCanvas.height - 19);
        }

        // Once the UI is updated, set needsUiUpdate to false so this block does not run again until another UI update is needed.
        needsUiUpdate = false;
    }

    // Call the next frame.
    requestAnimationFrame(loop);
}

// Initialize the game and start the game loop.
initialize();