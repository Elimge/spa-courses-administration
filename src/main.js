/**
 * @file This is the main entry point for the entire Single Page Application.
 * It is responsible for initializing the application, setting up global event listeners,
 * and kicking off the initial routing.
 */

// Import the main stylesheet for the application.
import "./style.css";

// Import the necessary functions from the router module.
import { handleLocation, navigateTo } from "./router.js";

/**
 * Initializes the application by setting up global event listeners for navigation.
 */
function initializeApp () {
    /**
     * Listen for click events on the entire document to handle SPA navigation.
     * This technique is called "event delegation". Instead of adding a listener
     * to every single link, we add one to the document and check if the clicked
     * element is a link we should handle.
     */
    document.addEventListener("click", e => {
        // Check if the clicked element is an anchor tag with an href attribute.
        if (e.target.matches("a[href]")) {
            e.preventDefault();  // Prevent the browser's default full page reload.
            navigateTo(e.target.getAttribute("href")); // Use the custom navigation function.
        }
    });

    /**
     * Listen for the 'popstate' event, which is triggered by the browser's
     * back and forward buttons. This ensures the view updates correctly
     * when the user navigates through their session history.
     */
    window.addEventListener("popstate", handleLocation);

    /**
     * Handle the initial page load. We wait for the DOM to be fully loaded
     * before running the router's location handler for the first time.
     * This ensures all elements, like the '#app-root', are available.
     */
    document.addEventListener("DOMContentLoaded", () => {
        handleLocation();
    })

    console.log("Application Initialized and listeners are set up.");
}

// Start the application.
initializeApp();
