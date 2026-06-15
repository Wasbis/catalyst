# Database Schema

## Summary

The schema is defined in `prisma/schema.prisma` and currently contains 22 Prisma models. All app-owned primary keys use string UUIDs unless a model intentionally uses a composite or non-UUID key.

### Domain grouping

| Domain | Models |
| --- | --- |
| Auth and identity | `User`, `Account`, `Session`, `VerificationToken` |
| Project workspace | `Project`, `ProjectFile`, `ProjectMember`, `TicketGroup` |
| Ticket execution | `Ticket`, `TicketFile`, `TicketAssignee`, `TicketAssigner`, `TicketActivityLog`, `TicketProgressLog`, `TicketProgressDetail`, `TicketProgressDetailWorker` |
| Collaboration and comments | `TicketComment`, `TicketCommentFile`, `TicketCommentReaction` |
| Import, integration, and audit | `IntegrationProjectInitRequest`, `TicketImportJob`, `TicketImportRowError` |

## Schema conventions

- Database provider: `sqlserver`
- Prisma client generator: `prisma-client-js`
- UUID primary keys: `String @id @default(uuid())`
- Large text fields use `@db.NVarChar(Max)`
- Ticket weighting uses `@db.Decimal(18, 2)`
- Timestamp patterns:
  - `@default(now())` for creation timestamps
  - `@updatedAt` for modification timestamps
- Referential actions are explicit on relation fields and commonly use:
  - `onDelete: Cascade`
  - `onDelete: NoAction`
  - matching `onUpdate` behavior

## Auth and Identity

### `User`

- Purpose: Local application profile and authorization record for both Microsoft-backed and local-only users.
- Primary key: `id` UUID string
- Main relations:
  - Owns `Account` and `Session` records
  - Can create projects and tickets
  - Can belong to projects through `ProjectMember`
  - Can participate in assignment, progress, comments, reactions, imports, and integrations
- Uniques and indexes:
  - `@unique` on `username`
  - `@unique` on `email`
  - `@unique` on `globalSubject`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `username` | `String` | No | - | Unique login/display handle |
| `name` | `String` | No | - | Display name |
| `email` | `String` | No | - | Unique local profile email |
| `identityType` | `String` | No | `"local_guest"` | Distinguishes local-only vs global identity |
| `globalSubject` | `String` | Yes | - | Unique stable Entra subject when present |
| `homeTenantId` | `String` | Yes | - | Entra tenant identifier |
| `emailVerified` | `DateTime` | Yes | - | Verification timestamp |
| `image` | `String` | Yes | - | Optional avatar/profile image |
| `passwordHash` | `String` | Yes | - | Present for local-password accounts |
| `isActive` | `Boolean` | No | `true` | Workspace access gate |
| `canCreateProject` | `Boolean` | No | `false` | Workspace-level project creation permission |
| `isGlobalAdmin` | `Boolean` | No | `false` | Full workspace override |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |

### `Account`

- Purpose: Auth.js provider-account record tied to a local `User`.
- Primary key: composite `@@id([provider, providerAccountId])`
- Main relations:
  - Belongs to `User`
- Uniques and indexes:
  - Composite primary key on `(provider, providerAccountId)`
- Relation behavior:
  - `userId -> User.id` uses `onDelete: Cascade`, `onUpdate: Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `userId` | `String` | No | - | FK to `User.id` |
| `type` | `String` | No | - | Auth.js account type |
| `provider` | `String` | No | - | Part of composite PK |
| `providerAccountId` | `String` | No | - | Part of composite PK |
| `refresh_token` | `String @db.NVarChar(Max)` | Yes | - | Provider refresh token |
| `access_token` | `String @db.NVarChar(Max)` | Yes | - | Provider access token |
| `expires_at` | `Int` | Yes | - | Token expiration |
| `token_type` | `String` | Yes | - | Token type |
| `scope` | `String` | Yes | - | Provider scope |
| `id_token` | `String @db.NVarChar(Max)` | Yes | - | Provider ID token |
| `session_state` | `String` | Yes | - | Provider session metadata |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |

### `Session`

- Purpose: Auth.js persisted session record.
- Key shape: no explicit `@id`; the model relies on unique `sessionToken`
- Main relations:
  - Belongs to `User`
- Uniques and indexes:
  - `@unique` on `sessionToken`
- Relation behavior:
  - `userId -> User.id` uses `onDelete: Cascade`, `onUpdate: Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `sessionToken` | `String` | No | - | Unique session identifier |
