# Rypaq R1 Frontend - Setup & Integration Guide

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev

# Build for production
npm run build
```

The development server will start at `http://localhost:3000`.

## Environment Configuration

Create a `.env` file in the project root:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000/api

# Optional: Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## Backend Integration

### Python FastAPI Backend

The frontend expects a Python FastAPI backend running on `http://localhost:8000` with the following structure:

#### Required Endpoints

**1. Health Check**
```
GET /api/health
Response: { "status": "ok", "backend": "python" }
```

**2. Macro Indicators**
```
GET /api/macro/live
Response: {
  "gdp": 4.72,
  "inflation": 4.49,
  "lendingRate": 13.0,
  "gdpGrowth": 4.72,
  "cbrRate": 13.0,
  "exchangeRate": 129.5,
  "nseIndex": 1842.3
}
```

**3. Risk Prediction**
```
POST /api/trpc/pesaRiskPredict
Request: {
  "input": {
    "gdpGrowth": 4.72,
    "inflation": 4.49,
    "revenueGrowth": 15,
    "debtRatio": 0.5,
    "volatility": 0.2
  }
}
Response: {
  "riskScore": 0.42,
  "predictedIrr": 18.4,
  "confidence": 0.87,
  "riskLabel": "Moderate Risk",
  "riskAdjustedReturn": 10.7,
  "sharpeProxy": 36.8,
  "shapValues": { ... }
}
```

**4. User Predictions**
```
GET /api/predictions
Response: [
  {
    "id": 1,
    "user_id": 1,
    "risk_score": 0.42,
    "predicted_irr": 18.4,
    "confidence": 0.87,
    "risk_label": "Moderate Risk",
    "created_at": "2026-03-18T04:00:00Z"
  }
]
```

**5. Portfolios**
```
GET /api/portfolios
Response: [
  {
    "id": 1,
    "user_id": 1,
    "name": "Primary Portfolio",
    "deals": [ ... ],
    "total_value": 1200000,
    "total_irr": 20.3,
    "portfolio_risk": 0.38
  }
]
```

### Connecting to Backend

1. **Ensure backend is running**:
   ```bash
   cd python-backend
   python main.py
   ```

2. **Update API URL** in `.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

3. **Start frontend**:
   ```bash
   npm run dev
   ```

## Architecture Overview

### Frontend Stack
- **React 19**: Modern UI framework with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components
- **Recharts**: Data visualization
- **Wouter**: Lightweight routing
- **Sonner**: Toast notifications

### API Client

The frontend uses a custom API client (`lib/api.ts`) that:
- Handles all HTTP requests to the backend
- Provides type-safe responses with TypeScript
- Includes automatic error handling and logging
- Supports GET, POST, PUT, DELETE methods

Example usage:
```typescript
import { api } from "@/lib/api";
import { MacroIndicators } from "@/lib/types";

const macro = await api.get<MacroIndicators>("/macro/live");
```

### Type Safety

All API responses are fully typed in `lib/types.ts`. This ensures:
- Compile-time type checking
- IDE autocomplete support
- Runtime type validation
- Better developer experience

## Project Structure

```
client/
├── src/
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── contexts/           # React contexts
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript types
│   │   └── utils.ts       # Utilities
│   ├── App.tsx            # Main app
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html             # HTML template
└── package.json           # Dependencies
```

## Development Workflow

### Adding a New Page

1. Create component in `src/pages/YourPage.tsx`:
```typescript
export default function YourPage() {
  return <div>Your content</div>;
}
```

2. Add route in `src/App.tsx`:
```typescript
<Route path="/your-page" component={YourPage} />
```

### Adding API Calls

1. Define types in `src/lib/types.ts`:
```typescript
export interface YourData {
  id: number;
  name: string;
}
```

2. Use in component:
```typescript
import { api } from "@/lib/api";
import { YourData } from "@/lib/types";

const data = await api.get<YourData>("/your-endpoint");
```

### Styling

Use Tailwind CSS classes:
```typescript
<div className="bg-background text-foreground p-4 rounded-lg">
  Content
</div>
```

Available semantic colors:
- `background` / `foreground`
- `card` / `card-foreground`
- `primary` / `primary-foreground`
- `secondary` / `secondary-foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `destructive` / `destructive-foreground`

## Testing

### Type Checking
```bash
npm run check
```

### Build Check
```bash
npm run build
```

### Development
```bash
npm run dev
```

## Deployment

### Build for Production
```bash
npm run build
```

This creates:
- `dist/public/` - Static frontend files
- `dist/index.js` - Server entry point

### Environment Variables for Production

Set these environment variables before deployment:
```
VITE_API_URL=https://api.yourdomain.com
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com
VITE_ANALYTICS_WEBSITE_ID=your-id
```

## Troubleshooting

### API Connection Errors

**Problem**: "Failed to fetch from /api/..."

**Solution**:
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Verify `VITE_API_URL` in `.env`
3. Check CORS headers from backend
4. Check browser console for detailed errors

### TypeScript Errors

**Problem**: "Cannot find module..."

**Solution**:
1. Run `npm install` to ensure all dependencies are installed
2. Run `npm run check` to see all errors
3. Check import paths are correct

### Build Errors

**Problem**: "Module not found" during build

**Solution**:
1. Clear cache: `rm -rf .vite node_modules`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

## Performance Optimization

The frontend is already optimized for performance:
- Minimal dependencies
- Code splitting via Vite
- Lazy loading of routes
- Efficient data fetching
- CSS minification

For further optimization:
1. Enable compression on server
2. Use CDN for static assets
3. Implement request caching
4. Monitor bundle size

## Security

- All API calls use HTTPS in production
- CORS properly configured
- No sensitive data in localStorage
- Input validation on forms
- XSS protection via React

## Support & Documentation

- **Frontend README**: `FRONTEND_README.md`
- **Backend Integration**: See backend documentation
- **Component Library**: shadcn/ui (https://ui.shadcn.com)
- **Tailwind CSS**: https://tailwindcss.com

## Next Steps

1. Implement missing backend endpoints
2. Add authentication/OAuth flow
3. Connect real data sources
4. Add more features (forecasts, alerts, admin panel)
5. Performance monitoring and optimization
