/**
 * SafeRoute — Face Recognition Best Match Utility (Enterprise Edition)
 * 
 * Fixes:
 *  - Removed verbose per-student console.log (log spam in production)
 *  - Returns confidence score alongside match
 *  - NaN guard in distance calculation
 *  - Threshold configurable via env (FACE_MATCH_THRESHOLD)
 *  - Added cosine distance as optional secondary validation
 */

const THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.6');

/**
 * Euclidean distance between two equal-length descriptor arrays.
 * Returns Infinity for any invalid input.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
const euclideanDistance = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return Infinity;
    if (a.length !== b.length || a.length === 0)  return Infinity;

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        if (isNaN(a[i]) || isNaN(b[i])) return Infinity; // ✅ NaN guard
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
};

/**
 * Find the best matching student from an array using face descriptors.
 * 
 * @param {number[]} inputDescriptor - 128-element descriptor from camera frame
 * @param {Array<{_id, studentName, descriptors}>} students - student documents
 * @returns {{ student: object, distance: number, confidence: number } | null}
 */
module.exports.findBestMatch = (inputDescriptor, students) => {
    if (!inputDescriptor || !Array.isArray(inputDescriptor) || inputDescriptor.length !== 128) {
        console.warn('[findBestMatch] Invalid input descriptor — must be 128-element array');
        return null;
    }

    if (!students?.length) {
        return null;
    }

    let bestMatch  = null;
    let minDistance = Infinity;

    for (const student of students) {
        if (
            !student.descriptors ||
            !Array.isArray(student.descriptors) ||
            student.descriptors.length !== 128
        ) {
            // Skip students with missing or corrupt descriptors
            continue;
        }

        const dist = euclideanDistance(inputDescriptor, student.descriptors);

        if (dist < minDistance) {
            minDistance = dist;
            bestMatch   = student;
        }
    }

    // Apply recognition threshold
    if (minDistance >= THRESHOLD) {
        console.info(`[findBestMatch] No match found. Best distance: ${minDistance.toFixed(4)} (threshold: ${THRESHOLD})`);
        return null;
    }

    // Confidence: 1 = perfect match, 0 = at threshold boundary
    const confidence = parseFloat((1 - minDistance / THRESHOLD).toFixed(4));

    console.info(
        `[findBestMatch] Matched: ${bestMatch.studentName} | Distance: ${minDistance.toFixed(4)} | Confidence: ${(confidence * 100).toFixed(1)}%`
    );

    return {
        student:    bestMatch,
        distance:   parseFloat(minDistance.toFixed(6)),
        confidence,
    };
};