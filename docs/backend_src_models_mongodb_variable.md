# Documentation for `backend/src/models/mongodb/variable.ts`

## Overview

This module defines the Mongoose schema and the `Variable` class for managing sets of configuration variables on a per-organization basis. The design suggests that each organization has a single MongoDB document that stores an array of its key-value variable pairs. The module provides methods to create, update, retrieve, and delete these sets of variables for an organization.

## Key Components

1.  **Imports**:
    *   `mongoose`: The core Mongoose library for MongoDB object data modeling.

2.  **`variableSchema` (Mongoose Model)**:
    *   This is the Mongoose model representing documents in the "variables" collection. Each document holds all variables for a single organization.
    *   **Schema Definition**:
        *   `data`: `Array` - An array of objects, where each object represents a single key-value variable.
            *   `name`: `String` - The name (key) of the variable (e.g., "API_URL", "FEATURE_FLAG_X").
            *   `value`: `String` - The value associated with the variable name.
        *   `organization_id`: `String` - The identifier that links this set of variables to a specific organization.
            *   **Design Note**: For the intended one-document-per-organization model to be robust, this field should ideally have a unique index in a production environment.
    *   **Options**:
        *   `timestamps: true`: Automatically adds `createdAt` and `updatedAt` Mongoose-managed timestamps to each document.

3.  **`Variable` Class**:
    This class encapsulates methods for interacting with the `variableSchema`.
    *   `async createVariables(data_list: any, organization_id: string)`:
        *   Creates a new document in the `variables` collection, storing the provided `data_list` (an array of variable objects) and associating it with the `organization_id`.
        *   Returns the `_id` (as a string) of the newly created document.
        *   **Important Design Consideration**: This method, as written, will create a new document each time it's called, even if one already exists for the `organization_id`. This may lead to multiple variable documents for the same organization, while other methods (`updateVariables`, `getVariables`) assume only one.
    *   `async updateVariables(data_list: any, organization_id: string)`:
        *   Finds the *first* document matching the `organization_id`.
        *   Updates the `data` field of this document with the new `data_list`, effectively replacing the entire set of variables.
        *   If no document exists for the `organization_id`, this method will likely not perform an update (as `variables` would be null and `id` undefined).
    *   `async getVariables(organization_id: string)`:
        *   Retrieves the *first* document matching the `organization_id`.
        *   If found, it returns the `data` array from the document. Each object within this array has its automatically generated Mongoose `_id` field removed for a cleaner output.
        *   If no document is found for the organization, it returns an empty array `[]`.
    *   `async deleteVariables(organization_id: string)`:
        *   Deletes the *first* document found that matches the `organization_id`.

4.  **Exports**:
    *   The module exports both the `Variable` class and the `variableSchema` (Mongoose model).

## Important Variables/Constants

*   `variableSchema`: The compiled Mongoose model for the "Variable" collection.
*   The `Variable` class: The primary interface for managing organization-specific variables.

## Usage Examples

**Setting up initial variables for an organization:**
```typescript
import { Variable } from './variable'; // Adjust path as necessary

const varManager = new Variable();
const orgId = "org_zeta_chi";

const initialOrgVariables = [
  { name: "S3_BUCKET_NAME", value: "my-app-bucket-prod" },
  { name: "EMAIL_SERVICE_API_KEY", value: "key_xxxxxxxxxxxx" }
];

async function setupOrgVars() {
  try {
    // This assumes no variables exist yet, or that creating duplicates is handled/avoided by application logic
    const docId = await varManager.createVariables(initialOrgVariables, orgId);
    console.log("Variables document created with ID:", docId);
  } catch (error) {
    console.error("Failed to create variables:", error);
  }
}
```

**Updating and retrieving variables:**
```typescript
async function manageOrgVars(orgId: string) {
  try {
    const currentVars = await varManager.getVariables(orgId);
    console.log("Current Variables:", currentVars);

    const newSetOfVars = [
      { name: "S3_BUCKET_NAME", value: "my-app-bucket-main" }, // Updated value
      { name: "EMAIL_SERVICE_API_KEY", value: "key_yyyyyyyyyyyy" }, // Updated value
      { name: "NEW_CONFIG_MAX_USERS", value: "100" } // New variable
    ];
    await varManager.updateVariables(newSetOfVars, orgId);
    console.log("Variables updated.");

    const updatedVars = await varManager.getVariables(orgId);
    console.log("Updated Variables:", updatedVars);
  } catch (error) {
    console.error("Failed to manage variables:", error);
  }
}
```

## Dependencies and Interactions

*   **Mongoose**: The core ODM for all MongoDB interactions.
*   **MongoDB Database**: All variable data is stored in and retrieved from a MongoDB collection named "variables".
*   **Organization Context (`organization_id`)**: Variables are strictly scoped by `organization_id`. The current implementation of class methods largely assumes that each organization will have at most one document in the "variables" collection where its array of variables is stored.

**Design Considerations and Potential Issues**:
*   **Single Document per Organization**: The methods `updateVariables`, `getVariables`, and `deleteVariables` are designed to work with a single document per `organization_id` (they use `findOne` or `deleteOne`). However, `createVariables` does not enforce this uniqueness. If `createVariables` is called multiple times for the same `organization_id`, it will result in multiple documents, and the other methods will only act on the first one found (which can be unpredictable without explicit sorting).
    *   **Recommendation**: To enforce one variable document per organization, a **unique index** should be added to the `organization_id` field in `variableSchema`. Alternatively, the `createVariables` method should be modified to perform an "upsert" (update if exists, insert if not) operation, or `updateVariables` should handle creation if no document is found.
*   **Data Structure**: Storing all variables for an organization as an array within a single document is a common pattern. This is generally efficient for a moderate number of variables. If an organization could have an extremely large number of variables (thousands), leading to very large documents, alternative data modeling approaches might be considered, though MongoDB's 16MB document size limit is substantial.
*   **Output Cleaning**: The `getVariables` method thoughtfully removes the Mongoose-specific `_id` field from each item in the `data` array before returning, providing a cleaner data structure to the application.
```
