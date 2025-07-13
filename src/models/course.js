
/**
 * @file Defines the Course class, which serves as a blueprint for creating course objects.
 */

/**
 * Represents a Course in the application.
 * This class provides a consistent structure for course data.
 */
export default class Course {
    /**
     * Creates an instance of a Course.
     * @param {string} title - The title of the course.
     * @param {string} description - A detailed description of the course content.
     * @param {string} category - The subject category of the course (e.g., "Programming", "Design").
     * @param {string|number} capacity - The maximum number of students that can enroll.
     * @param {string|number} instructorId - The ID of the instructor assigned to the course.
     */
    constructor(title, description, category, capacity, instructorId) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.capacity = parseInt(capacity, 10); // Ensure capacity is a number
        this.instructorId = parseInt(instructorId, 10); 
        this.enrolledStudents = []; // New courses start with no students
    }
}