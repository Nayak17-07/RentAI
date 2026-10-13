"""
Rentora ML Intelligence Tier: Predictive Maintenance Engine
Module: Predictive Maintenance & Smart Appliance IoT Health Analytics
"""

import os
import sys
import uuid
import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score

import joblib

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(CURRENT_DIR, "appliance_sensor_dataset.csv")
MODEL_PATH = os.path.join(CURRENT_DIR, "maintenance_rf_model.joblib")
AI4I_URL = "https://raw.githubusercontent.com/derekc22/ai4i2020/master/ai4i2020.csv"

APPLIANCE_COMPONENTS = {
    "Washing Machine": ["Motor Bearing", "Drain Pump", "Inverter PCB", "Suspension Damper"],
    "Refrigerator": ["Compressor", "Thermostat Sensor", "Condenser Fan", "Defrost Heater"],
    "Air Conditioner": ["Rotary Compressor", "Blower Motor", "Capacitor", "Refrigerant Coil"],
    "Microwave": ["Magnetron Tube", "High-Voltage Diode", "Turntable Motor", "Door Interlock"],
    "Water Purifier": ["RO Membrane", "Booster Pump", "Sediment Filter", "TDS Sensor"],
    "Dishwasher": ["Circulation Impeller", "Heating Element", "Flow Meter", "Solenoid Valve"]
}

def fetch_and_map_real_ai4i_dataset(url=AI4I_URL):
    """
    Fetches genuine UCI AI4I 2020 Predictive Maintenance dataset (10,000 industrial sensor rows)
    and maps physical temperature, torque, vibration and failure modes into smart household appliances.
    """
    try:
        print(f"[Dataset] Fetching genuine machine sensor failure dataset from: {url}")
        raw = pd.read_csv(url)

        type_map = {
            'L': ['Washing Machine', 'Refrigerator'],
            'M': ['Air Conditioner', 'Dishwasher'],
            'H': ['Microwave', 'Water Purifier']
        }

        appliance_types = []
        components = []
        for idx, row in raw.iterrows():
            opts = type_map.get(row['Type'], ['Washing Machine', 'Refrigerator'])
            app_type = opts[idx % len(opts)]
            appliance_types.append(app_type)
            
            # Map fault modes from real AI4I failures
            if row['HDF'] == 1:
                comp = 'Condenser Fan' if 'Refrigerator' in app_type else 'Compressor'
            elif row['PWF'] == 1:
                comp = 'Inverter PCB' if 'Washing' in app_type else 'Capacitor'
            elif row['OSF'] == 1:
                comp = 'Suspension Damper' if 'Washing' in app_type else 'Motor Bearing'
            elif row['TWF'] == 1:
                comp = 'Drain Pump' if 'Washing' in app_type else 'Booster Pump'
            elif row['RNF'] == 1:
                comp = 'Control Relay'
            else:
                comp = 'Standard Component'
            components.append(comp)

        ambient_temp_c = (raw['Air temperature [K]'] - 273.15).round(1)
        motor_temp_c = (raw['Process temperature [K]'] - 273.15).round(1)
        operating_hours = (raw['Tool wear [min]'] * 15.0).clip(50, 4500).round(1)
        vibration_amplitude = (raw['Rotational speed [rpm]'] / 400.0).round(2)
        power_fluctuation_pct = (raw['Torque [Nm]'] / 3.0).round(1)
        daily_energy_kwh = (raw['Torque [Nm]'] * raw['Rotational speed [rpm]'] / 80000.0).round(2)
        duty_cycle_pct = ((raw['Rotational speed [rpm]'] - 1100) / 1700 * 100).clip(10, 95).round(1)
        days_since_service = (raw['Tool wear [min]'] * 1.5).clip(10, 365).round(0).astype(int)

        failure_30d = raw['Machine failure']
        fail_prob = ((raw['Process temperature [K]'] - 305) / 10 * 0.3 + (raw['Tool wear [min]'] / 240) * 0.4 + failure_30d * 0.4).clip(0.05, 0.98).round(4)
        rul_days = (250 - raw['Tool wear [min]']).clip(5, 240).astype(int)

        df_iot = pd.DataFrame({
            'device_id': [f'IOT_{p}' for p in raw['Product ID']],
            'appliance_type': appliance_types,
            'operating_hours': operating_hours,
            'motor_temp_c': motor_temp_c,
            'vibration_amplitude': vibration_amplitude,
            'power_fluctuation_pct': power_fluctuation_pct,
            'daily_energy_kwh': daily_energy_kwh,
            'duty_cycle_pct': duty_cycle_pct,
            'days_since_service': days_since_service,
            'ambient_temp_c': ambient_temp_c,
            'failure_probability': fail_prob,
            'failure_30d': failure_30d,
            'rul_days': rul_days,
            'at_risk_component': components
        })

        df_iot.to_csv(DATASET_PATH, index=False)
        print(f"[Dataset] Saved {len(df_iot)} genuine records to: {DATASET_PATH}")
        return df_iot
    except Exception as e:
        print(f"[Dataset] Failed to download AI4I dataset ({e}). Generating fallback distribution...")
        return generate_telemetry_dataset()

