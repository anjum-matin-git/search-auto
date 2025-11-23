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

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server
- Separate development (`index-dev.ts`) and production (`index-prod.ts`) entry points
- Development mode integrates Vite middleware for SSR-like experience
- Production mode serves pre-built static assets

**AI Agent System (LangGraph)**
- StateGraph-based workflow with typed state annotations
- Multi-step agentic process:
  1. **Query Analysis**: Extract car features from natural language using GPT-5
  2. **Web Scraping**: Parallel scraping of AutoTrader and CarGurus
  3. **Embedding Generation**: Create vector embeddings for semantic search
  4. **Database Storage**: Store scraped cars with embeddings
  5. **Similarity Search**: Find matching vehicles using cosine similarity

**OpenAI Integration**
- GPT-5 model for natural language understanding and feature extraction
- text-embedding-3-small for vector embeddings (1536 dimensions)
- JSON mode for structured data extraction from user queries

**Web Scraping**
- Axios for HTTP requests
- Cheerio for HTML parsing
- Mock car generation fallback when scraping fails
- Graceful error handling with fallback to generated data

**API Design**
- RESTful endpoints:
  - `POST /api/search` - Main search endpoint accepting natural language queries
  - `GET /api/search/history` - User search history retrieval
- Request/response logging middleware with JSON body capture
- Error handling middleware for consistent error responses

### Data Storage

**Database: PostgreSQL via Neon**
- Neon serverless PostgreSQL for scalable, managed database hosting
- Connection pooling via `@neondatabase/serverless`
- WebSocket support for edge/serverless environments

**ORM: Drizzle**
- Type-safe schema definitions in `shared/schema.ts`
- Schema-first approach with automatic TypeScript type generation
- Migration system configured in `drizzle.config.ts`

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
- **@langchain/langgraph**: Agentic workflow orchestration
- **@langchain/openai**: OpenAI integration for LangChain
- **Radix UI**: ~30 accessible UI primitive components
- **Cheerio**: Server-side HTML parsing
- **Drizzle ORM**: Type-safe database queries
- **bcryptjs**: Password hashing for authentication
- **Zod**: Runtime schema validation (via drizzle-zod)

**Font Services**
- Google Fonts CDN for Outfit, Plus Jakarta Sans, JetBrains Mono

**Development Dependencies**
- **Vite Plugins**: React, Tailwind, Replit integration (cartographer, dev-banner)
- **TypeScript**: Strict mode enabled with path aliases
- **ESBuild**: Production bundling for server code

### Authentication Strategy

Basic username/password authentication prepared in schema, but not yet implemented in routes. Ready for session-based or JWT authentication addition.