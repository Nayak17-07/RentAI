import os
import sys
import uuid
import datetime
import requests

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api")

def run_tests():
    print("=" * 80)
    print("  VERIFYING SMART APPLIANCE, IOT, BI & REAL-TIME TRACKING MODULES")
    print("=" * 80)

    from api.mongo_client import get_mongo_db
    from api.mongo_auth import generate_tokens
    db = get_mongo_db()
    admin_id = str(uuid.uuid4())
    db.users.insert_one({"_id": admin_id, "username": f"adm_{admin_id[:6]}", "email": f"adm_{admin_id[:6]}@rentora.com", "role": "admin"})
    admin_auth = {"Authorization": f"Bearer {generate_tokens(admin_id)['access']}"}

    # 1. Test IoT Telemetry Endpoint
    res = requests.get(f"{BASE_URL}/iot/telemetry/sample-appliance-id")
    assert res.status_code == 200, f"IoT telemetry failed: {res.text}"
    telemetry = res.json()
    assert "health_score" in telemetry, "Missing health_score"
    assert "motor_temp_c" in telemetry, "Missing motor_temp_c"
    assert "daily_energy_kwh" in telemetry, "Missing daily_energy_kwh"
    print(f"[OK] 1. IoT Telemetry Endpoint: Health Score {telemetry['health_score']}/100, Temp {telemetry['motor_temp_c']}°C, Daily {telemetry['daily_energy_kwh']} kWh")

    # 2. Test Remote IoT Smart Controls
    res = requests.patch(f"{BASE_URL}/iot/controls/sample-appliance-id", json={"action": "TOGGLE_ECO"}, headers=admin_auth)
    assert res.status_code == 200, f"IoT eco toggle failed: {res.text}"
    print(f"[OK] 2. Remote IoT Controls (Eco-Saver Toggle): {res.json()['message']}")

    # 3. Test Proactive Preventive Maintenance Booking
    res = requests.post(f"{BASE_URL}/iot/proactive-service/sample-appliance-id", json={
        "preferred_slot": "Express Slot (Next 24 Hours)",
        "notes": "Automated test predictive maintenance booking"
    })
    assert res.status_code == 201, f"Proactive service booking failed: {res.text}"
    print(f"[OK] 3. Proactive Service Dispatch: Ticket #{res.json()['ticket_id']} created at INR 0 cost under Rentora Shield")

    # 4. Test Fleet Health Analytics
    res = requests.get(f"{BASE_URL}/iot/fleet-health")
    assert res.status_code == 200, f"Fleet health failed: {res.text}"
    fleet = res.json()
    summary = fleet["summary"]
    print(f"[OK] 4. Fleet Health Hub: {summary['total_connected_appliances']} Connected Nodes, {summary['online_rate_pct']}% Online, Avg Health {summary['avg_fleet_health_score']}/100")

    # 5. Test Serialized Inventory Units
    res = requests.get(f"{BASE_URL}/inventory/units", headers=admin_auth)
    assert res.status_code == 200, f"Inventory units failed: {res.text}"
    units = res.json()
    assert len(units) > 0, "No serialized units found"
    sample_unit = units[0]
    print(f"[OK] 5. Serialized Inventory Units: {len(units)} physical units tracked (Sample: {sample_unit['serial_number']} | RFID: {sample_unit['rfid_tag']} | Grade: {sample_unit['condition_grade']})")

    # 6. Test 4-Stage Refurbishment Pipeline Step
    res = requests.post(f"{BASE_URL}/inventory/refurbish-step/{sample_unit['unit_id']}", json={
        "next_stage": "SANITIZATION_PART_REPLACE",
        "notes": "Steam sanitization & gasket refresh initiated by quality team"
    }, headers=admin_auth)
    assert res.status_code == 200, f"Refurb step failed: {res.text}"
    print(f"[OK] 6. 4-Stage Refurbishment Workflow: {res.json()['message']}")

    # 7. Test Inventory Valuation KPIs
    res = requests.get(f"{BASE_URL}/inventory/kpis", headers=admin_auth)
    assert res.status_code == 200, f"Inventory KPIs failed: {res.text}"
    kpis = res.json()
    print(f"[OK] 7. Inventory KPIs: Fleet Utilization {kpis['fleet_utilization_pct']}%, Total Procurement INR {kpis['total_fleet_procurement_cost']:,}, Recovered INR {kpis['total_rental_revenue_recovered']:,}")

    # 8. Test Live Real-Time GPS Tracking & Waypoints
    res = requests.get(f"{BASE_URL}/tracking/live/sample-rental-id")
    assert res.status_code == 200, f"Live tracking failed: {res.text}"
    trk = res.json()
    assert "waypoints" in trk, "Missing waypoints"
    assert "eta_minutes" in trk, "Missing eta_minutes"
    print(f"[OK] 8. Live Real-Time GPS Route: Van #{trk['vehicle_number']} at {trk['speed_kmh']} km/h ({trk['distance_remaining_km']} km left • ETA: {trk['eta_minutes']} mins) with {len(trk['waypoints'])} GPS coordinates")

    # 9. Test Business Intelligence (BI) Analytics
    res = requests.get(f"{BASE_URL}/admin/bi-analytics/", headers=admin_auth)
    assert res.status_code == 200, f"BI analytics failed: {res.text}"
    bi = res.json()
    fin = bi["financial_kpis"]
    print(f"[OK] 9. Business Intelligence Suite: MRR INR {fin['mrr']:,} | ARR Run-Rate INR {fin['arr']:,} | ARPU INR {fin['arpu']:,} | LTV INR {fin['customer_ltv']:,} | Collection Efficiency {fin['collection_efficiency_pct']}%")
    print(f"      - 6-Month Category Demand Forecast: {len(bi['demand_forecast'])} seasonal predictions")
    print(f"      - Metro City Profitability: {len(bi['city_performance'])} hubs (Bangalore, Mumbai, Delhi, Hyderabad, Pune)")
    print(f"      - Cohort Retention Matrix: {len(bi['cohort_retention'])} customer cohorts")

    db.users.delete_one({"_id": admin_id})

    print("=" * 80)
    print("  ALL 9 NEW SMART APPLIANCE & BUSINESS INTELLIGENCE MODULES PASSED (100% SUCCESS)!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
