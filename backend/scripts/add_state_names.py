"""
Add state names based on 3-digit zip code prefixes using zipcodes library.
"""

import pandas as pd
import json
from pathlib import Path
import zipcodes


# State abbreviation to full name
STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "Washington DC", "FL": "Florida",
    "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana",
    "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
    "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
    "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota",
    "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
    "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin",
    "WY": "Wyoming", "PR": "Puerto Rico", "VI": "Virgin Islands", "GU": "Guam"
}


def build_zip3_to_state_mapping(zip3_prefixes: list) -> dict:
    """
    Build a mapping from 3-digit zip prefixes to states using zipcodes library.
    """
    mapping = {}

    for zip3 in zip3_prefixes:
        # Extract the 3-digit prefix (e.g., "441" from "441xx")
        # Handle both "441xx" format and raw "441" format
        if not zip3:
            continue

        prefix = str(zip3).replace('xx', '').replace('XX', '')[:3]

        if not prefix or prefix in mapping:
            continue

        # Search for zip codes starting with this prefix
        # zipcodes.similar_to() returns matching zip codes by prefix
        try:
            results = zipcodes.similar_to(prefix)
            if results:
                state_abbrev = results[0].get('state', 'Unknown')
                mapping[prefix] = state_abbrev
            else:
                mapping[prefix] = "Unknown"
        except Exception:
            mapping[prefix] = "Unknown"

    return mapping


def main():
    data_path = Path(__file__).parent.parent / "data" / "last-mile-data.csv"
    df = pd.read_csv(data_path)

    print(f"Processing {len(df)} rows...")

    # Get all unique 3-digit prefixes
    all_zip3 = set(df['origin_zip_3d'].unique()) | set(df['dest_zip_3d'].unique())
    print(f"Found {len(all_zip3)} unique 3-digit zip prefixes")

    # Build mapping using zipcodes
    print("Building zip-to-state mapping using zipcodes library...")
    zip3_to_state = build_zip3_to_state_mapping(list(all_zip3))

    # Function to get state from zip3
    def get_state_abbrev(zip3_str: str) -> str:
        if not zip3_str:
            return "Unknown"
        prefix = str(zip3_str).replace('xx', '').replace('XX', '')[:3]
        return zip3_to_state.get(prefix, "Unknown")

    def get_state_name(zip3_str: str) -> str:
        abbrev = get_state_abbrev(zip3_str)
        return STATE_NAMES.get(abbrev, abbrev)

    # Add origin state columns
    df['origin_state'] = df['origin_zip_3d'].apply(get_state_abbrev)
    df['origin_state_name'] = df['origin_zip_3d'].apply(get_state_name)

    # Add destination state columns
    df['dest_state'] = df['dest_zip_3d'].apply(get_state_abbrev)
    df['dest_state_name'] = df['dest_zip_3d'].apply(get_state_name)

    # Check for unknowns
    unknown_origin = df[df['origin_state'] == 'Unknown']['origin_zip_3d'].unique()
    unknown_dest = df[df['dest_state'] == 'Unknown']['dest_zip_3d'].unique()

    if len(unknown_origin) > 0:
        print(f"Warning: Unknown origin zips ({len(unknown_origin)}): {list(unknown_origin)[:10]}")
    if len(unknown_dest) > 0:
        print(f"Warning: Unknown dest zips ({len(unknown_dest)}): {list(unknown_dest)[:10]}")

    # Save updated CSV
    df.to_csv(data_path, index=False)
    print(f"Saved updated CSV with state columns")

    # Update schema
    schema_path = Path(__file__).parent.parent / "data" / "last-mile-data.json"
    with open(schema_path, 'r') as f:
        schema = json.load(f)

    new_columns = [
        {"name": "origin_state", "type": "string", "description": "Origin state abbreviation (e.g., 'CA', 'TX', 'NY')"},
        {"name": "origin_state_name", "type": "string", "description": "Origin state full name (e.g., 'California', 'Texas')"},
        {"name": "dest_state", "type": "string", "description": "Destination state abbreviation (e.g., 'CA', 'TX', 'NY')"},
        {"name": "dest_state_name", "type": "string", "description": "Destination state full name (e.g., 'California', 'Texas')"},
    ]

    for col in new_columns:
        if not any(c['name'] == col['name'] for c in schema):
            schema.append(col)

    with open(schema_path, 'w') as f:
        json.dump(schema, f, indent=2)
    print("Updated schema with state columns")

    # Print sample
    print("\nSample data with states:")
    sample = df[['origin_zip_3d', 'origin_state', 'origin_state_name', 'dest_zip_3d', 'dest_state', 'dest_state_name']].drop_duplicates().head(10)
    print(sample.to_string(index=False))

    # Print state distribution
    print(f"\nUnique origin states ({df['origin_state'].nunique()}): {sorted(df['origin_state'].unique())[:20]}")
    print(f"Unique dest states ({df['dest_state'].nunique()}): {sorted(df['dest_state'].unique())[:20]}")


if __name__ == "__main__":
    main()
