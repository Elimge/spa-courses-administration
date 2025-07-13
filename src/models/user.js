
/**
 * @file Defines the User class, which serves as a blueprint for creating user objects.
 */

/**
 * Represents a User in the application.
 * This class ensures that every new user object has a consistent structure.
 */
export default class User {
    /**
     * Creates an instance of a User.
     * @param {string} email - The user's email address.
     * @param {string} password - The user's raw password.
     * @param {string} [role="student"] - The user's role. Defaults to 'student' for all new registrations.
     */
    constructor(email, password, role = "student") {
        this.email = email;
        this.password = password;
        this.role = role; // Default role is 'student'
    }
}