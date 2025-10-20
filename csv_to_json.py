csv_to_json.py


Reads 'marketdata.csv' (expected header provided) and writes 'marketdata.json'.
This script preserves CSV text values exactly (no numeric conversions or currency stripping).
"""
import csv
import json
import os
import sys


CSV_FILE = "marketdata.csv"
JSON_FILE = "marketdata.json"




def csv_to_json(csv_file: str, json_file: str) -> int:
if not os.path.exists(csv_file):
print(f"ERROR: CSV file not found: {csv_file}")
return 1


# Read CSV using DictReader so header names are used as keys exactly
with open(csv_file, newline="", encoding="utf-8") as f:
reader = csv.DictReader(f)
data = [row for row in reader]


# Write JSON preserving all string values as-is
with open(json_file, "w", encoding="utf-8") as f:
json.dump(data, f, ensure_ascii=False, indent=2)


print(f"✅ Converted {len(data)} rows from '{csv_file}' → '{json_file}'")
return 0




if __name__ == "__main__":
exit_code = csv_to_json(CSV_FILE, JSON_FILE)
sys.exit(exit_code)
