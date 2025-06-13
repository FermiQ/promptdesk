# Documentation for `backend/src/routes/api/apps.ts`

## Overview

This module defines an Express router that handles API requests related to "apps." In this context, an "app" serves as a public-facing interface or endpoint for a specific prompt configuration. The router enables clients to fetch limited details of a prompt associated with an app and to submit data to that prompt to get a generated result. The generation process involves an internal, authenticated call to the `/api/generate` endpoint.

The base path for these routes is typically prefixed (e.g., `/api`), so endpoints would be `/api/apps/:id`.

## Key Components

1.  **Imports**:
    *   `express, { Request, Response }`: Core Express functionalities for routing and handling HTTP requests and responses.
    *   `Prompt, Organization` from `../../models/allModels`: Instances of the `Prompt` and `Organization` Mongoose model classes, used for database interactions.
    *   `request` from `supertest`: An HTTP assertion library, used here to make internal HTTP requests from this router to another endpoint (`/api/generate`) within the same Express application.

2.  **Router Setup**:
    *   `const router = express.Router();`: Initializes a new Express router.
    *   `const prompt_db = new Prompt();`: Creates an instance of the `Prompt` class for database operations related to prompts.
    *   `const organization_db = new Organization();`: Creates an instance of the `Organization` class for database operations related to organizations.

3.  **Endpoints**:

    *   **`GET /apps/:id`**
        *   **Purpose**: Retrieves publicly accessible information about a prompt associated with a given application ID (`appId`).
        *   **URL Parameter**: `id` - The application ID (`appId`) linked to a prompt.
        *   **Logic**:
            1.  Extracts `appId` from `req.params.id`.
            2.  Calls `prompt_db.findPromptByAppId(appId)`. By default (as per `prompt.ts` model logic), this method returns a "secure" version of the prompt, exposing only a limited set of fields suitable for public consumption (e.g., name, description, prompt variables, but not sensitive details like model parameters or full prompt data).
            3.  If no prompt is found for the `appId`, it responds with a `404 Not Found` and a JSON message.
            4.  If found, it responds with `200 OK` and the limited prompt data in JSON format.

    *   **`POST /apps/:id`**
        *   **Purpose**: Allows a client to submit data (prompt variables) to a prompt associated with an `appId` and receive a generated output. This endpoint acts as a proxy that internally calls the `/api/generate` endpoint.
        *   **URL Parameter**: `id` - The application ID (`appId`).
        *   **Request Body**: Expected to be a JSON object, typically containing a `prompt_variables` field with key-value pairs for the prompt. Example: `{"prompt_variables": {"user_query": "Tell me a joke"}}`
        *   **Logic**:
            1.  Initializes `supertest` client: `const client = request(req.app);` for making an internal request.
            2.  Extracts `appId` from `req.params.id` and `data` from `req.body`.
            3.  Fetches the **full, detailed** prompt configuration by calling `prompt_db.findPromptByAppId(appId, true)`. The `true` argument signifies that all prompt fields (including potentially sensitive ones) should be retrieved, as they are needed for the generation step.
            4.  If the prompt is not found, responds with `404 Not Found`.
            5.  Retrieves the organization details associated with the prompt using `organization_db.getOrganizationById(prompt.organization_id)`. This is done to obtain an API key for authenticating the internal call.
            6.  Updates the `prompt.prompt_variables` field with the variables provided in the client's request body.
            7.  **Internal Request Forwarding**:
                *   It then makes an internal `POST` request to `/api/generate` using the `supertest` client.
                *   The body of this internal request is the fully populated `prompt` object (including the injected variables).
                *   The `Authorization` header for this internal request is set to `Bearer <API_KEY>`, where `<API_KEY>` is the first key found in the `organization.keys` array (`organization.keys[0].key`).
            8.  **Response Handling**: The status code, `message`, and `error` from the response of the internal `/api/generate` call are then relayed back to the original client that called `POST /apps/:id`.

## Important Variables/Constants

*   `router`: The Express router instance managing the `/apps` routes.
*   `prompt_db`: An instance of the `Prompt` model class, used for database lookups of prompt configurations.
*   `organization_db`: An instance of the `Organization` model class, used for fetching organization details (primarily for API keys).

## Usage Examples

*   **Fetch public details of an app-linked prompt**:
    ```http
    GET /api/apps/app_identifier_123
    ```
    *(Assuming the main application uses `/api` as a prefix for this router)*

*   **Submit data to an app-linked prompt for generation**:
    ```http
    POST /api/apps/app_identifier_123
    Content-Type: application/json

    {
      "prompt_variables": {
        "topic": "renewable energy",
        "format": "a short poem"
      }
    }
    ```

## Dependencies and Interactions

*   **Express.js**: The web framework used to define and manage the routes.
*   **`Prompt` Model (`../../models/allModels`)**: Used to fetch prompt configurations based on `appId`. The behavior of `findPromptByAppId` (especially its "secure" vs "unsecure" mode) is critical.
*   **`Organization` Model (`../../models/allModels`)**: Used to fetch organization details to retrieve an API key for internal authentication.
*   **`supertest` library**: Used to make HTTP requests to an internal endpoint (`/api/generate`) within the same application. This facilitates treating the generation logic as a separate, callable service.
*   **`/api/generate` Endpoint (Internal)**: This is a crucial dependency. The `POST /apps/:id` endpoint is heavily reliant on `/api/generate` to perform the actual content generation. The `apps` router essentially prepares the data and authenticates the call to `/api/generate`.
*   **Authentication Mechanism**:
    *   The `POST /apps/:id` endpoint uses an API key from the prompt's owning organization to authenticate its internal call to `/api/generate`. This implies that the `/api/generate` endpoint itself requires API key-based authorization.
    *   The external call to `/apps/:id` does not appear to have its own authentication in this module, but it might be protected by middleware applied at a higher level in the Express application.
*   **Data Flow for `POST /apps/:id`**:
    1.  External client sends a POST request with `prompt_variables` to `/apps/:id`.
    2.  The `apps` router retrieves the full prompt configuration associated with `:id`.
    3.  It retrieves the organization linked to the prompt to get an API key.
    4.  It merges the client-provided `prompt_variables` into the fetched prompt configuration.
    5.  It makes an authenticated POST request to `/api/generate` with this complete prompt object.
    6.  The `/api/generate` endpoint processes the request and returns a JSON response (e.g., `{ "message": "Generated text...", "error": null }`).
    7.  The `apps` router forwards this JSON response (status, message, error) back to the external client.

**Security Notes**:
*   The `GET /apps/:id` endpoint correctly uses the "secure" mode of `findPromptByAppId` by default, which limits the exposure of potentially sensitive prompt configuration details.
*   The `POST /apps/:id` endpoint retrieves the full prompt details but does not expose them directly to the client. Instead, these details are used for the internal, authenticated call to `/api/generate`.
*   The use of the organization's first API key (`organization.keys[0].key`) for internal authentication is a simplification. In more complex scenarios, a dedicated internal service key or more sophisticated key selection logic might be used.
```
