
/**
 * Represents a Course.
 */
export default class Course {
    constructor(title, description, category, capacity, instructorId) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.capacity = parseInt(capacity, 10); // Ensure capacity is a number
        this.instructorId = parseInt(instructorId, 10); 
        this.enrolledStudents = []; // New courses start with no students
    }
}