| `userId` | `String` | No | - | FK to `User.id` |
| `expires` | `DateTime` | No | - | Session expiration |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |

### `VerificationToken`

- Purpose: Auth.js verification-token storage.
- Key shape: no explicit `@id`; uniqueness is enforced through `token` and `@@unique([identifier, token])`
- Main relations:
  - No explicit relational FKs
- Uniques and indexes:
  - `@unique` on `token`
  - `@@unique([identifier, token])`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `identifier` | `String` | No | - | Verification identity target |
| `token` | `String` | No | - | Unique token value |
| `expires` | `DateTime` | No | - | Expiration timestamp |

## Project Workspace

### `Project`

- Purpose: Top-level project workspace record.
- Primary key: `id` UUID string
- Main relations:
  - Created by `User`
  - Owns members, tickets, ticket groups, project files, import jobs, and integration request links
- Uniques and indexes:
  - `@unique` on `code`
- Relation behavior:
  - `createdById -> User.id` uses `onDelete: NoAction`, `onUpdate: NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `code` | `String` | No | - | Unique project code |
| `title` | `String` | No | - | Project title |
| `client` | `String` | Yes | - | Optional client label |
| `description` | `String @db.NVarChar(Max)` | Yes | - | Long-form description |
| `imageLogo` | `String` | Yes | - | Optional logo URL |
| `imageBackground` | `String` | Yes | - | Optional background image URL |
| `sharedToManagement` | `Boolean` | No | `false` | Management dashboard visibility flag |
| `startDate` | `DateTime` | No | - | Planned start date |
| `endDate` | `DateTime` | No | - | Planned end date |
| `endAt` | `DateTime` | Yes | - | Actual close/reopen state timestamp |
| `ticketSequence` | `Int` | No | `0` | Ticket-number counter |
| `createdById` | `String` | No | - | FK to creator |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |
| `archivedAt` | `DateTime` | Yes | - | Reserved archive timestamp |

### `IntegrationProjectInitRequest`

- Purpose: Audit and idempotency store for trusted cross-app project initialization.
- Primary key: `id` UUID string
- Main relations:
  - Optional link to requesting `User`
  - Optional link to created `Project`
- Uniques and indexes:
  - `@@unique([sourceApp, externalRequestId])`
  - `@@index([requestedByGlobalSubject])`
  - `@@index([requestedByUserId])`
  - `@@index([projectId])`
  - `@@index([status, createdAt])`
- Relation behavior:
  - `requestedByUserId -> User.id` uses `NoAction`
  - `projectId -> Project.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `sourceApp` | `String` | No | - | Calling application identifier |
| `externalRequestId` | `String` | No | - | Caller-side idempotency key |
| `requestedByGlobalSubject` | `String` | No | - | Trusted global identity subject |
| `requestedByUserId` | `String` | Yes | - | Optional FK to local user |
| `projectId` | `String` | Yes | - | Optional FK to created project |
| `requestPayloadJson` | `String @db.NVarChar(Max)` | No | - | Request snapshot |
| `responsePayloadJson` | `String @db.NVarChar(Max)` | Yes | - | Response snapshot |
| `status` | `String` | No | - | Request state |
| `errorMessage` | `String @db.NVarChar(Max)` | Yes | - | Failure detail |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |
| `completedAt` | `DateTime` | Yes | - | Completion timestamp |

### `ProjectFile`

- Purpose: Metadata for project logo, background, and attachment uploads.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Project`
- Uniques and indexes:
  - `@@index([projectId])`
- Relation behavior:
  - `projectId -> Project.id` uses `Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `projectId` | `String` | No | - | FK to `Project.id` |
| `name` | `String` | No | - | Stored display name |
| `originalName` | `String` | No | - | Original uploaded file name |
| `storedName` | `String` | No | - | Internal stored file name |
| `url` | `String` | No | - | Served upload URL |
| `mimeType` | `String` | No | - | Content type |
| `sizeBytes` | `Int` | No | - | File size |
| `kind` | `String` | No | - | `logo`, `background`, or `attachment` |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |

