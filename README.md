# MatchMint

MatchMint is a MERN-based platform that connects brands with influencers through a structured campaign lifecycle, smart matching, proof review, and a simulated payment pipeline.

## Motivation

Brands waste time finding the right creators, and influencers struggle to discover campaigns that fit their niche. MatchMint solves this by offering a single, guided flow from onboarding to completion.

## How It Works

1. User signs up as a company or influencer.
2. User completes a role-specific profile.
3. Companies create and publish campaigns.
4. Matching engine ranks fits for both sides.
5. Influencers accept or skip campaigns.
6. Influencers submit proof of work.
7. Companies review and advance the payment pipeline.
8. Either party can mark the collaboration completed after simulated payment.

## Key Features

- Role-based authentication and protected routes.
- Company and influencer profile management.
- Draft, publish, close, and delete campaign lifecycle.
- Two-way matching feeds (influencer feed and company feed).
- Application workflow with applicant view.
- Proof submission with file upload.
- Review + payment pipeline tracking.
- Pipeline dashboards and status stats.

## Matching Algorithm

Current weighted scoring formula:

$$
\text{score} = 0.30\cdot C + 0.25\cdot P + 0.20\cdot A + 0.15\cdot B + 0.10\cdot R
$$

Where:
- $C$ = category fit score (0 or 100)
- $P$ = platform fit score (0 or 100)
- $A$ = audience fit score (20 to 100)
- $B$ = budget validity score (0 or 100)
- $R$ = base rating score (currently constant 50)

Scores are clamped to 0..100 and sorted to create ranked feeds.

## Benefits

- Faster discovery of relevant campaigns and creators.
- Clear, auditable workflow for approvals and proof.
- Simple, structured status progression for collaboration.
- Demo-friendly with seed data and simulated payments.

## Tech Stack

Frontend:
- React + Vite
- React Router
- Axios
- Custom CSS

Backend:
- Node.js + Express
- MongoDB + Mongoose
- JWT auth with role-based middleware
- helmet, rate-limit, request sanitization

## Project Structure

```
MatchMint/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    scripts/
    utils/
    uploads/
    server.js
  frontend/
    src/
      components/
      pages/
      services/
      styles/
      assets/
    index.html
    vite.config.js
  docs/
```

## Local Setup

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Backend (create `backend/.env`):
```
PORT=5090
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
```

Frontend (create `frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:5090/api
```

## Demo Seed Data (Optional)

```bash
cd backend
npm run seed
```

## Demo Steps (3-5 Minutes)

1. Login as company and open the dashboard.
2. Create a draft campaign, publish it, and view applicants.
3. Open company feed to show ranked influencers.
4. Login as influencer and open matched campaign feed.
5. Accept a campaign, submit proof, and show pipeline status.
6. Return to company and review proof, mark ready, then paid, then completed.

## API Highlights

- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- Profiles: `POST /api/profile/company`, `POST /api/profile/influencer`
- Campaigns: create, update, publish, close, delete
- Matching: `GET /api/matches/influencer-feed`, `GET /api/matches/company-feed`
- Proofs: submit, update, view
- Review/Payment: review, ready, paid, complete

## Future Improvements

- Real payment integration (Stripe or similar).
- In-app messaging between brand and creator.
- Advanced analytics for campaign performance.
- More nuanced matching weights and ML-based tuning.
- Admin panel for moderation and dispute handling.

## Notes

This project simulates payment states for demonstration purposes only and does not move real money.
