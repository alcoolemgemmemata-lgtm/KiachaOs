# Development Environment Setup

Create a `.env.local` file in the root directory:

```env
# Backend Configuration
BACKEND_URL=http://localhost:3001
JWT_SECRET=kiacha-os-jwt-super-secret
NODE_ENV=development

# Database
CHROMA_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379

# API Keys (if using external services)
OPENAI_API_KEY=
HUGGINGFACE_API_KEY=
```

## Running Services

### Terminal 1: Frontend
```bash
cd frontend
npm install
npm run dev
```

### Terminal 2: Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 3: Docker Services (Chroma + Redis)
```bash
docker-compose up chroma redis
```

## Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Backend Tests
```bash
cd backend
npm run test
```

### Build Verification
```bash
make build-os
```
