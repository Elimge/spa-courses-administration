
// The base URL for the courses API endpoint.
const COURSES_API_URL = 'http://localhost:3000/courses';
const INSTRUCTORS_API_URL = "http://localhost:3000/instructors";

/**
 * Fetches all courses from the API
 * @returns {Promise<Array>} A promise that resolves to an array of course objects.
 */
export async function getAllCourses() {
    try {
        const response = await fetch(COURSES_API_URL);
        if (!response.ok) throw new Error("Failed to fetch courses.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching courses: ", error);
        return []; // Return an empty array on error
    }
}

/**
 * Creates a new course
 * @param {object} courseData - The data for the new course.
 * @returns {Promise<object|null} The created course object or null on failure.
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
 * Deletes a course by its ID. (Hard Delete)
 * @param {string|number} courseId - The ID of the course to delete.
 * @returns {Promise<boolean>} True on success, false on failure.
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
 * Fetches all instructors from the API.
 * @returns {Promise<Array>} A promise that resolves to an array of instructor objects.
 */
export async function getAllInstructors() {
    try {
        const response = await fetch(INSTRUCTORS_API_URL);
        if (!response.ok) throw new Error('Failed to fetch instructors.');
        return await response.json();
    } catch (error) {
        console.error('Error fetching instructors:', error);
        return [];
    }
}

/** 
 * Enrolls a student in a course by updating the course's student list.
 * @param {number|string} courseId - The ID of the course to enroll in.
 * @param {Array<number>} newStudentList - The new array of student IDs.
 * @returns {Promise<object|null} The updated course object or null on failure.
 */
export async function enrollInCourse(courseId, newStudentList) {
    try {
        const response = await fetch(`${COURSES_API_URL}/${courseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
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
 * Updates an existing course.
 * @param {string|number} courseId - The ID of the course to update.
 * @param {object} courseData - An object with the course properties to update.
 * @returns {Promise<object|null>} The updated course object or null on failure.
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

export async function unenrollFromCourse(courseId, newStudentList) {
    // Inverse function
    return enrollInCourse(courseId, newStudentList); 
}