# College Events Platform — Final Technical Specification

**Status:** Finalized for development

**Purpose:** Shareable, unambiguous spec for a MERN-based college event sharing platform. Includes full technical specifications, data models, every API route with request/response shapes and auth rules, middleware behavior, front-end pages/components, deployment checklist, and an ordered roadmap for the team to implement.

---

## 1. High-level summary

A web application where authenticated college users can view events, register/unregister, and manage registrations. Two event types exist: `IEEE` (IEEE members register free) and `GENERAL` (payment required for non-IEEE). Two admin classes exist:

- **SUPER_ADMIN** — full control of all data and routes.
- **TEMP_ADMIN** — temporary event organizer promoted by SUPER_ADMIN for a limited time; can create events, delete/edit only their events, and manage registrations only for their events (including offline/spot registrations they collected).

Authentication: JWT (access tokens). Passwords hashed with bcrypt.

Storage: MongoDB (Mongoose). Payment screenshots stored in S3 or GridFS; backend stores secured URL.

---

## 2. Technology stack

- Backend: Node.js (>=18) + Express
- Database: MongoDB (Atlas recommended) + Mongoose
- File uploads: Multer -> S3 (preferred) or GridFS
- Auth: JWT (jsonwebtoken), bcrypt
- Frontend: React (Vite or CRA) + React Router + Axios
- Dev tooling: ESLint, Prettier, Jest + supertest (backend tests)
- Deployment: Vercel/Netlify (frontend), Render/Heroku (backend), MongoDB Atlas

---

## 3. Security & infra requirements

- `JWT_SECRET` in env; use 256-bit secret
- HTTPS only in production
- Use helmet, express-rate-limit on auth endpoints
- Limit file upload size to 5 MB and accept only image types (jpeg/png/webp) and pdf
- Sanitize all user inputs (express-validator)
- CORS configured to frontend origin(s)
- Logs: structured (pino/winston); errors to Sentry (optional)

---

## 4. Data models (Mongoose)

### User

```js
// models/User.js
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  passwordHash: String (required),
  role: String enum ['USER','TEMP_ADMIN','SUPER_ADMIN'] default 'USER',
  promotedUntil: Date | null, // TTL logic: promoted only until this
  isIEEE: Boolean default false,
  createdAt: Date
}
```

Methods:
- `isTempAdminActive()` returns true if role === TEMP_ADMIN && promotedUntil > now

### Event

```js
// models/Event.js
{
  _id: ObjectId,
  title: String (required),
  description: String,
  type: String enum ['IEEE','GENERAL'] default 'GENERAL',
  location: String,
  startAt: Date,
  endAt: Date,
  organizer: ObjectId ref User (required),
  capacity: Number | null,
  isActive: Boolean default true,
  createdAt: Date
}
```

Indexes:
- `{ organizer:1 }`
- `{ type:1, startAt:1 }` for filtering

### Registration

```js
// models/Registration.js
{
  _id: ObjectId,
  event: ObjectId ref Event (required),
  user: ObjectId ref User (required),
  status: String enum ['REGISTERED','CANCELLED','PENDING_PAYMENT','AWAITING_ADMIN_CONFIRMATION'] default 'REGISTERED',
  payment: {
    mode: String enum ['ONLINE','OFFLINE','NONE'],
    screenshotUrl: String | null,
    paidByCollector: ObjectId ref User | null,
    verified: Boolean default false
  },
  createdAt: Date
}
```

Unique constraint: `{ event:1, user:1 }` to prevent duplicates.

### PromotionLog (audit)

```js
// (optional)
{
  promotedUser, promotedBy, oldRole, newRole, promotedUntil, createdAt
}
```

---

## 5. Authentication & Authorization

### JWT
- Access tokens signed with `JWT_SECRET`. Example payload:

```json
{ "sub": "<userId>", "role": "USER", "isIEEE": true, "iat": 123, "exp": 456 }
```

- Token expiry: configurable (e.g., 1h). Refresh tokens optional (recommended if long sessions desired).

### Passwords
- Hash with bcrypt, saltRounds = 10+.

### Middleware behavior
- `requireAuth`:
  - Extract bearer token from `Authorization` header.
  - Verify token; attach `req.user` with full user document (fresh from DB) to ensure server-side role check is authoritative.

- `checkRole(roleList)`:
  - Accepts roles like `['SUPER_ADMIN']` or `['TEMP_ADMIN', 'SUPER_ADMIN']`.
  - For `TEMP_ADMIN`, also validate `promotedUntil > now`. If expired, treat as USER.

