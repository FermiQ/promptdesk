# Documentation for `backend/src/models/mongodb/organization.ts`

## Overview

This module defines the Mongoose schema and the `Organization` class for managing organizations within the application. It handles the creation of organizations, management of their API keys, configuration of Single Sign-On (SSO) providers, and definition of namespaces. Some methods are specifically noted as being intended for "self-hosted mode," suggesting different operational contexts for the application.

## Key Components

1.  **Imports**:
    *   `mongoose`: The primary library for MongoDB object data modeling.
    *   `crypto`: Node.js built-in module for cryptographic functions, used here to generate random names and API keys.

2.  **`organizationSchema` (Mongoose Model)**:
    *   This is the Mongoose model representing entries in the "organizations" collection in MongoDB.
    *   **Schema Definition**:
        *   `name`: `String` - The name of the organization.
        *   `keys`: `Array` - An array of objects, where each object represents an API key associated with the organization.
            *   `key`: `String` - The actual API key string.
            *   `description`: `String` - A textual description for the API key (e.g., "Default API Key").
        *   `sso`: `Array` - An array of objects, each defining a Single Sign-On (SSO) provider configuration.
            *   `provider`: `String` - Name of the SSO provider (e.g., "Okta", "Google", "AzureAD").
            *   `client_id`: `String` - The Client ID provided by the SSO provider.
            *   `authorization_endpoint`: `String` - The authorization endpoint URL for the SSO provider.
            *   `token_endpoint`: `String` - The token endpoint URL for the SSO provider.
            *   `scopes`: `String` - A string containing space-separated scopes required for SSO.
            *   `redirect_endpoint`: `String` - The callback/redirect URL registered with the SSO provider.
        *   `namespaces`: `Array` - An array of objects, each defining a namespace within the organization.
            *   `name`: `String` - The name of the namespace.
            *   `description`: `String` - A textual description of the namespace.
    *   **Options**:
        *   `timestamps: true`: Automatically adds `createdAt` and `updatedAt` fields to each document, managed by Mongoose.

3.  **`Organization` Class**:
    This class provides methods for interacting with the `organizationSchema`.
    *   `async saveSSO(ssoData: any, id: string)`: Updates the SSO configuration for an organization identified by `id`. It replaces the entire existing `sso` array with the provided `ssoData`.
    *   `async addOrganization(organization_api_key?: any)`: Creates a new organization.
        *   Generates a random name (e.g., `org-xxxxxxxxxxxx`).
        *   Generates a random API key unless an `organization_api_key` is provided.
        *   Saves the new organization with the generated name and the default API key.
        *   Returns the newly created organization object.
    *   `async getOrganization()`: Retrieves the *first* organization document found in the collection.
        *   **Note**: This method is explicitly mentioned as intended primarily for "self-hosted mode," implying a single-organization context.
        *   Returns the transformed organization object or `null` if no organizations exist.
    *   `async getOrganizationById(id: string)`: Fetches an organization by its MongoDB document `_id`. Returns the transformed organization or `null` if not found or an error occurs.
    *   `async getOrganizationByKey(key: string, name?: string)`: Finds an organization that has a matching API `key` within its `keys` array. Optionally, it can also filter by the organization's `name`. Returns the transformed organization or `null`.
    *   `async removeOrganization(id: string)`: Permanently deletes an organization document from the database by its `_id`. Returns the `id` of the removed organization.
    *   `async rotateApiKey(id: string)`: Generates a new random API key and attempts to update the organization.
        *   **Potential Issue**: This method tries to update a top-level field named `api_key` (`await organizationSchema.findByIdAndUpdate(id, { api_key: randomApiKey, });`). However, the schema stores API keys in an array: `keys: [{ key: String, ... }]`. This method, as written, will not correctly update the API key within the `keys` array and may add an unintended top-level `api_key` field to the document.
    *   `transformOrganization(organization: any)`: A utility method that converts a Mongoose organization document into a plain JavaScript object and renames `_id` to `id` (as a string).

4.  **Exports**:
    *   The module exports both the `Organization` class and the `organizationSchema` (Mongoose model).

## Important Variables/Constants

*   `organizationSchema`: The compiled Mongoose model for the "Organization" collection.
*   The `Organization` class: The primary interface for organization management logic.

## Usage Examples

**Creating a new organization:**
```typescript
import { Organization } from './organization'; // Adjust path as necessary

const orgManager = new Organization();

async function setupNewOrg() {
  try {
    const newOrg = await orgManager.addOrganization();
    console.log(`Organization created: ${newOrg.name}`);
    console.log(`Default API Key: ${newOrg.keys[0].key}`);
  } catch (error) {
    console.error("Failed to create organization:", error);
  }
}
```

**Retrieving an organization by its API key:**
```typescript
async function findOrgByApiKey(apiKey: string) {
  try {
    const org = await orgManager.getOrganizationByKey(apiKey);
    if (org) {
      console.log(`Found organization: ${org.name} (ID: ${org.id})`);
    } else {
      console.log("Organization not found for the given API key.");
    }
  } catch (error) {
    console.error("Error fetching organization by key:", error);
  }
}
```

## Dependencies and Interactions

*   **Mongoose**: Essential for all MongoDB interactions, including schema definition, model compilation, and database operations.
*   `crypto` (Node.js module): Used for generating random hexadecimal strings for organization names and API keys, ensuring uniqueness.
*   **MongoDB Database**: All organization data is stored in and retrieved from a MongoDB collection (conventionally "organizations").
*   **Application Mode (Self-Hosted vs. Cloud/Multi-tenant)**: Some methods like `getOrganization()` are designated for "self-hosted mode," suggesting that organization retrieval logic might differ in a multi-tenant cloud deployment (e.g., being tied to an authenticated user or session).
*   **API Key Authentication**: The `getOrganizationByKey` method implies that API keys stored within organizations are used for authenticating requests elsewhere in the system.

**Critical Note on `rotateApiKey`**:
The `rotateApiKey` method, as currently implemented, appears to have a functional bug. It attempts to set a single, top-level `api_key` field on the organization document. However, the `organizationSchema` defines API keys as an array of objects under the `keys` field (i.e., `keys: [{ key: "somekey", description: "desc" }]`). Therefore, the current `rotateApiKey` logic will not correctly update an existing key within this array or add a new key to it in the intended manner. It will instead add a new, unstructured `api_key` field at the root of the document, leaving the `keys` array untouched. This functionality needs review and correction to align with the schema design.
```
