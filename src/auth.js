
// This file only manages the user's session state in localStorage.

const USER_INFO_KEY = "loggedInUser"; 

/**
 * Saves user information to localStorage after removing the password.
 * @param {object} user - The full user object from API.
 */
export function saveUserInfo(user) {
    const userToStore = {
        id: user.id,
        email: user.email,
        role: user.role
    };
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userToStore));
}

/**
 * Logs the user out by clearing their info from localStorage.
 */
export function logOut() {
    localStorage.removeItem(USER_INFO_KEY);
}

/** 
 * Checks if a user is currently logged in.
 * @returns {boolean} - True if user info exists in localStorage.
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