# SearchAuto - AI Car Finder

## Overview

SearchAuto is an AI-powered car search platform that helps users find their perfect vehicle through natural language queries. The application uses LangChain with LangGraph for agentic workflows, scrapes multiple car listing websites (AutoTrader, CarGurus), and leverages OpenAI embeddings for semantic search and matching. Built with a modern full-stack architecture featuring React/Vite on the frontend and Express with PostgreSQL on the backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server, configured for hot module replacement
- Wouter for lightweight client-side routing (chosen over React Router for bundle size optimization)
- TanStack Query v5 for server state management and caching

**UI Component System**
- Radix UI primitives for accessible, unstyled component foundation
- shadcn/ui design system with "new-york" style variant
- Tailwind CSS v4 for utility-first styling with custom design tokens
- Custom font stack: Outfit (display), Plus Jakarta Sans (body), JetBrains Mono (code)
- Custom CSS variables for theming (neutral base color scheme)

**State Management**
- TanStack Query for API data fetching and caching with aggressive cache strategies (staleTime: Infinity)
- Local component state with React hooks
- No global state management library (avoided Redux/Zustand for simplicity)

**Development Tools**
- Replit-specific plugins for development environment integration
- Custom Vite plugin for OpenGraph image meta tag management
- Runtime error modal overlay for development

### Backend Architecture (Python + FastAPI)

**MIGRATION COMPLETED**: Full Python backend with clean, modular architecture

**Server Framework**
- FastAPI for high-performance async API
- Uvicorn ASGI server with auto-reload in development
- CORS middleware for frontend integration
- Centralized exception handling with custom error responses
- Pydantic v2 for request/response validation

**AI Agent System (LangGraph + Python)**
- **StateGraph-based workflow** with TypedDict for type safety
- **5-step modular workflow** (each step is a separate, testable module):
  1. **analyze_query.py**: Extract car features from natural language using GPT-5
  2. **scrape_websites.py**: Parallel async scraping of AutoTrader and CarGurus
  3. **store_cars.py**: Store scraped cars with vector embeddings in PostgreSQL
  4. **find_similar.py**: Find matching vehicles using cosine similarity on embeddings
  5. **save_history.py**: Save search history and update user preferences
- **workflow.py**: Assembles the 5 steps into a cohesive LangGraph pipeline
- **state.py**: TypedDict state container for clarity and type checking

**OpenAI Integration (Python)**
- **OpenAIClient class** with retry logic using Tenacity
- GPT-5 for natural language understanding and feature extraction
- text-embedding-3-small for vector embeddings (1536 dimensions)
- JSON mode for structured data extraction from user queries
- Clean typed interface with error handling

**Web Scraping (Python)**
- **httpx** for async HTTP requests
- **BeautifulSoup** for HTML parsing
- **Retry logic** with exponential backoff (Tenacity)
- Mock car generation fallback when scraping fails
- Graceful error handling with structured logging

**Repository Pattern (Clean Architecture)**
- **UserRepository**: User CRUD operations
- **CarRepository**: Car operations with vector similarity search
- **SearchRepository**: Search history management
- **SearchResultRepository**: Search-to-car mappings
- **UserPreferenceRepository**: Learned preferences
- Clear separation between data access and business logic

**API Design (FastAPI Routers)**
- **Authentication Module** (`modules/auth/`):
  - `POST /api/auth/signup` - User registration with bcrypt password hashing
  - `POST /api/auth/login` - User authentication
  - `POST /api/auth/preferences` - Update user location and preferences
- **Search Module** (`modules/search/`):
  - `POST /api/search` - AI-powered car search (runs LangGraph workflow)
  - `GET /api/search/personalized` - Personalized results on login (Nov 23, 2025)
    - Returns cached results from user's last search, OR
    - Location-based Auto.dev query using user's location/postal_code
    - Fallback chain: location → postal_code → "California" default
- **Health Endpoints**:
  - `GET /` - Root health check
  - `GET /health` - Detailed health status
- Pydantic schemas for all requests and responses
- Automatic validation and error handling

**Structured Logging**
- **structlog** for JSON-formatted logs
- Correlation IDs for request tracing
- Development-friendly console output
- Production-ready JSON logs
- Log levels: INFO, DEBUG, ERROR

**Configuration Management**
- **Pydantic Settings** for environment-based config
- 12-factor app principles
- Type-safe settings with validation
- Environment variable loading from .env

### Data Storage

**Database: PostgreSQL via Neon**
- Neon serverless PostgreSQL for scalable, managed database hosting
- Python: Connection via psycopg2-binary with connection pooling
- pgvector extension enabled for vector similarity search

**ORM: SQLAlchemy 2.x (Python)**
- Declarative models in `backend/db/models.py`
- Type-safe ORM with relationship mapping
- Session management with dependency injection
- Migration support via Alembic (configured but not yet used)
- **Repository Pattern** for clean data access layer