### `ProjectMember`

- Purpose: Project-scoped access mapping between users and projects.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Project`
  - Belongs to `User`
  - Optionally records the adding `User`
- Uniques and indexes:
  - `@@unique([projectId, userId])`
- Relation behavior:
  - `projectId -> Project.id` uses `Cascade`
  - `userId -> User.id` uses `NoAction`
  - `addedById -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `projectId` | `String` | No | - | FK to `Project.id` |
| `userId` | `String` | No | - | FK to `User.id` |
| `role` | `Int` | No | - | Project role code |
| `addedById` | `String` | Yes | - | Optional actor who granted access |
| `addedAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |

### `TicketGroup`

- Purpose: Project-level ticket grouping and color/sort metadata.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Project`
  - Referenced by many `Ticket` rows
- Uniques and indexes:
  - `@@unique([projectId, name])`
  - `@@index([projectId, sortOrder, name])`
- Relation behavior:
  - `projectId -> Project.id` uses `Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `projectId` | `String` | No | - | FK to `Project.id` |
| `name` | `String` | No | - | Group label, unique per project |
| `color` | `String` | No | - | UI color value |
| `sortOrder` | `Int` | No | `0` | Display order |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |

## Ticket Execution

### `Ticket`

- Purpose: Core work item record for board, timeline, S-curve, and collaboration workflows.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Project`
  - Optionally belongs to `TicketGroup`
  - References creator and updater users
  - Owns assignments, assigners, activity logs, progress logs, files, and comments
- Uniques and indexes:
  - `@unique` on `ticketNumber`
  - `@@index([projectId, status])`
  - `@@index([ticketGroupId])`
- Relation behavior:
  - `projectId -> Project.id` uses `Cascade`
  - `ticketGroupId -> TicketGroup.id` uses `NoAction`
  - `createdById -> User.id` uses `NoAction`
  - `updatedById -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `projectId` | `String` | No | - | FK to `Project.id` |
| `ticketGroupId` | `String` | Yes | - | Optional FK to `TicketGroup.id` |
| `ticketNumber` | `String` | No | - | Unique human-readable ticket number |
| `title` | `String` | No | - | Ticket title |
| `description` | `String @db.NVarChar(Max)` | Yes | - | Description |
| `startDate` | `DateTime` | Yes | - | Optional scheduled start |
| `endDate` | `DateTime` | Yes | - | Optional scheduled end |
| `additionalInfo` | `String @db.NVarChar(Max)` | Yes | - | Additional planning/execution notes |
| `weightPoints` | `Decimal @db.Decimal(18, 2)` | No | `1` | Weighted contribution to progress reporting |
| `actualProgressPercent` | `Int` | No | `0` | Latest synchronized actual progress |
| `priority` | `String` | No | `"Medium"` | Priority label |
| `status` | `String` | No | - | Board workflow state |
| `createdById` | `String` | No | - | FK to creator |
| `updatedById` | `String` | No | - | FK to last updater |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |

### `TicketProgressLog`

- Purpose: Time-based progress history for a ticket.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Ticket`
  - Optionally records the acting `User`
  - Owns `TicketProgressDetail`
- Uniques and indexes:
  - `@@index([ticketId, effectiveDate, recordedAt])`
- Relation behavior:
  - `ticketId -> Ticket.id` uses `Cascade`
  - `recordedById -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketId` | `String` | No | - | FK to `Ticket.id` |
| `progressPercent` | `Int` | No | - | Recorded actual progress |
| `effectiveDate` | `DateTime` | No | `now()` | Business-effective date |
| `recordedAt` | `DateTime` | No | `now()` | Write timestamp |
| `recordedById` | `String` | Yes | - | Optional recorder FK |

### `TicketProgressDetail`

- Purpose: Detail rows attached to a progress log entry.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `TicketProgressLog`
  - Owns `TicketProgressDetailWorker`
- Uniques and indexes:
  - `@@index([ticketProgressLogId])`
- Relation behavior:
  - `ticketProgressLogId -> TicketProgressLog.id` uses `Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketProgressLogId` | `String` | No | - | FK to progress log |
| `additionalInfo` | `String @db.NVarChar(Max)` | Yes | - | Optional progress detail note |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |

