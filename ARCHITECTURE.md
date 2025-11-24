# SearchAuto Architecture

## Overview
World-class AI-powered car search platform with **autonomous ReAct agent**.

## Tech Stack

### Backend (Python/FastAPI)
- **Framework**: FastAPI with async/await
- **Database**: PostgreSQL (Railway) with SQLAlchemy ORM
- **AI**: OpenAI GPT-5 for reasoning + LangGraph ReAct Agent
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

### 1. Autonomous ReAct Agent (LangGraph)
```
User Query → ReAct Agent → Intelligently Uses Tools → Returns Results
```

**Agent Capabilities:**
- Reasons about user queries
- Decides which tools to use and when
- Adapts to different scenarios
- Provides conversational responses

**4 Powerful Tools:**
1. `extract_car_features` - Parse natural language queries
2. `search_car_listings` - Find real cars from Auto.dev
3. `filter_cars_by_criteria` - Refine results
4. `rank_cars_by_relevance` - Sort by best match

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
- `StripeClient` - payments

## Key Features

### Autonomous AI Agent
- **ReAct Pattern**: Reasons and acts autonomously
- **Context-aware**: Uses user location and preferences
- **Intelligent**: Decides which tools to use
- **Conversational**: Provides helpful suggestions
- **No Vector DB needed**: Agent is smart enough without it!

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
2. ReAct agent analyzes the query
3. Agent decides which tools to use:
   - Extract features (brand, model, price, location)
   - Search Auto.dev API for real listings
   - Filter by criteria if needed
   - Rank by relevance
4. Agent provides conversational response
5. Results displayed with beautiful UI

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
- Async/await for performance
- Repository pattern for DB
- Service layer for business logic
- Structured logging with `structlog`
- Custom exception handling

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
- Lazy loading components
- Optimized build with Vite
- Autonomous agent reduces unnecessary API calls

## What We Removed

### Old Static Workflow ❌
- Removed 5-step pipeline (analyze → scrape → store → find_similar → save)
- Removed ChromaDB vector database (not needed!)
- Removed pgvector dependency
- Removed Apify client (unused)
- Removed all workflow step files

### Why the Agent is Better ✅
**Old Approach:**
- Fixed pipeline, always runs all steps
- Required vector DB for similarity
- No flexibility or reasoning
- Can't adapt to user needs

**New ReAct Agent:**
- Autonomous decision making
- Only uses tools when needed
- Reasons about results
- No vector DB required
- Adapts to any query
- Provides conversational responses

## Project Structure

```
backend/
├── agents/
│   ├── react_agent.py          # Main ReAct agent
│   └── tools/
│       └── search_tools.py     # 4 LangChain tools
├── app/
│   └── main.py                 # FastAPI app
├── core/                       # Config, logging, auth
├── db/                         # Models, repositories
├── integrations/               # External APIs
├── modules/                    # Feature modules
│   ├── auth/
│   ├── search/
│   ├── assistant/
│   └── billing/
└── services/                   # Business logic

client/
├── src/
│   ├── components/             # React components
│   ├── pages/                  # Page components
│   ├── lib/                    # API clients
│   └── hooks/                  # Custom hooks
```

## Future Enhancements

The agent architecture makes it easy to add new capabilities:
- Add more tools (compare cars, get dealer reviews, etc.)
- Enhance system prompt for better responses
- Add memory/conversation history to agent
- Multi-turn conversations with context
- Image analysis for car condition

**Your SearchAuto is now powered by a truly intelligent, autonomous agent! 🚀**
