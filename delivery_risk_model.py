#!/usr/bin/env python3
"""
Probabilistic Delivery Advisor - ML Model Implementation
DeliveryIQ: AI-Powered Last Mile Risk Prediction

This module implements a machine learning model to predict delivery risk
(probability of late delivery) based on historical shipment data.

Features:
- XGBoost classifier for binary late/on-time prediction
- Feature engineering with lane and carrier historical statistics
- Time-based train/test split for realistic evaluation
- Model persistence for deployment
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import pickle
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# ML libraries
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    roc_curve, precision_recall_curve
)
import xgboost as xgb

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns


class DeliveryRiskModel:
    """
    Machine Learning model for predicting delivery risk.

    This model predicts the probability of a shipment being late
    based on historical patterns in lane, carrier, and temporal data.
    """

    def __init__(self, data_path: str = 'data/last-mile-data.csv'):
        """
        Initialize the delivery risk model.

        Args:
            data_path: Path to the shipment data CSV file
        """
        self.data_path = data_path
        self.df = None
        self.model = None
        self.label_encoders = {}
        self.feature_columns = []
        self.lane_stats = None
        self.carrier_stats = None
        self.carrier_lane_stats = None

    def load_data(self) -> pd.DataFrame:
        """Load and perform initial data cleaning."""
        print("Loading data...")
        self.df = pd.read_csv(self.data_path)

        # Convert datetime columns
        self.df['actual_ship'] = pd.to_datetime(self.df['actual_ship'])
        self.df['actual_delivery'] = pd.to_datetime(self.df['actual_delivery'])

        # Create target variable
        self.df['is_late'] = (self.df['otd_designation'] == 'Late').astype(int)

        print(f"Data loaded: {len(self.df):,} shipments")
        print(f"Late delivery rate: {self.df['is_late'].mean():.1%}")

        return self.df

    def compute_historical_stats(self, cutoff_date: datetime = None) -> None:
        """
        Compute historical statistics for lanes and carriers.

        These stats are used as features for the ML model and represent
        the historical performance up to a given cutoff date.

        Args:
            cutoff_date: Only use data before this date for computing stats.
                        If None, uses all data (for inference mode).
        """
        print("Computing historical statistics...")

        if cutoff_date is not None:
            hist_df = self.df[self.df['actual_ship'] < cutoff_date].copy()
        else:
            hist_df = self.df.copy()

        # Lane statistics (historical late rate by lane)
        self.lane_stats = hist_df.groupby('lane_id').agg({
            'is_late': ['mean', 'count', 'std'],
            'actual_transit_days': ['mean', 'std'],
            'customer_distance': 'mean'
        }).round(4)
        self.lane_stats.columns = [
            'lane_late_rate', 'lane_shipment_count', 'lane_late_std',
            'lane_avg_transit', 'lane_transit_std', 'lane_avg_distance'
        ]
        self.lane_stats = self.lane_stats.fillna(0)

        # Carrier statistics (historical late rate by carrier)
        self.carrier_stats = hist_df.groupby('carrier_pseudo').agg({
            'is_late': ['mean', 'count', 'std'],
            'actual_transit_days': ['mean', 'std']
        }).round(4)
        self.carrier_stats.columns = [
            'carrier_late_rate', 'carrier_shipment_count', 'carrier_late_std',
            'carrier_avg_transit', 'carrier_transit_std'
        ]
        self.carrier_stats = self.carrier_stats.fillna(0)

        # Carrier-Lane combination statistics
        self.carrier_lane_stats = hist_df.groupby(['carrier_pseudo', 'lane_id']).agg({
            'is_late': ['mean', 'count'],
            'actual_transit_days': 'mean'
        }).round(4)
        self.carrier_lane_stats.columns = [
            'carrier_lane_late_rate', 'carrier_lane_count', 'carrier_lane_avg_transit'
        ]
        self.carrier_lane_stats = self.carrier_lane_stats.fillna(0)

        print(f"Lane stats computed for {len(self.lane_stats)} lanes")
        print(f"Carrier stats computed for {len(self.carrier_stats)} carriers")
        print(f"Carrier-Lane combinations: {len(self.carrier_lane_stats)}")

    def engineer_features(self, df: pd.DataFrame = None) -> pd.DataFrame:
        """
        Engineer features for the ML model.

        Features include:
        - Lane historical performance
        - Carrier historical performance
        - Carrier-lane combination performance
        - Temporal features (day of week, month)
        - Distance features

        Args:
            df: DataFrame to engineer features for. If None, uses self.df

        Returns:
            DataFrame with engineered features
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()

        print("Engineering features...")

        # Merge lane statistics
        df = df.merge(
            self.lane_stats,
            left_on='lane_id',
            right_index=True,
            how='left'
        )

        # Merge carrier statistics
        df = df.merge(
            self.carrier_stats,
            left_on='carrier_pseudo',
            right_index=True,
            how='left'
        )

        # Merge carrier-lane statistics
        df = df.merge(
            self.carrier_lane_stats,
            left_on=['carrier_pseudo', 'lane_id'],
            right_index=True,
            how='left'
        )

        # Fill missing values for new lanes/carriers with global averages
        global_late_rate = self.df['is_late'].mean()
        global_transit = self.df['actual_transit_days'].mean()

        df['lane_late_rate'] = df['lane_late_rate'].fillna(global_late_rate)
        df['carrier_late_rate'] = df['carrier_late_rate'].fillna(global_late_rate)
        df['carrier_lane_late_rate'] = df['carrier_lane_late_rate'].fillna(global_late_rate)
        df['lane_avg_transit'] = df['lane_avg_transit'].fillna(global_transit)
        df['carrier_avg_transit'] = df['carrier_avg_transit'].fillna(global_transit)
        df['carrier_lane_avg_transit'] = df['carrier_lane_avg_transit'].fillna(global_transit)

        # Fill count columns with 0
        df['lane_shipment_count'] = df['lane_shipment_count'].fillna(0)
        df['carrier_shipment_count'] = df['carrier_shipment_count'].fillna(0)
        df['carrier_lane_count'] = df['carrier_lane_count'].fillna(0)

        # Fill std columns with global std
        global_late_std = self.df['is_late'].std()
        global_transit_std = self.df['actual_transit_days'].std()

        df['lane_late_std'] = df['lane_late_std'].fillna(global_late_std)
        df['lane_transit_std'] = df['lane_transit_std'].fillna(global_transit_std)
        df['carrier_late_std'] = df['carrier_late_std'].fillna(global_late_std)
        df['carrier_transit_std'] = df['carrier_transit_std'].fillna(global_transit_std)
        df['lane_avg_distance'] = df['lane_avg_distance'].fillna(df['customer_distance'])

        # Create additional temporal features
        df['ship_dow'] = pd.to_datetime(df['actual_ship']).dt.dayofweek
        df['ship_month'] = pd.to_datetime(df['actual_ship']).dt.month
        df['ship_hour'] = pd.to_datetime(df['actual_ship']).dt.hour
        df['is_weekend_ship'] = (df['ship_dow'] >= 5).astype(int)
        df['is_month_end'] = (pd.to_datetime(df['actual_ship']).dt.day >= 25).astype(int)

        # Distance bucket encoding
        distance_bucket_map = {
            '0-100': 0, '100-250': 1, '250-500': 2,
            '500-1k': 3, '1k-2k': 4, '2k+': 5
        }
        df['distance_bucket_encoded'] = df['distance_bucket'].map(distance_bucket_map).fillna(2)

        # Carrier mode encoding
        df['is_ltl'] = (df['carrier_mode'] == 'LTL').astype(int)

        # Goal transit time features
        df['goal_transit_ratio'] = df['all_modes_goal_transit_days'] / (df['lane_avg_transit'] + 0.1)
        df['distance_per_goal_day'] = df['customer_distance'] / (df['all_modes_goal_transit_days'] + 0.1)

        # Experience/reliability features
        df['lane_experience'] = np.log1p(df['lane_shipment_count'])
        df['carrier_experience'] = np.log1p(df['carrier_shipment_count'])
        df['carrier_lane_experience'] = np.log1p(df['carrier_lane_count'])

        # Risk indicator features
        df['high_risk_lane'] = (df['lane_late_rate'] > 0.3).astype(int)
        df['high_risk_carrier'] = (df['carrier_late_rate'] > 0.3).astype(int)

        print(f"Features engineered: {len(df.columns)} columns")

        return df

    def prepare_training_data(self, test_size: float = 0.2,
                             time_based_split: bool = True) -> tuple:
        """
        Prepare data for training with proper train/test split.

        Args:
            test_size: Fraction of data to use for testing
            time_based_split: If True, split by time (more realistic).
                             If False, random split.

        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        print("Preparing training data...")

        if time_based_split:
            # Sort by ship date and split by time
            self.df = self.df.sort_values('actual_ship')
            split_idx = int(len(self.df) * (1 - test_size))
            split_date = self.df.iloc[split_idx]['actual_ship']

            print(f"Time-based split: Training data before {split_date.date()}")

            # Compute historical stats only using training data
            self.compute_historical_stats(cutoff_date=split_date)

            # Engineer features
            df_featured = self.engineer_features()

            train_df = df_featured[df_featured['actual_ship'] < split_date]
            test_df = df_featured[df_featured['actual_ship'] >= split_date]
        else:
            # Random split
            self.compute_historical_stats()
            df_featured = self.engineer_features()
            train_df, test_df = train_test_split(
                df_featured, test_size=test_size, random_state=42,
                stratify=df_featured['is_late']
            )

        # Define feature columns
        self.feature_columns = [
            # Lane features
            'lane_late_rate', 'lane_shipment_count', 'lane_late_std',
            'lane_avg_transit', 'lane_transit_std', 'lane_avg_distance',
            # Carrier features
            'carrier_late_rate', 'carrier_shipment_count', 'carrier_late_std',
            'carrier_avg_transit', 'carrier_transit_std',
            # Carrier-lane features
            'carrier_lane_late_rate', 'carrier_lane_count', 'carrier_lane_avg_transit',
            # Temporal features
            'ship_dow', 'ship_month', 'ship_hour',
            'is_weekend_ship', 'is_month_end',
            # Distance features
            'customer_distance', 'distance_bucket_encoded',
            # Mode features
            'is_ltl',
            # Goal transit features
            'all_modes_goal_transit_days', 'goal_transit_ratio', 'distance_per_goal_day',
            # Experience features
            'lane_experience', 'carrier_experience', 'carrier_lane_experience',
            # Risk indicators
            'high_risk_lane', 'high_risk_carrier'
        ]

        X_train = train_df[self.feature_columns]
        X_test = test_df[self.feature_columns]
        y_train = train_df['is_late']
        y_test = test_df['is_late']

        print(f"Training set: {len(X_train):,} samples ({y_train.mean():.1%} late)")
        print(f"Test set: {len(X_test):,} samples ({y_test.mean():.1%} late)")

        return X_train, X_test, y_train, y_test

    def train(self, X_train: pd.DataFrame, y_train: pd.Series) -> None:
        """
        Train the XGBoost classifier.

        Args:
            X_train: Training features
            y_train: Training labels
        """
        print("\nTraining XGBoost model...")

        # Calculate scale_pos_weight for imbalanced classes
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

        self.model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            scale_pos_weight=scale_pos_weight,
            min_child_weight=3,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='auc',
            use_label_encoder=False
        )

        self.model.fit(
            X_train, y_train,
            verbose=True
        )

        print("Model training complete!")

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series,
                plot: bool = True) -> dict:
        """
        Evaluate model performance on test data.

        Args:
            X_test: Test features
            y_test: Test labels
            plot: Whether to create visualization plots

        Returns:
            Dictionary of evaluation metrics
        """
        print("\nEvaluating model performance...")

        # Predictions
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba)
        }

        print("\n" + "="*50)
        print("MODEL PERFORMANCE METRICS")
        print("="*50)
        print(f"Accuracy:  {metrics['accuracy']:.3f}")
        print(f"Precision: {metrics['precision']:.3f}")
        print(f"Recall:    {metrics['recall']:.3f}")
        print(f"F1 Score:  {metrics['f1']:.3f}")
        print(f"ROC AUC:   {metrics['roc_auc']:.3f}")

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['On Time', 'Late']))

        if plot:
            self._plot_evaluation(y_test, y_pred, y_pred_proba)

        return metrics

    def _plot_evaluation(self, y_test: pd.Series, y_pred: np.ndarray,
                        y_pred_proba: np.ndarray) -> None:
        """Create evaluation visualizations."""
        fig, axes = plt.subplots(2, 2, figsize=(14, 12))
        fig.suptitle('Delivery Risk Model - Evaluation Results', fontsize=16, fontweight='bold')

        # 1. Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[0, 0])
        axes[0, 0].set_title('Confusion Matrix')
        axes[0, 0].set_xlabel('Predicted')
        axes[0, 0].set_ylabel('Actual')
        axes[0, 0].set_xticklabels(['On Time', 'Late'])
        axes[0, 0].set_yticklabels(['On Time', 'Late'])

        # 2. ROC Curve
        fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        axes[0, 1].plot(fpr, tpr, color='darkorange', lw=2,
                       label=f'ROC curve (AUC = {roc_auc:.3f})')
        axes[0, 1].plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        axes[0, 1].set_xlim([0.0, 1.0])
        axes[0, 1].set_ylim([0.0, 1.05])
        axes[0, 1].set_xlabel('False Positive Rate')
        axes[0, 1].set_ylabel('True Positive Rate')
        axes[0, 1].set_title('ROC Curve')
        axes[0, 1].legend(loc='lower right')
        axes[0, 1].grid(True, alpha=0.3)

        # 3. Feature Importance
        importance_df = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=True).tail(15)

        axes[1, 0].barh(importance_df['feature'], importance_df['importance'], color='steelblue')
        axes[1, 0].set_xlabel('Feature Importance')
        axes[1, 0].set_title('Top 15 Feature Importances')

        # 4. Prediction Distribution
        axes[1, 1].hist(y_pred_proba[y_test == 0], bins=50, alpha=0.7,
                       label='On Time', color='green')
        axes[1, 1].hist(y_pred_proba[y_test == 1], bins=50, alpha=0.7,
                       label='Late', color='red')
        axes[1, 1].set_xlabel('Predicted Probability of Late Delivery')
        axes[1, 1].set_ylabel('Frequency')
        axes[1, 1].set_title('Prediction Distribution by Actual Outcome')
        axes[1, 1].legend()
        axes[1, 1].axvline(x=0.5, color='black', linestyle='--', label='Threshold')

        plt.tight_layout()
        plt.savefig('model_evaluation.png', dpi=150, bbox_inches='tight')
        plt.show()
        print("\nEvaluation plots saved to 'model_evaluation.png'")

    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance rankings."""
        importance_df = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        return importance_df

    def predict_risk(self, shipment_data: dict) -> dict:
        """
        Predict delivery risk for a single shipment.

        Args:
            shipment_data: Dictionary containing shipment details:
                - lane_id: Lane identifier
                - carrier_pseudo: Carrier identifier
                - carrier_mode: 'LTL' or 'Truckload'
                - customer_distance: Distance in miles
                - distance_bucket: Distance category
                - all_modes_goal_transit_days: Expected transit days
                - ship_dow: Day of week (0=Monday, 6=Sunday)
                - ship_month: Month (1-12)
                - ship_hour: Hour of day (0-23)

        Returns:
            Dictionary with risk assessment:
                - risk_score: Probability of late delivery (0-1)
                - risk_level: 'LOW', 'MEDIUM', or 'HIGH'
                - confidence: Model confidence level
        """
        # Create a DataFrame for the single prediction
        df = pd.DataFrame([shipment_data])

        # Engineer features
        df_featured = self.engineer_features(df)

        # Get features
        X = df_featured[self.feature_columns]

        # Predict
        risk_score = self.model.predict_proba(X)[0, 1]

        # Determine risk level
        if risk_score < 0.3:
            risk_level = 'LOW'
        elif risk_score < 0.7:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'

        # Calculate confidence based on data availability
        lane_count = self.lane_stats.get(shipment_data.get('lane_id', ''), {}).get('lane_shipment_count', 0)
        carrier_count = self.carrier_stats.get(shipment_data.get('carrier_pseudo', ''), {}).get('carrier_shipment_count', 0)

        if isinstance(lane_count, pd.Series):
            lane_count = lane_count.iloc[0] if len(lane_count) > 0 else 0
        if isinstance(carrier_count, pd.Series):
            carrier_count = carrier_count.iloc[0] if len(carrier_count) > 0 else 0

        confidence = min(1.0, (lane_count + carrier_count) / 200)

        return {
            'risk_score': round(risk_score, 3),
            'risk_level': risk_level,
            'confidence': round(confidence, 2),
            'lane_late_rate': df_featured['lane_late_rate'].iloc[0],
            'carrier_late_rate': df_featured['carrier_late_rate'].iloc[0]
        }

    def save_model(self, model_dir: str = 'models') -> None:
        """
        Save the trained model and artifacts.

        Args:
            model_dir: Directory to save model files
        """
        model_path = Path(model_dir)
        model_path.mkdir(exist_ok=True)

        # Save XGBoost model using pickle to preserve sklearn wrapper
        with open(model_path / 'delivery_risk_model.pkl', 'wb') as f:
            pickle.dump(self.model, f)

        # Save statistics and feature columns
        artifacts = {
            'feature_columns': self.feature_columns,
            'lane_stats': self.lane_stats.to_dict() if self.lane_stats is not None else None,
            'carrier_stats': self.carrier_stats.to_dict() if self.carrier_stats is not None else None,
            'carrier_lane_stats': self.carrier_lane_stats.to_dict() if self.carrier_lane_stats is not None else None,
        }

        with open(model_path / 'model_artifacts.pkl', 'wb') as f:
            pickle.dump(artifacts, f)

        print(f"Model saved to {model_path}")

    def load_model(self, model_dir: str = 'models') -> None:
        """
        Load a trained model and artifacts.

        Args:
            model_dir: Directory containing model files
        """
        model_path = Path(model_dir)

        # Load XGBoost model from pickle
        with open(model_path / 'delivery_risk_model.pkl', 'rb') as f:
            self.model = pickle.load(f)

        # Load artifacts
        with open(model_path / 'model_artifacts.pkl', 'rb') as f:
            artifacts = pickle.load(f)

        self.feature_columns = artifacts['feature_columns']
        self.lane_stats = pd.DataFrame(artifacts['lane_stats']) if artifacts['lane_stats'] else None
        self.carrier_stats = pd.DataFrame(artifacts['carrier_stats']) if artifacts['carrier_stats'] else None
        self.carrier_lane_stats = pd.DataFrame(artifacts['carrier_lane_stats']) if artifacts['carrier_lane_stats'] else None

        print(f"Model loaded from {model_path}")