- `checkOwnershipOrAdmin(resourceOwnerField, allowedRoles)`:
  - For operations where organizer-only or SUPER_ADMIN allowed (e.g., edit event), allow if `req.user._id.equals(resource.organizer)` OR user has allowedRoles.

All authorization must be checked server-side; NEVER trust client-provided role claims.

---

## 6. API - FULL ROUTE LIST (explicit, unambiguous)

Base path: `/api/v1`

> **Auth header for protected routes**: `Authorization: Bearer <JWT>`

### Auth

1. `POST /api/v1/auth/register`
   - Body (JSON): `{ name, email, password, isIEEE? }`
   - Validation: email format, password min 8 chars
   - Response 201: `{ user: { _id, name, email, isIEEE, role }, token }`
   - Errors: 400 (validation), 409 (email exists)

2. `POST /api/v1/auth/login`
   - Body: `{ email, password }`
   - Response 200: `{ user: { _id, name, email, isIEEE, role }, token }`
   - Errors: 401 invalid creds

3. `POST /api/v1/auth/refresh` (optional)
   - Body: `{ refreshToken }` => returns new access token


### Users

4. `GET /api/v1/users/me`
   - Auth required
   - Response: `{ _id, name, email, isIEEE, role, promotedUntil }`

5. `PUT /api/v1/users/me`
   - Auth required
   - Body: `{ name?, isIEEE? }` (email changes not allowed here)
   - Response: updated user

6. `GET /api/v1/users/:id` (public)
   - Returns public profile: `{ _id, name, isIEEE }`

7. `GET /api/v1/users/:id/registrations`
   - Auth required: owner OR SUPER_ADMIN OR event organizer of relevant registrations.
   - Returns list of registration documents for the user.


### Admin promotion (SUPER_ADMIN only)

8. `POST /api/v1/admin/promote`
   - Auth: SUPER_ADMIN
   - Body: `{ userId, until: ISODate string }` (until must be in future)
   - Behavior: set role to `TEMP_ADMIN`, set `promotedUntil` to provided date. Insert PromotionLog.
   - Response: promoted user object

9. `POST /api/v1/admin/demote`
   - Auth: SUPER_ADMIN
   - Body: `{ userId }`
   - Behavior: set role to `USER`, promotedUntil = null. Insert PromotionLog.

10. `GET /api/v1/admin/pending-registrations`
    - Auth: SUPER_ADMIN
    - Returns list of all registrations with `status` in `['PENDING_PAYMENT', 'AWAITING_ADMIN_CONFIRMATION']` across events.


### Events

11. `GET /api/v1/events`
    - Query params: `?type=IEEE|GENERAL&upcoming=true|false&page=1&limit=20&search=...`
    - Public
    - Response: `{ data: [Event], meta: { page, limit, total } }`

12. `GET /api/v1/events/:id`
    - Public
    - Response: detailed event, plus `registeredCount` (number of verified/registered users)

13. `POST /api/v1/events`
    - Auth: only `TEMP_ADMIN` (with active promotion) OR `SUPER_ADMIN`
    - Body: `{ title, description, type, location, startAt, endAt, capacity? }`
    - Behavior: `organizer` set to `req.user._id`
    - Response: created event (201)

14. `PUT /api/v1/events/:id`
    - Auth: event.organizer OR SUPER_ADMIN
    - Body: fields allowed to change (title, description, times, capacity, isActive)
    - Response: updated event

15. `DELETE /api/v1/events/:id`
    - Auth: event.organizer OR SUPER_ADMIN
    - Behavior: Soft delete preferred: set `isActive=false` and keep registrations. If hard delete, cascade or archive registrations.
    - Response: 200 { success: true }

16. `GET /api/v1/events/:id/registrations`
    - Auth: event.organizer OR SUPER_ADMIN
    - Response: paginated list of registrations for the event


### Registrations

17. `POST /api/v1/events/:id/register`
    - Auth: USER
    - Body (JSON): `{ paymentMode: 'ONLINE'|'OFFLINE'|'NONE', screenshotUrl?: string }`
    - Behavior (deterministic rules):
      1. If event.type === 'IEEE' and req.user.isIEEE === true -> create registration with `status: 'REGISTERED'`, `payment.mode: 'NONE'`.
      2. If event.type === 'IEEE' but user.isIEEE === false -> require paymentMode != 'NONE' and either `screenshotUrl` or online payment. Create registration with status = 'PENDING_PAYMENT' (if screenshot) or 'AWAITING_ADMIN_CONFIRMATION' for offline/spot.
      3. If event.type === 'GENERAL' -> payment required for everyone unless business rule changed; behave like non-IEEE above.
    - Errors:
      - 409 if user already registered (unique index)
      - 400 if required payment info missing
    - Response: created registration (201)

