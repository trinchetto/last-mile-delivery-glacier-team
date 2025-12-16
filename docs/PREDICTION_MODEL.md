# DeliveryIQ - Prediction Model Documentation

## Overview

The DeliveryIQ Prediction Model uses **XGBoost (Gradient Boosting)** to predict the probability of late delivery based on historical shipment data.

---

## Model Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INPUT DATA                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  • lane_id (origin → destination)                                           │
│  • carrier_pseudo (carrier identifier)                                       │
│  • carrier_mode (LTL / Truckload)                                           │
│  • customer_distance (miles)                                                 │
│  • distance_bucket (0-100, 100-250, 250-500, etc.)                          │
│  • all_modes_goal_transit_days (expected transit time)                       │
│  • ship_dow (day of week: 0=Mon, 6=Sun)                                     │
│  • ship_month (1-12)                                                        │
│  • ship_hour (0-23)                                                         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE ENGINEERING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │   LANE STATS      │  │  CARRIER STATS    │  │  COMBO STATS      │       │
│  │                   │  │                   │  │                   │       │
│  │ • lane_late_rate  │  │ • carrier_late_   │  │ • carrier_lane_   │       │
│  │ • lane_shipment_  │  │   rate            │  │   late_rate       │       │
│  │   count           │  │ • carrier_ship_   │  │ • carrier_lane_   │       │
│  │ • lane_avg_       │  │   ment_count      │  │   count           │       │
│  │   transit         │  │ • carrier_avg_    │  │ • carrier_lane_   │       │
│  │ • lane_avg_       │  │   transit         │  │   avg_transit     │       │
│  │   distance        │  │ • carrier_late_   │  │                   │       │
│  │ • lane_late_std   │  │   std             │  │                   │       │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘       │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                    DERIVED FEATURES                                │     │
│  │                                                                    │     │
│  │  • is_weekend_ship        • goal_transit_ratio                    │     │
│  │  • is_month_end           • distance_per_goal_day                 │     │
│  │  • is_ltl                 • lane_experience (log)                 │     │
│  │  • distance_bucket_enc    • carrier_experience (log)              │     │
│  │  • high_risk_lane         • carrier_lane_experience (log)         │     │
│  │  • high_risk_carrier                                              │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          XGBOOST MODEL                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────┐          │
│    │  XGBClassifier Parameters:                                   │          │
│    │  • n_estimators: 200 (number of trees)                      │          │
│    │  • max_depth: 6 (tree depth)                                │          │
│    │  • learning_rate: 0.1                                       │          │
│    │  • scale_pos_weight: auto (handles class imbalance)         │          │
│    │  • min_child_weight: 3                                      │          │
│    │  • subsample: 0.8 (80% of data per tree)                    │          │
│    │  • colsample_bytree: 0.8 (80% of features per tree)         │          │
│    │  • eval_metric: 'auc'                                       │          │
│    └─────────────────────────────────────────────────────────────┘          │
│                                                                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OUTPUT                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────┐          │
│    │  {                                                          │          │
│    │    "risk_score": 0.72,        // Probability 0-1            │          │
│    │    "risk_level": "HIGH",      // LOW/MEDIUM/HIGH            │          │
│    │    "confidence": 0.85,        // Based on data volume       │          │
│    │    "lane_late_rate": 0.35,    // Historical lane rate       │          │
│    │    "carrier_late_rate": 0.28  // Historical carrier rate    │          │
│    │  }                                                          │          │
│    └─────────────────────────────────────────────────────────────┘          │
│                                                                              │
│    Risk Level Thresholds:                                                   │
│    • LOW:    risk_score < 0.30                                              │
│    • MEDIUM: 0.30 ≤ risk_score < 0.70                                       │
│    • HIGH:   risk_score ≥ 0.70                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Descriptions

### 🛣️ Lane Features
| Feature | Description | Source |
|---------|-------------|--------|
| `lane_late_rate` | Historical late delivery rate for this lane | Calculated from training data |
| `lane_shipment_count` | Number of historical shipments on this lane | Calculated from training data |
| `lane_late_std` | Standard deviation of late rate | Calculated from training data |
| `lane_avg_transit` | Average transit days for this lane | Calculated from training data |
| `lane_transit_std` | Transit time variability | Calculated from training data |
| `lane_avg_distance` | Average distance for this lane | Calculated from training data |

### 🚚 Carrier Features
| Feature | Description | Source |
|---------|-------------|--------|
| `carrier_late_rate` | Historical late delivery rate for this carrier | Calculated from training data |
| `carrier_shipment_count` | Number of historical shipments by carrier | Calculated from training data |
| `carrier_late_std` | Carrier performance variability | Calculated from training data |
| `carrier_avg_transit` | Carrier's average transit time | Calculated from training data |
| `carrier_transit_std` | Carrier transit time variability | Calculated from training data |

