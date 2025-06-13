# Documentation for `backend/src/models/mongodb/prompt.ts`

## Overview

This module defines the Mongoose schema and the `Prompt` class for managing prompt configurations within the application. These prompts are likely used as templates or structured inputs for interacting with AI models. The module provides functionalities for creating, retrieving, updating, deleting, and listing prompts, with operations typically scoped by an `organization_id`. It also includes specialized methods for fetching prompts based on associated model IDs or application IDs, the latter with a security feature to limit exposed data.

## Key Components

1.  **Imports**:
    *   `mongoose`: The core Mongoose library for ODM functionalities with MongoDB.
    *   `Prompt as PromptInterface` from ` "@/interfaces/prompt"`: A TypeScript interface defining the expected structure of a prompt object, used for type safety, particularly in the `createPrompt` method.

2.  **`promptSchema` (Mongoose Model)**:
    *   This is the Mongoose model representing prompt configurations in the database. It is registered with Mongoose under the name "PromptX", which means the MongoDB collection will be named "promptxes".
    *   **Schema Definition**:
        *   `name`: `String` - A user-friendly name for the prompt (e.g., "Summarize Text").
        *   `description`: `String` - A brief description of what the prompt does or is used for.
        *   `model`: `String` - An identifier (likely a MongoDB `_id`) linking this prompt to a specific AI model configuration (defined elsewhere, e.g., in a "models" collection).
        *   `prompt_variables`: `mongoose.Schema.Types.Mixed` - A flexible field to store definitions of variables that can be used within the prompt template (e.g., `{"user_input": "string", "context": "string"}`).
        *   `model_parameters`: `mongoose.Schema.Types.Mixed` - Key-value pairs for parameters to be sent to the AI model when this prompt is used (e.g., `{"temperature": 0.7, "max_tokens": 1024}`).
        *   `prompt_data`: `mongoose.Schema.Types.Mixed` - The actual content or structure of the prompt itself. This could be a string template, a JSON object for chat models, or any other format the target AI model expects.
        *   `model_type`: `String` - The type of the associated AI model (e.g., "chat", "completion", "embedding"), which might influence how `prompt_data` is structured or processed.
        *   `organization_id`: `String` - An identifier that scopes this prompt to a specific organization, crucial for multi-tenant applications.
        *   `project`: `String` - An optional identifier to associate the prompt with a specific project within an organization.
        *   `app`: `String` - An optional identifier to link this prompt to a specific application, potentially a public-facing one.
    *   **Options**:
        *   `timestamps: true`: Automatically adds `createdAt` and `updatedAt` fields to each document, managed by Mongoose.

3.  **`Prompt` Class**:
    This class encapsulates methods for interacting with the `promptSchema`.
    *   `async createPrompt(promptData: PromptInterface, organization_id: string)`:
        *   Assigns the `organization_id` to the `promptData`.
        *   Creates a new prompt document and saves it.
        *   Returns the ID (as a string) of the newly created prompt.
    *   `async findPrompt(id: any, organization_id: string)`: Retrieves a prompt by its `_id` and `organization_id`. Returns a transformed prompt object or `null`.
    *   `async findPromptByName(name: any, organization_id: string)`: Retrieves a prompt by its `name` and `organization_id`. Returns a transformed prompt object or `null`.
    *   `async findPromptByModelId(modelId: string)`: Retrieves the first prompt found that is associated with the given `modelId`. Returns the raw Mongoose document.
    *   `async updatePrompt(updatedPrompt: any, organization_id: string)`: Updates an existing prompt identified by `updatedPrompt.id` and `organization_id`. If `updatedPrompt.app` is not provided, it explicitly sets the `app` field to `null`.
    *   `async deletePrompt(id: any, organization_id: string)`: Deletes a prompt document by its `_id` and `organization_id`. Returns the `id` of the deleted prompt.
    *   `async countPrompts(organization_id: string)`: Counts the total number of prompts belonging to an organization.
    *   `async listPrompts(organization_id: string)`: Retrieves a list of all prompts for a given `organization_id`. Each prompt in the list is transformed.
    *   `async findPromptByAppId(appId: string, unsecure = false)`:
        *   Finds a prompt associated with a specific `appId`.
        *   If `unsecure` is `true` (or any truthy value), it returns the full prompt object (after transformation).
        *   If `unsecure` is `false` (default), it returns a restricted object containing only `name`, `description`, and `prompt_variables`. This is a security measure to prevent exposing sensitive details (like `model_parameters` or full `prompt_data`) for prompts used in public applications.
    *   `transformPrompt(prompt: any)`: A utility method that converts a Mongoose prompt document into a plain JavaScript object and renames `_id` to `id`.

