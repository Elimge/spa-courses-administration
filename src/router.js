
// --- IMPORTS ---
import { handleLogin, handleRegister } from "./controllers/authController.js";
import { isAuthenticated, logOut, getCurrentUser} from "./auth.js";
import { getAllCourses, createCourse, deleteCourse, getAllInstructors, enrollInCourse, updateCourse, unenrollFromCourse } from "./controllers/courseController.js";
import Course from "./models/course.js";

// --- MODULE-LEVEL VARIABLES ---

/**
 * Maps URL paths to their corresponding HTML view files.
 * This object acts as the single source of truth for routing configuration.
 * @type {Object.<string, string>}
 */
const routes = {
    "/": "src/views/home.html",
    "/login": "src/views/login.html",
    "/register": "src/views/register.html",
    "/tasks": "src/views/task.html", // admin/student dashboard
    "/student-dashboard": "src/views/student-dashboard.html",
    "/404": "src/views/404.html",
}

/**
 * The main DOM element where all views will be rendered.
 * @type {HTMLElement}
 */
const appRoot = document.getElementById("app-root"); 

// --- CORE ROUTER LOGIC ---

/**
 * Fetches the HTML content of a view and injects it into the app's root container.
 * If the view cannot be fetched, it loads the 404 page as a fallback.
 * @param {string} viewPath - The path to the HTML view file (e.g., "src/views/login.html").
 */
async function loadView(viewPath) {
    try {
        const response = await fetch(viewPath);
        if (!response.ok) throw new Error("View not found");

        const html = await response.text();
        appRoot.innerHTML = html;
    } catch (error) {
        console.error("Failed to load view: ", error);
        // Fallback to 404 page on any error
        const response404 = await fetch(routes["/404"]);
        appRoot.innerHTML = await response404.text();
    }
}

/**
 * Navigates the SPA to a new path without a full page reload.
 * It updates the browser's history and then triggers the location handler.
 * @param {string} path - The destination path (e.g., "/login").
 */
export function navigateTo(path) {
    // Update the browser URL without reloading the page
    window.history.pushState({}, "", path); 
    // Manually call the location handler to process the new route 
    handleLocation();
}

/**
 * The main routing function. It determines the current path, checks user
 * authentication and roles, and then loads the appropriate view and its
 * associated logic. This function acts as the central controller for the application's UI.
 */
export async function handleLocation() {
    const path = window.location.pathname;
    const isAuth = isAuthenticated();
    const user = getCurrentUser();

    // Dynamically update the navbar and body class on every route change
    renderNavbar();
    updateBodyClass(path);

    // --- AUTHENTICATION GUARDS ---
    // Protect routes based on authentication status.

    // Unauthenticated users trying to access protected routes
    if (!isAuth && (path === "/tasks" || path === "/student-dashboard")) {
        console.log("Access Denied: Not authenticated. Redirecting to /login.");
        navigateTo("/login");
        return; // Stop execution to allow redirection to complete
    }
    // Authenticated users trying to access guest-only routes (login/register)
    if (isAuth && (path === "/login" || path === "/register")) {
        console.log("Access Denied: Already authenticated. Redirecting to dashboard.");
        navigateTo("/tasks"); // Redirect to the generic '/tasks' and let it resolve to the correct dashboard
        return; // Stop execution
    }

    // --- ROUTE RESOLUTION ---
    // Determine which view to load based on the path and user role.
    let viewPath;
    let viewInitializer = null; // A function to run after the view is loaded

    switch (path) {
        case "/":
        case "/home": // Allow /home as an alias for the root
            viewPath = routes["/"];
            break;

        case "/login":
            viewPath = routes["/login"];
            viewInitializer = initializeLoginForm;
            break;

        case "/register":
            viewPath = routes["/register"];
            viewInitializer = initializeRegisterForm;
            break;

        case "/tasks":
            // This route is role-dependent
            if (isAuth && user.role === "administrator") {
                viewPath = routes["/tasks"];
                viewInitializer = () => initializeTasksView(user);
            } else if (isAuth && user.role === "student") {
                // Students are automatically redirected from the generic /tasks to their specific dashboard
                navigateTo("/student-dashboard");
                return; // Stop execution to allow the new navigation to take over
            }
            break;

        case "/student-dashboard":
            // This route is specifically for students
            if (isAuth && user.role === "student") {
                viewPath = routes["/student-dashboard"];
                viewInitializer = () => initializeStudentDashboard(user);
            } else {
                // Any other user (guest or admin) trying to access this is redirected
                navigateTo(isAuth ? "/tasks" : "/login");
                return; // Stop execution
            }
            break;

        default:
            // If no other route matches, render the 404 page
            viewPath = routes["/404"];
            break;
    }

    // --- VIEW RENDERING AND LOGIC INITIALIZATION ---
    await loadView(viewPath);
    
    // If an initializer function was assigned for the route, execute it now.
    // This ensures that the view's HTML is in the DOM before we try to attach listeners.
    if (viewInitializer) {
        viewInitializer();
    }

    // Dynamically add the logout button if the user is authenticated.
    // This is handled here to ensure it's re-evaluated on every navigation.
    if (isAuth) {
        addLogoutButton();
    }
}

