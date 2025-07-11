// Controller logic, this logic will speak with the users API 

// The base URL of the user API.
const USERS_API_URL = "http://localhost:3000/users";

// Import the user class
import User from "../models/user.js";
// Import the session management functions 
import { saveUserInfo } from "../auth.js";

/**
 * Handles the user login process 
 * Fetches users from the API, checks credentials and saves session on success.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {promise<boolean>} True if login is successful, false otherwise.
 */
export async function handleLogin(email, password) {
    try {
        // Fetch all users from the API. 
        const response = await fetch(`${USERS_API_URL}?email=${email}&password=${password}`);
        if (!response.ok) throw new Error("Login request failed.");

        const users = await response.json();

        if (users.length === 1) {
            const user = users[0];
            // On success, call the auth service to save the session.
            saveUserInfo(user);
            console.log("Login successful for user: ", user);
            return true;
        } else {
            console.log("Login failed: Invalid credentials.");
            return false;
        }
    } catch (error) {
        console.error("Error during login: ", error);
        return false;
    }
}

/**
 * Handles the user registration process.
 * Creates a new user with the "student" role.
 * @param {string} email - The new user's email.
 * @param {string} password - The new user's password.
 * @returns {Promise<object|null>} The created user object or null on failure.
 */
export async function handleRegister (email, password) {
    try {
        // First, check if a user with this email already exists
        const checkResponse = await fetch(`${USERS_API_URL}?email=${email}`);
        const existingUsers = await checkResponse.json();
        if (existingUsers.length > 0) {
            alert('A user with this email already exists.');
            return null;
        }

        // if email is available, create the new user object
        const newUser = new User(email, password); 
    
        // Send the POST request to create the user
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
        return null;
    }
}