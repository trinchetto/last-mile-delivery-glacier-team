#!/usr/bin/env python3
"""
Risk Scoring Engine for Probabilistic Delivery Advisor
DeliveryIQ: AI-Powered Last Mile Risk Assessment

This module provides an ensemble risk scoring engine that combines:
1. ML model predictions (XGBoost)
2. Historical lane performance statistics
3. Carrier-lane combination performance

Features:
- Ensemble scoring with configurable weights
- Confidence interval calculation based on data availability
- Historical analog finder for similar shipments
- Time-windowed statistics (e.g., last 6 months)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import pickle
import warnings
warnings.filterwarnings('ignore')

import xgboost as xgb

from delivery_risk_model import DeliveryRiskModel


class RiskScoringEngine:
    """
    Ensemble risk scoring engine for delivery predictions.

    Combines multiple signals to produce a robust risk score:
    - ML model probability (captures complex feature interactions)
    - Lane historical late rate (captures route-specific patterns)
    - Carrier-lane performance (captures carrier reliability on specific routes)
    """

    # Default ensemble weights
    DEFAULT_WEIGHTS = {
        'ml_model': 0.4,
        'lane_performance': 0.3,
        'carrier_lane_performance': 0.3
    }

    def __init__(self,
                 data_path: str = 'data/last-mile-data.csv',
                 model_dir: str = 'models',
                 lookback_months: int = 6):
        """
        Initialize the risk scoring engine.

        Args:
            data_path: Path to historical shipment data
            model_dir: Directory containing trained ML model
            lookback_months: Number of months to look back for statistics
        """
        self.data_path = data_path
        self.model_dir = model_dir
        self.lookback_months = lookback_months

        self.df = None
        self.ml_model = None
        self.lane_stats = None
        self.carrier_stats = None
        self.carrier_lane_stats = None
        self.weights = self.DEFAULT_WEIGHTS.copy()

    def load(self) -> None:
        """Load data and ML model."""
        print("Loading Risk Scoring Engine...")

        # Load historical data
        print("  Loading historical data...")
        self.df = pd.read_csv(self.data_path)
        self.df['actual_ship'] = pd.to_datetime(self.df['actual_ship'])
        self.df['actual_delivery'] = pd.to_datetime(self.df['actual_delivery'])
        self.df['is_late'] = (self.df['otd_designation'] == 'Late').astype(int)

        # Load ML model
        print("  Loading ML model...")
        self.ml_model = DeliveryRiskModel(self.data_path)
        self.ml_model.load_data()
        self.ml_model.load_model(self.model_dir)

        # Compute statistics
        print("  Computing statistics...")
        self._compute_statistics()

        print(f"Risk Scoring Engine loaded successfully!")
        print(f"  - {len(self.df):,} historical shipments")
        print(f"  - {len(self.lane_stats):,} lanes")
        print(f"  - {len(self.carrier_stats):,} carriers")
        print(f"  - {len(self.carrier_lane_stats):,} carrier-lane combinations")

    def _compute_statistics(self, reference_date: datetime = None) -> None:
        """
        Compute lane and carrier statistics within the lookback window.

        Args:
            reference_date: Date to compute statistics from (defaults to latest in data)
        """
        if reference_date is None:
            reference_date = self.df['actual_ship'].max()

        cutoff_date = reference_date - timedelta(days=self.lookback_months * 30)

        # Filter to lookback window
        window_df = self.df[
            (self.df['actual_ship'] >= cutoff_date) &
            (self.df['actual_ship'] <= reference_date)
        ].copy()

        # Lane statistics
        self.lane_stats = window_df.groupby('lane_id').agg({
            'is_late': ['mean', 'count', 'std'],
            'actual_transit_days': ['mean', 'std', 'min', 'max', 'median'],
            'customer_distance': 'mean',
            'all_modes_goal_transit_days': 'mean'
        })
        self.lane_stats.columns = [
            'late_rate', 'shipment_count', 'late_std',
            'avg_transit', 'transit_std', 'min_transit', 'max_transit', 'median_transit',
            'avg_distance', 'avg_goal_transit'
        ]
        self.lane_stats = self.lane_stats.fillna(0)

        # Carrier statistics
        self.carrier_stats = window_df.groupby('carrier_pseudo').agg({
            'is_late': ['mean', 'count', 'std'],
            'actual_transit_days': ['mean', 'std']
        })
        self.carrier_stats.columns = [
            'late_rate', 'shipment_count', 'late_std',
            'avg_transit', 'transit_std'
        ]
        self.carrier_stats = self.carrier_stats.fillna(0)

        # Carrier-Lane statistics
        self.carrier_lane_stats = window_df.groupby(['carrier_pseudo', 'lane_id']).agg({
            'is_late': ['mean', 'count', 'std'],
            'actual_transit_days': ['mean', 'std', 'min', 'max', 'median']
        })
        self.carrier_lane_stats.columns = [
            'late_rate', 'shipment_count', 'late_std',
            'avg_transit', 'transit_std', 'min_transit', 'max_transit', 'median_transit'
        ]
        self.carrier_lane_stats = self.carrier_lane_stats.fillna(0)

    def get_lane_stats(self, lane_id: str) -> Dict[str, Any]:
        """
        Get historical statistics for a specific lane.

        Args:
            lane_id: Lane identifier

        Returns:
            Dictionary with lane statistics
        """
        if lane_id in self.lane_stats.index:
            stats = self.lane_stats.loc[lane_id].to_dict()
        else:
            # Return global averages for unknown lanes
            stats = {
                'late_rate': self.df['is_late'].mean(),
                'shipment_count': 0,
                'late_std': self.df['is_late'].std(),
                'avg_transit': self.df['actual_transit_days'].mean(),
                'transit_std': self.df['actual_transit_days'].std(),
                'min_transit': self.df['actual_transit_days'].min(),
                'max_transit': self.df['actual_transit_days'].max(),
                'median_transit': self.df['actual_transit_days'].median(),
                'avg_distance': self.df['customer_distance'].mean(),
                'avg_goal_transit': self.df['all_modes_goal_transit_days'].mean()
            }
        return stats

    def get_carrier_stats(self, carrier_pseudo: str) -> Dict[str, Any]:
        """
        Get historical statistics for a specific carrier.

        Args:
            carrier_pseudo: Carrier identifier

        Returns:
            Dictionary with carrier statistics
        """
        if carrier_pseudo in self.carrier_stats.index:
            stats = self.carrier_stats.loc[carrier_pseudo].to_dict()
        else:
            # Return global averages for unknown carriers
            stats = {
                'late_rate': self.df['is_late'].mean(),
                'shipment_count': 0,
                'late_std': self.df['is_late'].std(),
                'avg_transit': self.df['actual_transit_days'].mean(),
                'transit_std': self.df['actual_transit_days'].std()
            }
        return stats

    def get_carrier_lane_stats(self, carrier_pseudo: str, lane_id: str) -> Dict[str, Any]:
        """
        Get historical statistics for a specific carrier-lane combination.

        Args:
            carrier_pseudo: Carrier identifier
            lane_id: Lane identifier

        Returns:
            Dictionary with carrier-lane statistics
        """
        key = (carrier_pseudo, lane_id)
        if key in self.carrier_lane_stats.index:
            stats = self.carrier_lane_stats.loc[key].to_dict()
        else:
            # Fall back to lane stats, then carrier stats, then global
            lane_stats = self.get_lane_stats(lane_id)
            carrier_stats = self.get_carrier_stats(carrier_pseudo)

            # Blend lane and carrier stats
            stats = {
                'late_rate': (lane_stats['late_rate'] + carrier_stats['late_rate']) / 2,
                'shipment_count': 0,
                'late_std': max(lane_stats.get('late_std', 0), carrier_stats.get('late_std', 0)),
                'avg_transit': lane_stats['avg_transit'],
                'transit_std': lane_stats.get('transit_std', 0),
                'min_transit': lane_stats.get('min_transit', 0),
                'max_transit': lane_stats.get('max_transit', 10),
                'median_transit': lane_stats.get('median_transit', lane_stats['avg_transit'])
            }
        return stats

    def calculate_confidence(self, lane_id: str, carrier_pseudo: str) -> Dict[str, Any]:
        """
        Calculate confidence level based on data availability.

        Confidence is higher when:
        - More historical shipments exist for the lane
        - More historical shipments exist for the carrier-lane combo
        - Lower variance in historical performance

        Args:
            lane_id: Lane identifier
            carrier_pseudo: Carrier identifier

        Returns:
            Dictionary with confidence metrics
        """
        lane_stats = self.get_lane_stats(lane_id)
        carrier_lane_stats = self.get_carrier_lane_stats(carrier_pseudo, lane_id)

        # Base confidence on sample size (log scale for diminishing returns)
        lane_count = lane_stats['shipment_count']
        carrier_lane_count = carrier_lane_stats['shipment_count']

        # Sample size confidence (0-1)
        # 100 shipments = high confidence, 10 = medium, <5 = low
        sample_confidence = min(1.0, np.log1p(lane_count + carrier_lane_count) / np.log1p(200))

        # Variance confidence (lower variance = higher confidence)
        late_std = carrier_lane_stats.get('late_std', lane_stats.get('late_std', 0.5))
        variance_confidence = max(0, 1 - late_std)

        # Combined confidence score
        overall_confidence = 0.7 * sample_confidence + 0.3 * variance_confidence

        # Confidence level
        if overall_confidence >= 0.7:
            confidence_level = 'HIGH'
        elif overall_confidence >= 0.4:
            confidence_level = 'MEDIUM'
        else:
            confidence_level = 'LOW'

        return {
            'confidence_score': round(overall_confidence, 3),
            'confidence_level': confidence_level,
            'lane_shipment_count': int(lane_count),
            'carrier_lane_shipment_count': int(carrier_lane_count),
            'data_quality': 'sufficient' if lane_count >= 10 else 'limited'
        }

    def find_similar_shipments(self,
                               lane_id: str,
                               carrier_pseudo: str,
                               top_k: int = 50,
                               include_other_carriers: bool = True) -> pd.DataFrame:
        """
        Find historical shipments similar to the query shipment.

        Args:
            lane_id: Lane identifier
            carrier_pseudo: Carrier identifier
            top_k: Number of similar shipments to return
            include_other_carriers: Whether to include shipments from other carriers on same lane

        Returns:
            DataFrame with similar historical shipments
        """
        # First try exact carrier-lane match
        similar = self.df[
            (self.df['lane_id'] == lane_id) &
            (self.df['carrier_pseudo'] == carrier_pseudo)
        ].copy()

        # If not enough, include other carriers on same lane
        if len(similar) < top_k and include_other_carriers:
            lane_shipments = self.df[self.df['lane_id'] == lane_id].copy()
            # Prioritize same carrier
            lane_shipments['same_carrier'] = (lane_shipments['carrier_pseudo'] == carrier_pseudo).astype(int)
            lane_shipments = lane_shipments.sort_values(
                ['same_carrier', 'actual_ship'],
                ascending=[False, False]
            )
            similar = lane_shipments.head(top_k)
        else:
            similar = similar.sort_values('actual_ship', ascending=False).head(top_k)

        # Select relevant columns
        columns = [
            'actual_ship', 'actual_delivery', 'carrier_pseudo', 'carrier_mode',
            'customer_distance', 'all_modes_goal_transit_days', 'actual_transit_days',
            'otd_designation', 'is_late'
        ]

        return similar[columns].reset_index(drop=True)

    def calculate_delivery_risk(self, shipment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive delivery risk for a shipment.

        This is the main entry point for risk scoring. It combines:
        1. ML model prediction
        2. Historical lane performance
        3. Carrier-lane specific performance

        Args:
            shipment: Dictionary containing shipment details:
                - lane_id: Lane identifier
                - carrier_pseudo: Carrier identifier
                - carrier_mode: 'LTL' or 'Truckload'
                - customer_distance: Distance in miles
                - distance_bucket: Distance category
                - all_modes_goal_transit_days: Expected transit days
                - ship_dow: Day of week (0=Monday)
                - ship_month: Month (1-12)
                - ship_hour: Hour (0-23)
                - actual_ship: Ship datetime (optional)

        Returns:
            Comprehensive risk assessment dictionary
        """
        lane_id = shipment.get('lane_id', '')
        carrier_pseudo = shipment.get('carrier_pseudo', '')

        # 1. Get ML model prediction
        ml_prediction = self._get_ml_prediction(shipment)
        ml_probability = ml_prediction['risk_score']

        # 2. Get lane historical performance
        lane_stats = self.get_lane_stats(lane_id)
        lane_late_rate = lane_stats['late_rate']

        # 3. Get carrier-lane performance
        carrier_lane_stats = self.get_carrier_lane_stats(carrier_pseudo, lane_id)
        carrier_lane_late_rate = carrier_lane_stats['late_rate']

        # 4. Calculate ensemble risk score
        ensemble_score = (
            self.weights['ml_model'] * ml_probability +
            self.weights['lane_performance'] * lane_late_rate +
            self.weights['carrier_lane_performance'] * carrier_lane_late_rate
        )

        # 5. Determine risk level
        if ensemble_score < 0.3:
            risk_level = 'LOW'
            risk_color = '🟢'
        elif ensemble_score < 0.7:
            risk_level = 'MEDIUM'
            risk_color = '🟡'
        else:
            risk_level = 'HIGH'
            risk_color = '🔴'

        # 6. Calculate confidence
        confidence = self.calculate_confidence(lane_id, carrier_pseudo)

        # 7. Find similar shipments
        similar_shipments = self.find_similar_shipments(
            lane_id, carrier_pseudo, top_k=50
        )

        # 8. Calculate additional insights
        insights = self._generate_insights(
            shipment, ensemble_score, lane_stats, carrier_lane_stats, similar_shipments
        )

        return {
            'risk_score': round(ensemble_score, 3),
            'risk_level': risk_level,
            'risk_color': risk_color,
            'risk_percentage': f"{ensemble_score:.1%}",

            # Component scores
            'components': {
                'ml_model_score': round(ml_probability, 3),
                'lane_late_rate': round(lane_late_rate, 3),
                'carrier_lane_late_rate': round(carrier_lane_late_rate, 3),
                'weights': self.weights
            },

            # Confidence metrics
            'confidence': confidence,

            # Historical context
            'historical_context': {
                'similar_shipments_count': len(similar_shipments),
                'similar_shipments_late_rate': similar_shipments['is_late'].mean() if len(similar_shipments) > 0 else None,
                'lane_avg_transit_days': lane_stats['avg_transit'],
                'lane_median_transit_days': lane_stats.get('median_transit', lane_stats['avg_transit']),
                'carrier_lane_avg_transit': carrier_lane_stats['avg_transit']
            },

            # Actionable insights
            'insights': insights,

            # Raw data for further analysis
            'similar_shipments': similar_shipments.to_dict('records') if len(similar_shipments) <= 10 else similar_shipments.head(10).to_dict('records')
        }

    def _get_ml_prediction(self, shipment: Dict[str, Any]) -> Dict[str, Any]:
        """Get prediction from the ML model."""
        # Ensure ML model has statistics computed
        if self.ml_model.lane_stats is None:
            self.ml_model.compute_historical_stats()

        return self.ml_model.predict_risk(shipment)

    def _generate_insights(self,
                          shipment: Dict[str, Any],
                          risk_score: float,
                          lane_stats: Dict[str, Any],
                          carrier_lane_stats: Dict[str, Any],
                          similar_shipments: pd.DataFrame) -> List[str]:
        """Generate actionable insights based on the risk assessment."""
        insights = []

        lane_late_rate = lane_stats['late_rate']
        carrier_lane_late_rate = carrier_lane_stats['late_rate']
        goal_transit = shipment.get('all_modes_goal_transit_days', 1)
        lane_avg_transit = lane_stats['avg_transit']

        # High risk lane warning
        if lane_late_rate > 0.5:
            insights.append(
                f"⚠️ HIGH-RISK LANE: This lane has {lane_late_rate:.0%} historical late rate. "
                f"Consider SLA review."
            )
        elif lane_late_rate > 0.3:
            insights.append(
                f"⚠️ ELEVATED LANE RISK: This lane has {lane_late_rate:.0%} late rate, "
                f"above the {self.df['is_late'].mean():.0%} average."
            )

        # Carrier-lane performance
        if carrier_lane_stats['shipment_count'] >= 10:
            if carrier_lane_late_rate < lane_late_rate * 0.7:
                insights.append(
                    f"✅ RELIABLE CARRIER: This carrier performs better than average on this lane "
                    f"({carrier_lane_late_rate:.0%} vs {lane_late_rate:.0%} lane average)."
                )
            elif carrier_lane_late_rate > lane_late_rate * 1.3:
                insights.append(
                    f"⚠️ CARRIER CONCERN: This carrier underperforms on this lane "
                    f"({carrier_lane_late_rate:.0%} vs {lane_late_rate:.0%} lane average)."
                )
        else:
            insights.append(
                f"ℹ️ LIMITED DATA: Only {int(carrier_lane_stats['shipment_count'])} historical shipments "
                f"for this carrier-lane combination."
            )

        # SLA alignment check
        if lane_avg_transit > goal_transit * 1.2:
            insights.append(
                f"🎯 SLA MISMATCH: Goal is {goal_transit} days but historical average is "
                f"{lane_avg_transit:.1f} days. Consider updating SLA."
            )
        elif lane_avg_transit < goal_transit * 0.8:
            insights.append(
                f"✅ CONSERVATIVE SLA: Historical transit ({lane_avg_transit:.1f} days) "
                f"is well within goal ({goal_transit} days)."
            )

        # Risk level specific advice
        if risk_score >= 0.7:
            insights.append(
                "🔴 RECOMMENDED ACTIONS: Notify customer of potential delay, "
                "consider expedited shipping, or review carrier options."
            )
        elif risk_score >= 0.5:
            insights.append(
                "🟡 MONITOR CLOSELY: This shipment has elevated risk. "
                "Set up tracking alerts and prepare contingency communication."
            )

        return insights

    def set_weights(self, ml_model: float = 0.4,
                   lane_performance: float = 0.3,
                   carrier_lane_performance: float = 0.3) -> None:
        """
        Set custom weights for ensemble scoring.

        Args:
            ml_model: Weight for ML model prediction (default 0.4)
            lane_performance: Weight for lane historical performance (default 0.3)
            carrier_lane_performance: Weight for carrier-lane performance (default 0.3)
        """
        total = ml_model + lane_performance + carrier_lane_performance
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total}")

        self.weights = {
            'ml_model': ml_model,
            'lane_performance': lane_performance,
            'carrier_lane_performance': carrier_lane_performance
        }
        print(f"Weights updated: {self.weights}")

    def batch_score(self, shipments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Score multiple shipments in batch.

        Args:
            shipments: List of shipment dictionaries

        Returns:
            List of risk assessment dictionaries
        """
        results = []
        for i, shipment in enumerate(shipments):
            if (i + 1) % 100 == 0:
                print(f"  Scored {i + 1}/{len(shipments)} shipments...")
            results.append(self.calculate_delivery_risk(shipment))
        return results

    def get_high_risk_summary(self, shipments: List[Dict[str, Any]],
                              threshold: float = 0.5) -> Dict[str, Any]:
        """
        Get summary of high-risk shipments from a batch.

        Args:
            shipments: List of shipment dictionaries
            threshold: Risk score threshold for "high risk"

        Returns:
            Summary dictionary
        """
        scores = self.batch_score(shipments)

        high_risk = [s for s in scores if s['risk_score'] >= threshold]

        return {
            'total_shipments': len(shipments),
            'high_risk_count': len(high_risk),
            'high_risk_percentage': len(high_risk) / len(shipments) if shipments else 0,
            'average_risk_score': np.mean([s['risk_score'] for s in scores]),
            'risk_distribution': {
                'low': len([s for s in scores if s['risk_level'] == 'LOW']),
                'medium': len([s for s in scores if s['risk_level'] == 'MEDIUM']),
                'high': len([s for s in scores if s['risk_level'] == 'HIGH'])
            },
            'high_risk_shipments': high_risk
        }


def main():
    """Demo the risk scoring engine."""
    print("="*60)
    print("DeliveryIQ - Risk Scoring Engine Demo")
    print("="*60)

    # Initialize and load engine
    engine = RiskScoringEngine(
        data_path='data/last-mile-data.csv',
        model_dir='models',
        lookback_months=6
    )
    engine.load()

    # Demo 1: Single shipment scoring
    print("\n" + "="*60)
    print("DEMO 1: Single Shipment Risk Assessment")
    print("="*60)

    # Example high-risk shipment (problematic lane from data)
    high_risk_shipment = {
        'lane_id': '37b5426f2cfc',  # Known problematic lane
        'carrier_pseudo': '19936bf01cc6',
        'carrier_mode': 'Truckload',
        'customer_distance': 500,
        'distance_bucket': '250-500',
        'all_modes_goal_transit_days': 2,
        'ship_dow': 0,
        'ship_month': 6,
        'ship_hour': 10,
        'actual_ship': '2024-06-15 10:00:00'
    }

    print("\nHigh-Risk Shipment Example:")
    print(f"  Lane: {high_risk_shipment['lane_id']}")
    print(f"  Carrier: {high_risk_shipment['carrier_pseudo']}")
    print(f"  Goal Transit: {high_risk_shipment['all_modes_goal_transit_days']} days")

    result = engine.calculate_delivery_risk(high_risk_shipment)

    print(f"\n{result['risk_color']} RISK ASSESSMENT:")
    print(f"  Risk Score: {result['risk_percentage']}")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  Confidence: {result['confidence']['confidence_level']} ({result['confidence']['confidence_score']:.0%})")

    print(f"\nComponent Scores:")
    print(f"  ML Model: {result['components']['ml_model_score']:.1%}")
    print(f"  Lane Late Rate: {result['components']['lane_late_rate']:.1%}")
    print(f"  Carrier-Lane Late Rate: {result['components']['carrier_lane_late_rate']:.1%}")

    print(f"\nHistorical Context:")
    print(f"  Similar Shipments: {result['historical_context']['similar_shipments_count']}")
    print(f"  Similar Late Rate: {result['historical_context']['similar_shipments_late_rate']:.1%}" if result['historical_context']['similar_shipments_late_rate'] else "  No historical data")
    print(f"  Avg Transit Days: {result['historical_context']['lane_avg_transit_days']:.1f}")

    print(f"\nInsights:")
    for insight in result['insights']:
        print(f"  {insight}")

    # Demo 2: Low-risk shipment
    print("\n" + "="*60)
    print("DEMO 2: Low-Risk Shipment Comparison")
    print("="*60)

    # Get a lane with good performance
    good_lanes = engine.lane_stats[engine.lane_stats['late_rate'] < 0.1]
    if len(good_lanes) > 0:
        good_lane_id = good_lanes.index[0]

        low_risk_shipment = {
            'lane_id': good_lane_id,
            'carrier_pseudo': '54874e5091dc',  # Common carrier
            'carrier_mode': 'Truckload',
            'customer_distance': 300,
            'distance_bucket': '250-500',
            'all_modes_goal_transit_days': 3,
            'ship_dow': 2,
            'ship_month': 6,
            'ship_hour': 9,
            'actual_ship': '2024-06-15 09:00:00'
        }

        print(f"\nLow-Risk Shipment Example:")
        print(f"  Lane: {low_risk_shipment['lane_id']}")
        print(f"  Carrier: {low_risk_shipment['carrier_pseudo']}")

        result_low = engine.calculate_delivery_risk(low_risk_shipment)

        print(f"\n{result_low['risk_color']} RISK ASSESSMENT:")
        print(f"  Risk Score: {result_low['risk_percentage']}")
        print(f"  Risk Level: {result_low['risk_level']}")

        print(f"\nComponent Scores:")
        print(f"  ML Model: {result_low['components']['ml_model_score']:.1%}")
        print(f"  Lane Late Rate: {result_low['components']['lane_late_rate']:.1%}")
        print(f"  Carrier-Lane Late Rate: {result_low['components']['carrier_lane_late_rate']:.1%}")

    # Demo 3: Lane statistics lookup
    print("\n" + "="*60)
    print("DEMO 3: Lane Statistics Lookup")
    print("="*60)

    # Show worst lanes
    print("\nTop 5 Highest-Risk Lanes:")
    worst_lanes = engine.lane_stats.nlargest(5, 'late_rate')
    for lane_id, stats in worst_lanes.iterrows():
        print(f"  {lane_id}: {stats['late_rate']:.1%} late ({int(stats['shipment_count'])} shipments)")

    print("\nTop 5 Lowest-Risk Lanes (min 20 shipments):")
    qualified_lanes = engine.lane_stats[engine.lane_stats['shipment_count'] >= 20]
    best_lanes = qualified_lanes.nsmallest(5, 'late_rate')
    for lane_id, stats in best_lanes.iterrows():
        print(f"  {lane_id}: {stats['late_rate']:.1%} late ({int(stats['shipment_count'])} shipments)")

    print("\n" + "="*60)
    print("Risk Scoring Engine Demo Complete!")
    print("="*60)

    return engine


if __name__ == "__main__":
    engine = main()
