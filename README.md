# Online Academy SPA - Course Management System

This project is a Single Page Application (SPA) designed to simulate an online course management platform. It's built from the ground up using modern vanilla JavaScript (ES6+), HTML5, and CSS, running on a Vite development server. The application features a complete client-side routing system, role-based authentication, and full CRUD (Create, Read, Update, Delete) functionality for course management, all interacting with a mock backend powered by `json-server`.

This project serves as a comprehensive demonstration of modern frontend architecture without relying on a major framework, showcasing best practices in code organization, state management, and API interaction.

## Features

- **Role-Based Authentication**: Separate login and registration flows for two distinct user types: **Administrator** and **Student**.
- **Persistent Sessions**: User login state is maintained across page reloads and browser sessions using `localStorage`.
- **Protected Routes**: The application's router guards routes based on user authentication status and role.
  - Unauthenticated users cannot access dashboards.
  - Authenticated users are redirected away from login/register pages.
- **Administrator Dashboard**:
  - **Full CRUD Functionality**: Administrators can **Create**, **Read**, **Update**, and **Delete** courses.
  - **Dynamic Forms**: The course creation form dynamically populates instructor data from the API.
  - **Edit Mode**: A seamless editing experience that repopulates the form for updates and includes a cancel option.
- **Student Dashboard**:
  - **View Courses**: Students can view a list of all available courses, including capacity and enrollment status.
  - **Enroll & Unenroll**: Students can enroll in courses with available capacity and unenroll from courses they are currently in. The UI updates dynamically to reflect these changes.
- **Client-Side Routing**: A custom-built router handles navigation between views (`/`, `/login`, `/register`, `/tasks`, etc.) without full page reloads, providing a smooth, app-like user experience.

## Tech Stack & Architecture

- **Frontend**:
  - **Vanilla JavaScript (ES6+)**: Utilizes modern features like `async/await`, `Modules` (import/export), `Classes`, and the Spread operator.
  - **HTML5 & CSS3**: For structure and styling.
  - **Vite**: Serves as the development server and build tool, providing a fast and modern development experience with Hot Module Replacement (HMR).
- **Backend (Mock API)**:
  - **`json-server`**: Simulates a complete RESTful API for a persistent backend, allowing for realistic data manipulation.
- **Architecture**:
  - **Single Page Application (SPA)**: All functionality is served from a single `index.html` file, with views dynamically injected by the router.
  - **Modular Design**: The codebase is organized into modules with clear responsibilities:
    - `models/`: For data structures (e.g., `Course`, `User` classes).
    - `views/`: Contains HTML templates for each page.
    - `controllers/`: Handles the business logic and communication between the UI and the API.
    - `services/` (represented by `auth.js`): Manages application-wide concerns like session state.
    - `router.js`: The central nervous system for navigation and view management.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later recommended)
- npm (comes with Node.js)
- `json-server` installed globally:

  ```bash
  npm install -g json-server
  ```

### Installation & Setup

1.  **Download the repository:**
  spa-courses-administration.zip


2.  **Install NPM packages:**
  ```bash
  npm install
  ```

3. **Run the Backend API Server:**
Open a new terminal window and run the following command from the project root. This will start the mock API on http://localhost:3000.
  ```bash
  json-server --watch db.json
  ```

4. **Run the Frontend Development Server:**
In your original terminal window, run the following command. This will start the Vite dev server, typically on http://localhost:5173.
  ```bash
  npm run dev
  ```

5. **Open the application:**
Open your browser and navigate to the local URL provided by Vite (e.g., http://localhost:5173).

## Credentials for Testing

You can use the following pre-configured users from db.json to test the application:

* Administrator:
    * Email: admin@academy.com
    * Password: admin123
* Student:
    * Email: student1@academy.com
    * Password: student123

You can also register new student accounts through the /register page.

## File Structure
``` bash
/spa-courses-administration
│
├── .gitignore
├── db.json
├── index.html
├── package-lock.json
├── package.json
├── README.md
│
├── node_modules/
│   └── ... (dependencies)
│
├── public/
│   └── vite.svg
│
└── src/
    ├── auth.js
    ├── main.js
    ├── router.js
    ├── style.css
    │
    ├── controllers/
    │   ├── authController.js
    │   └── courseController.js
    │
    ├── models/
    │   └── course.js
    │
    └── views/
        ├── 404.html
        ├── home.html
        ├── login.html
        ├── register.html
        ├── student-dashboard.html
        └── task.html
``` 
## Author

-   **Miguel Canedo Vanegas**
-   GitHub: `@Elimge` 
