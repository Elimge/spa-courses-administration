
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

// --- Core Router Functions ---

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
 * Initializes the logic for the login form.
 * This function should be called AFTER a view with the login form is loaded.
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
            renderNavbar();
            // On successful login, navigate to the main dashboard
            navigateTo("/tasks");
        } else {
            alert("Invalid credentials. Please try again");
        }
    });
}

function initializeRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.querySelector("#register-email").value;
    const password = form.querySelector("#register-password").value;

    // Call the controller to handle the registration
    const success = await handleRegister(email, password);

    if (success) {
      alert("Registration successful! Please log in.");
      // On success, redirect the user to the login page
      navigateTo("/login");
    } 
    // The handleRegister function already shows an alert for existing users
  });
}

/** 
 * Initializes all logic for the admin course management view.
 */
async function initializeTasksView(user) {
    // --- DOM Element Selectors ---
    const courseListElement = document.getElementById("course-list");
    const courseForm = document.getElementById("course-form");

    // Safety check
    if (!courseListElement || !courseForm) return;

    // Populates the instructor dropdown select element. 
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

    // --- Render Function ---
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

    // --- Event Handlers ---
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
                courseForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    // Handles the submission of the new course form
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

        // Sprint 1
        // // Validation to ensure fields are not empty
        // if (!title || !description || !category || !capacity || !instructorId) {
        //     alert("Please fill out all fields.");
        //     return; // Stop the function if validation fails
        // }

        // // Create a new instance of the Course model.
        // const newCourse = new Course(title, description, category, capacity, instructorId);

        // // Call the controller function to send the data to the API
        // const createdCourse = await createCourse(newCourse); 

        // // Handle the result
        // if (createdCourse) {
        //     console.log("Course created successfully: ", createdCourse);
        //     // If the course was created, reload the list to show the new course.
        //     loadAdminDashboard();
        //     // Reset the form fields for the next entry.
        //     courseForm.reset(); 
        // } else {
        //     // If the controller returned null, it was an error.
        //     alert("Failed to create the course. Please check the console for errors.");
        // }
    }

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

    // --- Initial Load ---
    async function loadAdminDashboard() {
        // We can fetch both requests in parallel for better performance!
        const [courses, instructors] = await Promise.all([
            getAllCourses(),
            getAllInstructors()
        ]);
    
        renderCourses(courses);
        populateInstructorSelect(instructors);
    }

    // async function loadAndRenderCourses() {
    //     const courses = await getAllCourses();
    //     renderCourses(courses);
    // }

    // --- Attach Event Listeners ---
    courseListElement.addEventListener("click", handleCourseListClick);
    courseForm.addEventListener('submit', handleCourseFormSubmit);
    
    // Call the initial load
    loadAdminDashboard();
    //loadAndRenderCourses();
}

/**
 * Initializes all logic for the student dashboard view.
 */
async function initializeStudentDashboard(user) {
    // --- DOM Element Selectors ---
    const availableCoursesElement = document.getElementById("student-course-list");
    const myCoursesElement = document.getElementById("my-courses-list");
    if (!availableCoursesElement || !myCoursesElement) return; 

    // --- Render Functions ---
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

    // --- Event Handler ---
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

    // --- Initial load --- 
    async function loadStudentDashboard() {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const courses = await getAllCourses();
        renderAvailableCourses(courses, currentUser);
        renderMyCourses(courses, currentUser);
    }

    // Listeners
    availableCoursesElement.addEventListener("click", handleEnrollClick);
    myCoursesElement.addEventListener("click", handleUnenrollClick);
    loadStudentDashboard();
}


/**
 * Handles the routing logic based on the current URL patch.
 * It acts as a bouncer, checking credentials before loading a view
 */
