# Smart Wall Paint Visualizer (MEAN stack)

Preview paint colours on your own room photo: upload → select wall (polygon/brush) → apply colour → before/after → save/download.

## Structure
- `backend/` Node.js + Express + MongoDB (Mongoose), JWT auth, REST API
- `frontend/src/` Angular (standalone components) source files

## Backend
```
cd backend && cp .env.example .env   # set MONGO_URI (local or MongoDB Atlas) and JWT_SECRET
npm install && npm start             # http://localhost:5000
```
First registered user becomes Admin (or the email set in ADMIN_EMAIL).

## Frontend (Angular 17+)
```
npx @angular/cli new frontend-app --standalone --routing=false --style=css --skip-git
```
Then replace `frontend-app/src/main.ts` and the contents of `frontend-app/src/app/` with the files in `frontend/src/`, edit `API` in `api.service.ts`, and run:
```
cd frontend-app && ng serve        # http://localhost:4200
```

## API
POST /api/auth/register, /api/auth/login · GET/POST/PUT/DELETE /api/colors · GET/POST/DELETE /api/patterns · GET/POST/DELETE /api/projects · POST /api/track · GET /api/admin/stats

## Deploy
Database: MongoDB Atlas · Backend: Render/Railway/AWS · Frontend: `ng build`, host on Vercel/Netlify (set API URL to the backend).

## Notes
Manual wall selection only (no AI detection). Results are a preview; real colour varies with lighting and screen.
