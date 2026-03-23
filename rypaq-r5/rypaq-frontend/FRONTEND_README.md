# Rypaq R1 Frontend - Complete Rewrite

## Overview

This is a complete rewrite of the Rypaq R1 frontend, addressing all critical bugs and architectural issues from the original codebase. The new frontend is built with React 19, Vite, and Tailwind CSS, featuring a minimalistic, performance-focused design optimized for integration with the Python FastAPI backend.

## Key Improvements

### Architecture
- **Replaced tRPC with native fetch API**: Direct FastAPI integration without type mismatch
- **Clean API client layer**: Type-safe API calls with proper error handling
- **Simplified state management**: React hooks and Context API (no Redux/Zustand overhead)
- **Proper error boundaries**: Graceful error handling throughout the app

### Performance
- **Minimal bundle size**: No unnecessary dependencies
- **Efficient data fetching**: Proper loading states and caching
- **Fast page transitions**: Lightweight routing with Wouter
- **Optimized rendering**: No excessive re-renders or prop drilling

### Design
- **Minimalistic UI**: Clean, data-focused interface inspired by modern fintech platforms
- **Consistent color scheme**: Semantic colors with proper contrast
- **Responsive layout**: Mobile-first design with proper breakpoints
- **Accessibility**: Keyboard navigation and focus indicators

## Project Structure

```
client/
├── src/
│   ├── pages/
│   │   ├── Home.tsx              # Public landing page
│   │   ├── Dashboard.tsx          # Main dashboard overview
│   │   ├── RiskPredictions.tsx    # Risk analysis interface
│   │   ├── PortfolioManagement.tsx # Portfolio management
│   │   ├── Settings.tsx           # User settings
│   │   └── NotFound.tsx           # 404 page
│   ├── components/
│   │   ├── DashboardLayout.tsx    # Main app layout with sidebar
│   │   ├── ErrorBoundary.tsx      # Error handling
│   │   └── ui/                    # shadcn/ui components
│   ├── contexts/
│   │   └── ThemeContext.tsx       # Theme management
│   ├── lib/
│   │   ├── api.ts                 # API client for FastAPI
│   │   ├── types.ts               # TypeScript type definitions
│   │   └── utils.ts               # Utility functions
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global styles
├── index.html                     # HTML template
└── package.json                   # Dependencies
```

## API Integration

The frontend communicates with the Python FastAPI backend using a clean, type-safe API client:

```typescript
import { api } from "@/lib/api";
import { MacroIndicators } from "@/lib/types";

// Fetch macro data
const macro = await api.get<MacroIndicators>("/macro/live");

// Post prediction request
const result = await api.post<PredictionResponse>("/api/trpc/pesaRiskPredict", {
  input: { gdpGrowth: 4.72, inflation: 4.49, ... }
});
```

### Expected Backend Endpoints

The frontend expects the following endpoints from the Python backend:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/macro/live` | GET | Kenya macro indicators |
| `/api/trpc/pesaRiskPredict` | POST | Risk prediction analysis |
| `/api/predictions` | GET | List user predictions |
| `/api/portfolios` | GET | List user portfolios |
| `/api/alerts` | GET | List user alerts |

## Type Safety

All API responses are fully typed using TypeScript interfaces defined in `lib/types.ts`. This ensures type safety across the entire application and catches errors at compile time.

```typescript
// Example: Strongly typed API response
const prediction: PredictionResponse = {
  riskScore: 0.42,
  predictedIrr: 18.4,
  confidence: 0.87,
  riskLabel: "Moderate Risk",
  riskAdjustedReturn: 10.7,
  sharpeProxy: 36.8,
  shapValues: { /* ... */ }
};
```

## Development

### Install Dependencies
```bash
npm install
# or
pnpm install
```

### Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Build for Production
```bash
npm run build
```

### Environment Variables

Create a `.env` file with:
```
VITE_API_URL=http://localhost:8000/api
```

## Design Philosophy

The frontend follows a **Modern Minimalism** design approach:

- **Information Hierarchy**: Every visual element serves data communication
- **Performance-Centric**: Minimal animations, efficient rendering
- **Monochromatic Base**: Neutral colors with semantic accents
- **Generous Whitespace**: Ample padding for reduced cognitive load
- **System Fonts**: No custom fonts for better performance

## Pages

### Home (`/`)
Public landing page with feature highlights and call-to-action buttons.

### Dashboard (`/dashboard`)
Main overview page showing:
- Kenya macro indicators (GDP, inflation, lending rate)
- Portfolio risk score with gauge visualization
- Sector allocation pie chart
- Usage statistics
- Recent predictions

### Risk Predictions (`/predictions`)
Interactive risk analysis interface with:
- Adjustable input sliders for model parameters
- Real-time risk score calculation
- SHAP value visualization showing feature importance
- Predicted IRR and confidence metrics

### Portfolio Management (`/portfolio`)
Portfolio tracking with:
- Portfolio summary cards
- Performance charts
- Deal listings with status indicators
- Risk and return metrics

### Settings (`/settings`)
User account management:
- Account information
- Notification preferences
- API key management
- Account deletion and data export

## Migration from Old Frontend

### What Changed
- Removed tRPC dependency (incompatible with FastAPI)
- Replaced complex state management with simple React hooks
- Removed hardcoded mock data (now fetched from backend)
- Simplified component structure
- Added proper error handling

### What Stayed the Same
- shadcn/ui components (improved and updated)
- Tailwind CSS for styling
- Wouter for routing
- Recharts for data visualization

## Known Limitations

1. **Authentication**: OAuth flow not yet implemented (backend needs to provide endpoints)
2. **Real Data**: Dashboard uses mock data until backend endpoints are complete
3. **API Endpoints**: Some endpoints are stubs and need backend implementation
4. **Notifications**: Push notifications not yet implemented

## Next Steps

1. **Implement Backend Endpoints**: Create all expected API endpoints in FastAPI
2. **Add Authentication**: Implement OAuth flow and session management
3. **Connect Real Data**: Replace mock data with actual API calls
4. **Add More Features**: Implement forecasts, alerts, and admin panel
5. **Performance Optimization**: Add caching and request deduplication

## Troubleshooting

### API Connection Issues
- Check `VITE_API_URL` environment variable
- Ensure backend is running on the correct port
- Check browser console for CORS errors

### Type Errors
- Run `npm run check` to verify TypeScript
- Update types in `lib/types.ts` if backend schema changes

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

## Support

For issues or questions, refer to the backend documentation or contact the development team.