### `TicketProgressDetailWorker`

- Purpose: Join table assigning workers to a specific progress-detail row.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `TicketProgressDetail`
  - Belongs to `User`
- Uniques and indexes:
  - `@@unique([ticketProgressDetailId, userId])`
  - `@@index([ticketProgressDetailId])`
  - `@@index([userId])`
- Relation behavior:
  - `ticketProgressDetailId -> TicketProgressDetail.id` uses `Cascade`
  - `userId -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketProgressDetailId` | `String` | No | - | FK to progress detail |
| `userId` | `String` | No | - | FK to worker user |
| `addedAt` | `DateTime` | No | `now()` | Creation timestamp |

### `TicketFile`

- Purpose: Metadata for ticket attachments.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Ticket`
- Uniques and indexes:
  - `@@index([ticketId])`
- Relation behavior:
  - `ticketId -> Ticket.id` uses `Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketId` | `String` | No | - | FK to `Ticket.id` |
| `name` | `String` | No | - | Stored display name |
| `originalName` | `String` | No | - | Original uploaded name |
| `storedName` | `String` | No | - | Internal stored file name |
| `url` | `String` | No | - | Served upload URL |
| `mimeType` | `String` | No | - | Content type |
| `sizeBytes` | `Int` | No | - | File size |
| `kind` | `String` | No | - | Attachment kind |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |

### `TicketAssignee`

- Purpose: Join table for users assigned to a ticket.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Ticket`
  - Belongs to `User`
- Uniques and indexes:
  - `@@unique([ticketId, userId])`
- Relation behavior:
  - `ticketId -> Ticket.id` uses `Cascade`
  - `userId -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketId` | `String` | No | - | FK to `Ticket.id` |
| `userId` | `String` | No | - | FK to assignee user |
| `addedAt` | `DateTime` | No | `now()` | Creation timestamp |

### `TicketAssigner`

- Purpose: Join table for users associated as assigners on a ticket.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Ticket`
  - Belongs to `User`
- Uniques and indexes:
  - `@@unique([ticketId, userId])`
- Relation behavior:
  - `ticketId -> Ticket.id` uses `Cascade`
  - `userId -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketId` | `String` | No | - | FK to `Ticket.id` |
| `userId` | `String` | No | - | FK to assigner user |
| `addedAt` | `DateTime` | No | `now()` | Creation timestamp |

### `TicketActivityLog`

- Purpose: Immutable audit/history stream for ticket creation, updates, movement, approval, progress, and comment events.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Ticket`
  - Optionally records actor `User`
- Uniques and indexes:
  - `@@index([ticketId, createdAt])`
- Relation behavior:
  - `ticketId -> Ticket.id` uses `Cascade`
  - `actorId -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketId` | `String` | No | - | FK to `Ticket.id` |
| `actorId` | `String` | Yes | - | Optional acting user |
| `actionType` | `String` | No | - | Activity verb |
| `fromStatus` | `String` | Yes | - | Optional prior state |
| `toStatus` | `String` | Yes | - | Optional resulting state |
| `snapshotJson` | `String @db.NVarChar(Max)` | Yes | - | Event payload snapshot |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |

## Collaboration and Comments

### `TicketComment`

- Purpose: Ticket discussion thread record, including replies and soft-delete state.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Ticket`
  - Self-references for parent/reply trees
  - References author and optional deleting user
  - Owns comment files and reactions
- Uniques and indexes:
  - `@@index([ticketId, createdAt])`
  - `@@index([parentCommentId, createdAt])`
- Relation behavior:
  - `ticketId -> Ticket.id` uses `Cascade`
  - `parentCommentId -> TicketComment.id` uses `NoAction`
  - `authorId -> User.id` uses `NoAction`
  - `deletedById -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `ticketId` | `String` | No | - | FK to `Ticket.id` |
| `parentCommentId` | `String` | Yes | - | Optional parent comment FK |
| `authorId` | `String` | No | - | FK to author |
| `body` | `String @db.NVarChar(Max)` | No | - | Comment text |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |
| `deletedAt` | `DateTime` | Yes | - | Soft-delete timestamp |
| `deletedById` | `String` | Yes | - | Optional deleting user FK |

### `TicketCommentFile`