**Database Schema**
- **users**: Authentication and user management
  - username/password (bcrypt hashed)
  - Created timestamp
  
- **cars**: Vehicle inventory with rich metadata
  - Source tracking (AutoTrader, CarGurus)
  - Structured data: brand, model, year, price, mileage, location
  - Specifications: acceleration, top speed, power, MPG
  - Arrays: features, images
  - Vector embeddings (pgvector, 1536 dimensions)
  - Active/inactive flag for soft deletes

- **searches**: User search history
  - Query text and extracted features
  - Query embeddings for preference learning
  - User relationship

- **searchResults**: Many-to-many join table
  - Links searches to matched cars
  - Match score and ranking

- **userPreferences**: Learned user preferences
  - Aggregated preference embeddings
  - JSON storage for preference details

**Vector Search**
- pgvector extension for similarity search
- Cosine similarity for semantic matching
- Embeddings stored directly in PostgreSQL for efficient querying

### External Dependencies

**Core Services**
- **OpenAI API**: GPT-5 for NLU, text-embedding-3-small for vectors
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Platform**: Development and deployment environment

**Web Scraping Targets**
- AutoTrader (www.autotrader.com)
- CarGurus (planned integration)
- Fallback to mock data generation when scraping unavailable

**Third-Party Libraries**

*Frontend:*
- **Radix UI**: ~30 accessible UI primitive components
- **Vite Plugins**: React, Tailwind, Replit integration
- **TypeScript**: Strict mode enabled with path aliases

*Python Backend:*
- **FastAPI**: Modern async web framework
- **LangChain + LangGraph**: Agentic workflow orchestration (Python)
- **langchain-openai**: OpenAI integration for LangChain
- **SQLAlchemy**: ORM with async support
- **pgvector**: PostgreSQL vector extension for Python
- **Pydantic**: Data validation and settings management
- **structlog**: Structured logging with JSON output
- **httpx**: Async HTTP client for web scraping
- **BeautifulSoup + selectolax**: HTML parsing
- **passlib + bcrypt**: Password hashing
- **python-jose**: JWT token handling
- **Tenacity**: Retry logic with exponential backoff

**Font Services**
- Google Fonts CDN for Outfit, Plus Jakarta Sans, JetBrains Mono

### Authentication Strategy

**Python Backend Implementation (COMPLETED)**
- bcrypt password hashing via passlib
- User signup with username, email, password validation
- User login with credential verification
- AuthService layer with repository pattern
- Pydantic schemas for request validation
- Ready for JWT token-based sessions (python-jose installed)

### Car Listing Features

**"Find Dealer" Button (Nov 23, 2025)**
- **Problem**: Auto.dev API does not provide working URLs to dealer websites
  - API fields `vdpUrl`, `hrefTarget`, and `clickoffUrl` all return 404 errors
  - No direct links to original listings or dealer websites available
- **Solution**: Google Search fallback for dealer discovery
  - Button constructs Google search URL using dealer name + location
  - Format: `https://www.google.com/search?q={dealerName}+{location}`
  - Example: "Matt Blatt Mitsubishi Glassboro, NJ" → Google search
  - Opens in new tab for user convenience
- **Implementation**:
  - Frontend: `client/src/components/car-card.tsx` - `getDealerSearchUrl()` function
  - Backend provides `dealerName` and `location` fields from Auto.dev API
  - CarResult interface supports both `dealerName` and legacy `dealership` field
- **User Experience**:
  - Guarantees users can find dealer contact information
  - More reliable than broken Auto.dev URLs
  - Works for all listings regardless of data source
### Feature: Personalized Results (Nov 23, 2025)

**Implementation**
- On login, frontend automatically fetches personalized car recommendations
- Backend serves either:
  1. **Cached Search Results**: User's most recent search with matched cars
  2. **Location-Based Results**: Auto.dev query using user's location/postal_code
- Atomic search history persistence using flush() for ID generation before commit
- SearchRepository.get_latest_with_results() joins searches + searchResults + cars

**UX Indicators**
- "Curated for You" badge for cached search results
- "Near {location}" badge for location-based results
- Skeleton loading states during fetch
- Error fallback to manual search

**Data Flow**
1. User logs in → Frontend calls GET /api/search/personalized
2. Backend checks SearchRepository.get_latest_with_results(user_id)
3. If found: Return cached results with "Curated for You" context
4. If not found: Query Auto.dev with location fallback → Return with "Near X" context
5. Frontend displays results with appropriate badges and styling

**Technical Notes**
- Search persistence wraps Search + SearchResult creation in single transaction
- Uses db.flush() to get Search.id before creating SearchResults
- Bulk insert of SearchResults for performance
- Preference update runs after commit (outside transaction scope)
- Future hardening: Wrap all three operations in single transaction context
