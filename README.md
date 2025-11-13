# sche-chotto-cho

A tiny schedule coordination web app that is handy for exercising both the Amplify SSR frontend and API surface. One person creates a schedule with multiple candidate dates, and everyone who has the link can record their availability as ◯ (available), △ (maybe), or ✕ (not available). All responses render in a shared table so concurrent users always see the latest answers.

## Features

- Create schedules with title, description, and any number of candidate date/time slots.
- Shareable URL per schedule so anyone can respond without authentication.
- Participants choose their availability for each slot and optionally leave a comment.
- Responses persist via [Amplify Data](https://docs.amplify.aws/react/build-a-backend/data/) so multiple users always see the same dataset.
- Minimal, easy-to-read Next.js + TypeScript codebase suitable for manual or automated testing.

## Running locally

```bash
npm install
npm run dev
```

Visit <http://localhost:3000> to create a schedule, then open the generated `/schedule/:id` URL (in another tab or browser) to simulate multiple participants.

## Amplify Data configuration

The API routes call Amplify Data directly via GraphQL. Provide the connection details in `.env.local` before running the dev server:

| Variable                      | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `AMPLIFY_DATA_GRAPHQL_ENDPOINT` | AppSync/Amplify Data GraphQL endpoint URL (see `amplify_outputs.json`).     |
| `AMPLIFY_DATA_REGION`         | AWS region that hosts the data backend.                                     |
| `AMPLIFY_DATA_API_KEY`        | API key for the public authorization mode.                                  |
| `AMPLIFY_DATA_AUTH_MODE`      | *(optional)* Amplify auth mode (`apiKey`, `iam`, `userPool`, etc.). Defaults to `apiKey`. |

The shared schema lives in `amplify/data/resource.ts`. Generate or sync your Amplify backend so that it contains matching `Schedule` and `ParticipantResponse` models (including the `byScheduleId` secondary index).

## API surface

Endpoints backed by Amplify Data:

| Method | Path                              | Description                              |
| ------ | --------------------------------- | ---------------------------------------- |
| GET    | `/api/schedules`                  | List every stored schedule               |
| POST   | `/api/schedules`                  | Create a new schedule document           |
| GET    | `/api/schedules/:id`              | Fetch a single schedule + responses      |
| POST   | `/api/schedules/:id/responses`    | Create or update a participant response  |

`POST /api/schedules/:id/responses` upserts responses by participant name, making it easy for someone to adjust their answers later without duplicate rows.

## Notes

- The server polls Amplify Data on every API call; pair it with Amplify Gen 2 or an AppSync API key for multi-user demos.
- The client polls every 5 seconds and also exposes a manual “Refresh” button so concurrent edits are reflected quickly without websockets.
