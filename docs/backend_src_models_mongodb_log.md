# Documentation for `backend/src/models/mongodb/log.ts`

## Overview

This module defines the MongoDB data model (schema) and associated business logic for application logging. It uses Mongoose to interact with a "logs" collection. The `Log` class provides a structured way to create, retrieve, filter, and manage log entries, which can store diverse information including messages, raw data payloads, error indicators, status codes, performance metrics (duration), and associations with other entities like models and prompts.

## Key Components

1.  **Imports**:
    *   `mongoose`: The core Mongoose library for ODM functionalities.
    *   `modelSchema` from `./model`: The Mongoose model for "models" (likely ML models or similar entities), used to fetch model names for log enrichment.
    *   `Prompt as mongoPrompt`, `promptSchema` from `./prompt`: The Mongoose model for "prompts," used to fetch prompt names for log enrichment.

2.  **`logSchema` (Mongoose Model)**:
    *   This is the Mongoose model representing log entries in the database. It's created by calling `mongoose.model("Log", new mongoose.Schema(...))`.
    *   **Schema Definition**:
        *   `message`: `mongoose.Schema.Types.Mixed` - Flexible field for storing log messages or structured data.
        *   `raw`: `mongoose.Schema.Types.Mixed` - For storing raw request/response payloads or other unstructured data.
        *   `data`: `mongoose.Schema.Types.Mixed` - Another flexible field for arbitrary structured data.
        *   `error`: `Boolean` - Flag indicating if the log entry pertains to an error.
        *   `status`: `Number` - Typically an HTTP status code or other numerical status.
        *   `model_id`: `String` - Identifier linking the log to a specific model (e.g., an ML model used in a transaction).
        *   `deleted`: `Boolean` - Soft deletion flag, defaults to `false`. Ensures logs are archived rather than permanently removed.
        *   `prompt_id`: `String` - Identifier linking the log to a specific prompt.
        *   `organization_id`: `String` - Identifier for scoping the log to a particular organization (supporting multi-tenancy).
        *   `duration`: `Number` - Records the time taken for the logged operation, likely in milliseconds.
        *   `hash`: `String` - A hash value associated with the log entry, potentially for uniqueness, caching, or quick lookups.
    *   **Options**:
        *   `timestamps: true`: Automatically adds `createdAt` and `updatedAt` fields to each log document, managed by Mongoose.

3.  **`Log` Class**:
    This class encapsulates methods for interacting with the `logSchema` model.
    *   `async createLog(logData: any, organization_id: string)`:
        *   Assigns `organization_id` to the `logData`.
        *   Validates `logData.prompt_id`; if it's not a valid MongoDB ObjectId, it's set to `undefined`.
        *   Creates a new log document using `new logSchema(logData)` and saves it.
        *   Returns the ID of the newly created log entry as a string.
    *   `async findLog(id: any, organization_id: string)`:
        *   Retrieves a single log document by its `_id` and `organization_id`, excluding those marked as `deleted: true`.
        *   Transforms the result using `this.transformLog` before returning. Returns `null` if not found.
    *   `async getLogDetails(organization_id: string)`:
        *   Fetches distinct `model_id`s, `prompt_id`s, and `status` codes from logs belonging to the specified `organization_id`.
        *   Looks up names for these `model_id`s and `prompt_id`s from `modelSchema` and `promptSchema` respectively. If a name isn't found, the ID itself is used.
        *   Returns an object containing arrays of these distinct values, formatted as `{ name: 'Name/ID', value: 'ID' }`.
    *   `async getLogs(page: any, limit = 10, organization_id: string, prompt_id?: string, model_id?: string, status?: number)`:
        *   Provides paginated access to logs.
        *   Filters logs based on `organization_id`, and optionally by `prompt_id`, `model_id`, and `status`.
        *   Handles a special case where `prompt_id === "undefined"` to query for logs with no `prompt_id`.
        *   Sorts logs by `createdAt` in descending order.
        *   Calculates statistics: total count, average duration, and success rate (percentage of logs with status 200).
        *   Returns a structured object with pagination details (`page`, `per_page`, `total`, `total_pages`), the list of `data` (transformed logs), and `stats`.
    *   `async findLogByHash(hash: string, organization_id: string)`:
        *   Retrieves a single non-deleted log document by its `hash` and `organization_id`.
    *   `async deleteLog(id: any, organization_id: string)`:
        *   Performs a soft delete by setting `deleted: true` for the log matching the given `id` and `organization_id`.
    *   `transformLog(log: any)`:
        *   A utility method that converts a Mongoose log document into a plain JavaScript object.
        *   It renames `_id` to `id` (as a string) for consistency in API responses.

4.  **Exports**:
    *   The module exports both the `Log` class and the `logSchema` (Mongoose model).

## Important Variables/Constants

*   `logSchema`: The compiled Mongoose model for the "Log" collection.
*   The `Log` class itself serves as the primary interface for log operations.

## Usage Examples

**Creating a log entry:**
```typescript
import { Log } from './log'; // Adjust path as necessary

const logger = new Log();
const logData = {
  message: "API request processed.",
  raw: { requestBody: { foo: "bar" }, responseBody: { success: true } },
  status: 200,
  model_id: "model_123",
  prompt_id: "prompt_abc",
  duration: 150, // ms
  hash: "unique_request_hash"
};
const organizationId = "org_xyz";

async function recordLog() {
  try {
    const logId = await logger.createLog(logData, organizationId);
    console.log("Log created with ID:", logId);
  } catch (error) {
    console.error("Failed to create log:", error);
  }
}
```

**Fetching paginated logs with statistics:**
```typescript
async function fetchOrgLogs(orgId: string, currentPage: number) {
  try {
    const result = await logger.getLogs(currentPage, 10, orgId);
    console.log("Logs:", result.data);
    console.log("Total Logs:", result.total);
    console.log("Stats:", result.stats);
  } catch (error) {
    console.error("Failed to fetch logs:", error);
  }
}
```

## Dependencies and Interactions

*   **Mongoose**: This is the fundamental dependency for all database interactions, including schema definition, model compilation, and CRUD operations.
*   **`./model` (`modelSchema`)**: The `getLogDetails` method queries the collection associated with `modelSchema` to enrich `model_id` fields with actual model names.
*   **`./prompt` (`promptSchema`)**: Similarly, `getLogDetails` queries the collection associated with `promptSchema` to enrich `prompt_id` fields with prompt names.
*   **MongoDB Database**: All log data is stored in and retrieved from a MongoDB collection, conventionally named "logs" (Mongoose pluralizes "Log"). The application must have an active connection to a MongoDB instance.
*   **Organization Context**: A strong dependency on `organization_id` for most operations signifies a multi-tenant architecture where logs are strictly segregated by organization.
*   **Data Types (`mongoose.Schema.Types.Mixed`)**: The use of `Mixed` for `message`, `raw`, and `data` fields allows for storing highly variable data structures. However, this can impact query performance and data consistency if not managed carefully. It's harder to index and query specific sub-fields within `Mixed` types.

This module provides a comprehensive system for logging within the application, complete with data storage, retrieval, and analytical capabilities.
```