export async function handleLocation() {
    renderNavbar();
    const path = window.location.pathname;
    const isAuth = isAuthenticated();
    const user = getCurrentUser();

    // Body classes
    const body = document.body;
    if (path === '/tasks' || path === '/student-dashboard') {
        body.classList.add('dashboard-view');
    } else {
        body.classList.remove('dashboard-view');
    }

    // --- AUTHENTICATION GUARDS ---
    // If isn"t authenticated can"t look the protected views.
    if (!isAuth && (path === "/tasks" || path === "/student-dashboard")) {
        console.log("Access Denied: Not authenticated. Redirecting to /login.");
        navigateTo("/login");
        return; // Stop here.
    }
    // If is authenticated can"t look login and register views.
    if (isAuth && (path === "/login" || path === "/register")) {
        console.log("Access Denied: Already authenticated. Redirecting to dashboard.");
        navigateTo("/tasks"); // Redirect to /tasks.
        return; 
    }

    // --- DECISION PHASE: Determine which view and logic to execute ---
    let viewPath;
    let viewInitializer = null;

    if (path === "/" || path === "/home") {
        viewPath = routes["/"];
    } else if (path === "/login") {
        viewPath = routes["/login"];
        viewInitializer = initializeLoginForm;
    } else if (path === "/register") {
        viewPath = routes["/register"];
        viewInitializer = initializeRegisterForm;
    } else if (path === "/tasks") {
        // The /tasks route depends on the user"s role.
        if (isAuth && user.role === "administrator") {
            viewPath = routes["/tasks"];
            viewInitializer = () => initializeTasksView(user);
        } else if (isAuth && user.role === "student") {
            // A student accessing /tasks is redirected to their own dashboard.
            navigateTo("/student-dashboard");
            return; // Stop here so the new navigation can take over.
        }
    } else if (path === "/student-dashboard") {
        //  Only students are allowed to access this page.
        if (isAuth && user.role === "student") {
            viewPath = routes["/student-dashboard"];
            viewInitializer = () => initializeStudentDashboard(user);
        } else {
            // Any other user is redirected accordingly
            navigateTo(isAuth ? "/tasks" : "/login");
            return;
        }
    } else {
        // If no route matches, show the 404 page..
        viewPath = routes["/404"];
    }

    // --- EXECUTION PHASE: Load the view and associated logic ---
    await loadView(viewPath);
    
    // If we previously assigned an initializer, run it now.
    if (viewInitializer) {
        viewInitializer();
    }

    //  Add the Logout button dynamically ---
    if (isAuth) {
        // Check if it already exists to avoid adding it on every navigation.
        if (!document.getElementById("logout-btn")) {
            const logoutBtn = document.createElement("button");
            logoutBtn.id = "logout-btn";
            logoutBtn.textContent = "Logout";
            logoutBtn.addEventListener("click", () => {
                logOut();
                renderNavbar();
                navigateTo("/login");
            });
            // Add it to the top of the main container.
            appRoot.prepend(logoutBtn);
        }
    }
}

/**
 * Renders the main navigation bar based on authentication status and user role.
 */
function renderNavbar() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const isAuth = isAuthenticated();
    const user = getCurrentUser();

    let navLinks = ''; // Start with an empty string of HTML links

    if (isAuth) {
        // --- Navigation for LOGGED-IN users ---
        navLinks += `<a href="/">Home</a> | `;
        
        if (user.role === 'administrator') {
            navLinks += `<a href="/tasks">Course Management</a> | `;
        } else if (user.role === 'student') {
            navLinks += `<a href="/student-dashboard">My Dashboard</a> | `;
        }

        // The logout button is handled separately by handleLocation
        // but you could also add a placeholder here if you wanted.

    } else {
        // --- Navigation for GUEST users ---
        navLinks += `<a href="/">Home</a> | `;
        navLinks += `<a href="/login">Login</a> | `;
        navLinks += `<a href="/register">Register</a>`;
    }

    nav.innerHTML = navLinks;
}

/** 
 * Navigates to a new path and updates the view.
 * @param {string} path - The path to navigate to (e.g., "/tasks").
 */
export function navigateTo(path) {
    // Use the History API to the change the URL without a full page reload.
    window.history.pushState({}, "", path); 
    // Manually call the location handler to render the new view. 
    handleLocation();
}

/**
 * Initializes the router by setting up event listeners.
 */
// export function initializeRouter() {
//     // Listen for clicks on any link in the document.
//     document.addEventListener("click", e => {
//         // Check if the clicked element is a link.
//         if (e.target.matches("a[href]")) {
//             e.preventDefault(); // Prevent the default browser navigation (full reload).
//             navigateTo(e.target.getAttribute("href")); // Use our custom navigation.
//         }
//     });

//     // Handle browser back/forward buttons.
//     window.addEventListener("popstate", handleLocation);

//     // Use DOMContentLoaded to ensure the app-root element exists before we start
//     document.addEventListener("DOMContentLoaded", () => {
//         handleLocation();
//     });
// }
// INITIALIZE NOW EN MAIN.JS


