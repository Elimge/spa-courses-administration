
/**
 * @file This module acts as a session management service.
 * It provides a simple API to handle user authentication state
 * by interacting with the browser's localStorage.
 * It abstracts away the direct manipulation of localStorage.
 */

/**
 * The key used to store user information in localStorage.
 * Using a constant prevents typos and makes it easy to change if needed.
 * @type {string}
 */
const USER_INFO_KEY = "loggedInUser"; 

/**
 * Saves user information to localStorage.
 * The password is deliberately omitted for security best practices.
 * We should never store sensitive information like passwords in localStorage.
 * @param {object} user - The full user object received from the API.
 */
export function saveUserInfo(user) {
    // Create a new object with only the necessary, non-sensitive user data.
    const userToStore = {
        id: user.id,
        email: user.email,
        role: user.role
    };
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userToStore));
}

/**
 * Logs the user out by removing their information from localStorage.
 */
export function logOut() {
    localStorage.removeItem(USER_INFO_KEY);
}

/**
 * Checks if a user is currently authenticated.
 * @returns {boolean} True if user information exists in localStorage, false otherwise.
 */
export function isAuthenticated() {
    // A user is considered authenticated if the user info key exists.
    return localStorage.getItem(USER_INFO_KEY) !== null;
}

/**
 * Retrieves the currently logged-in user's information.
 * @returns {object|null} The user object (id, email, role) if logged in, or null if not.
 */
export function getCurrentUser() {
    const userJson = localStorage.getItem(USER_INFO_KEY);
    // Parse the JSON string back into an object. Return null if no user data is found.
    return userJson ? JSON.parse(userJson) : null; 
}