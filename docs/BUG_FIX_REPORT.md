# Bug Fix Challenge — Converse Chat Application

## Challenge Overview

This project is an existing full-stack chat application built with React and TypeScript on the frontend and Node.js/TypeScript on the backend. It includes authentication, private and group conversations, message history, conversation management, realtime delivery, and unread/read tracking.

The challenge requires a candidate to:

- work with an existing React application,
- work with an existing Node API,
- identify 10 intentional bugs,
- implement fixes for each issue,
- validate the corrected behavior manually,
- document the root causes and the resulting fix for each bug.

This final report contains exactly 10 core bugs and intentionally excludes toast-based notification work because those features were not implemented in the current project state.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + TypeScript |
| API | REST API |
| Realtime | Socket.IO |
| Database | MongoDB |
| Authentication | JWT |
| Build/Package | npm |

## 10-Bug Summary

| ID | Issue | Status |
|---|---|---|
| BUG-001 | New Conversation Required Refresh | VERIFIED |
| BUG-002 | User-Specific Chat Delete Did Not Preserve History Boundaries | VERIFIED |
| BUG-003 | Deleted Chat Restored Old History / Reopen Issue | VERIFIED |
| BUG-004 | Realtime Messages Were Lost Intermittently | VERIFIED |
| BUG-005 | Duplicate Socket.IO Connections After Reconnect | VERIFIED |
| BUG-006 | Fetch Responses Could Overwrite Realtime Messages | VERIFIED |
| BUG-007 | Active Conversation State Was Not Consistently Respected | VERIFIED |
| BUG-008 | Duplicate Message Handling | VERIFIED |
| BUG-009 | Read/Unread State Was Not Updated Correctly Per User | VERIFIED |
| BUG-010 | Composer Microphone/Recording Behavior | VERIFIED |

## BUG-001 — New Conversation Required Refresh

### Problem
Selecting a person from the People list and starting a new conversation did not always display that conversation immediately. The user could be forced to refresh the page before the new chat appeared.

### Root Cause
`useConversations()` was loading the conversation list asynchronously. A stale response from an earlier fetch could overwrite the newer local state after the conversation had already been created.

### Impact
Users could not reliably open a newly created conversation without refreshing the page, and the conversation list could temporarily show stale data.

### Fix
Added request-order protection so older list responses cannot overwrite newer state. The conversation flow now reloads authoritative data before selecting the newly created conversation, and the local create response is no longer allowed to replace the correct list state.

### Files Changed
- `frontend/src/hooks/useConversations.ts`
- `frontend/src/pages/ChatPage.tsx`

### Validation
VERIFIED — Manually tested in the application.

## BUG-002 — User-Specific Chat Delete Did Not Preserve History Boundaries

### Problem
Deleting a conversation for one user caused confusing history behavior because the shared conversation had no user-specific deletion boundary.

### Root Cause
The conversation-level visibility model did not preserve a per-user deletion timestamp. This meant the system could not distinguish messages created before and after deletion for a specific user.

### Impact
A deleted conversation could incorrectly expose old history or make the visibility state inconsistent across users.

### Fix
Added per-user `deletedAt` tracking on the conversation model and updated the filtering logic so message visibility respects the correct deletion boundary for the requesting user without globally deleting the shared conversation or messages.

### Files Changed
- `backend/src/models/Conversation.ts`
- `backend/src/services/conversationService.ts`
- `backend/src/services/messageService.ts`

### Validation
VERIFIED — Manually tested in the application.

## BUG-003 — Deleted Chat Restored Old History / Reopen Issue

### Problem
After a user deleted a chat, reopening it could restore old message history incorrectly, or new messages could fail to reopen the hidden conversation in the correct way.

### Root Cause
The old hidden-state flow removed the hide flag without preserving the correct deletion boundary. New-message logic also did not reliably restore hidden participants into the visible list.

### Impact
Old messages could reappear unexpectedly, and the conversation did not reliably reopen as intended after new activity occurred.

### Fix
The reopening flow preserves the user-specific deletion boundary while removing only the hidden state. When new messages are created, the participant is reopened in the visible list without losing the deletion timestamp. This keeps old messages filtered while allowing post-deletion conversation activity to show correctly.

