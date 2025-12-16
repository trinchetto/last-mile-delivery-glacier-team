#!/usr/bin/env python3
"""
Batch Prediction Generator for DeliveryIQ
Generates risk predictions and delivery window recommendations for all shipments in a given year.

Usage:
    python generate_predictions.py --year 2025
    python generate_predictions.py --year 2025 --input data/shipments_2025.csv
    python generate_predictions.py --year 2025 --output predictions_2025.csv --include-windows
"""

import argparse
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import sys

from risk_scoring_engine import RiskScoringEngine
from delivery_window_recommender import DeliveryWindowRecommender


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Generate delivery risk predictions for shipments in a specific year.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Generate predictions for 2025 shipments using default data file
    python generate_predictions.py --year 2025

    # Use a custom input file with 2025 shipments
    python generate_predictions.py --year 2025 --input data/shipments_2025.csv

    # Include delivery window recommendations
    python generate_predictions.py --year 2025 --include-windows

    # Specify custom output file
    python generate_predictions.py --year 2025 --output my_predictions.csv
        """
    )

    parser.add_argument(
        '--year', '-y',
        type=int,
        required=True,
        help='Year to generate predictions for (e.g., 2025)'
    )

    parser.add_argument(
        '--input', '-i',
        type=str,
        default='data/last-mile-data.csv',
        help='Path to input CSV file with shipment data (default: data/last-mile-data.csv)'
    )

    parser.add_argument(
        '--output', '-o',
        type=str,
        default=None,
        help='Path to output CSV file (default: predictions_{year}.csv)'
    )

    parser.add_argument(
        '--include-windows', '-w',
        action='store_true',
        help='Include delivery window recommendations in output'
    )

    parser.add_argument(
        '--model-dir', '-m',
        type=str,
        default='models',
        help='Directory containing trained model files (default: models)'
    )

    parser.add_argument(
        '--batch-size', '-b',
        type=int,
        default=100,
        help='Progress reporting batch size (default: 100)'
    )

    parser.add_argument(
        '--high-risk-only',
        action='store_true',
        help='Only output high-risk shipments (risk_score >= 0.5)'
    )

    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress progress output'
    )

    return parser.parse_args()


def load_shipment_data(input_path: str, year: int, quiet: bool = False) -> pd.DataFrame:
    """
    Load and filter shipment data for a specific year.

    Args:
        input_path: Path to input CSV file
        year: Year to filter for
        quiet: If True, suppress output

    Returns:
        DataFrame with shipments for the specified year
    """
    if not quiet:
        print(f"Loading shipment data from {input_path}...")

    df = pd.read_csv(input_path)

    # Parse dates
    if 'actual_ship' in df.columns:
        df['actual_ship'] = pd.to_datetime(df['actual_ship'])

    # Filter by year
    if 'ship_year' in df.columns:
        year_df = df[df['ship_year'] == year].copy()
    elif 'actual_ship' in df.columns:
        year_df = df[df['actual_ship'].dt.year == year].copy()
    else:
        # Assume all data is for the requested year if no year column
        if not quiet:
            print(f"  Warning: No year column found, processing all {len(df)} shipments")
        year_df = df.copy()

    # Reset index to avoid issues when assigning new columns
    year_df = year_df.reset_index(drop=True)

    if not quiet:
        print(f"  Found {len(year_df):,} shipments for year {year}")

    return year_df


def shipment_to_dict(row: pd.Series) -> Dict[str, Any]:
    """Convert a DataFrame row to a shipment dictionary for prediction."""
    shipment = {
        'lane_id': row.get('lane_id', ''),
        'carrier_pseudo': row.get('carrier_pseudo', ''),
        'carrier_mode': row.get('carrier_mode', 'Truckload'),
        'customer_distance': row.get('customer_distance', 0),
        'distance_bucket': row.get('distance_bucket', ''),
        'all_modes_goal_transit_days': row.get('all_modes_goal_transit_days', 1),
        'ship_dow': row.get('ship_dow', 0),
        'ship_month': row.get('ship_month', 1),
        'ship_hour': 10,  # Default if not available
    }

    # Add actual_ship if available
    if 'actual_ship' in row and pd.notna(row['actual_ship']):
        shipment['actual_ship'] = str(row['actual_ship'])
        if hasattr(row['actual_ship'], 'hour'):
            shipment['ship_hour'] = row['actual_ship'].hour

    return shipment


def generate_predictions(
    df: pd.DataFrame,
    engine: RiskScoringEngine,
    window_recommender: Optional[DeliveryWindowRecommender] = None,
    batch_size: int = 100,
    quiet: bool = False
) -> pd.DataFrame:
    """
    Generate predictions for all shipments in the DataFrame.

    Args:
        df: DataFrame with shipment data
        engine: RiskScoringEngine instance
        window_recommender: Optional DeliveryWindowRecommender for window predictions
        batch_size: Progress reporting frequency
        quiet: If True, suppress progress output

    Returns:
        DataFrame with predictions added
    """
    # Convert to list of dicts for safe iteration
    records = df.to_dict('records')
    n_shipments = len(records)

    if not quiet:
        print(f"\nGenerating predictions for {n_shipments:,} shipments...")

    # Process each shipment and build results list
    prediction_results = []

    for i, record in enumerate(records):
        if not quiet and (i + 1) % batch_size == 0:
            print(f"  Processed {i + 1:,}/{n_shipments:,} shipments ({(i+1)/n_shipments*100:.1f}%)")

        shipment = {
            'lane_id': record.get('lane_id', ''),
            'carrier_pseudo': record.get('carrier_pseudo', ''),
            'carrier_mode': record.get('carrier_mode', 'Truckload'),
            'customer_distance': record.get('customer_distance', 0),
            'distance_bucket': record.get('distance_bucket', ''),
            'all_modes_goal_transit_days': record.get('all_modes_goal_transit_days', 1),
            'ship_dow': record.get('ship_dow', 0),
            'ship_month': record.get('ship_month', 1),
            'ship_hour': 10,
        }

        # Add actual_ship if available
        if 'actual_ship' in record and pd.notna(record.get('actual_ship')):
            shipment['actual_ship'] = str(record['actual_ship'])

        result = {}

        # Get risk prediction
        try:
            risk_result = engine.calculate_delivery_risk(shipment)

            result['risk_score'] = risk_result['risk_score']
            result['risk_level'] = risk_result['risk_level']
            result['risk_percentage'] = risk_result['risk_percentage']
            result['ml_model_score'] = risk_result['components']['ml_model_score']
            result['lane_late_rate'] = risk_result['components']['lane_late_rate']
            result['carrier_lane_late_rate'] = risk_result['components']['carrier_lane_late_rate']
            result['confidence_score'] = risk_result['confidence']['confidence_score']
            result['confidence_level'] = risk_result['confidence']['confidence_level']
            result['lane_shipment_count'] = risk_result['confidence']['lane_shipment_count']
            result['lane_avg_transit_days'] = risk_result['historical_context']['lane_avg_transit_days']

            # Get window recommendation if available
            if window_recommender:
                try:
                    window_result = window_recommender.recommend_delivery_window(
                        shipment,
                        risk_score=risk_result['risk_score']
                    )
                    result['recommended_window_min'] = window_result['recommended_window']['min_days']
                    result['recommended_window_max'] = window_result['recommended_window']['max_days']
                    result['expected_delivery_days'] = window_result['transit_distribution']['median']
                    result['p50_transit'] = window_result['transit_distribution']['p50']
                    result['p90_transit'] = window_result['transit_distribution']['p90']
                except Exception:
                    result['recommended_window_min'] = None
                    result['recommended_window_max'] = None
                    result['expected_delivery_days'] = None
                    result['p50_transit'] = None
                    result['p90_transit'] = None

        except Exception as e:
            if not quiet:
                print(f"  Warning: Error predicting shipment {i}: {e}")

            result['risk_score'] = None
            result['risk_level'] = 'UNKNOWN'
            result['risk_percentage'] = None
            result['ml_model_score'] = None
            result['lane_late_rate'] = None
            result['carrier_lane_late_rate'] = None
            result['confidence_score'] = None
            result['confidence_level'] = 'LOW'
            result['lane_shipment_count'] = 0
            result['lane_avg_transit_days'] = None

            if window_recommender:
                result['recommended_window_min'] = None
                result['recommended_window_max'] = None
                result['expected_delivery_days'] = None
                result['p50_transit'] = None
                result['p90_transit'] = None

        prediction_results.append(result)

    # Create predictions DataFrame and merge with original
    predictions_df = pd.DataFrame(prediction_results)
    result_df = pd.concat([df.reset_index(drop=True), predictions_df], axis=1)

    if not quiet:
        print(f"  Completed {n_shipments:,} predictions")

    return result_df


def print_summary(df: pd.DataFrame, year: int, quiet: bool = False):
    """Print summary statistics of predictions."""
    if quiet:
        return

    print(f"\n{'='*60}")
    print(f"PREDICTION SUMMARY - Year {year}")
    print(f"{'='*60}")

    print(f"\nTotal shipments: {len(df):,}")

    # Risk distribution
    if 'risk_level' in df.columns:
        print(f"\nRisk Distribution:")
        for level in ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN']:
            count = len(df[df['risk_level'] == level])
            pct = count / len(df) * 100 if len(df) > 0 else 0
            print(f"  {level}: {count:,} ({pct:.1f}%)")

    # Risk score statistics
    if 'risk_score' in df.columns:
        valid_scores = df['risk_score'].dropna()
        if len(valid_scores) > 0:
            print(f"\nRisk Score Statistics:")
            print(f"  Mean: {valid_scores.mean():.3f}")
            print(f"  Median: {valid_scores.median():.3f}")
            print(f"  Min: {valid_scores.min():.3f}")
            print(f"  Max: {valid_scores.max():.3f}")

    # Confidence distribution
    if 'confidence_level' in df.columns:
        print(f"\nConfidence Distribution:")
        for level in ['HIGH', 'MEDIUM', 'LOW']:
            count = len(df[df['confidence_level'] == level])
            pct = count / len(df) * 100 if len(df) > 0 else 0
            print(f"  {level}: {count:,} ({pct:.1f}%)")

    # High risk breakdown by carrier mode
    if 'carrier_mode' in df.columns and 'risk_level' in df.columns:
        print(f"\nHigh-Risk by Carrier Mode:")
        for mode in df['carrier_mode'].unique():
            mode_df = df[df['carrier_mode'] == mode]
            high_risk = len(mode_df[mode_df['risk_level'] == 'HIGH'])
            pct = high_risk / len(mode_df) * 100 if len(mode_df) > 0 else 0
            print(f"  {mode}: {high_risk:,}/{len(mode_df):,} ({pct:.1f}%)")


def main():
    """Main entry point."""
    args = parse_args()

    # Set default output path
    if args.output is None:
        args.output = f'predictions_{args.year}.csv'

    print(f"{'='*60}")
    print(f"DeliveryIQ - Batch Prediction Generator")
    print(f"{'='*60}")
    print(f"Year: {args.year}")
    print(f"Input: {args.input}")
    print(f"Output: {args.output}")
    print(f"Include Windows: {args.include_windows}")
    print(f"{'='*60}")

    # Load shipment data
    df = load_shipment_data(args.input, args.year, args.quiet)

    if len(df) == 0:
        print(f"\nError: No shipments found for year {args.year}")
        print("Please check your input file has shipments for the requested year.")
        sys.exit(1)

    # Initialize risk engine
    if not args.quiet:
        print(f"\nInitializing Risk Scoring Engine...")

    engine = RiskScoringEngine(
        data_path=args.input,
        model_dir=args.model_dir,
        lookback_months=6
    )
    engine.load()

    # Initialize window recommender if requested
    window_recommender = None
    if args.include_windows:
        if not args.quiet:
            print(f"\nInitializing Delivery Window Recommender...")
        window_recommender = DeliveryWindowRecommender(risk_engine=engine)
        window_recommender.load()

    # Generate predictions
    result_df = generate_predictions(
        df,
        engine,
        window_recommender=window_recommender,
        batch_size=args.batch_size,
        quiet=args.quiet
    )

    # Filter to high-risk only if requested
    if args.high_risk_only:
        result_df = result_df[result_df['risk_score'] >= 0.5]
        if not args.quiet:
            print(f"\nFiltered to {len(result_df):,} high-risk shipments")

    # Print summary
    print_summary(result_df, args.year, args.quiet)

    # Save results
    if not args.quiet:
        print(f"\nSaving predictions to {args.output}...")

    result_df.to_csv(args.output, index=False)

    print(f"\nPredictions saved to: {args.output}")
    print(f"{'='*60}")

    return result_df


if __name__ == "__main__":
    main()