// --- VIEW-SPECIFIC INITIALIZERS ---
// These functions contain the logic for a specific view. They are called by handleLocation.

/**
 * Attaches the submit event listener to the login form.
 */
function initializeLoginForm() {
    const form = document.getElementById("login-form");
    // If the form doesn"t exist on the current page, do nothing.
    if (!form) return; 

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent page reload
        const email = form.querySelector("#email").value;
        const password = form.querySelector("#password").value;

        // Call our controller to handle the login process
        const success = await handleLogin(email, password); 

        if (success) {
            navigateTo("/tasks");// Redirect to the main dashboard hub
        } else {
            alert("Invalid credentials. Please try again");
        }
    });
}

/**
 * Attaches the submit event listener to the registration form.
 */
function initializeRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = form.querySelector("#register-email").value;
    const password = form.querySelector("#register-password").value;

    // Call the controller to handle the registration
    const success = await handleRegister(email, password);

    if (success) {
      alert("Registration successful! Please log in.");
      
      navigateTo("/login"); // On success, redirect the user to the login page
    } 
    // Error alerts are handled within handleRegister
  });
}

/**
 * Initializes the entire Admin Course Management dashboard.
 * Fetches data, renders courses, and sets up all event listeners for the view.
 * @param {object} user - The currently logged-in administrator user object.
 */
