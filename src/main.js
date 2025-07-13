
// Imports
import "./style.css";
import { handleLocation, navigateTo } from "./router.js";

// Initialize the roter to handle navigation 
function initializeApp () {
    //
    document.addEventListener("click", e => {
        // Prevent the recharge of the webpage
        if (e.target.matches("a[href]")) {
            e.preventDefault();
            navigateTo(e.target.getAttribute("href"));
        }
    });

    // Listen the history behind back/forward
    window.addEventListener("popstate", handleLocation);

    // Handle the initial charge of the webpage 
    document.addEventListener("DOMContentLoaded", () => {
        handleLocation();
    })

    console.log("Application Initialized and listeners are set up.");
}

initializeApp();
