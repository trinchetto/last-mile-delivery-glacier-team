"""
Generate friendly nicknames for carrier IDs and update the CSV data.
"""

import pandas as pd
import random
import json
from pathlib import Path

# Friendly name components
PREFIXES = [
    "Swift", "Fast", "Quick", "Speedy", "Rapid", "Express", "Prime", "Elite",
    "Pro", "Star", "Blue", "Red", "Green", "Gold", "Silver", "Iron", "Steel",
    "Thunder", "Lightning", "Eagle", "Falcon", "Hawk", "Phoenix", "Atlas",
    "Titan", "Summit", "Peak", "Arrow", "Rocket", "Jet", "Turbo", "Mega",
    "Ultra", "Super", "Max", "Apex", "Crown", "Royal", "Noble", "Grand",
    "Pacific", "Atlantic", "Mountain", "Valley", "River", "Ocean", "Prairie",
    "Metro", "Urban", "National", "Continental", "Global", "United", "Allied",
    "Central", "Northern", "Southern", "Eastern", "Western", "Midwest",
    "Coastal", "Frontier", "Pioneer", "Liberty", "Freedom", "Victory",
    "Anchor", "Compass", "Horizon", "Sunrise", "Sunset", "Polar", "Tropic",
    "Alpha", "Beta", "Delta", "Omega", "Vertex", "Nexus", "Core", "Prime"
]

SUFFIXES = [
    "Freight", "Cargo", "Haul", "Transport", "Logistics", "Delivery",
    "Carrier", "Shipping", "Lines", "Fleet", "Express", "Movers",
    "Trucking", "Transit", "Haulage", "Distribution", "Couriers",
    "Dispatch", "Forwarding", "Solutions", "Services", "Partners"
]

def generate_unique_names(count: int) -> list[str]:
    """Generate unique friendly carrier names."""
    names = set()

    # First, generate all possible combinations
    all_combinations = []
    for prefix in PREFIXES:
        for suffix in SUFFIXES:
            all_combinations.append(f"{prefix} {suffix}")

    # Shuffle and pick unique names
    random.seed(42)  # For reproducibility
    random.shuffle(all_combinations)

    return all_combinations[:count]


def main():
    # Load the CSV
    data_path = Path(__file__).parent.parent / "data" / "last-mile-data.csv"
    df = pd.read_csv(data_path)

    # Get unique carrier IDs
    carrier_ids = df['carrier_pseudo'].unique().tolist()
    print(f"Found {len(carrier_ids)} unique carriers")

    # Generate names
    names = generate_unique_names(len(carrier_ids))

    # Create mapping
    carrier_mapping = {}
    for carrier_id, name in zip(carrier_ids, names):
        carrier_mapping[carrier_id] = name

    # Save mapping to JSON for reference
    mapping_path = Path(__file__).parent.parent / "data" / "carrier_names.json"
    with open(mapping_path, 'w') as f:
        json.dump(carrier_mapping, f, indent=2)
    print(f"Saved carrier name mapping to {mapping_path}")

    # Add carrier_name column to DataFrame
    df['carrier_name'] = df['carrier_pseudo'].map(carrier_mapping)

    # Save updated CSV
    df.to_csv(data_path, index=False)
    print(f"Updated CSV with carrier_name column")

    # Print sample
    print("\nSample carrier mappings:")
    for i, (cid, name) in enumerate(list(carrier_mapping.items())[:15]):
        print(f"  {cid} -> {name}")

    # Also update the schema JSON
    schema_path = Path(__file__).parent.parent / "data" / "last-mile-data.json"
    with open(schema_path, 'r') as f:
        schema = json.load(f)

    # Add carrier_name to schema
    schema.append({
        "name": "carrier_name",
        "type": "string",
        "description": "Friendly name for the carrier (e.g., 'Swift Freight', 'Eagle Logistics')"
    })

    with open(schema_path, 'w') as f:
        json.dump(schema, f, indent=2)
    print(f"Updated schema with carrier_name column")


if __name__ == "__main__":
    main()
