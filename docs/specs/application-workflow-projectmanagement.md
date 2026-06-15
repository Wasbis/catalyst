# Application Workflow

## Overview

This application is an internal scheduling workspace built as a `Next.js 16` App Router monolith. The main runtime layers are:

- Server Components for page reads
- Client Components for interactive UI state
- Server Actions in `src/app/actions/*` for authenticated mutations
- Route Handlers in `src/app/api/*` for JSON and file-oriented endpoints
- A centralized data layer in `src/lib/datalayer.js`
- `Prisma ORM` backed by `SQL Server`

At a high level, the app combines workspace access control, project planning, ticket execution, timeline visibility, S-curve reporting, and lightweight collaboration in one protected workspace.

## Entry Flow

### 1. Root redirect

- Route: `/`
- File: `src/app/page.js`
- Behavior:
  - Calls `auth()` to inspect the current session.
  - If the user has a valid session, redirects to `getAuthenticatedRedirectPath(...)`.
  - Otherwise redirects to `/login`.

### 2. Login flow

- Route: `/login`
- File: `src/app/login/page.js`
- Behavior:
  - If a session already exists, redirects to the authenticated destination.
  - Shows Microsoft Entra sign-in when `AUTH_MICROSOFT_ENTRA_ID` and `AUTH_MICROSOFT_ENTRA_TENANT_ID` are configured.
  - Uses the browser MSAL bridge and exchanges the Entra ID token through Auth.js credentials flow.

- Route: `/login/local`
- File: `src/app/login/local/page.js`
- Behavior:
  - Supports local username/password login.
  - Intended for local-only workspace users and emergency local admin access.
  - Submits to `localLoginAction` in `src/app/actions/auth.js`.

### 3. Session creation and user hydration

- Main auth file: `src/auth.js`
- Behavior:
  - Auth.js uses `PrismaAdapter(prisma)`.
  - Session strategy is `jwt`.
  - Supported providers:
    - Local credentials
    - Microsoft Entra ID through a credentials-based ID-token exchange
  - JWT and session callbacks refresh the current user record from the database and persist:
    - `id`
    - `email`
    - `identityType`
    - `username`
    - `canCreateProject`
    - `isGlobalAdmin`
    - `authProvider`

### 4. Protected layout gating

- Layout: `src/app/(protected)/layout.js`
- Behavior:
  - Calls `getCurrentUser()` from the data layer.
  - `getCurrentUser()` depends on `requireCurrentSession()`.
  - If the session is missing or the user is inactive, the user is redirected to `/login`.
  - The resolved user object is passed into `AppShell`.

### 5. Welcome behavior

- Route: `/welcome`
- File: `src/app/welcome/page.js`
- Behavior:
  - Reserved for app-local accounts.
  - If the current user is not local-only, or can already use a local password, the page redirects to `/dashboard`.
  - Microsoft Entra users are provisioned automatically and go directly into the workspace.

## User Journey and Module Workflows

### Dashboard

- Route: `/dashboard`
- Page read: `getDashboardSummary()`
- Main purpose:
  - Show portfolio and personal workspace health in one place.
  - Aggregate active projects, focus tickets, recent activity, workload, and S-curve style summaries.
- Read behavior:
  - The server loads projects the user can access.
  - Global admins see all projects.
  - Other users are filtered through `ProjectMember`.
  - Management-specific dashboard content is only shown when the user matches the management visibility rule.
- Key outputs:
  - Personal dashboard summary
  - Attention projects
  - Project health
  - Dashboard portfolio timeline/S-curve data
  - Recent activity
  - Workload and watchlist data

### Projects list and project creation

- Route: `/projects`
- Page read: `getVisibleProjects()`
- Main purpose:
  - Show all projects visible to the current user.
  - Allow authorized users to create a new project.
- Creation behavior:
  - Mutation: `createProjectAction`
  - Permission:
    - `isGlobalAdmin`, or
    - `canCreateProject`
  - Flow:
    - Validates project fields.
    - Validates optional logo, background, and attachment uploads.
    - Generates a project code.
    - Creates the project through `createProjectWorkspace(...)`.
    - Automatically creates the creator as project `owner`.
    - Stores uploaded file metadata in `ProjectFile`.
    - Revalidates `/projects`, `/dashboard`, and project workspace routes.