async function initializeTasksView(user) {
    const courseListElement = document.getElementById("course-list");
    const courseForm = document.getElementById("course-form");
    if (!courseListElement || !courseForm) return;  // Safety check

    // --- NESTED HELPER FUNCTIONS for the Admin View ---

    /** Renders the list of courses into the DOM. */
    function renderCourses(courses) {
        courseListElement.innerHTML = "";
        courses.forEach(course => { 
            const courseElement = document.createElement("div");
            courseElement.classList.add("course-card");
            courseElement.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <p><strong>Category:</strong> ${course.category}</p>
                <div class="actions">
                    <button class="edit-btn" data-id="${course.id}">Edit</button>
                    <button class="delete-btn" data-id="${course.id}">Delete</button>
                </div>
            `;
            courseListElement.appendChild(courseElement);
        });
    }

    /** Populates the 'instructor' select dropdown with data from the API. */
    function populateInstructorSelect(instructors) {
        const instructorSelect = document.getElementById("course-instructor");
        if (!instructorSelect) return;

        // Clean the options first 
        // Save the first option ("Please choose..."")
        const placeholderOption = instructorSelect.options[0];
        instructorSelect.innerHTML = ""; // Delete all the options
        instructorSelect.appendChild(placeholderOption); // Add the placeholder again

        instructors.forEach(instructor => {
            const option = document.createElement("option");
            option.value = instructor.id; // The value will be the ID
            option.textContent = instructor.name; // The text shown will be the name
            instructorSelect.appendChild(option);
        });
    }   

    /** Resets the course form to its default state after a create or update action. */
    function resetCourseForm() {
        courseForm.reset();
        courseForm.removeAttribute("data-editing-id"); // Removes the editing state indicator
        courseForm.querySelector("button[type='submit']").textContent = "Create Course"; // Resets button text

        // Find and remove the cancel button if it exists
        const cancelButton = courseForm.querySelector(".cancel-btn");
        if (cancelButton) {
            cancelButton.remove();
        }
    }

    /** Handles form submission for both creating and updating courses. */
    async function handleCourseFormSubmit(event) {
        event.preventDefault(); 
        const editingId = courseForm.dataset.editingId; // Read the ID that was saved

        // Get the values from the form inputs
        // Select each input by its unique ID
        const title = document.getElementById("course-title").value;
        const description = document.getElementById("course-description").value;
        const category = document.getElementById("course-category").value;
        const capacity = document.getElementById("course-capacity").value;
        const instructorId = document.getElementById("course-instructor").value;

        const courseData = { title, description, category, capacity, instructorId}; 

        let success = false;
        if (editingId) {
            // --- UPDATE MOOD ---
            const updatedCourse = await updateCourse(editingId, courseData);
            if (updatedCourse) success = true;
        } else {
            // --- CREATE MOOD ---
            const newCourse = new Course(title, description, category, capacity, instructorId);
            const createdCourse = await createCourse(newCourse);
            if (createdCourse) success = true;
        }

        if (success) {
            resetCourseForm();
            loadAdminDashboard(); // Recharge the view
        } else {
            alert("Operation failed. Please check the console.");
        } 
    }

    /** Handles clicks on the 'Edit' and 'Delete' buttons within the course list. */
    async function handleCourseListClick(event) {
        if (event.target.matches(".delete-btn")) {
            const courseId = event.target.dataset.id;
            const success = await deleteCourse(courseId);
            if (success) {
                loadAdminDashboard(); // Reload the list
            }
        } else if (event.target.matches(".edit-btn")) {
            const courseId = event.target.dataset.id;
            // Get all the courses to find the one to edit
            const courses = await getAllCourses();
            const courseToEdit = courses.find(c => c.id == courseId);
            if (courseToEdit) {
                // Fill the form with the course data
                document.getElementById("course-title").value = courseToEdit.title;
                document.getElementById("course-description").value = courseToEdit.description;
                document.getElementById("course-category").value = courseToEdit.category;
                document.getElementById("course-capacity").value = courseToEdit.capacity;
                document.getElementById("course-instructor").value = courseToEdit.instructorId;
            
                // Save the course"s ID that was editted 
                courseForm.setAttribute("data-editing-id", courseId);
            
                // Change the text on the form button
                courseForm.querySelector("button[type='submit']").textContent = "Update Course";

                // Scroll to edit box
                courseForm.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            // Check if cancel button already exists to avoid duplicates
            if (!courseForm.querySelector(".cancel-btn")) {
                const cancelButton = document.createElement("button");
                cancelButton.type = "button"; // Important to prevent form submission
                cancelButton.textContent = "Cancel";
                cancelButton.classList.add("cancel-btn");
        
                cancelButton.addEventListener("click", () => {
                resetCourseForm(); // Reset the form
                });

                // Add the cancel button next to the update button
                courseForm.querySelector("button[type='submit']").insertAdjacentElement("afterend", cancelButton);
            }
        }
    }

    /** Main function to fetch all necessary data and render the admin dashboard. */
    async function loadAdminDashboard() {
        // Fetch courses and instructors in parallel for better performance
        const [courses, instructors] = await Promise.all([
            getAllCourses(),
            getAllInstructors()
        ]);
    
        renderCourses(courses);
        populateInstructorSelect(instructors);
    }

    // --- ATTACH EVENT LISTENERS for the Admin View ---
    courseListElement.addEventListener("click", handleCourseListClick);
    courseForm.addEventListener("submit", handleCourseFormSubmit);
    
    // --- INITIAL DATA LOAD ---
    loadAdminDashboard();
}

/**
 * Initializes the entire Student Dashboard.
 * Fetches all courses and renders two lists: "Available Courses" and "My Enrolled Courses".
 * @param {object} user - The currently logged-in student user object.
 */
async function initializeStudentDashboard(user) {
    const availableCoursesElement = document.getElementById("student-course-list");
    const myCoursesElement = document.getElementById("my-courses-list");
    if (!availableCoursesElement || !myCoursesElement) return; 

    // --- NESTED HELPER FUNCTIONS for the Student View ---

    /** Renders the list of all courses available for enrollment. */
    function renderAvailableCourses(courses, currentUser) {
        availableCoursesElement.innerHTML = "";
        courses.forEach(course => {
            // A student can enroll of they are not already enrolled and there is capacity.
            const isEnrolled = course.enrolledStudents.includes(currentUser.id);
            const hasCapacity = course.enrolledStudents.length < course.capacity; 

            const courseCard = document.createElement("div");
            courseCard.classList.add("course-card");
            courseCard.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <p><strong>Enrolled:<strong> ${course.enrolledStudents.length} / ${course.capacity}</p>
                <div class="actions">
                    <button class="enroll-btn" data-course-id="${course.id}" 
                        ${isEnrolled || !hasCapacity ? "disabled" : ""}>
                        ${isEnrolled ? "Already Enrolled" : (hasCapacity ? "Enroll" : "Full")}
                    </button>
                </div>
            `;
            availableCoursesElement.appendChild(courseCard);
        });
    }

    /** Renders the list of courses the current student is enrolled in. */
    function renderMyCourses(courses, currentUser) {
        myCoursesElement.innerHTML = ""; 
        const enrolledCourses = courses.filter(course => course.enrolledStudents.includes(currentUser.id));

        if (enrolledCourses.length === 0) {
            myCoursesElement.innerHTML = "<p>You are not enrolled in any courses yet.</p>";
            return;
        }

        enrolledCourses.forEach(course => {
            const courseCard = document.createElement("div");
            courseCard.classList.add("course-card");
            courseCard.innerHTML =  `
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <button class="unenroll-btn" data-course-id="${course.id}">Unenroll</button>
            `;
            myCoursesElement.appendChild(courseCard);
        });
    }

    /** Handles the click on an 'Enroll' button. */
    async function handleEnrollClick(event) {
        if (event.target.matches(".enroll-btn")) {
            const button = event.target;
            const courseId = button.dataset.courseId;
            const currentUser = getCurrentUser();

            // Find the course to get its current list of students
            const courses = await getAllCourses();
            const courseToEnroll = courses.find(c => c.id == courseId);
            
            if (courseToEnroll && currentUser) {
                const updatedStudents = [...courseToEnroll.enrolledStudents, currentUser.id];
                const success = await enrollInCourse(courseId, updatedStudents);
                if (success) {
                    loadStudentDashboard(); // Reload the entire dashboard
                }
            }
        }
    }

    /** Handles the click on an 'Unenroll' button. */
    async function handleUnenrollClick(event) {
        if (event.target.matches(".unenroll-btn")) {
            const courseId = event.target.dataset.courseId;
            const currentUser = getCurrentUser();
            const courses = await getAllCourses();
            const courseToUnenroll = courses.find(c => c.id == courseId);

            if (courseToUnenroll && currentUser) {
                // Create a new  array without the actual user
                const updatedStudents = courseToUnenroll.enrolledStudents.filter(studentId => studentId !== currentUser.id);
                const success = await unenrollFromCourse(courseId, updatedStudents);
                if (success) {
                    loadStudentDashboard(); // Recharge 
                }
            }
        }
    }

    /** Main function to fetch data and render the student dashboard. */
    async function loadStudentDashboard() {
        const currentUser = getCurrentUser();
        if (!currentUser) return; // Safety check

        const courses = await getAllCourses();
        renderAvailableCourses(courses, currentUser);
        renderMyCourses(courses, currentUser);
    }

    // --- ATTACH EVENT LISTENERS for the Student View ---
    availableCoursesElement.addEventListener("click", handleEnrollClick);
    myCoursesElement.addEventListener("click", handleUnenrollClick);

    // --- INITIAL DATA LOAD ---
    loadStudentDashboard();
}

