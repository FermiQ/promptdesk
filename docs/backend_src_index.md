# Documentation for `backend/src/index.ts`

## Overview

This file is the main entry point for the backend server of the application. It sets up an Express server, configures middleware, defines API routes, handles static file serving, and manages different environments (development, test, production).

## Key Components

The script performs the following key operations:

1.  **Environment Configuration**:
    *   Detects the `NODE_ENV` (development, test, or production).
    *   Loads environment variables from corresponding `.env` files (`.env`, `.env.production.local`) using `dotenv`.

2.  **Express Application Initialization**:
    *   Creates an instance of the Express application.

3.  **Middleware Setup**:
    *   `cors`: Enables Cross-Origin Resource Sharing.
    *   `body-parser`: Parses incoming request bodies (URL-encoded and JSON), with a limit of 10mb.
    *   `helmet`: (Commented out in the provided code) Can be used to set various HTTP headers for security.
    *   `apiKeyMiddleware`: Custom middleware located in `./utils/authorization` to protect certain API routes.
    *   `publicAuth`: Custom authentication (`authenticate`, `checkAuth`) from `./utils/publicAuth` for public-facing routes.
    *   `express.json()`: Parses incoming JSON requests.
    *   `express.static()`: Serves static files from `./assets`, `./public`, and `./dist` directories.

4.  **API Routers**:
    *   Imports and uses various routers for different API endpoints under the `/api` prefix:
        *   `appsRouter`: For managing applications.
        *   `modelsRouter`: For machine learning models.
        *   `promptsRouter`: For prompt management.
        *   `generateRouter`: For content generation.
        *   `samplesRouter`: For samples.
        *   `logsRouter`: For logging.
        *   `variablesRouter`: For variables.
        *   `organizationRouter`: For organization settings.
        *   `usersRouter`: For user management.
        *   `embedRouter`: For embedding functionalities.
    *   A specific `apiKeyMiddleware` is applied to most `/api` routes after the initial `/api/apps` and before other specific API routes.

5.  **Route Handling**:
    *   `/ping`: A heartbeat route that responds with "pong". There are two such routes, one public and one after `apiKeyMiddleware`.
    *   `/api/*`: All undefined `/api` routes return a 404 error.
    *   `/apps/:id`: Serves `../public/apps.html`.
    *   `/`, `/prompts/:path(*)`: Serves `../dist/index.html` if it exists; otherwise, provides a message to build the frontend.
    *   `/workspace/:id`, `/workspace/:id/samples`, `/models/:id`, `/logs/:id`: Serve corresponding HTML files from the `../dist` directory.
    *   `/:filename`: Attempts to serve `../dist/[filename].html`; if not found, serves `../public/404.html`.
    *   `/*`: A catch-all route that serves `../public/404.html` for any other undefined paths.

6.  **Error Handling**:
    *   A custom 404 middleware is in place for routes not found.
    *   A custom error handler logs the error stack and sends a generic "500 Something broke!" message with a 500 status.

7.  **Server Listening**:
    *   Starts the server on the port defined by `process.env.PROMPT_SERVER_PORT` or defaults to `4000`.
    *   Logs messages indicating the internal and external server URLs upon successful startup.

## Important Variables/Constants

*   `environment (string)`: Stores the current `NODE_ENV` (e.g., "development", "test", "production").
*   `app (Express.Application)`: The instance of the Express application.
*   `port (number)`: The port on which the server is listening. Determined by `process.env.PROMPT_SERVER_PORT` or defaults to `4000`.

## Usage Examples

To run the server:

1.  Ensure necessary environment variables are set (e.g., in a `.env` file).
2.  Install dependencies using `npm install` or `yarn install`.
3.  Start the server using a command like `npm start` or `node src/index.js` (depending on `package.json` scripts).

Example interaction:
*   Accessing `http://localhost:<port>/ping` in a browser or with `curl` should return "pong".

## Dependencies and Interactions

**External Dependencies (npm packages):**

*   `express`: Web framework for Node.js.
*   `cors`: Middleware for enabling CORS.
*   `body-parser`: Middleware for parsing request bodies.
*   `dotenv`: For loading environment variables from `.env` files.
*   `path`: Node.js built-in module for handling file paths.
*   `fs`: Node.js built-in module for file system operations (used to check if `dist/index.html` exists).
*   `helmet`: (Currently commented out) For securing Express apps by setting various HTTP headers.

**Internal Modules & Files:**

*   `./utils/authorization`: Provides `apiKeyMiddleware` for API route protection.
*   `./utils/publicAuth`: Provides `authenticate` and `checkAuth` middleware for public routes.
*   `./routes/api/models`: Router for model-related API endpoints.
*   `./routes/api/prompts`: Router for prompt-related API endpoints.
*   `./routes/api/generate`: Router for generation-related API endpoints.
*   `./routes/api/samples`: Router for sample-related API endpoints.
*   `./routes/api/logs`: Router for log-related API endpoints.
*   `./routes/api/variables`: Router for variable-related API endpoints.
*   `./routes/api/organization`: Router for organization-related API endpoints.
*   `./routes/api/users`: Router for user-related API endpoints.
*   `./routes/api/embed`: Router for embed-related API endpoints.
*   `./routes/api/apps`: Router for app-related API endpoints.

**File System Interactions:**

*   Reads `.env` or `.env.production.local` for environment configuration.
*   Serves static files from:
    *   `./assets`
    *   `../public/` (e.g., `apps.html`, `404.html`)
    *   `../dist/` (e.g., `index.html`, `workspace/[id].html`)
*   Checks for the existence of `../dist/index.html` before serving it.

The application is exported as `app` for potential use in other modules (e.g., for testing).