### Project overview

- Route: `/projects/[projectId]`
- Page read: `getProjectDetail(projectId)`
- Main purpose:
  - Show project metadata, members, attachments, and recent activity.
- Access behavior:
  - All project reads first pass through `requireProjectAccess(projectId)`.
  - Global admins are treated as project owners.
  - Other users must have a visible membership role.
- Typical actions linked from this workspace:
  - Update project metadata
  - Close project
  - Reopen project
  - Navigate into board, timeline, S-curve, settings, and prepared modules

### Project settings and membership management

- Route: `/projects/[projectId]/settings`
- Page read: `getProjectSettings(projectId)`
- Main purpose:
  - Manage project members and ticket groups.
- Manager-only mutations:
  - `addProjectMemberAction`
  - `updateProjectMemberRoleAction`
  - `removeProjectMemberAction`
  - `createTicketGroupAction`
  - `updateTicketGroupAction`
  - `deleteTicketGroupAction`
- Membership rules:
  - Project roles are stored as numeric codes:
    - `1` = Guest
    - `2` = Member
    - `3` = Owner
  - Global admins always resolve to owner access.
  - Local-only users are forced to `Guest`.
  - Project creators cannot be removed from their own project unless a global admin intervenes.
- Ticket group rules:
  - Groups are project-scoped.
  - Deleting a group clears `ticketGroupId` from matching tickets before removing the group.

### Board workflow

- Route: `/projects/[projectId]/board`
- Page read: `getProjectBoard(projectId)`
- Main purpose:
  - Operate the project ticket board.
  - Create tickets, move tickets, filter by users/groups, manage groups, and run board imports.

#### Ticket lifecycle

The real implemented status flow is:

`Draft -> To Do -> Scheduled -> In Progress -> Done`

- `Draft`
  - Used when a non-owner creates a ticket.
  - Cannot be moved on the board until approved.
- `To Do`
  - Starting point for owner-created tickets.
  - Approval target for draft tickets.
- `Scheduled`
  - Intermediate planning state.
- `In Progress`
  - Active execution state.
- `Done`
  - Final board state.
  - Moving to `Done` automatically writes a `100%` progress log if needed.

#### Create ticket

- Mutation: `createTicketAction`
- Permission:
  - Any visible project role can create a ticket.
  - Owners create normal board tickets directly into `To Do`.
  - Guests and members create through `Draft`.
- Behavior:
  - Validates title, dates, weight, priority, assignees, assigners, and optional ticket group.
  - Confirms referenced users belong to the project.
  - Stores attachments in `TicketFile`.
  - Increments `Project.ticketSequence` and generates `ticketNumber`.
  - Writes a `TicketActivityLog` entry with action `created`.

#### Approve draft

- Mutation: `approveTicketAction`
- Permission:
  - Project owner access required through `requireProjectManager(projectId)`.
- Behavior:
  - Only `Draft` tickets can be approved.
  - Changes status from `Draft` to `To Do`.
  - Writes a `TicketActivityLog` entry with action `approved`.

#### Move ticket left and right

- Mutation: `moveTicketAction`
- Permission:
  - Uses `requireProjectMover(projectId)`.
  - Members can move tickets within allowed transitions.
  - Owners/global admins have the widest movement rights.
- Behavior:
  - Board movement is explicit and directional.
  - There is no drag-and-drop in the implemented workflow.
  - Draft tickets must be approved before movement.
  - Status changes create `TicketActivityLog` rows with action `status_changed`.

#### Board import

- Routes:
  - `GET/POST /api/projects/[projectId]/board-import`
  - `GET /api/projects/[projectId]/board-import/template`
  - `GET /api/projects/[projectId]/board-import/report`
- Main behavior:
  - Owner-only async import workflow.
  - Download an Excel template.
  - Upload `.xlsx` workbook.
  - Create a `TicketImportJob`.
  - Queue background processing in the Node runtime.
  - Poll job status through the API.
  - Download an error report if row failures exist.
