# SearchAuto Architecture

## Overview
World-class AI-powered car search platform with autonomous agent capabilities.

## Tech Stack

### Backend (Python/FastAPI)
- **Framework**: FastAPI with async/await
- **Database**: PostgreSQL (Railway) with SQLAlchemy ORM
- **Vector DB**: ChromaDB for semantic search
- **AI**: OpenAI GPT-5 + Embeddings
- **Search**: Auto.dev API for real car listings
- **Auth**: JWT-based authentication
- **Payments**: Stripe integration

### Frontend (React/TypeScript)
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: Wouter (lightweight router)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **State**: TanStack Query (React Query)
- **Animations**: Framer Motion

## Architecture Patterns

### 1. LangGraph Workflow
```
User Query → Analyze Query → Scrape Auto.dev → Store in DB → Vector Search → Save History
```

### 2. Repository Pattern
All database operations abstracted through repository classes:
- `UserRepository`
- `SearchRepository`
- `ConversationRepository`
- `UserPreferenceRepository`

### 3. Service Layer
Business logic separated from routes:
- `AuthService` - user registration, login, preferences
- `AssistantService` - AI conversation handling
- `CreditsService` - credit management and quota checks

### 4. Clean API Integration
All external APIs centralized in `integrations/`:
- `AutoDevAPI` - car listings
- `OpenAIClient` - NLU and embeddings
- `ChromaClient` - vector search
- `StripeClient` - payments

## Key Features

### AI Assistant
- Context-aware conversation
- Extracts search intent from chat
- Triggers new searches based on conversation
- Maintains chat history in PostgreSQL

### Credit System
- 3 free searches for all users
- Personal: $5 for 50 credits
- Pro: $25 unlimited credits
- Premium: Contact for dealer connections

### Search Flow
1. User enters natural language query
2. OpenAI extracts features (brand, model, price, location)
3. Auto.dev API fetches real listings
4. Vector search finds semantically similar cars
5. Results stored in DB
6. Frontend displays with beautiful UI

### User Personalization
- Capture location/postal code during registration
- Store car preferences (brands, types, fuel)
- Personalized recommendations on homepage
- Chat-to-search synchronization

## Deployment

### Frontend: Vercel
- Automatic deployments from `main` branch
- Environment variables configured in Vercel dashboard

### Backend: Railway
- Docker-based deployment
- Auto-deploy from GitHub
- PostgreSQL database included
- Environment variables in Railway dashboard

## Code Quality

### Backend
- Type hints throughout
- Structured logging with `structlog`
- Custom exception handling
- Pydantic schemas for validation
- Async/await for performance

### Frontend
- TypeScript strict mode
- Component-based architecture
- Custom hooks for reusability
- Responsive design (mobile-first)
- Dark theme with glassmorphism

## Security
- JWT tokens with 7-day expiration
- Bcrypt password hashing
- CORS configured
- Environment-based secrets
- Stripe webhook signature verification

## Performance
- Database connection pooling
- React Query caching
- Vector search for fast similarity
- Lazy loading components
- Optimized build with Vite

## Future Enhancements (Autonomous Agent)
The codebase is ready for a LangGraph ReAct agent with tools:
- `search_cars_by_criteria` - autonomous car search
- `filter_cars_by_features` - smart filtering
- `compare_cars` - side-by-side comparison
- `get_price_range_for_model` - market analysis

This will replace the current 5-step workflow with an intelligent agent that reasons and acts autonomously.