def main():
    """Main execution function for training the delivery risk model."""
    print("="*60)
    print("DeliveryIQ - Probabilistic Delivery Advisor")
    print("ML Model Training Pipeline")
    print("="*60)

    # Initialize model
    model = DeliveryRiskModel('data/last-mile-data.csv')

    # Load data
    model.load_data()

    # Prepare training data with time-based split
    X_train, X_test, y_train, y_test = model.prepare_training_data(
        test_size=0.2,
        time_based_split=True
    )

    # Train model
    model.train(X_train, y_train)

    # Evaluate model
    metrics = model.evaluate(X_test, y_test, plot=True)

    # Show feature importance
    print("\n" + "="*50)
    print("TOP FEATURE IMPORTANCES")
    print("="*50)
    importance = model.get_feature_importance()
    print(importance.head(15).to_string(index=False))

    # Save model
    model.save_model()

    # Demo prediction
    print("\n" + "="*50)
    print("DEMO PREDICTION")
    print("="*50)

    # Use a sample from test data for demo
    sample_shipment = {
        'lane_id': '109c918ef6db',
        'carrier_pseudo': '19936bf01cc6',
        'carrier_mode': 'Truckload',
        'customer_distance': 275,
        'distance_bucket': '250-500',
        'all_modes_goal_transit_days': 1,
        'ship_dow': 0,
        'ship_month': 1,
        'ship_hour': 10,
        'actual_ship': '2024-01-15 10:00:00'
    }

    risk = model.predict_risk(sample_shipment)
    print(f"\nSample Shipment Risk Assessment:")
    print(f"  Risk Score: {risk['risk_score']:.1%}")
    print(f"  Risk Level: {risk['risk_level']}")
    print(f"  Confidence: {risk['confidence']:.0%}")
    print(f"  Lane Historical Late Rate: {risk['lane_late_rate']:.1%}")
    print(f"  Carrier Historical Late Rate: {risk['carrier_late_rate']:.1%}")

    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)

    return model, metrics


if __name__ == "__main__":
    model, metrics = main()
