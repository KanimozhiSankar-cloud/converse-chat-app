# Converse — Real-Time Chat Application

A full-stack, real-time chat application supporting one-to-one and group
messaging, live presence (online/offline) status, and persistent message
history — built with React, TypeScript, Express, Socket.IO, and MongoDB.

## 1. Project Overview

Converse lets registered users search for other people, start private
conversations, create group chats, and exchange messages instantly over
WebSockets. All messages, users, and conversations are persisted in
MongoDB, so history survives refreshes and restarts. Presence (who's
online right now) is tracked live via Socket.IO rather than polling.

## 2. Features

- Email/password authentication with JWT and bcrypt password hashing
- Username registration, password confirmation, forgot-password, and reset-password flow
- Profile updates and authenticated password changes
- Protected routes on both the API and the frontend
- One-to-one conversations with real-time delivery
- Group conversations with multi-user selection at creation time
- Live online/offline presence, reflected in the sidebar and chat header
- Unread message counts per conversation, cleared on open
- Message history persisted in MongoDB and reloaded on refresh
- Timestamps, sender identification, auto-scroll to the latest message
- Loading, empty, and error states throughout the UI
- Responsive mobile conversation navigation and message edit/delete actions
- Clean modular architecture on both frontend and backend

## 3. Tech Stack

**Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, Axios,
Socket.IO Client, Lucide React icons

**Backend:** Node.js, Express, TypeScript, Socket.IO, MongoDB, Mongoose,
JWT, bcrypt, dotenv, CORS

## 4. Architecture Overview

- **Backend** follows a layered architecture: `routes → controllers →
  services → models`. Socket.IO event handling lives in its own `socket/`
  module, completely separate from REST controllers, though both call the
  same service functions to avoid duplicated business logic.
- **Frontend** separates concerns into `services` (API calls),
  `context` (auth + socket state), `hooks` (data-fetching + real-time
  logic), and `components` (presentational UI), so pages stay thin.

## 5. Folder Structure

```text
chat-app/
├── backend/
│   ├── src/
│   │   ├── config/        # env loading, MongoDB connection
│   │   ├── controllers/   # thin request handlers
│   │   ├── middleware/    # auth, error handling, validation
│   │   ├── models/        # Mongoose schemas (User, Conversation, Message)
│   │   ├── routes/        # Express routers
│   │   ├── services/      # business logic, used by controllers & sockets
│   │   ├── socket/        # Socket.IO server, auth, and event handlers
│   │   ├── types/         # shared/augmented TypeScript types
│   │   ├── utils/         # ApiError, JWT helpers, async handler, seed script
│   │   ├── app.ts         # Express app setup
│   │   └── server.ts      # HTTP + Socket.IO bootstrap
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/       # ProtectedRoute
    │   │   ├── chat/       # ConversationListItem, ChatWindow, MessageBubble, etc.
    │   │   ├── layout/     # Sidebar
    │   │   └── common/     # Avatar, Spinner, EmptyState, ErrorBanner
    │   ├── pages/          # LoginPage, RegisterPage, ChatPage
    │   ├── layouts/        # AuthLayout
    │   ├── hooks/          # useConversations, useMessages, useDebouncedValue
    │   ├── services/       # axios API clients
    │   ├── context/        # AuthContext, SocketContext
    │   ├── socket/         # socket.io-client wrapper
    │   ├── types/          # shared TypeScript interfaces
    │   ├── utils/          # formatting helpers
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## 6. Prerequisites

- Node.js 18+ and npm
- A running MongoDB instance — either:
  - Local MongoDB Community Server ([install guide](https://www.mongodb.com/docs/manual/installation/)), or
  - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (get a connection string)

## 7. Installation

Clone/unzip the project, then install each side separately:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 8. Environment Variables

Copy the example files and adjust as needed.

**backend/.env** (copy from `backend/.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chat-app
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
PASSWORD_RESET_EXPIRES_MINUTES=30
```

**frontend/.env** (copy from `frontend/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Never commit real `.env` files — only the `.env.example` templates are
tracked.

## 9. MongoDB Setup

**Option A — Local MongoDB:**

```bash
# Install MongoDB Community Edition, then start it:
mongod --dbpath /path/to/data/db
```

MongoDB will listen on `mongodb://127.0.0.1:27017` by default, which
matches the example `.env`.

**Option B — MongoDB Atlas (no local install needed):**

1. Create a free cluster at https://www.mongodb.com/atlas
2. Add a database user and allow your IP address
3. Copy the connection string and paste it into `MONGO_URI` in `backend/.env`

## 10. Running the Backend

```bash
cd backend
npm run dev
```

This starts the API and Socket.IO server on `http://localhost:5000` with
hot-reload via nodemon. You should see:

```text
[database] Connected to MongoDB at ...
[server] Listening on http://localhost:5000
```

Other backend scripts:

```bash
npm run build      # compile TypeScript to dist/
npm start          # run the compiled build
npm run typecheck  # type-check without emitting
npm run seed       # create 4 demo users for quick testing
```

## 11. Running the Frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser. Vite will hot-reload as you
edit files.

Other frontend scripts:

```bash
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build locally
```

## 12. Test Credentials / Seed Data

Register a new account directly through the UI, or seed a few demo users:

```bash
cd backend
npm run seed
```

This creates:

| Name        | Email               | Password      |
|-------------|----------------------|---------------|
| Ava Chen    | ava@example.com      | password123   |
| Liam Torres | liam@example.com     | password123   |
| Maya Patel  | maya@example.com     | password123   |
| Noah Kim    | noah@example.com     | password123   |

Log in as one, then open a second browser (or incognito window) and log
in as another to test real-time messaging and presence between two
active sessions.

## 13. API Overview

All routes are prefixed with `/api`. Routes marked 🔒 require a
`Authorization: Bearer <token>` header.

| Method | Route                             | Description                          |
|--------|------------------------------------|---------------------------------------|
| POST   | `/auth/register`                  | Create an account, returns a JWT      |
| POST   | `/auth/login`                     | Log in, returns a JWT                 |
| POST   | `/auth/forgot-password`           | Request a generic password reset response |
| POST   | `/auth/reset-password`            | Consume a reset token and set a password |
| GET    | `/users/me` 🔒                    | Get the current user's profile        |
| PUT    | `/users/me` 🔒                    | Update name, email, or avatar         |
| PUT    | `/users/me/password` 🔒           | Change password                       |
| GET    | `/users` 🔒                        | List users (optional `?search=`)      |
| GET    | `/users/:id` 🔒                    | Get a single user                     |
| GET    | `/conversations` 🔒                | List the current user's conversations |
| POST   | `/conversations` 🔒                | Start/get a private conversation      |
| GET    | `/conversations/:id/messages` 🔒   | Load message history, marks as read   |
| POST   | `/groups` 🔒                       | Create a group conversation           |
| GET    | `/groups/:id` 🔒                   | Get a group's details                 |
| POST   | `/messages` 🔒                     | Send a message (also emits via socket)|
| PUT    | `/messages/:id/read` 🔒            | Mark a single message as read         |
| PUT    | `/messages/:id` 🔒                 | Edit an owned message                 |
| DELETE | `/messages/:id` 🔒                 | Delete an owned message               |

## 14. Socket.IO Events

The client authenticates the socket handshake with the JWT
(`socket.handshake.auth.token`).

Conversation room joins are authorized against MongoDB, so a valid socket
token alone cannot subscribe to another user's conversation.

**Client → Server**

| Event                | Payload                          | Purpose                          |
|-----------------------|-----------------------------------|-----------------------------------|
| `conversation:join`  | `conversationId`                 | Join a conversation's room        |
| `conversation:leave` | `conversationId`                 | Leave a conversation's room       |
| `message:send`       | `{ conversationId, content }`    | Send a message over the socket    |
| `typing:start`       | `conversationId`                 | Notify others typing has started  |
| `typing:stop`        | `conversationId`                 | Notify others typing has stopped  |

**Server → Client**

| Event               | Payload                                          | Purpose                          |
|----------------------|---------------------------------------------------|------------------------------------|
| `online:users`      | `string[]` of user ids                            | Snapshot sent on connect          |
| `user:online`       | `{ userId }`                                      | A user just came online           |
| `user:offline`      | `{ userId, lastSeen }`                            | A user went offline               |
| `message:receive`   | `Message`                                         | New message for a joined room     |
| `message:read`      | `{ messageId, conversationId, userId }`           | A message was read                |
| `typing:start`      | `{ conversationId, userId }`                      | Someone is typing                 |
| `typing:stop`       | `{ conversationId, userId }`                      | Someone stopped typing            |

## 15. Screenshots

_Add screenshots of the login page, chat view, and group creation modal here
once the app is running locally._

```text
docs/screenshots/login.png
docs/screenshots/chat.png
docs/screenshots/new-group.png
```

## Verification Notes

- Both `backend` and `frontend` type-check with zero errors (`npm run
  typecheck` / `tsc -b --noEmit`) and build successfully (`npm run
  build`).
- The Express app, JWT signing/verification, bcrypt hashing, and all
  Mongoose schema validations were smoke-tested directly.
- End-to-end runtime testing (register → login → 1:1 chat → group chat →
  presence → refresh) requires a live MongoDB instance and should be run
  in your own environment following the steps above, since this project
  was assembled in a sandbox without outbound access to install a MongoDB
  server.