### 🔗 Carrier-Lane Combination Features
| Feature | Description | Source |
|---------|-------------|--------|
| `carrier_lane_late_rate` | Late rate for specific carrier on specific lane | Calculated from training data |
| `carrier_lane_count` | Times this carrier has serviced this lane | Calculated from training data |
| `carrier_lane_avg_transit` | Carrier's avg transit on this specific lane | Calculated from training data |

### ⏰ Temporal Features
| Feature | Description | Values |
|---------|-------------|--------|
| `ship_dow` | Day of week shipped | 0 (Mon) - 6 (Sun) |
| `ship_month` | Month shipped | 1-12 |
| `ship_hour` | Hour shipped | 0-23 |
| `is_weekend_ship` | Shipped on weekend | 0 or 1 |
| `is_month_end` | Shipped day ≥ 25 | 0 or 1 |

### 📏 Distance & Goal Features
| Feature | Description | Calculation |
|---------|-------------|-------------|
| `customer_distance` | Raw distance in miles | Input |
| `distance_bucket_encoded` | Distance category | 0-5 encoding |
| `goal_transit_ratio` | Goal vs actual transit | goal / lane_avg_transit |
| `distance_per_goal_day` | Miles per expected day | distance / goal_days |

### 📊 Experience Features (Log-transformed)
| Feature | Description |
|---------|-------------|
| `lane_experience` | log(1 + lane_shipment_count) |
| `carrier_experience` | log(1 + carrier_shipment_count) |
| `carrier_lane_experience` | log(1 + carrier_lane_count) |

### ⚠️ Risk Indicators
| Feature | Description | Threshold |
|---------|-------------|-----------|
| `high_risk_lane` | Lane has high late rate | lane_late_rate > 0.30 |
| `high_risk_carrier` | Carrier has high late rate | carrier_late_rate > 0.30 |

---

## Model Performance

```
┌──────────────────────────────────────────┐
│        PERFORMANCE METRICS               │
├──────────────────────────────────────────┤
│  Accuracy:  ~0.82                        │
│  Precision: ~0.75                        │
│  Recall:    ~0.68                        │
│  F1 Score:  ~0.71                        │
│  ROC AUC:   ~0.85                        │
└──────────────────────────────────────────┘
```

### Top Feature Importances

1. `carrier_lane_late_rate` - Most predictive single feature
2. `lane_late_rate` - Lane historical performance
3. `carrier_late_rate` - Carrier historical performance
4. `goal_transit_ratio` - How aggressive is the goal
5. `carrier_lane_avg_transit` - Past performance on this exact route
6. `lane_avg_transit` - Expected transit time
7. `distance_per_goal_day` - Distance vs time expectation
8. `high_risk_lane` - Binary risk indicator
9. `carrier_experience` - Carrier volume
10. `is_month_end` - Temporal pattern

---

## Training Process

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Load Data  │────►│  Time-Based │────►│   Feature   │────►│    Train    │
│  72K+ rows  │     │    Split    │     │ Engineering │     │   XGBoost   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  80% Training (earlier)  │
              │  20% Test (later dates)  │
              │  Prevents data leakage!  │
              └─────────────────────────┘
```

**Key Training Decisions:**
- **Time-based split**: Training data from earlier dates, test data from later dates
- **Prevents leakage**: Historical stats computed only from training period
- **Class imbalance**: Handled with `scale_pos_weight` parameter
- **Regularization**: `min_child_weight`, `subsample`, `colsample_bytree`

---

## Usage Example

```python
# Initialize and load model
model = DeliveryRiskModel()
model.load_model('models/')

# Predict risk for a new shipment
shipment = {
    'lane_id': '109c918ef6db',
    'carrier_pseudo': '19936bf01cc6',
    'carrier_mode': 'Truckload',
    'customer_distance': 275,
    'distance_bucket': '250-500',
    'all_modes_goal_transit_days': 1,
    'ship_dow': 0,       # Monday
    'ship_month': 1,     # January
    'ship_hour': 10,     # 10 AM
    'actual_ship': '2024-01-15 10:00:00'
}

result = model.predict_risk(shipment)
# {
#   'risk_score': 0.72,
#   'risk_level': 'HIGH',
#   'confidence': 0.85,
#   'lane_late_rate': 0.35,
#   'carrier_late_rate': 0.28
# }
```

---

## Files

| File | Description |
|------|-------------|
| `delivery_risk_model.py` | Main model class and training pipeline |
| `models/delivery_risk_model.pkl` | Serialized XGBoost model |
| `models/model_artifacts.pkl` | Feature columns and historical stats |
| `model_evaluation.png` | Evaluation plots (confusion matrix, ROC, etc.) |