### Files Changed
- `backend/src/models/Conversation.ts`
- `backend/src/services/conversationService.ts`
- `backend/src/services/messageService.ts`
- `frontend/src/hooks/useConversations.ts`
- `frontend/src/pages/ChatPage.tsx`

### Validation
VERIFIED — Manually tested in the application.

## BUG-004 — Realtime Messages Were Lost Intermittently

### Problem
A recipient sometimes did not receive a newly sent message until a page refresh. Sidebar state, unread counts, and message updates could also be inconsistent.

### Root Cause
The backend emitted messages only to the conversation room. Because conversation-room membership could be established asynchronously, a user could miss the event before joining that room.

### Impact
Realtime delivery was unreliable even when the REST request and database write succeeded.

### Fix
Added participant user-room delivery so messages are emitted to each authenticated participant’s user room, not only the conversation room. This ensures the recipient receives the event reliably, even if room joins are not yet fully synchronized.

### Files Changed
- `backend/src/socket/index.ts`
- `backend/src/socket/socketHandlers.ts`
- `backend/src/controllers/messageController.ts`
- `frontend/src/socket/socket.ts`
- `frontend/src/hooks/useConversations.ts`
- `frontend/src/hooks/useMessages.ts`

### Validation
VERIFIED — Manually tested in the application.

## BUG-005 — Duplicate Socket.IO Connections After Reconnect

### Problem
A temporary disconnect could cause a second Socket.IO client instance to be created, which increased the chance of duplicate listeners and duplicate event processing.

### Root Cause
The socket reuse logic only returned the cached socket if it was currently connected. During reconnect attempts, a cached socket could be replaced by a new client instance.

### Impact
Duplicate connections could lead to duplicate listeners, duplicate message events, and repeated unread or state updates.

### Fix
The socket connection logic now reuses the existing cached socket during reconnect state instead of creating another instance. Logout remains responsible for permanently disconnecting and clearing that socket.

### Files Changed
- `frontend/src/socket/socket.ts`

### Validation
VERIFIED — Manually tested in the application.

## BUG-006 — Fetch Responses Could Overwrite Realtime Messages

### Problem
A message received via Socket.IO during a pending history fetch could disappear when the fetch response completed and replaced the current message list.

### Root Cause
The message fetch flow replaced the current list with the server response instead of merging new realtime state with the existing message data.

### Impact
Messages could disappear, duplicate, or appear to arrive inconsistently during rapid interaction.

### Fix
History fetches are merged with the current in-memory message list by message ID and ordered by creation time, preserving realtime updates while maintaining a stable conversation history.

### Files Changed
- `frontend/src/hooks/useMessages.ts`

### Validation
VERIFIED — Manually tested in the application.

## BUG-007 — Active Conversation State Was Not Consistently Respected

### Problem
Messages received while switching conversations could be processed using stale active-conversation state. That led to inconsistent unread and read behavior.

### Root Cause
Message listener logic relied directly on the changing active state, which created timing gaps and could cause the wrong conversation to be treated as active.

### Impact
Incoming messages could be counted incorrectly, marked read incorrectly, or treated as active/inactive at the wrong time.

### Fix
The active conversation value is stored in a stable ref, and the listener uses that stable value instead of a changing reactive variable. This ensures message handling is consistent while the user changes chats.

### Files Changed
- `frontend/src/hooks/useConversations.ts`
- `frontend/src/hooks/useMessages.ts`

### Validation
VERIFIED — Manually tested in the application.

## BUG-008 — Duplicate Message Handling

### Problem
The same message could be processed more than once when multiple event paths or listeners were involved.

### Root Cause
Message delivery from multiple socket paths and component lifecycle updates created a risk of duplicate processing without a single deduplication gate.

### Impact
Users could see duplicate message bubbles, duplicate unread increments, and repeated state updates for the same message.

### Fix
Added message-ID deduplication in the conversation and message handling flow so each message is processed once and only appended once to the correct state.

### Files Changed
- `frontend/src/hooks/useConversations.ts`
- `frontend/src/hooks/useMessages.ts`
- `frontend/src/socket/socket.ts`

### Validation
VERIFIED — Manually tested in the application.