// --- UI HELPER FUNCTIONS ---

/**
 * Updates the navigation bar links based on the user's authentication status and role.
 */
function renderNavbar() {
    const nav = document.getElementById("main-nav");
    if (!nav) return;

    const isAuth = isAuthenticated();
    const user = getCurrentUser();
    let navLinks = ""; // Start with an empty string of HTML links

    if (isAuth) {
        // --- Navigation for LOGGED-IN users ---
        navLinks += `<a href="/">Home</a> | `;
        if (user.role === "administrator") {
            navLinks += `<a href="/tasks">Course Management</a> | `;
        } else if (user.role === "student") {
            navLinks += `<a href="/student-dashboard">My Dashboard</a> | `;
        }
    } else {
        // --- Navigation for GUEST users ---
        navLinks = `<a href="/">Home</a> | <a href="/login">Login</a> | <a href="/register">Register</a>`;
    }
    nav.innerHTML = navLinks;
}

/**
 * Adds a logout button to the top of the app container if it doesn't already exist.
 */
function addLogoutButton() {
    if (document.getElementById("logout-btn")) return; // Prevent duplicates

    const logoutBtn = document.createElement("button");
    logoutBtn.id = "logout-btn";
    logoutBtn.textContent = "Logout";
    logoutBtn.addEventListener("click", () => {
        logOut();
        // After logging out, the navbar needs to be updated immediately
        renderNavbar();
        navigateTo("/login");
    });
    // Prepending ensures it appears at the top of the main content area
    appRoot.prepend(logoutBtn);
}

/**
 * Toggles a specific CSS class on the body element for dashboard views.
 * This allows for custom styling on wider layout pages.
 * @param {string} path - The current window path.
 */
function updateBodyClass(path) {
    const body = document.body;
    if (path === "/tasks" || path === "/student-dashboard") {
        body.classList.add("dashboard-view");
    } else {
        body.classList.remove("dashboard-view");
    }
}
