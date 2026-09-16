# Interactive Icon Audit

| Surface | Behavior | Status |
| --- | --- | --- |
| Sidebar search | Filters conversations or searches real users | Implemented |
| Sidebar plus | Opens the real People flow for a new conversation | Implemented |
| Sidebar theme | Toggles persisted light/dark theme | Implemented |
| Sidebar settings | Opens profile, password, appearance, notification, privacy, and logout settings | Implemented |
| Chat header search | Searches authorized conversation messages with results, highlighting, count, navigation, and Escape | Implemented |
| Chat header contact | Opens contact details panel | Implemented |
| Chat header more | Opens custom options menu; unsupported actions are labeled by toast | Implemented / honest unavailable states |
| Voice/video calls | Opens responsive call controls without claiming a connection | UI implemented; transport unavailable |
| Attachment | Opens file picker and previews selected file | Preview implemented; upload unavailable without media backend |
| GIF | Reports missing GIF provider through toast | Honest unavailable state |
| Emoji | Searchable picker inserts emoji into the composer | Implemented |
| Microphone | Requests permission and records locally with timer | Recording implemented; voice upload unavailable without media backend |
| Send | Sends text through existing REST and Socket.IO flow | Implemented |
| Message actions | Edit/delete confirmation, reply context, copy, local reaction | Implemented; reactions are not persisted by current backend |
| People | Real backend users, username/status, start-chat action | Implemented |
| Chat filters | All, unread, and groups with live counts | Implemented |
| Destructive dialogs | Reusable custom confirmation modal | Implemented |
| Toasts | Success/error feedback without browser dialogs | Implemented |