18. `POST /api/v1/events/:id/spot-register`
    - Auth: USER
    - Body: optional `{ note }`
    - Behavior: create registration with `payment.mode: 'OFFLINE'`, `status: 'AWAITING_ADMIN_CONFIRMATION'` and `payment.paidByCollector=null`. This is a request for spot/offline payment; collector must later claim it.

19. `POST /api/v1/registrations/:regId/assign-collector`
    - Auth: TEMP_ADMIN (active) OR SUPER_ADMIN
    - Body: `{ collectorId }` (collector must be a user)
    - Behavior: set `payment.paidByCollector = collectorId`
    - Security: collector must be the one who collected cash in real world. System logs this action as audit record.

20. `POST /api/v1/registrations/:regId/verify-payment`
    - Auth: event.organizer (owner of event) OR SUPER_ADMIN
    - Body: `{ verified: true|false, note?: string }`
    - Behavior: If verified true -> `payment.verified=true` and `status = 'REGISTERED'`. If false -> optionally set status to 'PENDING_PAYMENT' and require re-upload.

21. `DELETE /api/v1/events/:id/registrations/:userId` (cancel registration)
    - Auth: the registered user OR event.organizer OR SUPER_ADMIN
    - Behavior: If user cancels -> set `status: 'CANCELLED'`. If organizer cancels, send notification to user. Refund logic out of scope (manual).

22. `GET /api/v1/users/:id/registrations` (repeated for clarity)
    - Auth: owner OR SUPER_ADMIN


### Uploads