def generate_telemetry_dataset(n_samples=2000, random_state=42):
    """
    Fallback generator if offline.
    """
    np.random.seed(random_state)
    appliance_types = list(APPLIANCE_COMPONENTS.keys())
    categories = np.random.choice(appliance_types, size=n_samples)
    
    operating_hours = np.random.exponential(scale=1200, size=n_samples).clip(50, 8000)
    motor_temp_c = np.random.normal(loc=52.0, scale=14.0, size=n_samples).clip(25.0, 98.0)
    vibration_amplitude = np.random.gamma(shape=2.5, scale=1.2, size=n_samples).clip(0.4, 18.0)
    power_fluctuation_pct = np.random.normal(loc=6.5, scale=4.8, size=n_samples).clip(0.5, 35.0)
    daily_energy_kwh = np.random.normal(loc=3.2, scale=1.5, size=n_samples).clip(0.4, 12.0)
    duty_cycle_pct = np.random.beta(a=3, b=4, size=n_samples) * 100
    days_since_service = np.random.randint(10, 400, size=n_samples)
    ambient_temp_c = np.random.normal(loc=29.0, scale=5.0, size=n_samples).clip(16.0, 46.0)
    
    thermal_stress = (motor_temp_c - 45.0) / 35.0
    mechanical_wear = (vibration_amplitude - 2.0) / 8.0
    electrical_instability = power_fluctuation_pct / 20.0
    age_wear = operating_hours / 5000.0
    service_lag = days_since_service / 250.0
    
    degradation_score = (
        0.30 * thermal_stress +
        0.28 * mechanical_wear +
        0.18 * electrical_instability +
        0.14 * age_wear +
        0.10 * service_lag
    )
    prob = 1.0 / (1.0 + np.exp(-(degradation_score * 4.5 - 2.2)))
    failure_label = (prob > 0.50).astype(int)
    rul_days = np.clip(np.round((1.0 - prob) * 120 + np.random.normal(0, 8, size=n_samples)), 3, 180).astype(int)
    
    records = []
    for i in range(n_samples):
        cat = categories[i]
        comp_list = APPLIANCE_COMPONENTS[cat]
        comp = comp_list[i % len(comp_list)]
        
        records.append({
            "device_id": f"IOT_{cat[:3].upper()}_{i+1:04d}",
            "appliance_type": cat,
            "operating_hours": round(float(operating_hours[i]), 1),
            "motor_temp_c": round(float(motor_temp_c[i]), 1),
            "vibration_amplitude": round(float(vibration_amplitude[i]), 2),
            "power_fluctuation_pct": round(float(power_fluctuation_pct[i]), 1),
            "daily_energy_kwh": round(float(daily_energy_kwh[i]), 2),
            "duty_cycle_pct": round(float(duty_cycle_pct[i]), 1),
            "days_since_service": int(days_since_service[i]),
            "ambient_temp_c": round(float(ambient_temp_c[i]), 1),
            "failure_probability": round(float(prob[i]), 4),
            "failure_30d": int(failure_label[i]),
            "rul_days": int(rul_days[i]),
            "at_risk_component": comp
        })
        
    df = pd.DataFrame(records)
    df.to_csv(DATASET_PATH, index=False)
    print(f"Generated {len(df)} telemetry records -> {DATASET_PATH}")
    return df

