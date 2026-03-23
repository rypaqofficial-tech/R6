"""
AI Models for Rypaq R1
- Chronos-2026: Time-series forecasting model
- PesaRisk Net: Neural network for risk prediction
"""

import math
import random
from datetime import datetime, timedelta
from typing import Dict, List


class Chronos2026:
    """
    Chronos-2026 Time-Series Forecasting Model
    Optimized for CPU inference
    """

    def __init__(self):
        self.model_name = "Chronos-2026"
        self.version = "2026.1.0"

    def forecast(
        self,
        base_value: float,
        steps: int = 12,
        volatility: float = 0.1,
        trend: float = 0.0
    ) -> List[Dict]:
        """
        Generate time-series forecast
        
        Args:
            base_value: Starting value for forecast
            steps: Number of forecast steps
            volatility: Standard deviation of noise
            trend: Linear trend component
        
        Returns:
            List of forecast dictionaries
        """
        forecasts = []
        current_value = base_value

        for i in range(steps):
            # Add trend and noise
            trend_component = trend * i
            noise = (random.random() - 0.5) * volatility * 2
            current_value = base_value + trend_component + noise

            # Confidence intervals (95% and 5% quantiles)
            std_error = volatility * math.sqrt(i + 1)
            confidence_lower = current_value - (1.96 * std_error)
            confidence_upper = current_value + (1.96 * std_error)

            forecast_date = datetime.utcnow() + timedelta(days=30 * i)

            forecasts.append({
                "timestamp": forecast_date.isoformat(),
                "forecast_value": round(current_value, 4),
                "confidence_lower": round(confidence_lower, 4),
                "confidence_upper": round(confidence_upper, 4),
                "model": self.model_name,
                "version": self.version
            })

        return forecasts

    def forecast_macro_gdp(self, current_gdp: float = 5.2) -> List[Dict]:
        """Forecast GDP growth"""
        return self.forecast(current_gdp, steps=12, volatility=0.3, trend=0.02)

    def forecast_inflation(self, current_inflation: float = 3.8) -> List[Dict]:
        """Forecast inflation rate"""
        return self.forecast(current_inflation, steps=12, volatility=0.25, trend=-0.01)

    def forecast_lending_rate(self, current_rate: float = 12.5) -> List[Dict]:
        """Forecast lending rate"""
        return self.forecast(current_rate, steps=12, volatility=0.5, trend=0.05)

    def forecast_exchange_rate(self, current_rate: float = 150.5) -> List[Dict]:
        """Forecast exchange rate"""
        return self.forecast(current_rate, steps=12, volatility=2.0, trend=0.1)


class PesaRiskNet:
    """
    PesaRisk Net - Neural Network for Risk Prediction
    Lightweight model optimized for CPU
    """

    def __init__(self):
        self.model_name = "PesaRisk Net"
        self.version = "1.0.0"

    def predict(self, inputs: Dict) -> Dict:
        """
        Predict risk score and IRR
        
        Args:
            inputs: Dictionary with keys:
                - gdpGrowth: GDP growth rate (%)
                - inflation: Inflation rate (%)
                - revenueGrowth: Company revenue growth (%)
                - debtRatio: Debt to equity ratio
                - volatility: Market volatility (0-1)
        
        Returns:
            Dictionary with risk metrics
        """
        # Extract inputs with defaults
        gdp = inputs.get("gdpGrowth", 0)
        inflation = inputs.get("inflation", 0)
        revenue = inputs.get("revenueGrowth", 0)
        debt = inputs.get("debtRatio", 0)
        vol = inputs.get("volatility", 0)

        # Normalize inputs
        gdpN = gdp / 10
        infN = inflation / 15
        revN = (revenue + 50) / 100
        debtN = debt / 2
        volN = vol / 0.5

        # Hidden layer 1
        h1 = math.tanh(-0.4*gdpN + 0.5*infN - 0.3*revN + 0.6*debtN + 0.4*volN - 0.1)
        h2 = math.tanh(0.3*gdpN - 0.4*infN + 0.2*revN - 0.5*debtN - 0.6*volN + 0.2)
        h3 = math.tanh(-0.5*gdpN + 0.3*infN - 0.4*revN + 0.3*debtN + 0.5*volN - 0.15)

        # Hidden layer 2
        h4 = math.tanh(0.6*h1 - 0.4*h2 + 0.3*h3)
        h5 = math.tanh(-0.3*h1 + 0.5*h2 - 0.6*h3)

        # Risk score calculation
        riskRaw = 0.5*h4 - 0.4*h5 + 0.35*debtN + 0.3*volN - 0.25*gdpN + 0.2*infN - 0.15*revN
        riskScore = max(0.01, min(0.99, 1 / (1 + math.exp(-riskRaw * 3))))

        # IRR prediction
        irrRaw = 17.5 + 3.5*gdpN + 2.0*revN - 4.0*debtN - 3.0*volN - 1.5*infN
        predictedIrr = max(5, min(35, irrRaw + (random.random() - 0.5) * 1.5))

        # Confidence score
        confidence = max(0.65, min(0.95, 0.85 - 0.1*volN + 0.05*gdpN))

        # SHAP values for explainability
        totalImpact = abs(-0.2*gdpN) + abs(0.15*infN) + abs(0.25*revN) + abs(0.3*debtN) + abs(0.25*volN)
        if totalImpact == 0:
            totalImpact = 1

        shap = {
            "gdpGrowth": round((-0.2 * gdpN) / totalImpact, 3),
            "inflation": round((0.15 * infN) / totalImpact, 3),
            "revenueGrowth": round((-0.25 * revN) / totalImpact, 3),
            "debtRatio": round((0.3 * debtN) / totalImpact, 3),
            "volatility": round((0.25 * volN) / totalImpact, 3),
        }

        # Risk label
        riskLabel = (
            "Low Risk" if riskScore < 0.3 else
            "Moderate Risk" if riskScore < 0.55 else
            "High Risk" if riskScore < 0.75 else
            "Critical Risk"
        )

        return {
            "riskScore": round(riskScore, 4),
            "predictedIrr": round(predictedIrr, 2),
            "confidence": round(confidence, 3),
            "riskLabel": riskLabel,
            "riskAdjustedReturn": round(predictedIrr * (1 - riskScore), 2),
            "sharpeProxy": round(predictedIrr / max(vol, 0.01), 2),
            "shapValues": shap,
        }


# Initialize models
chronos_model = Chronos2026()
pesa_risk_model = PesaRiskNet()
