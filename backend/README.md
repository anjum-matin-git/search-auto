# SearchAuto Python Backend

Clean, modular Python backend with FastAPI, LangGraph AI agent, and PostgreSQL vector search.

## Architecture

```
backend-python/
├── app/                # FastAPI application
│   └── main.py        # App entrypoint with routes and middleware
├── core/              # Core utilities
│   ├── config.py      # Pydantic settings
│   ├── logging.py     # Structured logging
│   └── exceptions.py  # Custom exceptions
├── db/                # Database layer
│   ├── base.py        # SQLAlchemy setup
│   ├── models.py      # ORM models with pgvector
│   ├── repositories.py # Repository pattern
│   └── init_db.py     # Database initialization
├── modules/           # Domain modules
│   ├── auth/          # Authentication
│   │   ├── service.py
│   │   ├── schemas.py
│   │   └── router.py
│   └── search/        # Search
│       ├── schemas.py
│       └── router.py
├── agents/            # LangGraph agents
│   └── search/        # Car search agent
│       ├── state.py   # State definition
│       ├── workflow.py # Workflow assembly
│       └── steps/     # Individual steps
│           ├── analyze_query.py
│           ├── scrape_websites.py
│           ├── store_cars.py
│           ├── find_similar.py
│           └── save_history.py
├── integrations/      # External services
│   ├── openai_client.py
│   └── web_scraper.py
└── main.py            # Uvicorn server entrypoint
```

## Features

- **LangGraph AI Agent**: 5-step workflow (analyze → scrape → store → find → save)
- **Vector Search**: PostgreSQL with pgvector for semantic similarity
- **Clean Architecture**: Repository pattern, service layer, typed schemas
- **Structured Logging**: JSON logs with correlation IDs (structlog)
- **Error Handling**: Centralized exception middleware
- **Type Safety**: Pydantic v2 for validation, SQLAlchemy 2.x ORM

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (copy .env.example to .env)

3. Initialize database:
```bash
python db/init_db.py
```

4. Run server:
```bash
python main.py
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/preferences` - Update user preferences

### Search
- `POST /api/search` - AI-powered car search

### Health
- `GET /` - Root health check
- `GET /health` - Detailed health status
