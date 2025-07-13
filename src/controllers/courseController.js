
/**
 * @file This controller manages all CRUD operations for courses and related data
 * like instructors. It serves as the intermediary between the frontend logic
 * and the course-related API endpoints.
 */

/**
 * The base URL for the courses API endpoint.
 * @type {string}
 */
const COURSES_API_URL = 'http://localhost:3000/courses';

/**
 * The base URL for the instructors API endpoint.
 * @type {string}
 */
const INSTRUCTORS_API_URL = "http://localhost:3000/instructors";

/**
 * Fetches all courses from the API.
 * @returns {Promise<Array>} A promise that resolves to an array of course objects, or an empty array on failure.
 */
export async function getAllCourses() {
    try {
        const response = await fetch(COURSES_API_URL);
        if (!response.ok) throw new Error("Failed to fetch courses.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching courses: ", error);
        return []; // Return a safe, empty array on error to prevent crashes in rendering logic.
    }
}

/**
 * Fetches all instructors from the API.
 * @returns {Promise<Array>} A promise that resolves to an array of instructor objects, or an empty array on failure.
 */
export async function getAllInstructors() {
    try {
        const response = await fetch(INSTRUCTORS_API_URL);
        if (!response.ok) throw new Error('Failed to fetch instructors.');
        return await response.json();
    } catch (error) {
        console.error('Error fetching instructors:', error);
        return []; // Return a safe value.
    }
}

/**
 * Creates a new course by sending a POST request to the API.
 * @param {object} courseData - The data for the new course, typically an instance of the Course model.
 * @returns {Promise<object|null>} A promise that resolves to the newly created course object, or `null` on failure.
 */
export async function createCourse(courseData) {
    try {
        const response = await fetch(COURSES_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(courseData)
        });
        if (!response.ok) throw new Error("Failed to create course.");
        return await response.json();
    } catch (error) {
        console.error("Error creating course: ", error);
        return null;
    }
}

/**
 * Updates an existing course using a PATCH request.
 * A PATCH request is used to update only the specified fields.
 * @param {string|number} courseId - The ID of the course to update.
 * @param {object} courseData - An object containing the course properties to update.
 * @returns {Promise<object|null>} The updated course object, or `null` on failure.
 */
export async function updateCourse(courseId, courseData) {
    try {
        const response = await fetch(`${COURSES_API_URL}/${courseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });
        if (!response.ok) throw new Error('Failed to update course.');
        return await response.json();
    } catch (error) {
        console.error('Error updating course:', error);
        return null;
    }
}

/**
 * Deletes a course by its ID using a DELETE request. (Hard Delete)
 * @param {string|number} courseId - The ID of the course to delete.
 * @returns {Promise<boolean>} `true` on successful deletion, `false` on failure.
 */
export async function deleteCourse(courseId) {
    try {
        const response = await fetch(`${COURSES_API_URL}/${courseId}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete course.");
        return true;
    } catch (error) {
        console.error("Error deleting course: ", error);
        return false;
    }
}

/**
 * Enrolls a student in a course by updating the course's `enrolledStudents` array.
 * This is a specific type of update, so we use a PATCH request.
 * @param {number|string} courseId - The ID of the course to enroll in.
 * @param {Array<number>} newStudentList - The complete new array of student IDs for the course.
 * @returns {Promise<object|null>} The updated course object, or `null` on failure.
 */
export async function enrollInCourse(courseId, newStudentList) {
    try {
        const response = await fetch(`${COURSES_API_URL}/${courseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // We are only patching the 'enrolledStudents' property of the course.
            body: JSON.stringify({ enrolledStudents: newStudentList })
        });
        if (!response.ok) throw new Error('Failed to enroll in course.');
        return await response.json();
    } catch (error) {
        console.error('Error enrolling in course:', error);
        return null;
    }
}

/**
 * Unenrolls a student from a course.
 * This function reuses the `enrollInCourse` logic, as the API operation is identical:
 * patching the `enrolledStudents` array with a new list.
 * @param {number|string} courseId - The ID of the course to unenroll from.
 * @param {Array<number>} newStudentList - The updated array of student IDs (without the unenrolled student).
 * @returns {Promise<object|null>} The updated course object, or `null` on failure.
 */
export async function unenrollFromCourse(courseId, newStudentList) {
    // The underlying API call is the same as enrolling, just with a different student list.
    // Reusing the function avoids code duplication.
    return enrollInCourse(courseId, newStudentList); 
}