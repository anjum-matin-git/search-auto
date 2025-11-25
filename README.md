# SearchAuto 🚗

AI-powered car search platform that helps users find their perfect vehicle using natural language queries.

## Features

- **Natural Language Search**: Search for cars using everyday language ("red Mazda under $40k")
- **AI-Powered Matching**: Claude AI extracts features and ranks results by relevance
- **Real Listings**: Live inventory from MarketCheck API across US dealers
- **Personalized Results**: Recommendations based on user preferences and location
- **Conversational Assistant**: Chat interface for follow-up questions and refinements
- **Context Memory**: Remembers your last search for returning users

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL database
- Anthropic API key
- MarketCheck API key

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy and configure environment
cp ../env.example ../.env
# Edit .env with your credentials

# Run migrations
python -m db.init_db

# Start server
python -m uvicorn app.main:app --reload --port 3000
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `ANTHROPIC_API_KEY` | Claude API key |
| `ANTHROPIC_MODEL` | Claude model (default: claude-sonnet-4-20250514) |
| `MARKETCHECK_API_KEY` | MarketCheck API key for car listings |
| `STRIPE_SECRET_KEY` | Stripe API key (optional, for payments) |

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register with preferences
- `POST /api/auth/login` - Login and get JWT token

### Search
- `POST /api/search` - Search for cars with natural language
- `GET /api/search/personalized` - Get personalized recommendations
- `GET /api/search/latest` - Get latest search results

### Assistant
- `GET /api/assistant/conversation` - Get conversation history
- `POST /api/assistant/message` - Send chat message

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   FastAPI    │────▶│   Claude    │
│   (React)   │     │   Backend    │     │   (AI)      │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────────┐  ┌──────────┐
              │ MarketCheck │  │ Postgres │
              │     API     │  │    DB    │
              └─────────────┘  └──────────┘
```

### Key Components

- **Router Layer**: Orchestrates search flow (feature extraction → API call → save results)
- **Claude Client**: Handles AI feature extraction and summary generation
- **MarketCheck API**: Fetches real US dealer inventory
- **Repository Pattern**: Clean database access through repository classes

## Testing

```bash
# Run full flow test
python test_full_flow.py

# Test specific queries
python test_agent_queries.py
```

## Deployment

### Frontend (Vercel)
- Connect GitHub repo to Vercel
- Set `VITE_API_BASE_URL` to your backend URL

### Backend (Railway)
- Connect GitHub repo to Railway
- Add PostgreSQL plugin
- Set environment variables

## Tech Stack

**Backend**: FastAPI, SQLAlchemy, LangGraph, Anthropic Claude  
**Frontend**: React, TypeScript, Tailwind CSS, Framer Motion  
**Database**: PostgreSQL  
**APIs**: MarketCheck, Stripe

## License

MIT