- Purpose: Metadata for files attached to ticket comments.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `TicketComment`
- Uniques and indexes:
  - `@@index([commentId])`
- Relation behavior:
  - `commentId -> TicketComment.id` uses `Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `commentId` | `String` | No | - | FK to `TicketComment.id` |
| `name` | `String` | No | - | Stored display name |
| `originalName` | `String` | No | - | Original uploaded name |
| `storedName` | `String` | No | - | Internal stored file name |
| `url` | `String` | No | - | Served upload URL |
| `mimeType` | `String` | No | - | Content type |
| `sizeBytes` | `Int` | No | - | File size |
| `kind` | `String` | No | - | Comment attachment kind |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |

### `TicketCommentReaction`

- Purpose: Emoji reactions per user per comment.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `TicketComment`
  - Belongs to `User`
- Uniques and indexes:
  - `@@unique([commentId, userId, emoji])`
  - `@@index([commentId])`
- Relation behavior:
  - `commentId -> TicketComment.id` uses `Cascade`
  - `userId -> User.id` uses `Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `commentId` | `String` | No | - | FK to `TicketComment.id` |
| `userId` | `String` | No | - | FK to reacting user |
| `emoji` | `String` | No | - | Reaction value |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |

## Import, Integration, and Audit

### `TicketImportJob`

- Purpose: Tracks a board import run for a project.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `Project`
  - Belongs to creator `User`
  - Owns row-error records
- Uniques and indexes:
  - `@@index([projectId, status, createdAt])`
  - `@@index([createdById, createdAt])`
- Relation behavior:
  - `projectId -> Project.id` uses `Cascade`
  - `createdById -> User.id` uses `NoAction`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `projectId` | `String` | No | - | FK to `Project.id` |
| `createdById` | `String` | No | - | FK to creator user |
| `fileName` | `String` | No | - | Source workbook name |
| `status` | `String` | No | - | Import job state |
| `totalRows` | `Int` | No | `0` | Workbook row count |
| `processedRows` | `Int` | No | `0` | Rows processed so far |
| `successRows` | `Int` | No | `0` | Rows imported successfully |
| `failedRows` | `Int` | No | `0` | Rows rejected |
| `startedAt` | `DateTime` | Yes | - | Execution start time |
| `finishedAt` | `DateTime` | Yes | - | Execution end time |
| `errorMessage` | `String @db.NVarChar(Max)` | Yes | - | Job-level error message |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |
| `updatedAt` | `DateTime` | No | `updatedAt` | Last update timestamp |

### `TicketImportRowError`

- Purpose: Captures row-level validation or import errors for a board import job.
- Primary key: `id` UUID string
- Main relations:
  - Belongs to `TicketImportJob`
- Uniques and indexes:
  - `@@index([jobId, createdAt])`
- Relation behavior:
  - `jobId -> TicketImportJob.id` uses `Cascade`

| Field | Prisma type / DB note | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | No | `uuid()` | Primary key |
| `jobId` | `String` | No | - | FK to import job |
| `rowNumber` | `Int` | No | - | Workbook row number |
| `title` | `String` | Yes | - | Optional row title snapshot |
| `message` | `String @db.NVarChar(Max)` | No | - | Error detail |
| `createdAt` | `DateTime` | No | `now()` | Creation timestamp |

## Relationship Summary

- `User` is the central identity record and fans out into auth accounts, sessions, project memberships, ticket authorship, assignment, progress recording, comments, reactions, imports, and trusted integration requests.
- `Project` is the main workspace root. It owns members, ticket groups, tickets, project files, ticket import jobs, and may be the result target of trusted integration requests.
- `Ticket` is the core execution object under a project. It connects scheduling data, board state, weight-based reporting, attachments, assignment joins, progress logs, comments, and activity history.
- Progress is modeled as a three-level chain:
  - `Ticket`
  - `TicketProgressLog`
  - `TicketProgressDetail`
  - `TicketProgressDetailWorker`
- Collaboration is modeled around `TicketComment`, which supports reply trees, file attachments, and per-user emoji reactions.
- Operational import and cross-app workflows are captured separately:
  - `TicketImportJob` and `TicketImportRowError` for board import processing
  - `IntegrationProjectInitRequest` for trusted project-init auditing and idempotency
