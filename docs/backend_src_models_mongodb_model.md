# Documentation for `backend/src/models/mongodb/model.ts`

## Overview

This module defines the Mongoose schema and a corresponding `Model` class for managing configurations of external models, primarily AI/ML models or other API-based services. It allows the application to store details about how to interact with these external services, including API endpoints, parameters, and data transformation rules. Operations are scoped by organization, supporting a multi-tenant architecture.

## Key Components

1.  **Imports**:
    *   `mongoose`: The primary library used for MongoDB object data modeling (ODM).

2.  **`modelSchema` (Mongoose Model)**:
    *   This is the Mongoose model that represents entries in the "models" collection in MongoDB.
    *   **Schema Definition**:
        *   `name`: `String` - A user-friendly name for the model configuration (e.g., "OpenAI GPT-4 Turbo").
        *   `type`: `String` - The type of model, which could categorize its function (e.g., "chat", "completion", "embedding").
        *   `provider`: `String` - The name of the entity providing the model (e.g., "OpenAI", "Anthropic", "Google").
        *   `api_call`: `Object` - Contains details for making API requests to the external model/service.
            *   `url`: `String` - The endpoint URL for the API.
            *   `method`: `String` - The HTTP method (e.g., "POST", "GET").
            *   `headers`: `mongoose.Schema.Types.Mixed` - A flexible field to store key-value pairs for API request headers (e.g., Authorization tokens, Content-Type).
        *   `input_format`: `String` - A description or schema defining the expected input format for this model.
        *   `output_format`: `String` - A description or schema defining the expected output format from this model.
        *   `model_parameters`: `mongoose.Schema.Types.Mixed` - Key-value pairs for parameters specific to the external model (e.g., `temperature`, `max_tokens`, `top_p`).
        *   `default`: `Boolean` - A flag to indicate if this model configuration is the default for its organization.
        *   `organization_id`: `String` - An identifier that scopes this model configuration to a specific organization.
        *   `deleted`: `Boolean` - A flag for implementing soft deletes. If `true`, the model is considered inactive.
        *   `request_mapping`: `mongoose.Schema.Types.Mixed` - Rules, templates, or scripts for transforming the application's internal data structure into the format required by the external model's API.
        *   `response_mapping`: `mongoose.Schema.Types.Mixed` - Rules, templates, or scripts for transforming the external model's API response into a standardized format for the application.
    *   **Options**:
        *   `timestamps: true`: Automatically adds `createdAt` and `updatedAt` fields to each document, managed by Mongoose.

3.  **`Model` Class**:
    This class provides methods for interacting with the `modelSchema`.
    *   `db = modelSchema`: An instance property that holds a reference to the `modelSchema` Mongoose model.
    *   `async createModel(modelData: any, organization_id: string)`:
        *   Assigns the `organization_id` to the `modelData`.
        *   Creates a new model document using `new modelSchema(modelData)` and saves it.
        *   Returns the ID (as a string) of the newly created model.
    *   `async findModel(id: any, organization_id: string)`:
        *   Retrieves a single model document by its `_id` and `organization_id`, ensuring `deleted` is not `true`.
        *   Returns the transformed model object (via `this.transformModel`) or `null` if not found.
    *   `async findModelByName(name: string, organization_id: string)`:
        *   Retrieves a single model document by its `name` and `organization_id`, ensuring `deleted` is not `true`.
        *   Returns the transformed model object or `null`.
    *   `async updateModelById(updatedModel: any, organization_id: string)`:
        *   Updates an existing model document identified by `updatedModel.id` and `organization_id` with the provided `modelData`.
    *   `async deleteModel(id: any, organization_id: string)`:
        *   Performs a soft delete by setting the `deleted` flag to `true` for the specified model.
        *   Returns the `id` of the deleted model.
    *   `async countModels(organization_id: string)`:
        *   Counts the number of non-deleted model documents for a given `organization_id`.
    *   `async listModels(organization_id: string)`:
        *   Retrieves a list of all non-deleted model documents for a given `organization_id`.
        *   Each model in the list is transformed by `this.transformModel`.
    *   `transformModel(model: any)`:
        *   A utility method that converts a Mongoose model document into a plain JavaScript object.
        *   It renames the `_id` field to `id` (as a string) for easier consumption by clients.

4.  **Exports**:
    *   The module exports both the `Model` class and the `modelSchema` (Mongoose model).

## Important Variables/Constants

*   `modelSchema`: The compiled Mongoose model for the "Model" collection.
*   The `Model` class: Serves as the main interface for managing model configurations.

## Usage Examples

**Defining a new AI model configuration:**
```typescript
import { Model } from './model'; // Adjust path as necessary

const modelOps = new Model();
const organizationId = "org_alpha_beta";

const newModelConfig = {
  name: "Claude 3 Opus",
  type: "chat",
  provider: "Anthropic",
  api_call: {
    url: "https://api.anthropic.com/v1/messages",
    method: "POST",
    headers: {
      "x-api-key": "$ANTHROPIC_API_KEY",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    }
  },
  model_parameters: {
    max_tokens: 4096,
    temperature: 0.8
  },
  request_mapping: { /* ... transformation logic ... */ },
  response_mapping: { /* ... transformation logic ... */ }
};

async function addModel() {
  try {
    const modelId = await modelOps.createModel(newModelConfig, organizationId);
    console.log("New model configuration created with ID:", modelId);
  } catch (error) {
    console.error("Failed to create model configuration:", error);
  }
}
```

**Listing all active models for an organization:**
```typescript
async function listOrgModels(orgId: string) {
  try {
    const models = await modelOps.listModels(orgId);
    models.forEach(m => console.log(m.name, m.provider, m.type));
  } catch (error) {
    console.error("Failed to list models:", error);
  }
}
```

## Dependencies and Interactions

*   **Mongoose**: This is the core dependency for all database operations, including schema definition, model compilation, data validation, and CRUD operations.
*   **MongoDB Database**: All model configuration data is persisted in and retrieved from a MongoDB collection (by default named "models" by Mongoose, based on the "Model" singular name). An active MongoDB connection is required.
*   **Organization Context**: The `organization_id` field in the schema and its use in nearly all class methods indicate that model configurations are isolated per organization, a key feature for multi-tenant applications.
*   **External APIs (Conceptual)**: The schema fields like `api_call`, `request_mapping`, and `response_mapping` imply that these stored model configurations are used by other parts of the application (e.g., a proxy service or generation service) to make calls to external APIs, particularly those of AI model providers. The actual API calls are not made by this module but are configured through it.
*   **Data Transformation Logic (Conceptual)**: `request_mapping` and `response_mapping` fields suggest that there's associated logic elsewhere in the system that interprets these rules to adapt data to and from the external API's specific format.

**Technical Notes**:
*   The use of `mongoose.Schema.Types.Mixed` for fields like `headers`, `model_parameters`, `request_mapping`, and `response_mapping` provides flexibility for storing varied and complex configurations. However, it bypasses Mongoose's type validation for these fields and can make targeted querying within these structures more complex.
*   The soft delete pattern (`deleted: true`) is employed, meaning model configurations are not permanently removed from the database upon deletion, allowing for potential recovery or auditing.
*   The `transformModel` method ensures a consistent and client-friendly object structure (string `id` instead of Mongoose `_id` object) when model data is retrieved.
```
