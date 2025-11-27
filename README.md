# Airtable-Connected Dynamic Form Builder

Minimal MERN-stack implementation for the interview task: an Airtable-connected dynamic form builder.

Repository structure
- `backend/` — Express + Mongoose backend with Airtable OAuth, form schema storage, response syncing, and webhooks.
- `frontend/` — Vite + React minimal UI for login, building forms, viewing/filling forms, and listing responses.

Quick start (local)

1. Backend

	 - Copy `.env.example` to `.env` in `backend/` and fill values:
		 - `MONGODB_URI` (e.g. `mongodb://localhost:27017/airtable_form_builder`)
		 - `AIRTABLE_CLIENT_ID`, `AIRTABLE_CLIENT_SECRET`
		 - `AIRTABLE_OAUTH_REDIRECT_URI` (e.g. `http://localhost:4000/auth/airtable/callback`)
		 - `FRONTEND_URL` (e.g. `http://localhost:5173`)
		 - Optional: `WEBHOOK_SECRET` to validate incoming webhook requests.

	 Install and run:

```powershell
cd backend
npm install
npm run dev
```

2. Frontend

	 - Copy `frontend/.env.example` to `frontend/.env` if you need to override the backend URL.

```powershell
cd frontend
npm install
npm run dev
```

3. Airtable OAuth setup

	 - Create an Airtable OAuth app in the Airtable developer console.
	 - Set the redirect URI to the `AIRTABLE_OAUTH_REDIRECT_URI` you configured (e.g. `http://localhost:4000/auth/airtable/callback`).
	 - Set scopes required by the app: at minimum `data.records:read`, `data.records:write`, `data.bases:read`.
	 - Use the generated `client_id` and `client_secret` in your backend `.env`.

How it works (summary)

- OAuth: `/auth/airtable` starts the OAuth flow; `/auth/airtable/callback` receives tokens and stores the user's profile + tokens in MongoDB (`User` model).
- Form builder: backend endpoints fetch bases/tables/fields from Airtable metadata and store a form schema in MongoDB (`Form` model).
- Conditional logic: a pure util `shouldShowQuestion(rules, answersSoFar)` is implemented and used in both frontend and backend.
- Submit: when a form is submitted the backend validates required fields + select choices, creates a record in Airtable, and stores a `Response` document in MongoDB.
- Webhooks: Airtable can POST events to `/webhooks/airtable` to inform about record updates/deletes; the backend updates the corresponding DB record (or flags it deleted).

Data models (brief)

- `User` (`backend/models/User.js`): stores `airtableUserId`, `profile`, `accessToken`, `refreshToken`, and `lastLoginAt`.
- `Form` (`backend/models/Form.js`): stores `owner` (User ref), `airtableBaseId`, `airtableTableId`, `airtableTableName`, and `questions` array with fields:
	- `questionKey`, `airtableFieldId`, `label`, `type`, `required`, `conditionalRules`, `options`
- `Response` (`backend/models/Response.js`): stores `formId`, `airtableRecordId`, `answers`, `status`, `deletedInAirtable`, timestamps.

Conditional logic

- Rules shape:

```js
{
	logic: 'AND' | 'OR',
	conditions: [ { questionKey, operator: 'equals' | 'notEquals' | 'contains', value } ]
}
```

- The pure function `shouldShowQuestion(rules, answersSoFar)` accepts these rules and evaluates them safely. See `backend/utils/conditional.js` and `frontend/src/utils/conditional.js`.

Webhook configuration

- To secure webhooks, set `WEBHOOK_SECRET` in the backend `.env`. The webhook handler will expect incoming requests to include a matching header (`x-webhook-secret` or similar). Configure Airtable to call `/webhooks/airtable` on your deployed backend.

Next steps / recommendations

- Add robust authentication (sessions or JWTs) and token refresh flow for production.
- Implement file upload handling for `multipleAttachments` with multipart uploads to Airtable.
- Add more tests and CI, and deploy to Vercel (frontend) and Render/Railway (backend).

If you want, I can now:
- run the backend tests (conditional util),
- implement token refresh + an endpoint to refresh tokens,
- add a simple UI for configuring conditional rules in the builder,
- or prepare deployment instructions and environment variable lists for Render + Vercel.