- Imported board defaults:
  - Imported tickets always enter as `To Do`.
  - Assignees are not imported from the template.
  - Import progress is tracked by `Queued`, `Running`, `Completed`, and `Failed`.

### Ticket detail workflow

- Data route: `GET /api/projects/[projectId]/tickets/[ticketId]`
- Read function: `getProjectTicketDetail(projectId, ticketId)`
- Main purpose:
  - Load the richer modal/detail state for a single ticket.
- Data returned:
  - Ticket metadata
  - Assignees and assigners
  - Attachments
  - Ticket groups
  - Activity history
  - Progress history
  - Comments, replies, comment files, and reactions
  - Permission flags for the current viewer

#### Ticket detail edits

- Mutations:
  - `updateTicketAction`
  - `deleteTicketAction`
- Rules:
  - Owners can manage project tickets.
  - Draft creators can edit and delete their own draft tickets.
  - Updates create a `TicketActivityLog` entry with action `updated`.
  - Deletes create a `TicketActivityLog` entry with action `deleted`.

#### Progress logs

- Mutations:
  - `createTicketProgressAction`
  - `updateTicketProgressAction`
  - `deleteTicketProgressAction`
- Permission:
  - Owner-only through `requireProjectManager(projectId)`.
- Behavior:
  - Progress entries are stored in `TicketProgressLog`.
  - Optional detail rows are stored in `TicketProgressDetail`.
  - Optional workers per detail row are stored in `TicketProgressDetailWorker`.
  - Ticket `actualProgressPercent` is synchronized from the latest ordered progress log.
  - Progress mutations create `TicketActivityLog` entries:
    - `progress_added`
    - `progress_edited`
    - `progress_deleted`

#### Comments and reactions

- Mutations in `src/app/actions/ticket-comments.js`:
  - `createTicketCommentAction`
  - `updateTicketCommentAction`
  - `toggleTicketCommentReactionAction`
  - `deleteTicketCommentAction`
  - `restoreTicketCommentAction`
- Behavior:
  - Top-level comments and replies are both supported.
  - Attachments are stored in `TicketCommentFile`.
  - Emoji reactions are stored in `TicketCommentReaction`.
  - Deletion is soft-delete style at the comment level through `deletedAt` and `deletedById`.
  - Comment-related actions also write ticket activity entries.

### Timeline

- Route: `/projects/[projectId]/timeline`
- Page read: `getProjectTimeline(projectId)`
- JSON route: `GET /api/projects/[projectId]/timeline`
- Main purpose:
  - Visualize scheduled tickets across time and assignees.
- Timeline logic:
  - Only tickets with both `startDate` and `endDate` participate in the timeline range.
  - Timeline rows are grouped by assignee.
  - Tickets with no assignees are grouped under an `Unassigned` pseudo-row.
  - Timeline range expands to cover project dates and the latest scheduled ticket end date.

### S-curve

- Route: `/projects/[projectId]/scurve`
- Page read: `getProjectSCurve(projectId, options)`
- JSON route: `GET /api/projects/[projectId]/scurve`
- Export route: `GET /api/projects/[projectId]/scurve/export`
- Main purpose:
  - Show planned versus actual cumulative progress over time.
- Data sources:
  - Project dates
  - Ticket dates and weights
  - Ticket progress logs
  - Ticket activity history for real-actual interpretations
  - Optional ticket-group filtering
- Output behavior:
  - Returns plotted series data, progress events, planned end date, and excluded ticket counts.
  - Supports actual-mode validation in the API route.
  - Export route produces an Excel workbook using explicit mode, view, and reference-date parameters.

### Admin user management

- Route: `/admin/users`
- Page read: `getAdminUsers()`
- Main purpose:
  - Manage workspace users and access posture.
- Access rule:
  - Global admin only.
- Mutations:
  - `createUserAction`
  - `toggleUserActiveAction`
  - `toggleGlobalAdminAction`
  - `resetPasswordAction`
- Behavior:
  - Can create:
    - Local-only accounts
    - Microsoft-backed user records that activate on first Entra sign-in
  - Can enable or disable users.
  - Can grant or revoke global admin access.
  - Can reset passwords only for local-only accounts.

### Trusted integration project init

