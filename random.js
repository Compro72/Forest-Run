/**
 * A seedable pseudorandom number generator using a Linear Congruential Generator (LCG).
 * Constants and formula are sourced from Wikipedia.
 * @see {@link https://en.wikipedia.org/wiki/Linear_congruential_generator}
 */
class Random {
    /**
     * @param {number} seed - The initial value to seed the generator.
     */
    constructor(seed) {
        this.randomState = seed;
    }

    /**
     * Generates the next pseudorandom number between 0 (inclusive) and 1 (exclusive).
     * @returns {number} A random number between 0 and 1.
     */
    next() {
        // LCG Formula - X_(n+1) = (a * X_(n) + c) % m
        // a = 1664525, c = 1013904223, m = 2^32 (4294967296)
        this.randomState = (this.randomState * 1664525 + 1013904223) % 4294967296;
        
        // Since randomState now ranges from 0 (inclusive) to 4294967296 (exclusive), dividing by 4294967296 give a range from 0 to 1.
        return this.randomState / 4294967296;
    }

    /**
     * Generates a random integer within a given range.
     * @param {number} min - The inclusive minimum.
     * @param {number} max - The exclusive maximum.
     * @returns {number} A random integer between min (inclusive) and max (exclusive).
     */
    intRange(min, max) {
        // Generate a float within the required range and then floor it.
        return Math.floor(this.range(min, max));
    }

    /**
     * Generates a random float within a given range.
     * @param {number} min - The inclusive minimum.
     * @param {number} max - The exclusive maximum.
     * @returns {number} A random float between min (inclusive) and max (exclusive).
     */
    range(min, max) {
        // Multiply by the size of the range and add the minimum to translate [0, 1) to [min, max).
        return (this.next() * (max - min)) + min;
    }
}