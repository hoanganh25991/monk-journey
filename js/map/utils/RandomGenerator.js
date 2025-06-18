/**
 * Utility class for random number generation
 */
export class RandomGenerator {
    /**
     * Create a seeded random number generator
     * @param {string|number} seed - The seed for the random number generator
     * @returns {Function} - A function that returns a random number between 0 and 1
     */
    static seededRandom(seed) {
        // Convert string seed to number if needed
        let numericSeed;
        if (typeof seed === 'string') {
            numericSeed = 0;
            for (let i = 0; i < seed.length; i++) {
                numericSeed = ((numericSeed << 5) - numericSeed) + seed.charCodeAt(i);
                numericSeed |= 0; // Convert to 32bit integer
            }
        } else {
            numericSeed = seed;
        }
        
        // Ensure seed is positive
        numericSeed = Math.abs(numericSeed);
        
        return function() {
            numericSeed = (numericSeed * 9301 + 49297) % 233280;
            return numericSeed / 233280;
        };
    }
    
    /**
     * Get a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - A random integer between min and max
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Get a random float between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - A random float between min and max
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Get a random item from an array
     * @param {Array} array - The array to pick from
     * @returns {*} - A random item from the array
     */
    static randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Get a random boolean with the specified probability
     * @param {number} probability - The probability of returning true (0-1)
     * @returns {boolean} - A random boolean
     */
    static randomBool(probability = 0.5) {
        return Math.random() < probability;
    }
}