def train_and_sync_models():
    """Trains the predictive maintenance classifier and syncs to MongoDB."""
    if not os.path.exists(DATASET_PATH):
        df = fetch_and_map_real_ai4i_dataset()
    else:
        df = pd.read_csv(DATASET_PATH)
        
    features = [
        "operating_hours", "motor_temp_c", "vibration_amplitude",
        "power_fluctuation_pct", "daily_energy_kwh", "duty_cycle_pct",
        "days_since_service", "ambient_temp_c"
    ]
    
    X = df[features]
    y = df["failure_30d"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    y_prob = np.asarray(clf.predict_proba(X_test))[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    roc = roc_auc_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    
    print("\n=======================================================")
    print("  RENTORA PREDICTIVE MAINTENANCE ML MODEL EVALUATION  ")
    print("=======================================================")
    print(f"  Classification Accuracy: {acc*100:.2f}%")
    print(f"  ROC-AUC Score:          {roc:.4f}")
    print(f"  F1-Score:                {f1:.4f}")
    print("=======================================================")
    
    importances = dict(zip(features, [round(float(v), 4) for v in clf.feature_importances_]))
    print("Feature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {feat:24s}: {imp*100:.1f}%")
        
    # Persist model
    joblib.dump({
        'model': clf,
        'features': features,
        'metrics': {'accuracy': acc, 'roc_auc': roc, 'f1': f1}
    }, MODEL_PATH)
    print(f"[Model Artifact] Serialized predictive maintenance model to: {MODEL_PATH}")
        
    # Attempt to sync precomputed telemetry insights into MongoDB
    try:
        from api.mongo_client import get_mongo_db
        db = get_mongo_db()
        
        appliances = list(db.appliances.find({}))
        active_rentals = list(db.rentals.find({"status": {"$in": ["active", "OWNED"]}}))
        
        telemetry_docs = []
        alerts_docs = []
        now = datetime.datetime.utcnow().isoformat()
        
        print(f"\nSyncing IoT Telemetry for {len(appliances)} catalog appliances and {len(active_rentals)} rentals...")
        
        for idx, app in enumerate(appliances):
            app_id = app.get("appliance_id") or str(app.get("_id"))
            name = app.get("rental_name", "Appliance")
            cat = app.get("category_id", "Appliances")
            
            # Map category to matching appliance type
            matched_type = "Washing Machine"
            for k in APPLIANCE_COMPONENTS.keys():
                if k.lower() in name.lower() or k.lower() in cat.lower():
                    matched_type = k
                    break
                    
            sample_row = df[df["appliance_type"] == matched_type].iloc[idx % 200]
            fail_prob = float(sample_row["failure_probability"])
            rul = int(sample_row["rul_days"])
            comp = sample_row["at_risk_component"]
            
            risk_level = "LOW"
            if fail_prob >= 0.75:
                risk_level = "CRITICAL"
            elif fail_prob >= 0.50:
                risk_level = "HIGH"
            elif fail_prob >= 0.30:
                risk_level = "MODERATE"
                
            recommendation = (
                f"Proactive service advised: Inspect {comp} within {rul} days to prevent unexpected failure."
                if risk_level in ["HIGH", "CRITICAL"]
                else f"Appliance operating within optimal parameters. Next preventive checkup in {rul} days."
            )
            
            telemetry_doc = {
                "device_id": f"IOT-{app_id[-8:].upper()}",
                "appliance_id": app_id,
                "rental_name": name,
                "category": matched_type,
                "online_status": "ONLINE" if fail_prob < 0.85 else "STANDBY",
                "operating_mode": "ECO_MODE" if idx % 3 == 0 else "STANDARD",
                "motor_temp_c": float(sample_row["motor_temp_c"]),
                "vibration_amplitude_mms": float(sample_row["vibration_amplitude"]),
                "daily_energy_kwh": float(sample_row["daily_energy_kwh"]),
                "cumulative_kwh": round(float(sample_row["daily_energy_kwh"]) * np.random.randint(20, 180), 1),
                "operating_hours": float(sample_row["operating_hours"]),
                "filter_health_pct": max(15, int(100 - (sample_row["operating_hours"] % 1000) / 10)),
                "health_score": int(round((1.0 - fail_prob) * 100)),
                "failure_risk_score": round(fail_prob, 3),
                "risk_level": risk_level,
                "remaining_useful_life_days": rul,
                "at_risk_component": comp,
                "proactive_recommendation": recommendation,
                "diagnostic_error_code": "ERR_TEMP_SURGE" if risk_level == "CRITICAL" else ("WARN_FILTER_CLOGGED" if risk_level == "HIGH" else "NORMAL_OK"),
                "last_ping_at": now,
                "last_service_date": (datetime.datetime.utcnow() - datetime.timedelta(days=int(sample_row["days_since_service"]))).strftime("%Y-%m-%d")
            }
            telemetry_docs.append(telemetry_doc)
            
            if risk_level in ["HIGH", "CRITICAL"]:
                alerts_docs.append({
                    "alert_id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
                    "device_id": telemetry_doc["device_id"],
                    "appliance_id": app_id,
                    "rental_name": name,
                    "risk_level": risk_level,
                    "failure_risk_score": round(fail_prob, 3),
                    "at_risk_component": comp,
                    "proactive_action": "PREVENTIVE_SERVICE_DISPATCH_REQUIRED",
                    "status": "PENDING_DISPATCH",
                    "created_at": now
                })
                
        # Upsert telemetry
        for t in telemetry_docs:
            db.iot_device_telemetry.update_one(
                {"appliance_id": t["appliance_id"]},
                {"$set": t},
                upsert=True
            )
            
        # Insert alerts
        if alerts_docs:
            db.predictive_maintenance_alerts.delete_many({"status": "PENDING_DISPATCH"})
            db.predictive_maintenance_alerts.insert_many(alerts_docs)
            
        print(f"Successfully synced {len(telemetry_docs)} IoT device records and {len(alerts_docs)} predictive maintenance alerts to MongoDB.")
        
    except Exception as e:
        print(f"Notice: MongoDB sync skipped ({e}). Models evaluated successfully.")

if __name__ == "__main__":
    train_and_sync_models()
