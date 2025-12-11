#!/usr/bin/env python3
"""
Delivery Window Recommender for Probabilistic Delivery Advisor
DeliveryIQ: AI-Powered Delivery Time Estimation

This module provides realistic delivery window recommendations based on:
1. Historical transit time distributions
2. Risk score from the ML model
3. Carrier-lane specific performance patterns

Features:
- Percentile-based delivery window calculation
- Confidence intervals for predictions
- SLA comparison and mismatch detection
- Risk-adjusted window widening
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

from risk_scoring_engine import RiskScoringEngine


class DeliveryWindowRecommender:
    """
    Recommends realistic delivery windows based on historical data and risk assessment.

    Uses historical transit time distributions to provide:
    - Expected delivery window (min-max days)
    - Confidence intervals (50%, 80%, 95%)
    - SLA alignment assessment
    - Risk-adjusted recommendations
    """

    def __init__(self, risk_engine: RiskScoringEngine = None,
                 data_path: str = 'data/last-mile-data.csv',
                 model_dir: str = 'models'):
        """
        Initialize the Delivery Window Recommender.

        Args:
            risk_engine: Pre-loaded RiskScoringEngine (optional)
            data_path: Path to historical data
            model_dir: Path to ML model directory
        """
        self.risk_engine = risk_engine
        self.data_path = data_path
        self.model_dir = model_dir
        self.df = None

    def load(self) -> None:
        """Load data and risk engine if not provided."""
        print("Loading Delivery Window Recommender...")

        if self.risk_engine is None:
            self.risk_engine = RiskScoringEngine(
                data_path=self.data_path,
                model_dir=self.model_dir
            )
            self.risk_engine.load()

        self.df = self.risk_engine.df
        print("Delivery Window Recommender ready!")

    def get_transit_distribution(self,
                                 lane_id: str,
                                 carrier_pseudo: str = None,
                                 min_samples: int = 5) -> Dict[str, Any]:
        """
        Get historical transit time distribution for a lane/carrier combination.

        Args:
            lane_id: Lane identifier
            carrier_pseudo: Carrier identifier (optional, uses all carriers if None)
            min_samples: Minimum samples required for reliable statistics

        Returns:
            Dictionary with transit time statistics
        """
        # Try carrier-lane specific first
        if carrier_pseudo:
            mask = (self.df['lane_id'] == lane_id) & (self.df['carrier_pseudo'] == carrier_pseudo)
            carrier_lane_data = self.df[mask]['actual_transit_days']

            if len(carrier_lane_data) >= min_samples:
                return self._compute_distribution_stats(
                    carrier_lane_data,
                    source='carrier_lane',
                    sample_count=len(carrier_lane_data)
                )

        # Fall back to lane-level data
        lane_data = self.df[self.df['lane_id'] == lane_id]['actual_transit_days']

        if len(lane_data) >= min_samples:
            return self._compute_distribution_stats(
                lane_data,
                source='lane',
                sample_count=len(lane_data)
            )

        # Fall back to global distribution
        return self._compute_distribution_stats(
            self.df['actual_transit_days'],
            source='global',
            sample_count=len(self.df)
        )

    def _compute_distribution_stats(self,
                                    transit_data: pd.Series,
                                    source: str,
                                    sample_count: int) -> Dict[str, Any]:
        """Compute statistical distribution of transit times."""
        return {
            'source': source,
            'sample_count': sample_count,
            'min': transit_data.min(),
            'max': transit_data.max(),
            'mean': transit_data.mean(),
            'median': transit_data.median(),
            'std': transit_data.std(),
            'p5': transit_data.quantile(0.05),
            'p10': transit_data.quantile(0.10),
            'p25': transit_data.quantile(0.25),
            'p50': transit_data.quantile(0.50),
            'p75': transit_data.quantile(0.75),
            'p90': transit_data.quantile(0.90),
            'p95': transit_data.quantile(0.95)
        }

    def recommend_delivery_window(self,
                                  shipment: Dict[str, Any],
                                  risk_score: float = None) -> Dict[str, Any]:
        """
        Recommend a realistic delivery window for a shipment.

        The window width is adjusted based on risk:
        - Low risk (< 0.3): Tight window around median
        - Medium risk (0.3-0.7): Wider window using IQR
        - High risk (> 0.7): Conservative window with warning

        Args:
            shipment: Shipment details dictionary
            risk_score: Pre-computed risk score (optional, will compute if not provided)

        Returns:
            Comprehensive delivery window recommendation
        """
        lane_id = shipment.get('lane_id', '')
        carrier_pseudo = shipment.get('carrier_pseudo', '')
        goal_transit = shipment.get('all_modes_goal_transit_days', 1)

        # Get risk score if not provided
        if risk_score is None:
            risk_result = self.risk_engine.calculate_delivery_risk(shipment)
            risk_score = risk_result['risk_score']
            risk_level = risk_result['risk_level']
        else:
            if risk_score < 0.3:
                risk_level = 'LOW'
            elif risk_score < 0.7:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'HIGH'

        # Get transit time distribution
        distribution = self.get_transit_distribution(lane_id, carrier_pseudo)

        # Calculate recommended window based on risk level
        window = self._calculate_window(distribution, risk_score, risk_level)

        # Calculate confidence intervals
        confidence_intervals = self._calculate_confidence_intervals(distribution)

        # Compare with SLA
        sla_comparison = self._compare_with_sla(window, goal_transit, distribution)

        # Generate recommendation text
        recommendation = self._generate_recommendation(
            window, risk_level, sla_comparison, distribution
        )

        # Calculate expected delivery date if ship date provided
        delivery_dates = None
        if 'actual_ship' in shipment:
            delivery_dates = self._calculate_delivery_dates(
                shipment['actual_ship'], window
            )

        return {
            'recommended_window': window,
            'confidence_intervals': confidence_intervals,
            'sla_comparison': sla_comparison,
            'recommendation': recommendation,
            'delivery_dates': delivery_dates,
            'distribution_stats': distribution,
            'risk_score': risk_score,
            'risk_level': risk_level
        }

    def _calculate_window(self,
                         distribution: Dict[str, Any],
                         risk_score: float,
                         risk_level: str) -> Dict[str, Any]:
        """
        Calculate the recommended delivery window based on risk.

        Window strategy:
        - LOW: median to median+1 (tight window for reliable lanes)
        - MEDIUM: p25 to p75 (interquartile range)
        - HIGH: median to p90 (conservative with buffer)
        """
        median = distribution['median']
        p25 = distribution['p25']
        p75 = distribution['p75']
        p90 = distribution['p90']

        if risk_level == 'LOW':
            # Tight window around median
            min_days = max(0, int(median))
            max_days = int(median) + 1
            window_type = 'tight'
            description = f"{min_days}-{max_days} days"

        elif risk_level == 'MEDIUM':
            # Use interquartile range
            min_days = max(0, int(p25))
            max_days = int(np.ceil(p75))
            window_type = 'moderate'
            description = f"{min_days}-{max_days} days"

        else:  # HIGH risk
            # Conservative window with buffer
            min_days = max(0, int(median))
            max_days = int(np.ceil(p90))
            window_type = 'wide'
            description = f"{min_days}-{max_days} days (⚠️ High variability)"

        return {
            'min_days': min_days,
            'max_days': max_days,
            'expected_days': round(distribution['mean'], 1),
            'median_days': round(median, 1),
            'window_type': window_type,
            'description': description,
            'display': f"{min_days}-{max_days}"
        }

    def _calculate_confidence_intervals(self,
                                        distribution: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate confidence intervals for delivery time."""
        return {
            '50%': {
                'min': round(distribution['p25'], 1),
                'max': round(distribution['p75'], 1),
                'description': f"{distribution['p25']:.1f}-{distribution['p75']:.1f} days"
            },
            '80%': {
                'min': round(distribution['p10'], 1),
                'max': round(distribution['p90'], 1),
                'description': f"{distribution['p10']:.1f}-{distribution['p90']:.1f} days"
            },
            '95%': {
                'min': round(distribution['p5'], 1),
                'max': round(distribution['p95'], 1),
                'description': f"{distribution['p5']:.1f}-{distribution['p95']:.1f} days"
            }
        }

    def _compare_with_sla(self,
                         window: Dict[str, Any],
                         goal_transit: float,
                         distribution: Dict[str, Any]) -> Dict[str, Any]:
        """Compare recommended window with current SLA/goal."""
        expected = distribution['mean']
        median = distribution['median']

        # Determine alignment
        if goal_transit >= window['max_days']:
            alignment = 'ALIGNED'
            alignment_color = '🟢'
            message = "SLA is achievable based on historical performance"
        elif goal_transit >= median:
            alignment = 'TIGHT'
            alignment_color = '🟡'
            message = "SLA is tight but achievable in most cases"
        else:
            alignment = 'MISALIGNED'
            alignment_color = '🔴'
            message = "SLA is aggressive - high risk of missing target"

        # Calculate probability of meeting SLA
        # Using historical data to estimate
        historical_on_time_rate = (
            self.df[self.df['actual_transit_days'] <= goal_transit].shape[0] /
            len(self.df)
        )

        # Difference analysis
        diff_from_expected = goal_transit - expected
        diff_from_median = goal_transit - median

        return {
            'current_sla_days': goal_transit,
            'recommended_min': window['min_days'],
            'recommended_max': window['max_days'],
            'expected_transit': round(expected, 1),
            'alignment': alignment,
            'alignment_color': alignment_color,
            'message': message,
            'diff_from_expected': round(diff_from_expected, 1),
            'diff_from_median': round(diff_from_median, 1),
            'estimated_sla_achievement_rate': round(historical_on_time_rate, 2),
            'sla_vs_recommended': (
                'SLA is within recommended window' if window['min_days'] <= goal_transit <= window['max_days']
                else 'SLA is outside recommended window'
            )
        }

    def _generate_recommendation(self,
                                 window: Dict[str, Any],
                                 risk_level: str,
                                 sla_comparison: Dict[str, Any],
                                 distribution: Dict[str, Any]) -> Dict[str, Any]:
        """Generate actionable recommendation text."""
        actions = []
        summary = ""

        # Main recommendation based on risk
        if risk_level == 'LOW':
            summary = (
                f"✅ Low-risk shipment. Expect delivery in {window['description']}. "
                f"Historical median is {distribution['median']:.1f} days."
            )
        elif risk_level == 'MEDIUM':
            summary = (
                f"⚠️ Moderate-risk shipment. Recommend communicating {window['description']} window. "
                f"Historical data shows some variability."
            )
        else:  # HIGH
            summary = (
                f"🔴 High-risk shipment! Historical data shows high variability. "
                f"Recommend conservative window of {window['description']}."
            )

        # SLA-specific actions
        if sla_comparison['alignment'] == 'MISALIGNED':
            actions.append(
                f"📋 UPDATE SLA: Current {sla_comparison['current_sla_days']}-day SLA is unrealistic. "
                f"Recommend {window['max_days']} days minimum."
            )
            actions.append(
                "📞 PROACTIVE COMMUNICATION: Notify customer of potential delay before shipping."
            )
        elif sla_comparison['alignment'] == 'TIGHT':
            actions.append(
                "👀 MONITOR CLOSELY: SLA is achievable but tight. Set up tracking alerts."
            )

        # Risk-specific actions
        if risk_level == 'HIGH':
            actions.append(
                "🚨 ESCALATE: Consider alternative carriers or expedited options."
            )
            actions.append(
                "📊 REVIEW LANE: This lane has consistently poor performance. Consider strategic review."
            )

        # Data quality note
        if distribution['source'] == 'global':
            actions.append(
                "ℹ️ LIMITED DATA: Using global averages due to insufficient lane-specific data."
            )
        elif distribution['sample_count'] < 20:
            actions.append(
                f"ℹ️ LIMITED SAMPLES: Only {distribution['sample_count']} historical shipments. "
                "Confidence is lower."
            )

        return {
            'summary': summary,
            'actions': actions,
            'confidence': 'HIGH' if distribution['sample_count'] >= 50 else (
                'MEDIUM' if distribution['sample_count'] >= 20 else 'LOW'
            )
        }

    def _calculate_delivery_dates(self,
                                  ship_date: str,
                                  window: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate expected delivery dates based on ship date."""
        if isinstance(ship_date, str):
            ship_dt = pd.to_datetime(ship_date)
        else:
            ship_dt = ship_date

        return {
            'ship_date': ship_dt.strftime('%Y-%m-%d'),
            'earliest_delivery': (ship_dt + timedelta(days=window['min_days'])).strftime('%Y-%m-%d'),
            'expected_delivery': (ship_dt + timedelta(days=window['expected_days'])).strftime('%Y-%m-%d'),
            'latest_delivery': (ship_dt + timedelta(days=window['max_days'])).strftime('%Y-%m-%d'),
            'window_display': (
                f"{(ship_dt + timedelta(days=window['min_days'])).strftime('%b %d')} - "
                f"{(ship_dt + timedelta(days=window['max_days'])).strftime('%b %d')}"
            )
        }

    def compare_carriers(self,
                        lane_id: str,
                        carriers: List[str] = None,
                        min_shipments: int = 10) -> pd.DataFrame:
        """
        Compare carrier performance on a specific lane.

        Args:
            lane_id: Lane to analyze
            carriers: List of carriers to compare (None = all carriers on lane)
            min_shipments: Minimum shipments for a carrier to be included

        Returns:
            DataFrame with carrier comparison
        """
        lane_data = self.df[self.df['lane_id'] == lane_id]

        if carriers:
            lane_data = lane_data[lane_data['carrier_pseudo'].isin(carriers)]

        # Group by carrier
        comparison = lane_data.groupby('carrier_pseudo').agg({
            'actual_transit_days': ['count', 'mean', 'median', 'std', 'min', 'max'],
            'is_late': 'mean'
        }).round(2)

        comparison.columns = [
            'shipments', 'avg_transit', 'median_transit', 'transit_std',
            'min_transit', 'max_transit', 'late_rate'
        ]

        # Filter by minimum shipments
        comparison = comparison[comparison['shipments'] >= min_shipments]

        # Add ranking
        comparison['reliability_rank'] = comparison['late_rate'].rank()
        comparison['speed_rank'] = comparison['avg_transit'].rank()

        # Add recommendation
        comparison['recommended'] = comparison['late_rate'] == comparison['late_rate'].min()

        return comparison.sort_values('late_rate')

    def get_lane_summary(self, lane_id: str) -> Dict[str, Any]:
        """Get comprehensive summary for a lane."""
        lane_data = self.df[self.df['lane_id'] == lane_id]

        if len(lane_data) == 0:
            return {'error': f'No data found for lane {lane_id}'}

        distribution = self._compute_distribution_stats(
            lane_data['actual_transit_days'],
            source='lane',
            sample_count=len(lane_data)
        )

        late_rate = lane_data['is_late'].mean()

        return {
            'lane_id': lane_id,
            'total_shipments': len(lane_data),
            'late_rate': round(late_rate, 3),
            'on_time_rate': round(1 - late_rate, 3),
            'transit_stats': {
                'average': round(distribution['mean'], 1),
                'median': round(distribution['median'], 1),
                'std_dev': round(distribution['std'], 1),
                'min': int(distribution['min']),
                'max': int(distribution['max'])
            },
            'percentiles': {
                'p25': round(distribution['p25'], 1),
                'p50': round(distribution['p50'], 1),
                'p75': round(distribution['p75'], 1),
                'p90': round(distribution['p90'], 1)
            },
            'carriers': lane_data['carrier_pseudo'].nunique(),
            'carrier_list': lane_data['carrier_pseudo'].unique().tolist(),
            'avg_goal_transit': round(lane_data['all_modes_goal_transit_days'].mean(), 1),
            'goal_vs_actual': round(
                lane_data['all_modes_goal_transit_days'].mean() - distribution['mean'], 1
            )
        }


def main():
    """Demo the Delivery Window Recommender."""
    print("="*60)
    print("DeliveryIQ - Delivery Window Recommender Demo")
    print("="*60)

    # Initialize recommender
    recommender = DeliveryWindowRecommender(
        data_path='data/last-mile-data.csv',
        model_dir='models'
    )
    recommender.load()

    # Demo 1: High-risk shipment
    print("\n" + "="*60)
    print("DEMO 1: High-Risk Shipment Window Recommendation")
    print("="*60)

    high_risk_shipment = {
        'lane_id': '37b5426f2cfc',
        'carrier_pseudo': '19936bf01cc6',
        'carrier_mode': 'Truckload',
        'customer_distance': 500,
        'distance_bucket': '250-500',
        'all_modes_goal_transit_days': 2,
        'ship_dow': 0,
        'ship_month': 6,
        'ship_hour': 10,
        'actual_ship': '2024-12-15 10:00:00'
    }

    print(f"\nShipment Details:")
    print(f"  Lane: {high_risk_shipment['lane_id']}")
    print(f"  Carrier: {high_risk_shipment['carrier_pseudo']}")
    print(f"  Current SLA: {high_risk_shipment['all_modes_goal_transit_days']} days")
    print(f"  Ship Date: {high_risk_shipment['actual_ship']}")

    result = recommender.recommend_delivery_window(high_risk_shipment)

    print(f"\n📦 DELIVERY WINDOW RECOMMENDATION:")
    print(f"  Recommended Window: {result['recommended_window']['description']}")
    print(f"  Expected Transit: {result['recommended_window']['expected_days']} days")
    print(f"  Risk Level: {result['risk_level']} ({result['risk_score']:.1%})")

    print(f"\n📊 CONFIDENCE INTERVALS:")
    for ci, values in result['confidence_intervals'].items():
        print(f"  {ci} confidence: {values['description']}")

    print(f"\n🎯 SLA COMPARISON:")
    sla = result['sla_comparison']
    print(f"  {sla['alignment_color']} Status: {sla['alignment']}")
    print(f"  Current SLA: {sla['current_sla_days']} days")
    print(f"  Expected Transit: {sla['expected_transit']} days")
    print(f"  Difference: {sla['diff_from_expected']:+.1f} days")
    print(f"  Message: {sla['message']}")

    if result['delivery_dates']:
        print(f"\n📅 DELIVERY DATES:")
        dates = result['delivery_dates']
        print(f"  Ship Date: {dates['ship_date']}")
        print(f"  Earliest Delivery: {dates['earliest_delivery']}")
        print(f"  Expected Delivery: {dates['expected_delivery']}")
        print(f"  Latest Delivery: {dates['latest_delivery']}")
        print(f"  Window: {dates['window_display']}")

    print(f"\n💡 RECOMMENDATION:")
    print(f"  {result['recommendation']['summary']}")
    if result['recommendation']['actions']:
        print(f"\n  Actions:")
        for action in result['recommendation']['actions']:
            print(f"    • {action}")

    # Demo 2: Low-risk shipment
    print("\n" + "="*60)
    print("DEMO 2: Low-Risk Shipment Window Recommendation")
    print("="*60)

    # Find a good lane
    good_lanes = recommender.risk_engine.lane_stats[
        recommender.risk_engine.lane_stats['late_rate'] < 0.1
    ]
    if len(good_lanes) > 0:
        good_lane_id = good_lanes[good_lanes['shipment_count'] >= 20].index[0]

        low_risk_shipment = {
            'lane_id': good_lane_id,
            'carrier_pseudo': '54874e5091dc',
            'carrier_mode': 'Truckload',
            'customer_distance': 300,
            'distance_bucket': '250-500',
            'all_modes_goal_transit_days': 3,
            'ship_dow': 2,
            'ship_month': 6,
            'ship_hour': 9,
            'actual_ship': '2024-12-15 09:00:00'
        }

        print(f"\nShipment Details:")
        print(f"  Lane: {low_risk_shipment['lane_id']}")
        print(f"  Current SLA: {low_risk_shipment['all_modes_goal_transit_days']} days")

        result_low = recommender.recommend_delivery_window(low_risk_shipment)

        print(f"\n📦 DELIVERY WINDOW RECOMMENDATION:")
        print(f"  Recommended Window: {result_low['recommended_window']['description']}")
        print(f"  Expected Transit: {result_low['recommended_window']['expected_days']} days")
        print(f"  Risk Level: {result_low['risk_level']} ({result_low['risk_score']:.1%})")

        print(f"\n🎯 SLA COMPARISON:")
        sla = result_low['sla_comparison']
        print(f"  {sla['alignment_color']} Status: {sla['alignment']}")
        print(f"  Message: {sla['message']}")

    # Demo 3: Lane Summary
    print("\n" + "="*60)
    print("DEMO 3: Lane Summary")
    print("="*60)

    # Pick a high-volume lane
    high_volume_lanes = recommender.risk_engine.lane_stats.nlargest(1, 'shipment_count')
    sample_lane = high_volume_lanes.index[0]

    summary = recommender.get_lane_summary(sample_lane)
    print(f"\nLane: {summary['lane_id']}")
    print(f"  Total Shipments: {summary['total_shipments']}")
    print(f"  Late Rate: {summary['late_rate']:.1%}")
    print(f"  Average Transit: {summary['transit_stats']['average']} days")
    print(f"  Transit Range: {summary['transit_stats']['min']}-{summary['transit_stats']['max']} days")
    print(f"  Carriers on Lane: {summary['carriers']}")
    print(f"  Avg Goal Transit: {summary['avg_goal_transit']} days")
    print(f"  Goal vs Actual: {summary['goal_vs_actual']:+.1f} days")

    # Demo 4: Carrier Comparison
    print("\n" + "="*60)
    print("DEMO 4: Carrier Comparison for Lane")
    print("="*60)

    if summary['carriers'] > 1:
        comparison = recommender.compare_carriers(sample_lane, min_shipments=5)
        if len(comparison) > 0:
            print(f"\nCarrier comparison for lane {sample_lane}:")
            print(comparison[['shipments', 'avg_transit', 'late_rate', 'recommended']].to_string())
        else:
            print("Not enough data for carrier comparison")

    print("\n" + "="*60)
    print("Delivery Window Recommender Demo Complete!")
    print("="*60)

    return recommender


if __name__ == "__main__":
    recommender = main()
