
/**
 * Represents a User.
 */
export default class User {
    constructor(email, password, role = "student") {
        this.email = email;
        this.password = password;
        this.role = role; // Default role is 'student'
    }
}