## BUG-009 — Read/Unread State Was Not Updated Correctly Per User

### Problem
Incoming messages did not always update the read/unread state correctly for the current user. The behavior differed depending on whether the conversation was active or inactive.

### Root Cause
The read/unread logic was not coordinated consistently across message receipt, conversation selection, and user-specific state updates.

### Impact
Users could see incorrect unread counts and messages could remain unread even after opening the conversation.

### Fix
The final behavior is coordinated as follows:

- When the user is inside the active conversation, the incoming message appears immediately, the unread count does not increase, and the message is treated as read.
- When the user is in another conversation, the conversation state updates, the unread count increases, and the message remains unread until the conversation is opened.

### Files Changed
- `backend/src/services/messageService.ts`
- `backend/src/controllers/conversationController.ts`
- `frontend/src/hooks/useConversations.ts`
- `frontend/src/hooks/useMessages.ts`
- `frontend/src/pages/ChatPage.tsx`
- `frontend/src/services/conversationService.ts`

### Validation
VERIFIED — Manually tested in the application.

## BUG-010 — Composer Microphone/Recording Behavior

### Problem
The composer exposed microphone/recording behavior that was not part of the expected message workflow. The submit control could act like a recording trigger instead of a send action.

### Root Cause
The message input and action button combined send behavior with recording state and media handling, which did not belong in the required chat composer flow.

### Impact
The UI was misleading and could request unsupported microphone features, creating a poor user experience and inconsistent action semantics.

### Fix
Removed the microphone/recording path and ensured the composer consistently presents a send action. Existing text-message sending, validation, emoji, attachment, and loading behavior remained intact without the unsupported recording features.

### Files Changed
- `frontend/src/components/chat/MessageInput.tsx`

### Validation
VERIFIED — Manually tested in the application.

## Supporting Engineering Improvements

### Realtime Diagnostic Logging

Development-only logging was added to support debugging of Socket.IO connection lifecycle, reconnect handling, room membership, message delivery, unread updates, and message processing. These logs are intended to help trace issues during realtime communication without exposing credentials or sensitive values.

This logging is a supporting engineering improvement and is not counted as one of the 10 core bugs.

## Debugging Approach

1. Reproduce the issue in the application.
2. Identify the affected frontend, backend, and realtime flow.
3. Inspect conversation state, message state, unread state, and socket events.
4. Trace the backend model and service logic for persistence and visibility rules.
5. Confirm the root cause before implementing a fix.
6. Apply the smallest targeted change to resolve the issue.
7. Manually validate the behavior in the application.
8. Document the fix and the validated outcome.

## Validation Summary

| ID | Test Scenario | Expected Result | Status |
|---|---|---|---|
| BUG-001 | Create new conversation | Conversation appears without refresh | VERIFIED |
| BUG-002 | Delete conversation for one user | History boundary is preserved for that user | VERIFIED |
| BUG-003 | Reopen deleted conversation | Old history does not reappear; new messages work | VERIFIED |
| BUG-004 | Send realtime message | Recipient receives message without refresh | VERIFIED |
| BUG-005 | Socket reconnect | Existing connection is reused correctly | VERIFIED |
| BUG-006 | Fetch while receiving realtime message | Realtime message is not overwritten | VERIFIED |
| BUG-007 | Receive message in active/inactive conversation | Correct read/unread behavior is applied | VERIFIED |
| BUG-008 | Duplicate message delivery | Message appears only once | VERIFIED |
| BUG-009 | Read/unread state | Correct user-specific read state is maintained | VERIFIED |
| BUG-010 | Composer behavior | Send action works without microphone recording path | VERIFIED |

## Future Improvements

- Realtime message toast notifications
- Click-to-open notifications
- Notification actions
- Advanced notification queue

## Challenge Completion Criteria

The candidate is expected to:

- identify all 10 intentional bugs,
- reproduce each issue,
- explain the root cause,
- implement a fix,
- verify the corrected behavior,
- avoid regressions,
- document each issue clearly.

## Candidate Submission Expectations

The candidate should submit:

- updated source code,
- bug and root-cause documentation,
- a list of changed files,
- validation results,
- any remaining limitations or future-work items.
