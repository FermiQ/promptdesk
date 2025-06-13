# Documentation for `backend/src/models/mongodb/user.ts`

## Overview

This module defines the Mongoose schema and the `User` class for managing user accounts within the application. It provides fundamental functionalities for creating, finding, and deleting user records in a MongoDB database. User documents primarily store email, a password (which **must** be hashed by upstream logic), and an association to an organization.

## Key Components

1.  **Imports**:
    *   `mongoose`: The core Mongoose library for MongoDB object data modeling (ODM).

2.  **`userSchema` (Mongoose Model)**:
    *   This is the Mongoose model representing user documents in the "users" collection in MongoDB.
    *   **Schema Definition**:
        *   `password`: `String` - This field is intended to store the user's hashed password.
            *   **CRITICAL SECURITY NOTE**: Raw, plaintext passwords **must not** be stored. The application logic responsible for user creation **must** hash the password (e.g., using bcrypt or Argon2) *before* calling the `createUser` method. This module only stores the provided string.
        *   `email`: `String` - The user's email address. This is typically used as the primary identifier for login and should generally be unique.
        *   `organization_id`: `String` - An identifier that links the user to a specific organization, supporting multi-tenant architectures.
    *   **Options**:
        *   `timestamps: true`: Automatically adds `createdAt` and `updatedAt` fields to each user document, managed by Mongoose.

3.  **`User` Class**:
    This class encapsulates methods for interacting with the `userSchema`.
    *   `async findUser(email: any)`: Retrieves a single user document from the database that matches the provided `email`. Returns the Mongoose document if found, otherwise `null`.
    *   `async createUser(email: string, password: string, organization_id: string)`:
        *   Creates a new user document with the given `email`, `password` (which, again, must already be hashed), and `organization_id`.
        *   Saves the new user to the database.
        *   Returns the MongoDB `_id` (as a string) of the newly created user.
    *   `async findUsersByOrganizationId(organizationId: string)`: Retrieves an array of all user documents associated with the specified `organizationId`.
    *   `async deleteUserByEmail(email: string)`: Deletes a single user document that matches the provided `email`. Returns a boolean (`true` if the deletion was acknowledged by MongoDB, `false` otherwise).
    *   `async deleteUsers(emails: string[])`: Deletes all user documents whose `email` field is present in the provided `emails` array. Returns a boolean (`true` if the deletion operation was acknowledged, `false` otherwise).

4.  **Exports**:
    *   The module exports the `User` class. The `userSchema` itself is not exported directly but is used internally by the class.

## Important Variables/Constants

*   `userSchema`: The compiled Mongoose model for the "User" collection.
*   The `User` class: The primary interface for user data management.

## Usage Examples

**Creating a new user (with pre-hashed password):**
```typescript
import { User } from './user'; // Adjust path as necessary
// Assume hashPassword is an external utility, e.g., using bcrypt
// import { hashPassword } from '../utils/auth';

const userManager = new User();
const orgId = "org_kilo_lima";

async function registerNewUser(userEmail: string, plainTextPassword: string) {
  try {
    // const hashedPassword = await hashPassword(plainTextPassword); // Hashing step
    const hashedPassword = "hashed_password_example"; // Placeholder for actual hashed password
    const userId = await userManager.createUser(userEmail, hashedPassword, orgId);
    console.log("User created successfully with ID:", userId);
  } catch (error) {
    console.error("Failed to create user:", error);
  }
}
```

**Finding a user for login:**
```typescript
async function loginUser(userEmail: string, plainTextPassword: string) {
  try {
    const user = await userManager.findUser(userEmail);
    if (user) {
      // Assume verifyPassword is an external utility
      // const isValidPassword = await verifyPassword(plainTextPassword, user.password);
      const isValidPassword = (user.password === "hashed_" + plainTextPassword + "_example"); // Placeholder
      if (isValidPassword) {
        console.log("Login successful for user:", user.email);
        // Proceed with session creation, etc.
      } else {
        console.log("Invalid password.");
      }
    } else {
      console.log("User not found.");
    }
  } catch (error) {
    console.error("Error during login:", error);
  }
}
```

## Dependencies and Interactions

*   **Mongoose**: This is the fundamental dependency for all database interactions (schema definition, model compilation, CRUD operations).
*   **MongoDB Database**: All user data is stored in and retrieved from a MongoDB collection named "users".
*   **Organization Context (`organization_id`)**: Users are linked to organizations, enabling multi-tenancy and organizational grouping of users.
*   **Authentication Services (External)**: This module is responsible for storing and retrieving user credentials but **does not handle critical security aspects like password hashing or verification**. These operations must be performed by other parts of the application (e.g., an authentication service or auth middleware) before interacting with this user model for creation or after fetching user data for login.

**Security Considerations**:
*   **Password Hashing**: It cannot be overstated: the `password` field must store a cryptographically strong hash of the user's actual password. This module does not perform hashing. The calling code is responsible for this critical security step.
*   **Data Exposure**: The `findUser` method returns the entire user document, including the hashed password. While this is necessary for password verification by an authentication service, care must be taken not to inadvertently expose this hash in API responses or logs.
*   **Unique Email Constraint**: The schema does not explicitly define a unique index on the `email` field. While most applications would require emails to be unique, this constraint would need to be added to the schema for database-level enforcement or managed strictly at the application level during user registration.

This module provides the basic data layer for user management, forming a part of a larger authentication and user identity system.
```