- Route: `POST /api/integrations/projects/init`
- Main library: `src/lib/integrations.js`
- Main purpose:
  - Allow trusted internal applications to seed a project in this workspace without writing directly to the database.
- Flow:
  - Caller authenticates with `Authorization: Bearer <token>`.
  - Token is matched against `APP_INTEGRATION_CLIENTS`.
  - Payload is validated.
  - Requester identity is upserted as a global user when needed.
  - Permissions are checked:
    - requester must be active
    - requester must be `isGlobalAdmin` or `canCreateProject`
  - The request is deduplicated by `(sourceApp, externalRequestId)`.
  - A project is created through `createProjectWorkspace(...)`.
  - Request and response snapshots are stored in `IntegrationProjectInitRequest`.

### Upload serving

- Route: `/uploads/[...segments]`
- File: `src/app/uploads/[...segments]/route.js`
- Main purpose:
  - Serve project, ticket, and comment attachments from `public/uploads`.
- Behavior:
  - Supports `GET` and `HEAD`.
  - Normalizes path segments and rejects unsafe traversal inputs.
  - Resolves content type from file extension.
  - Returns `404` for invalid or missing files.

## Transport Map

### Server Component reads through `src/lib/datalayer.js`

- `/dashboard` -> `getDashboardSummary()`
- `/projects` -> `getVisibleProjects()`
- `/projects/[projectId]` -> `getProjectDetail(projectId)`
- `/projects/[projectId]/board` -> `getProjectBoard(projectId)`
- `/projects/[projectId]/timeline` -> `getProjectTimeline(projectId)`
- `/projects/[projectId]/scurve` -> `getProjectSCurve(projectId)`
- `/projects/[projectId]/settings` -> `getProjectSettings(projectId)`
- `/admin/users` -> `getAdminUsers()`

### Server Actions in `src/app/actions/*`

- Auth and session:
  - `localLoginAction`
  - `completeMicrosoftOnboardingAction`
  - `logoutAction`
- Account:
  - `updateOwnProfileAction`
  - `changeOwnPasswordAction`
- Project workspace:
  - `createProjectAction`
  - `updateProjectAction`
  - `closeProjectAction`
  - `reopenProjectAction`
  - `addProjectMemberAction`
  - `updateProjectMemberRoleAction`
  - `removeProjectMemberAction`
  - `createTicketGroupAction`
  - `updateTicketGroupAction`
  - `deleteTicketGroupAction`
- Tickets:
  - `createTicketAction`
  - `updateTicketAction`
  - `deleteTicketAction`
  - `approveTicketAction`
  - `moveTicketAction`
  - `createTicketProgressAction`
  - `updateTicketProgressAction`
  - `deleteTicketProgressAction`
- Ticket comments:
  - `createTicketCommentAction`
  - `updateTicketCommentAction`
  - `toggleTicketCommentReactionAction`
  - `deleteTicketCommentAction`
  - `restoreTicketCommentAction`
- Admin:
  - `createUserAction`
  - `toggleUserActiveAction`
  - `toggleGlobalAdminAction`
  - `resetPasswordAction`

### API routes in `src/app/api/*`

- Auth:
  - `/api/auth/[...nextauth]`
- Health:
  - `/api/health`
- Integration:
  - `POST /api/integrations/projects/init`
- Ticket detail:
  - `GET /api/projects/[projectId]/tickets/[ticketId]`
- Timeline:
  - `GET /api/projects/[projectId]/timeline`
- S-curve:
  - `GET /api/projects/[projectId]/scurve`
  - `GET /api/projects/[projectId]/scurve/export`
- Board import:
  - `GET/POST /api/projects/[projectId]/board-import`
  - `GET /api/projects/[projectId]/board-import/template`
  - `GET /api/projects/[projectId]/board-import/report`

## Implemented vs Placeholder Modules

The following project workspace routes are prepared shells, not implemented business workflows yet:

- `/projects/[projectId]/mom`
  - Prepared for meeting minutes, decisions, action items, and follow-ups.
- `/projects/[projectId]/view-timesheet`
  - Prepared for viewing timesheet summaries and team activity.

These routes currently render `DevelopmentModulePage` placeholders and should not be treated as active modules in downstream documentation or integration work.
