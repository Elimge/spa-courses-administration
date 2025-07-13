
/**
 * @file This controller handles all logic related to user authentication,
 * such as login and registration. It communicates with the user-related
 * endpoints of the mock API.
 */

import User from "../models/user.js";
// Import the session management functions 
import { saveUserInfo } from "../auth.js";

/**
 * The base URL for the users API endpoint.
 * @type {string}
 */
const USERS_API_URL = "http://localhost:3000/users";

/**
 * Handles the user login process.
 * It sends a request to the API to find a user matching the provided credentials.
 * If successful, it saves the user's session information.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<boolean>} A promise that resolves to `true` if login is successful, `false` otherwise.
 */
export async function handleLogin(email, password) {
    try {
        // Query the API for a user with a matching email and password.
        const response = await fetch(`${USERS_API_URL}?email=${email}&password=${password}`);
        
        // Check if the HTTP request itself was successful (e.g., status 200-299)
        if (!response.ok) throw new Error("Login request failed.");

        const users = await response.json();

        // A successful login should return exactly one user.
        if (users.length === 1) {
            const user = users[0];
            // On success, use the auth service to store user info in localStorage.
            saveUserInfo(user);
            console.log("Login successful for user: ", user);
            return true;
        } else {
            // If 0 or more than 1 user is returned, the credentials are considered invalid.
            console.log("Login failed: Invalid credentials.");
            return false;
        }
    } catch (error) {
        console.error("Error during login: ", error);
        return false; // Ensure false is returned on any kind of error.
    }
}

/**
 * Handles the user registration process.
 * It first checks if the email is already taken and then creates a new user
 * with the "student" role.
 * @param {string} email - The email for the new account.
 * @param {string} password - The password for the new account.
 * @returns {Promise<object|null>} A promise that resolves to the created user object on success, or `null` on failure.
 */
export async function handleRegister (email, password) {
    try {
        // First, check if a user with this email already exists
        const checkResponse = await fetch(`${USERS_API_URL}?email=${email}`);
        const existingUsers = await checkResponse.json();
        if (existingUsers.length > 0) {
            alert("A user with this email already exists.");
            return null; // Registration fails because the email is taken.
        }

        // Second, if the email is available, create the new user instance.
        const newUser = new User(email, password); // The User model defaults the role to 'student'.
    
        // Send the POST request to create the new user
        const createResponse = await fetch(USERS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
        });

        if (!createResponse.ok) throw new Error("Failed to create user.");

        const createdUser = await createResponse.json();
        console.log("Registration successsful: ", createdUser);
        return createdUser;
    
    } catch (error) {
        console.error("Error during registration: ", error);
        return null; // Ensure null is returned on any kind of error.
    }
}