23. `POST /api/v1/uploads/payment-screenshot`
    - Auth: USER
    - FormData: `file` (image or pdf)
    - Validation: file size <= 5MB, mime type image/* or application/pdf
    - Behavior: upload to S3, return presigned URL or stored URL
    - Response: `{ url: 'https://s3.bucket/...' }`


### Health & debug

24. `GET /api/v1/health` - public
    - Response: `{ status: 'ok', timestamp }`


---

## 7. Request/Response examples (concise)

**Register for event (non-IEEE needs payment screenshot)**

Request:
```
POST /api/v1/events/64a.../register
Authorization: Bearer <token>
Content-Type: application/json

{ "paymentMode": "ONLINE", "screenshotUrl": "https://s3.../txn-123.jpg" }
```

Response 201:
```
{
  "_id": "64b...",
  "event": "64a...",
  "user": "64c...",
  "status": "PENDING_PAYMENT",
  "payment": { "mode":"ONLINE", "screenshotUrl":"https://s3...", "verified": false },
  "createdAt": "2025-10-31T..."
}
```

**Verify payment (organizer)**

Request:
```
POST /api/v1/registrations/64b.../verify-payment
Authorization: Bearer <organizerToken>
Body: { "verified": true }
```

Response 200:
```
{ "success": true, "registration": { ... status: 'REGISTERED', payment.verified: true } }
```

---

## 8. Business logic rules (definitive)

1. **Double registration**: prevented by unique DB index. API must return 409 Conflict.
2. **Capacity**: if `event.capacity` is set, before approving registration (when creating or verifying) check current `REGISTERED` count. If [`REGISTERED` count >= capacity] -> reject with 409 or place on waitlist (waitlist not implemented by default).
3. **IEEE free rule**: For events where `type == 'IEEE' && user.isIEEE == true`, payment is not required and registration is auto-approved.
4. **Payment verification**: Any registration with `payment.mode != 'NONE'` requires manual verification by event organizer or SUPER_ADMIN before status becomes `REGISTERED`. For `OFFLINE`/spot regs, collector must be assigned before verification.
5. **Temporary admin expiry**: All permission checks for TEMP_ADMIN must check `promotedUntil`. Expired promotions must be treated as `USER`.
6. **Deleting events**: Soft-delete preferred (`isActive=false`). If hard delete chosen, the system must either cascade-delete or export registrations to an archive collection.

---

## 9. Frontend: pages, components & behavior

**Pages**
- `Landing / Events Feed` — list events, filters (type, upcoming, search), pagination
- `Event Detail` — full event info, register/unregister buttons, registration status for logged-in user
- `Auth: Login, Register`
- `Dashboard` — My Registrations (with statuses), My Events (if organizer)
- `Admin Dashboard (TEMP_ADMIN)` — Create Event, Manage My Events, Pending Payments for my events
- `Super Admin Dashboard` — Promote/Demote users, view all pending registrations, full user search

**Key components**
- `EventCard`, `EventList`, `EventFilters`, `RegistrationModal` (payment upload UI), `Uploader` (wraps formData POST to `/uploads`), `AdminTable` (pending regs), `PromoteUserModal`

**State & auth**
- Store JWT in memory and refresh via refresh token in httpOnly cookie if implemented. If storing in localStorage, store only non-sensitive data and guard against XSS.
- Axios instance with `Authorization` header set.

**Exact UI flows**
1. Register: Show choice if payment required: `Upload payment screenshot` OR `Spot registration (pay offline)`.
2. After screenshot upload: call `/events/:id/register` with screenshotUrl.
3. Show registration card in Dashboard with real-time status polling (e.g., refresh every 30s) or push notifications.

---

## 10. Indexes & DB performance

- Users: `{ email:1 }` unique
- Events: `{ organizer:1 }`, `{ type:1, startAt:1 }`
- Registrations: `{ event:1, user:1 }` unique, `{ event:1, status:1 }` for admin queries
- Consider compound indexes: `{ event:1, payment.verified:1 }` for admin dashboards

---

## 11. Environment variables

```
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://.../events-db
JWT_SECRET=... (use strong secret)
JWT_EXPIRY=1h
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
S3_REGION=...
FILE_UPLOAD_MAX=5MB
FRONTEND_URL=https://app.example.com
```

---

## 12. Tests (minimum)

- Auth: register/login validation and wrong password
- Registration flows: IEEE auto-approve, payment-required flows, duplicate registration
- Admin: promote/demote, temp admin expiry behavior
- Upload: file validation

Use Jest + supertest; create fixtures for users, events, registrations.

---

## 13. Logging & audit

- Record PromotionLog when promoting/demoting
- Log assign-collector and verify-payment actions with who performed them
- Keep immutable audit fields: `createdAt`, action logs in separate collection or append-only array in Registration if brief notes required

---

## 14. Roadmap (ordered, implementation-ready)

1. **Setup repo**: monorepo with `backend/` and `frontend/`. Add linting & pre-commit hooks.
2. **Backend: Auth**: implement User model, `/auth/register`, `/auth/login`, JWT middleware, `/users/me`.
3. **Backend: Events**: implement Event model & CRUD endpoints (11-16). Unit tests.
4. **Backend: Registrations**: implement Registration model and registration endpoints (17-21). Add unique index and capacity check. Unit tests.
5. **Backend: Uploads**: implement `POST /uploads/payment-screenshot` with Multer->S3.
6. **Backend: Admin**: promote/demote endpoints and admin pending list. PromotionLog.
7. **Frontend: Auth + Events feed**: login/register, list events, event detail, register flow (screenshot upload + spot reg).
8. **Frontend: Dashboards**: user dashboard, temp admin dashboard, super admin promote UI.
9. **QA & tests**: end-to-end, cross-browser checks.
10. **Deploy**: set envs, set CORS, test full flow.
11. **Polish**: notifications, emails, waitlist, analytics.

---

## 15. Developer responsibilities & notes

- **Backend lead**: owns API, DB indexes, auth, uploads
- **Frontend lead**: owns UX flows and state handling, token handling strategy
- **QA**: test critical flows (registration/payment verification)
- **DevOps**: deploy pipeline, secrets, S3 permissions

Notes:
- Frontend must never assume roles from token payload alone. On app start, call `/users/me` to load authoritative role & `promotedUntil`.
- Timezones: store all dates as UTC (ISO strings). Frontend converts to local display.

---

## 16. Appendix — sample API contract (OpenAPI-ready snippets)

- `POST /api/v1/auth/login` -> `200 OK { user, token }`
- `POST /api/v1/events/:id/register` -> `201 Created { registration }` or `400/409`
- `POST /api/v1/registrations/:id/verify-payment` -> `200 OK { registration }`

(Provide full OpenAPI YAML on request)

---

## 17. Delivery checklist before sprint 1

- Repo initialized with README and `.env.example`
- Backend skeleton with linting
- User & Auth endpoints implemented and tested
- Frontend login/register implemented
- Documentation link (this file) added to repo root

---

If you want, I can next produce any of the following **right now** (pick one):
- Backend scaffold (models/controllers/routes/middleware) with runnable example (Express + Mongoose)
- Frontend scaffold (React pages + Axios service + auth handling)
- Postman collection or OpenAPI (YAML) spec for all routes



<end of document>

