# Domain Model Blueprint

## ORM Choice

- **Tooling:** Prisma ORM targeting PostgreSQL.
- **Why Prisma?** Type-safe client generation, first-class migration support, and smooth integration with NestJS via the `@nestjs/terminus` + Prisma module pattern. Prisma's schema syntax keeps the data model readable in reviews and mirrors what we want to demonstrate to hiring managers (strong typing, migrations, seeding scripts). The generated client also keeps service layers thin without sacrificing testability.
- **Trade-offs:** Prisma introduces a build step (`prisma generate`) and expects one-to-one ownership of schema management. We'll document how to keep it in sync with native SQL migrations if the project ever needs raw scripts.

## Core Entities

| Entity                              | Key Fields                                                                                                                                  | Notes                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **User**                            | `id`, `email`, `passwordHash`, `displayName`, `profileColor`, `createdAt`, `updatedAt`                                                      | Unique email, soft delete handled later. `profileColor` fuels avatar chips.                                                       |
| **Project**                         | `id`, `name`, `description`, `ownerId`, `status`, `createdAt`, `updatedAt`, `archivedAt`                                                    | Owner is the user who created the project. Status enum keeps roadmap visible.                                                     |
| **Membership**                      | `id`, `userId`, `projectId`, `role`, `joinedAt`, `invitedById`                                                                              | Connects users to projects with roles (`OWNER`, `ADMIN`, `CONTRIBUTOR`, `VIEWER`).                                                |
| **Task**                            | `id`, `projectId`, `assigneeId`, `title`, `description`, `priority`, `status`, `dueAt`, `position`, `createdAt`, `updatedAt`, `completedAt` | `position` supports Kanban ordering. `status` enum maps to columns.                                                               |
| **TaskActivity**                    | `id`, `taskId`, `actorId`, `type`, `payload`, `createdAt`                                                                                   | Captures timeline (status change, comment added, attachment uploaded, reassignment). `payload` is JSON with typed discriminators. |
| **Comment**                         | `id`, `taskId`, `authorId`, `body`, `createdAt`, `updatedAt`, `editedAt`, `deletedAt`                                                       | Soft delete for audit and reference.                                                                                              |
| **Attachment**                      | `id`, `taskId`, `uploaderId`, `fileName`, `fileSize`, `contentType`, `s3Key`, `createdAt`                                                   | Stores metadata; presigned URLs handle file I/O.                                                                                  |
| **Notification**                    | `id`, `userId`, `type`, `payload`, `readAt`, `createdAt`                                                                                    | Eventually fan-out via WebSockets/email.                                                                                          |
| **AuthToken**                       | `id`, `userId`, `refreshTokenHash`, `expiresAt`, `createdAt`                                                                                | Allows multi-session refresh tokens and revocation per device.                                                                    |
| **IntegrationSettings** _(stretch)_ | `id`, `projectId`, `aiEnabled`, `aiProvider`, `aiModel`, `aiApiKeyEncrypted`, `createdAt`                                                   | Keeps optional AI summary module configurable per project.                                                                        |

## Relationship Highlights

- `User` ↔ `Membership` ↔ `Project`: many-to-many with role metadata.
- `Task` belongs to `Project`; optional `assigneeId` referencing `Membership` (enforced via unique constraint on user/project pair to keep tasks assigned only to project members).
- `Comment`, `Attachment`, `TaskActivity` all hang off `Task` with cascade deletes but we will soft delete records for audit visibility.
- `Notification` references `User`; payload encodes the target entity (task, project, comment) for flexible rendering in the frontend.
- `AuthToken` stores hashed refresh tokens, enabling per-device logout without invalidating all sessions at once.

## Next Steps

1. Add Prisma to the backend package, scaffold initial schema reflecting the entities above, and generate migrations.
2. Introduce Dockerized PostgreSQL + Prisma migrate workflow (`pnpm db:migrate`, `pnpm db:seed`).
3. Wire NestJS modules (`PrismaModule`, `ConfigModule`) with environment-driven connection settings.

This doc will evolve as we shape concrete API requirements (e.g., task labels, checklists, workspace-level billing), but it anchors the core tables before we write migrations or services.