4.  **Exports**:
    *   The module exports both the `Prompt` class and the `promptSchema` (Mongoose model).

## Important Variables/Constants

*   `promptSchema`: The compiled Mongoose model for the "PromptX" collection (collection name will be "promptxes").
*   The `Prompt` class: The primary interface for managing prompt configurations.

## Usage Examples

**Creating a new prompt:**
```typescript
import { Prompt } from './prompt'; // Adjust path as necessary
import { Prompt as PromptInterface } from '@/interfaces/prompt'; // Adjust path

const promptOps = new Prompt();
const orgId = "org_epsilon_zeta";

const newPrompt: PromptInterface = {
  name: "Creative Story Idea Generator",
  description: "Generates a unique story concept based on keywords.",
  model: "model_id_for_claude3", // Link to an existing model configuration
  prompt_variables: { genre: "string", keywords: "array" },
  model_parameters: { temperature: 0.9, max_tokens: 300 },
  prompt_data: "Generate a story idea for a {{genre}} story using the following keywords: {{keywords.join(', ')}}.",
  model_type: "completion",
  organization_id: orgId,
  project: "project_alpha",
  app: "app_story_writer_public"
};

async function addPrompt() {
  try {
    const promptId = await promptOps.createPrompt(newPrompt, orgId);
    console.log("New prompt created with ID:", promptId);
  } catch (error) {
    console.error("Failed to create prompt:", error);
  }
}
```

**Fetching a prompt for public application use (securely):**
```typescript
async function getPublicPrompt(applicationId: string) {
  try {
    const promptDetails = await promptOps.findPromptByAppId(applicationId); // unsecure defaults to false
    if (promptDetails) {
      console.log("Prompt Name:", promptDetails.name);
      console.log("Variables expected:", promptDetails.prompt_variables);
    } else {
      console.log("No prompt found for this application ID.");
    }
  } catch (error) {
    console.error("Error fetching public prompt details:", error);
  }
}
```

## Dependencies and Interactions

*   **Mongoose**: The core ODM for all MongoDB interactions.
*   `@/interfaces/prompt` (`PromptInterface`): Provides TypeScript type definitions for prompt objects, enhancing code quality and developer experience.
*   **MongoDB Database**: All prompt configuration data is stored in and retrieved from a MongoDB collection named "promptxes" (due to model name "PromptX").
*   **Organization Context (`organization_id`)**: Most operations are scoped by `organization_id`, ensuring data isolation in a multi-tenant system.
*   **Model Configurations**: Prompts are linked to specific model configurations (stored elsewhere, likely in a "models" collection) via the `model` field, which stores the ID of the associated model.
*   **Application Context (`app` field)**: The `app` field and the `findPromptByAppId` method allow prompts to be tied to specific applications, with a mechanism to control the visibility of prompt details for security.

**Technical Notes**:
*   The Mongoose model name "PromptX" is unconventional and will result in a MongoDB collection named "promptxes". Standard practice is typically singular model names (e.g., "Prompt") leading to plural collection names (e.g., "prompts").
*   The use of `mongoose.Schema.Types.Mixed` for `prompt_variables`, `model_parameters`, and `prompt_data` provides flexibility but means Mongoose doesn't enforce a strict schema for these fields. This requires careful management at the application layer to ensure data consistency.
*   The `findPromptByAppId` method's `unsecure` flag is an important feature for controlling data exposure when prompts are used in potentially public-facing contexts.
*   The `updatePrompt` method's behavior of setting `app` to `null` if not provided in the input is a specific design choice for updates.
```
