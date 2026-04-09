# ==============================================================================
# Intellivor v4.0 — FastAPI Backend  (Production-Grade)
# AI Smart Farming Ecosystem — Karnataka, India
#
# NEW in v4:
#   • Cohere AI chatbot (replaces Anthropic for chat)
#   • Payments & Orders system (Razorpay UPI integration)
#   • Shop/Product catalog (seeds, fertilizers, equipment)
#   • Real-time weather via OpenWeatherMap (no dummy fallback for weather page)
#   • Enhanced 5-agent agentic AI pipeline with IoT + Order agents
#   • Rural-first UX: simple language mode, voice-first flows
#   • WhatsApp order confirmations via Twilio
#
# ── Install ────────────────────────────────────────────────────────────────────
#   pip install fastapi "uvicorn[standard]" python-multipart pillow numpy
#               torch torchvision scikit-learn joblib
#               cohere twilio requests python-jose[cryptography]
#               passlib[bcrypt] sqlalchemy python-dotenv aiofiles
#               pytesseract pdf2image rapidfuzz pandas anthropic
#
# ── Run ────────────────────────────────────────────────────────────────────────
#   uvicorn backend1:app --host 0.0.0.0 --port 8000 --reload
#
# ── .env keys needed ───────────────────────────────────────────────────────────
#   JWT_SECRET
#   COHERE_API_KEY               (primary chatbot)
#   ANTHROPIC_API_KEY            (agent pipeline fallback)
#   OPENWEATHER_API_KEY          (REQUIRED for real weather)
#   TWILIO_SID / TWILIO_TOKEN
#   TWILIO_WHATSAPP_FROM
#   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET  (payments)
#   DATAGOV_API_KEY
#   DATABASE_URL
# ==============================================================================

from __future__ import annotations

import hashlib, io, json, logging, os, re, secrets, shutil, socket
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# ── JWT / Auth ─────────────────────────────────────────────────────────────────
try:
    from jose import JWTError, jwt; JWT_OK = True
except ImportError:
    JWT_OK = False
try:
    from passlib.context import CryptContext
    _pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto"); BCRYPT_OK = True
except ImportError:
    BCRYPT_OK = False

# ── ML ─────────────────────────────────────────────────────────────────────────
import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image
from sklearn.ensemble import IsolationForest
import joblib

# ── OCR ────────────────────────────────────────────────────────────────────────
try:
    import pytesseract; from pdf2image import convert_from_bytes; OCR_OK = True
except ImportError:
    OCR_OK = False

try:
    from rapidfuzz import fuzz; FUZZ_OK = True
except ImportError:
    FUZZ_OK = False

import requests as http
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# ── Cohere (primary chatbot) ───────────────────────────────────────────────────
try:
    import cohere as _cohere; COHERE_OK = True
except ImportError:
    COHERE_OK = False

# ── Anthropic (agent pipeline) ─────────────────────────────────────────────────
try:
    import anthropic as _anthropic; ANTHROPIC_OK = True
except ImportError:
    ANTHROPIC_OK = False

# ── Twilio ─────────────────────────────────────────────────────────────────────
try:
    from twilio.rest import Client as TwilioClient; TWILIO_OK = True
except ImportError:
    TWILIO_OK = False

from dotenv import load_dotenv
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)


def _env_first(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default

# ══════════════════════════════════════════════════════════════════════════════
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
log = logging.getLogger("intellivor")

# ══════════════════════════════════════════════════════════════════════════════
SECRET_KEY     = os.getenv("JWT_SECRET", secrets.token_hex(32))
ALGORITHM      = "HS256"
TOKEN_EXPIRE_M = 60 * 24 * 7   # 7 days

DB_URL          = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'intellivor.db'}")
OWM_KEY         = _env_first("OPENWEATHER_API_KEY")
COHERE_KEY      = _env_first("COHERE_API_KEY")
ANTHROPIC_KEY   = _env_first("ANTHROPIC_API_KEY")
TWILIO_SID      = _env_first("TWILIO_SID", "ACCOUNT_SID")
TWILIO_TOKEN    = _env_first("TWILIO_TOKEN", "TWILIO_AUTH_TOKEN", "AUTH_TOKEN")
TWILIO_FROM     = _env_first("TWILIO_WHATSAPP_FROM", "TWILIO_NUMBER", default="whatsapp:+14155238886")
DATAGOV_KEY     = _env_first("DATAGOV_API_KEY")
RAZORPAY_KEY    = _env_first("RAZORPAY_KEY_ID")
RAZORPAY_SECRET = _env_first("RAZORPAY_KEY_SECRET")

if DB_URL.startswith("sqlite:///./"):
    DB_URL = f"sqlite:///{BASE_DIR / DB_URL.removeprefix('sqlite:///./')}"

UPLOAD_DIR = BASE_DIR / "uploads"; UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_DIR  = BASE_DIR / "models";  MODEL_DIR.mkdir(exist_ok=True)

NUM_DISEASE = 38 
NUM_PEST    = 22

DISEASE_CLASSES: List[str] = [
    "Apple___Apple_scab","Apple___Black_rot","Apple___Cedar_apple_rust","Apple___healthy",
    "Blueberry___healthy","Cherry___Powdery_mildew","Cherry___healthy",
    "Corn___Cercospora_leaf_spot","Corn___Common_rust","Corn___Northern_Leaf_Blight","Corn___healthy",
    "Grape___Black_rot","Grape___Esca_Black_Measles","Grape___Leaf_blight","Grape___healthy",
    "Orange___Haunglongbing","Peach___Bacterial_spot","Peach___healthy",
    "Pepper___Bacterial_spot","Pepper___healthy",
    "Potato___Early_blight","Potato___Late_blight","Potato___healthy",
    "Raspberry___healthy","Soybean___healthy","Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch","Strawberry___healthy",
    "Tomato___Bacterial_spot","Tomato___Early_blight","Tomato___Late_blight",
    "Tomato___Leaf_Mold","Tomato___Septoria_leaf_spot","Tomato___Spider_mites",
    "Tomato___Target_Spot","Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus","Tomato___healthy",
]

PEST_CLASSES: List[str] = [
    "Cashew anthracnose","Cashew gumosis","Cashew healthy","Cashew leaf miner","Cashew red rust",
    "Cassava bacterial blight","Cassava brown spot","Cassava green mite","Cassava healthy","Cassava mosaic",
    "Maize fall armyworm","Maize grasshopper","Maize healthy","Maize leaf beetle",
    "Maize leaf blight","Maize leaf spot","Maize streak virus",
    "Tomato healthy","Tomato leaf blight","Tomato leaf curl",
    "Tomato septoria leaf spot","Tomato verticillium wilt",
]

DISEASE_INFO: Dict[str, Dict] = {
    "Tomato___Early_blight": {
        "cause_en":"Fungal infection (Alternaria solani) — excess moisture and warm temperatures cause spore germination on lower leaves.",
        "cause_kn":"ಶಿಲೀಂಧ್ರ ಸೋಂಕು (ಆಲ್ಟರ್ನೇರಿಯ ಸೋಲಾನಿ) — ಅಧಿಕ ತೇವಾಂಶ ಮತ್ತು ಬೆಚ್ಚನೆಯ ತಾಪಮಾನದಿಂದ ಕೆಳ ಎಲೆಗಳ ಮೇಲೆ ಶಿಲೀಂಧ್ರ ಹರಡುತ್ತದೆ.",
        "solution_en":"Apply Mancozeb @ 2.5 g/L every 7 days. Remove infected leaves. Improve air circulation. Avoid overhead irrigation.",
        "solution_kn":"ಮ್ಯಾಂಕೋಜೆಬ್ @ 2.5 g/L ಅನ್ನು 7 ದಿನಗಳಿಗೊಮ್ಮೆ ಸಿಂಪಡಿಸಿ. ಸೋಂಕಿತ ಎಲೆಗಳನ್ನು ತಕ್ಷಣ ತೆಗೆದು ಹಾಕಿ.",
        "organic_en":"Neem oil @ 5 ml/L + baking soda @ 5 g/L every 5 days. Remove lower infected leaves.",
        "severity":"Moderate",
    },
    "Tomato___Late_blight": {
        "cause_en":"Phytophthora infestans — spreads rapidly in cool, humid conditions (15-20°C, >90% humidity).",
        "cause_kn":"ಫೈಟೋಫ್ಥೋರಾ ಇನ್ಫೆಸ್ಟಾನ್ಸ್ — ತಂಪು ಮತ್ತು ಆರ್ದ್ರ ವಾತಾವರಣದಲ್ಲಿ ವೇಗವಾಗಿ ಹರಡುತ್ತದೆ.",
        "solution_en":"Apply Metalaxyl + Mancozeb. Destroy infected plants. Avoid overhead irrigation. Use resistant varieties.",
        "solution_kn":"ಮೆಟಾಲಾಕ್ಸಿಲ್ + ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪಡಿಸಿ. ಸೋಂಕಿತ ಸಸ್ಯಗಳನ್ನು ಸುಡಿ.",
        "organic_en":"Bordeaux mixture (1%) spray. Copper hydroxide 3g/L.", "severity":"Severe",
    },
    "Tomato___Bacterial_spot": {
        "cause_en":"Xanthomonas campestris bacteria — spread by rain splash and infected transplants.",
        "cause_kn":"ಕ್ಸ್ಯಾಂಥೋಮೋನಾಸ್ ಕ್ಯಾಂಪೆಸ್ಟ್ರಿಸ್ ಬ್ಯಾಕ್ಟೀರಿಯಾ — ಮಳೆ ಮತ್ತು ಸೋಂಕಿತ ನಾಟಿಗಳಿಂದ ಹರಡುತ್ತದೆ.",
        "solution_en":"Copper-based bactericide. Use pathogen-free seeds. Remove infected debris.",
        "solution_kn":"ತಾಮ್ರ ಆಧಾರಿತ ಬ್ಯಾಕ್ಟೀರಿಯಾನಾಶಕ ಸಿಂಪಡಿಸಿ.",
        "organic_en":"Copper soap spray. Avoid working in wet conditions.", "severity":"Moderate",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "cause_en":"Begomovirus transmitted by whitefly (Bemisia tabaci). Spreads quickly in warm dry weather.",
        "cause_kn":"ಬಿಳಿ ನೊಣ ಮೂಲಕ ಹರಡುವ ಬೆಗೋಮೋವೈರಸ್.",
        "solution_en":"Remove infected plants. Imidacloprid 0.3 ml/L for whitefly control. Install yellow sticky traps.",
        "solution_kn":"ಸೋಂಕಿತ ಸಸ್ಯ ನಾಶ ಮಾಡಿ. ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ 0.3 ml/L ಸಿಂಪಡಿಸಿ.",
        "organic_en":"Reflective silver mulch. Neem oil spray. Yellow sticky traps.", "severity":"Severe",
    },
    "Potato___Early_blight": {
        "cause_en":"Alternaria solani — worsened by stressed or ageing plants and warm humid weather.",
        "cause_kn":"ಆಲ್ಟರ್ನೇರಿಯ ಸೋಲಾನಿ — ದುರ್ಬಲ ಸಸ್ಯಗಳಲ್ಲಿ ತ್ವರಿತವಾಗಿ ಹರಡುತ್ತದೆ.",
        "solution_en":"Copper oxychloride or Mancozeb. Crop rotation. Remove affected leaves.",
        "solution_kn":"ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ ಅಥವಾ ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪಡಿಸಿ.",
        "organic_en":"Neem oil 5ml/L. Remove infected foliage promptly.", "severity":"Moderate",
    },
    "Potato___Late_blight": {
        "cause_en":"Phytophthora infestans — devastating in cool wet conditions.",
        "cause_kn":"ಫೈಟೋಫ್ಥೋರಾ ಇನ್ಫೆಸ್ಟಾನ್ಸ್ — ತಂಪು ಮತ್ತು ತೇವ ವಾತಾವರಣದಲ್ಲಿ ವಿನಾಶಕಾರಿ.",
        "solution_en":"Cymoxanil + Mancozeb. Destroy infected tubers. Use certified seed.",
        "solution_kn":"ಸಿಮೊಕ್ಸನಿಲ್ + ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪಡಿಸಿ.",
        "organic_en":"Bordeaux mixture spray weekly.", "severity":"Severe",
    },
    "Corn___Common_rust": {
        "cause_en":"Puccinia sorghi — favoured by moderate temperatures (16-23°C) and high relative humidity.",
        "cause_kn":"ಪಕ್ಸಿನಿಯ ಸೊರ್ಘಿ ಶಿಲೀಂಧ್ರ.",
        "solution_en":"Propiconazole or strobilurin fungicide. Plant resistant hybrid varieties.",
        "solution_kn":"ಪ್ರೊಪಿಕೊನಾಜೋಲ್ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಿ.",
        "organic_en":"Sulfur dust application in early stages.", "severity":"Moderate",
    },
    "Apple___Apple_scab": {
        "cause_en":"Venturia inaequalis — spores released during spring rains infect young leaves.",
        "cause_kn":"ವೆಂಟೂರಿಯಾ ಇನ್‌ಈಕ್ವಾಲಿಸ್ ಶಿಲೀಂಧ್ರ.",
        "solution_en":"Captan or Mancozeb before and after wet periods. Prune for air circulation.",
        "solution_kn":"ತೇವ ಅವಧಿ ಮೊದಲು ಮತ್ತು ನಂತರ ಕ್ಯಾಪ್ಟಾನ್ ಸಿಂಪಡಿಸಿ.",
        "organic_en":"Lime sulfur spray before green tip.", "severity":"Moderate",
    },
}

PEST_INFO: Dict[str, Dict] = {
    "Maize fall armyworm":{"solution_en":"Emamectin Benzoate 5% SG @ 0.4 g/L in the whorl. Pheromone traps at 5/acre.","solution_kn":"ಸ್ಪೈರಲ್‌ನಲ್ಲಿ ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಜೋಯೇಟ್ @ 0.4 g/L ಸಿಂಪಡಿಸಿ."},
    "Tomato leaf curl":{"solution_en":"Imidacloprid 17.8% SL @ 0.3 ml/L. Yellow sticky traps. Remove infected plants.","solution_kn":"ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ @ 0.3 ml/L ಸಿಂಪಡಿಸಿ. ಹಳದಿ ಅಂಟು ಬಲೆ ಹಾಕಿ."},
    "Cassava mosaic":{"solution_en":"Use virus-free stem cuttings. Rogue out infected plants. Neem oil @ 5 ml/L.","solution_kn":"ಪ್ರಮಾಣಿತ ಕಾಂಡ ತುಂಡು ಬಳಸಿ. ಸೋಂಕಿತ ಸಸ್ಯ ನಾಶ ಮಾಡಿ."},
    "Cashew anthracnose":{"solution_en":"Carbendazim 1g/L + Mancozeb 2g/L. Prune infected branches. Burn fallen fruit.","solution_kn":"ಕಾರ್ಬೆಂಡಾಜಿಮ್ + ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪಡಿಸಿ. ಬಿದ್ದ ಹಣ್ಣು ಸುಡಿ."},
}

IOT_CIRCUITS: Dict[str, Dict] = {
    "soil_moisture": {
        "title":"Soil Moisture Monitoring System",
        "simple_title":"ಮಣ್ಣಿನ ತೇವ ಅಳತೆ / Soil Moisture Monitor",
        "what_it_does_simple":"ನಿಮ್ಮ ಮಣ್ಣಿನಲ್ಲಿ ನೀರಿದೆಯೇ ಇಲ್ಲವೇ ಎಂದು ತಿಳಿಸುತ್ತದೆ. ನೀರು ಕಡಿಮೆಯಾದಾಗ ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಸಂದೇಶ ಕಳುಹಿಸುತ್ತದೆ. / Tells you if soil has enough water. Sends message to your phone when water is low.",
        "components":["Arduino Uno / ESP32 (microcontroller)","Capacitive Soil Moisture Sensor v2.0","16×2 LCD Display (I2C module)","Active Buzzer module","10 kΩ resistor","Jumper wires","5V power supply / USB"],
        "components_simple":["Arduino — the 'brain' (₹500)","Soil sensor — put in ground (₹250)","Small screen — shows readings (₹150)","Buzzer — makes alert sound (₹50)","Connecting wires (₹50)"],
        "circuit_desc":"VCC/GND of sensor → 3.3V & GND on board. Signal pin → A0. LCD via I2C (SDA→A4, SCL→A5). Buzzer → D8 with 10kΩ pull-down.",
        "steps_simple":["1. ಸೆನ್ಸರ್ ಅನ್ನು ಮಣ್ಣಿನಲ್ಲಿ ꝋ5 cm ಆಳಕ್ಕೆ ಅಳವಡಿಸಿ / Push sensor 5cm into soil","2. ಕೇಬಲ್ ಅನ್ನು Arduino ಗೆ ಸೇರಿಸಿ (A0 ಪಿನ್) / Connect cable to Arduino A0 pin","3. Arduino ಅನ್ನು USB ಮೂಲಕ ಚಾರ್ಜರ್‌ಗೆ ಸಂಪರ್ಕಿಸಿ / Connect Arduino to charger via USB","4. ಅಪ್ಲಿಕೇಶನ್ ಮೂಲಕ ನಿಮ್ಮ Wi-Fi ಮಾಹಿತಿ ನಮೂದಿಸಿ / Enter Wi-Fi details in app"],
        "code_snippet":"int raw = analogRead(A0);\nfloat pct = map(raw,0,1023,100,0);\nif(pct<30){digitalWrite(8,HIGH);} // alert",
        "technologies":["Arduino IDE","Blynk IoT App","ThingSpeak","MQTT + Node-RED"],
        "cost_inr":"₹800 – ₹1,500",
        "difficulty":"Beginner",
        "rural_friendly":True,
    },
    "weather_station": {
        "title":"Field Microclimate Weather Station",
        "simple_title":"ಹೊಲ ಹವಾಮಾನ ಕೇಂದ್ರ / Farm Weather Station",
        "what_it_does_simple":"ನಿಮ್ಮ ಹೊಲದ ನಿಜವಾದ ತಾಪಮಾನ, ತೇವಾಂಶ, ಮತ್ತು ಮಳೆ ಅಳೆಯುತ್ತದೆ. ಶಿಲೀಂಧ್ರ ಅಪಾಯ ಇದ್ದಾಗ ಎಚ್ಚರಿಸುತ್ತದೆ. / Measures your field's exact temperature, humidity, and rainfall. Warns when fungal disease risk is high.",
        "components":["ESP32 / Raspberry Pi Zero W","DHT22 Temperature & Humidity Sensor","BMP280 Barometric Pressure Sensor","Tipping-bucket Rain Gauge","Anemometer (wind speed)","Solar Panel 5W + TP4056 Charger","18650 Li-Ion Battery 3500 mAh"],
        "components_simple":["ESP32 — mini computer (₹600)","DHT22 — temperature+humidity sensor (₹180)","Rain gauge — measures rainfall (₹800)","Solar panel — free power from sun (₹500)","Battery — stores energy (₹200)"],
        "circuit_desc":"DHT22 DATA → GPIO4. BMP280 I2C: SDA → GPIO21, SCL → GPIO22. Rain gauge pulse → GPIO34 (interrupt). Solar → TP4056 → 18650 → ESP32 5V.",
        "steps_simple":["1. ಸೋಲಾರ್ ಪ್ಯಾನೆಲ್ ಅನ್ನು ಮರದ ಕಂಬಕ್ಕೆ ಜೋಡಿಸಿ / Attach solar panel to wooden pole","2. DHT22 ಸೆನ್ಸರ್ ಅನ್ನು ನೆರಳಿನಲ್ಲಿ ಇರಿಸಿ / Place DHT22 in shade","3. ಮಳೆ ಅಳಕ ಅನ್ನು ತೆರೆದ ಜಾಗದಲ್ಲಿ ಇರಿಸಿ / Place rain gauge in open area","4. ESP32 ಅನ್ನು Wi-Fi ಗೆ ಸಂಪರ್ಕಿಸಿ ಮತ್ತು Blynk app ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ / Connect ESP32 to Wi-Fi and download Blynk app"],
        "code_snippet":"#include <DHT.h>\nDHT dht(4,DHT22);\nvoid loop(){\n  float t=dht.readTemperature();\n  float h=dht.readHumidity();\n  if(h>85) sendWhatsAppAlert();\n  delay(600000);\n}",
        "technologies":["Arduino IDE / MicroPython","MQTT + Mosquitto","Blynk IoT App","Intellivor Dashboard"],
        "cost_inr":"₹2,500 – ₹4,000",
        "difficulty":"Intermediate",
        "rural_friendly":True,
    },
    "auto_irrigation": {
        "title":"Automated Drip Irrigation Controller",
        "simple_title":"ಸ್ವಯಂ ನೀರಾವರಿ ವ್ಯವಸ್ಥೆ / Auto Irrigation System",
        "what_it_does_simple":"ಮಣ್ಣು ಒಣಗಿದಾಗ ತಾನೇ ನೀರು ಬಿಡುತ್ತದೆ. ನೀರು ತುಂಬಿದಾಗ ತಾನೇ ನಿಲ್ಲಿಸುತ್ತದೆ. 30-40% ನೀರು ಉಳಿತಾಯ. / Opens water valve when soil is dry, closes when full. Saves 30-40% water.",
        "components":["ESP8266 NodeMCU v3","4-Channel 5V Relay Module","12V Solenoid Valves ×4","Capacitive Moisture Sensors ×4","CD4051 Multiplexer","YF-S201 Flow Meter","12V DC Water Pump"],
        "components_simple":["ESP8266 — controller (₹300)","Relay module — controls pump (₹180)","Solenoid valve — water tap (₹400 each)","Moisture sensors ×4 — (₹250 each)","Water pump — (₹500)"],
        "circuit_desc":"Relay IN1-IN4 → GPIO5,4,14,12. Moisture sensors → CD4051 → A0. Flow meter → GPIO2 (interrupt). Pump via L298N driver.",
        "steps_simple":["1. ಮಣ್ಣಿನ ಸೆನ್ಸರ್‌ಗಳನ್ನು ಪ್ರತಿ ಸಾಲಿನ ನಡುವೆ ಅಳವಡಿಸಿ / Install sensors between crop rows","2. ಸೋಲಿನಾಯ್ಡ್ ಕವಾಟವನ್ನು ನೀರಿನ ಪೈಪ್‌ಗೆ ಸೇರಿಸಿ / Connect solenoid valve to water pipe","3. ರಿಲೇ ಮಾಡ್ಯೂಲ್ ಅನ್ನು ESP8266 ಗೆ ಸಂಪರ್ಕಿಸಿ / Connect relay module to ESP8266","4. Blynk app ಮೂಲಕ ತೇವಾಂಶ ಮಿತಿ ಹೊಂದಿಸಿ / Set moisture threshold via Blynk app"],
        "code_snippet":"const float THRESHOLD=30.0;\nvoid checkZone(int z){\n  float m=readMoisture(z);\n  if(m<THRESHOLD){\n    openValve(z); delay(120000); closeValve(z);\n  }\n}",
        "technologies":["Arduino IDE","Blynk IoT App","IFTTT","Intellivor WhatsApp Alerts"],
        "cost_inr":"₹3,500 – ₹6,000",
        "difficulty":"Intermediate",
        "rural_friendly":True,
    },
    "pest_trap": {
        "title":"Smart Pheromone Pest Trap with Camera",
        "simple_title":"ಸ್ಮಾರ್ಟ್ ಕೀಟ ಬಲೆ / Smart Pest Trap",
        "what_it_does_simple":"ಕೀಟಗಳು ಬಲೆಯಲ್ಲಿ ಬಿದ್ದಾಗ ಫೋಟೋ ತೆಗೆದು AI ಮೂಲಕ ಗುರುತಿಸುತ್ತದೆ. ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಕೀಟ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸುತ್ತದೆ. / Takes photo when pest enters trap, AI identifies it, sends alert to your phone.",
        "components":["Raspberry Pi Camera Module v2","Raspberry Pi Zero W","PIR Motion Sensor HC-SR501","IR LED Array (850nm)","GSM SIM800L Module","Solar + Battery Pack 10000mAh","Pheromone capsule dispenser housing"],
        "components_simple":["Raspberry Pi Zero — mini computer (₹1,500)","Camera module — takes insect photos (₹1,200)","Motion sensor — detects insects (₹80)","SIM module — sends SMS alerts (₹400)","Solar+battery pack — field power (₹2,000)"],
        "circuit_desc":"Camera → RPi CSI connector. PIR OUT → GPIO18. IR LED → GPIO23 (PWM via transistor). SIM800L TXD → GPIO15, RXD → GPIO14.",
        "steps_simple":["1. ಕ್ಯಾಮೆರಾ ಅನ್ನು Raspberry Pi ಗೆ ಸೇರಿಸಿ / Connect camera to Raspberry Pi","2. PIR ಸೆನ್ಸರ್ ಅನ್ನು ಬಲೆ ಮೇಲ್ಭಾಗದಲ್ಲಿ ಅಳವಡಿಸಿ / Mount PIR sensor on trap top","3. SIM ಕಾರ್ಡ್ ಹಾಕಿ SMS ಸಂಖ್ಯೆ ಹೊಂದಿಸಿ / Insert SIM card and set alert number","4. ಫೆರೋಮೋನ್ ಕ್ಯಾಪ್ಸ್ಯೂಲ್ ಅನ್ನು ಬಲೆ ಒಳಗೆ ಇರಿಸಿ / Place pheromone capsule inside trap"],
        "code_snippet":"import RPi.GPIO as GPIO\nimport picamera\nGPIO.setup(18,GPIO.IN)\nif GPIO.input(18):\n  camera.capture('pest.jpg')\n  upload_to_intellivor('pest.jpg')\n  send_sms_alert()",
        "technologies":["Python (picamera)","TensorFlow Lite","Twilio SMS","Intellivor API","Node-RED"],
        "cost_inr":"₹6,000 – ₹9,000",
        "difficulty":"Intermediate",
        "rural_friendly":False,
    },
    "leaf_sensor": {
        "title":"Leaf Wetness & Disease Risk Sensor",
        "simple_title":"ಎಲೆ ತೇವ ಮತ್ತು ರೋಗ ಅಪಾಯ ಸೆನ್ಸರ್ / Leaf Wetness Sensor",
        "what_it_does_simple":"ಎಲೆ ಎಷ್ಟು ತೇವವಾಗಿದೆ ಎಂದು ಅಳೆಯುತ್ತದೆ. ಶಿಲೀಂಧ್ರ ರೋಗ ಅಪಾಯ ಇದ್ದಾಗ ಮುಂಚಿತವಾಗಿ ಎಚ್ಚರಿಸುತ್ತದೆ. / Measures how wet leaves are. Warns early when fungal disease risk is high.",
        "components":["ESP32 development board","Leaf Wetness Sensor (LWS-1)","DHT22 Temperature/Humidity Sensor","MicroSD Card Module (for offline logging)","LoRa SX1278 Module (for long range)","Solar panel + LiPo battery"],
        "components_simple":["ESP32 — controller (₹600)","Leaf wetness sensor (₹350)","DHT22 — temperature sensor (₹180)","LoRa module — 2km range (₹350)","Solar panel + battery (₹700)"],
        "circuit_desc":"LWS SIGNAL → GPIO34 (ADC). DHT22 → GPIO4. LoRa: NSS → GPIO5, MOSI → GPIO23, MISO → GPIO19, SCK → GPIO18.",
        "steps_simple":["1. ಸೆನ್ಸರ್ ಅನ್ನು ಬೆಳೆ ಎಲೆ ಮಟ್ಟದಲ್ಲಿ ಇರಿಸಿ / Place sensor at crop canopy level","2. LoRa ಆಂಟೆನಾ ಅನ್ನು ಮೇಲ್ಭಾಗಕ್ಕೆ ಚಾಚಿ / Point LoRa antenna upward","3. ಸೋಲಾರ್ ಪ್ಯಾನೆಲ್ ಅನ್ನು ಸೂರ್ಯನ ಕಡೆ ಇರಿಸಿ / Face solar panel toward sun","4. Gateway ನಿಂದ ಡೇಟಾ Intellivor dashboard ಗೆ ಸ್ವಯಂ ಕಳುಹಿಸಲಾಗುತ್ತದೆ / Data auto-sends to Intellivor dashboard"],
        "code_snippet":"float lws=analogRead(34)/4095.0*100;\nfloat temp=dht.readTemperature();\nfloat hum=dht.readHumidity();\nif(lws>70&&hum>80) sendFungalAlert();\nLoRa.write(lws); LoRa.write(temp);",
        "technologies":["Arduino IDE","LoRaWAN / TTN","Grafana","Intellivor API"],
        "cost_inr":"₹2,000 – ₹3,500",
        "difficulty":"Beginner",
        "rural_friendly":True,
    },
    "drone_sprayer": {
        "title":"Drone-Assisted Crop Spraying System",
        "simple_title":"ಡ್ರೋನ್ ಸಿಂಪಡಿಕೆ ವ್ಯವಸ್ಥೆ / Drone Sprayer",
        "what_it_does_simple":"ಡ್ರೋನ್ ಮೂಲಕ ಹೊಲಕ್ಕೆ ಕ್ರಿಮಿನಾಶಕ ಅಥವಾ ರಸಗೊಬ್ಬರ ಸಿಂಪಡಿಸಬಹುದು. ಕಷ್ಟದ ಭೂಮಿ ಮತ್ತು ದೊಡ್ಡ ಹೊಲಕ್ಕೆ ಸೂಕ್ತ. / Spray pesticide/fertilizer using drone. Ideal for hilly terrain and large farms.",
        "components":["F450 Quadcopter Frame","Pixhawk Flight Controller","4× BLDC Motors + ESCs","1L Spray Tank + Pump","GPS Module (NEO-M8N)","RC Transmitter/Receiver (10ch)","LiPo Battery 6S 10000mAh"],
        "components_simple":["ಡ್ರೋನ್ ಫ್ರೇಮ್ (₹2,500)","ಫ್ಲೈಟ್ ಕಂಟ್ರೋಲರ್ (₹3,500)","4 ಮೋಟರ್‌ಗಳು (₹4,000)","ಸ್ಪ್ರೇ ಟ್ಯಾಂಕ್ + ಪಂಪ್ (₹1,500)","GPS ಮಾಡ್ಯೂಲ್ (₹1,200)","ಬ್ಯಾಟರಿ (₹3,000)"],
        "circuit_desc":"Pixhawk MAIN OUT 1-4 → ESC signal. GPS TX → TELEM1 RX. Spray pump → AUX1 via relay. RC receiver → RCIN. Battery → Power module → Pixhawk.",
        "steps_simple":["1. Frame ಜೋಡಿಸಿ Motors ಸ್ಕ್ರೂ ಮಾಡಿ / Assemble frame and screw motors","2. Pixhawk ಅನ್ನು ಮಧ್ಯಭಾಗಕ್ಕೆ ಜೋಡಿಸಿ / Mount Pixhawk at center","3. Mission Planner ಮೂಲಕ ಹೊಲ ಸ್ಕ್ಯಾನ್ ಮಾರ್ಗ ಹೊಂದಿಸಿ / Set field scan path via Mission Planner","4. ಮೊದಲ ಹಾರಾಟ ತೆರೆದ ಜಾಗದಲ್ಲಿ ಅಭ್ಯಾಸ ಮಾಡಿ / Practice first flight in open area"],
        "code_snippet":"# Mission Planner / ArduPilot\n# Auto spray route: set waypoints\n# at 3m height, 5m/s speed\n# Trigger spray pump at GPIO AUX1\n# every 2m overlap for full coverage",
        "technologies":["ArduPilot / PX4","Mission Planner","QGroundControl","Intellivor NDVI Map"],
        "cost_inr":"₹18,000 – ₹28,000",
        "difficulty":"Advanced",
        "rural_friendly":False,
    },
}

FERT_RULES: Dict[tuple, Dict] = {
    ("Rice","Loamy"):      {"fertilizer":"NPK 17-17-17 @ 100 kg/acre + Urea 50 kg at tillering","dose_schedule":"Apply in 3 splits: basal, tillering, panicle"},
    ("Rice","Clay"):       {"fertilizer":"DAP 50 kg/acre + Urea 40 kg","dose_schedule":"Basal + top dress at tillering"},
    ("Rice","Sandy"):      {"fertilizer":"NPK 20-20-0 @ 80 kg/acre + MOP 25 kg","dose_schedule":"Split: 50% basal, 50% at 30 DAS"},
    ("Wheat","Loamy"):     {"fertilizer":"NPK 12-32-16 @ 80 kg/acre + Urea 60 kg","dose_schedule":"Basal + crown root initiation"},
    ("Wheat","Sandy"):     {"fertilizer":"NPK 20-20-0 @ 80 kg/acre + MOP 20 kg","dose_schedule":"Basal + first irrigation"},
    ("Tomato","Loamy"):    {"fertilizer":"NPK 19-19-19 @ 50 kg/acre + Calcium Nitrate 25 kg","dose_schedule":"Weekly fertigation through drip"},
    ("Tomato","Clay"):     {"fertilizer":"NPK 13-0-46 @ 40 kg/acre + DAP 30 kg","dose_schedule":"Basal DAP + weekly K fertigation"},
    ("Maize","Black Cotton"):{"fertilizer":"NPK 14-35-14 @ 100 kg/acre + Zinc Sulfate 10 kg","dose_schedule":"Basal + V6 stage top dress"},
    ("Cotton","Black Cotton"):{"fertilizer":"NPK 20-10-10 @ 100 kg/acre + Boron 2 kg","dose_schedule":"Basal + 45 DAS + 70 DAS"},
    ("Ragi","Red Laterite"):{"fertilizer":"NPK 10-26-26 @ 100 kg/acre + Urea 30 kg","dose_schedule":"Basal dose only"},
    ("Sugarcane","Loamy"): {"fertilizer":"NPK 17-17-17 @ 150 kg/acre + FYM 10 tonnes","dose_schedule":"3 splits over 6 months"},
}

CROP_COEFF: Dict[str, Dict] = {
    "Rice":{"base":4.5,"t":0.040,"r":0.006,"h":0.010},
    "Wheat":{"base":4.0,"t":0.030,"r":0.005,"h":0.008},
    "Maize":{"base":5.0,"t":0.050,"r":0.007,"h":0.009},
    "Tomato":{"base":25.0,"t":0.100,"r":0.020,"h":0.030},
    "Cotton":{"base":2.5,"t":0.050,"r":0.003,"h":0.006},
    "Ragi":{"base":3.2,"t":0.030,"r":0.008,"h":0.010},
    "Sugarcane":{"base":60.0,"t":0.200,"r":0.050,"h":0.040},
}
SOIL_MUL: Dict[str, float] = {
    "Loamy":1.10,"Black Cotton":1.15,"Clay":0.95,"Sandy":0.85,"Silt":1.05,"Red Laterite":0.90,
}

STATIC_PRICES = [
    {"commodity":"Rice","price":2280,"unit":"₹/quintal","trend":"+2.1%","exchange":"APMC Bangalore"},
    {"commodity":"Wheat","price":2150,"unit":"₹/quintal","trend":"+0.5%","exchange":"APMC Kolar"},
    {"commodity":"Maize","price":1920,"unit":"₹/quintal","trend":"-1.2%","exchange":"APMC Mysore"},
    {"commodity":"Tomato","price":1640,"unit":"₹/quintal","trend":"+5.8%","exchange":"APMC Bangalore"},
    {"commodity":"Onion","price":1380,"unit":"₹/quintal","trend":"-0.8%","exchange":"APMC Hassan"},
    {"commodity":"Cotton","price":6200,"unit":"₹/quintal","trend":"+1.3%","exchange":"APMC Dharwad"},
    {"commodity":"Ragi","price":3846,"unit":"₹/quintal","trend":"+0.9%","exchange":"APMC Mandya"},
    {"commodity":"Jowar","price":3180,"unit":"₹/quintal","trend":"-0.5%","exchange":"APMC Bidar"},
    {"commodity":"Groundnut","price":5850,"unit":"₹/quintal","trend":"+2.8%","exchange":"APMC Chitradurga"},
    {"commodity":"Sunflower","price":6760,"unit":"₹/quintal","trend":"+1.5%","exchange":"APMC Bellary"},
]

# ── Shop product catalog ───────────────────────────────────────────────────────
SHOP_PRODUCTS = [
    {"id":"P001","category":"Seeds","name":"BPT-5204 (Sona Masuri) Rice Seed","name_kn":"BPT-5204 (ಸೋನಾ ಮಸೂರಿ) ಭತ್ತದ ಬೀಜ","description":"Certified high-yield Sona Masuri rice seed, suitable for Karnataka conditions","price":120,"unit":"per kg","min_qty":5,"max_qty":200,"in_stock":True,"image":"🌾","brand":"KSRSAC Certified","subsidy_available":True},
    {"id":"P002","category":"Seeds","name":"Tomato Hybrid F1 Seed","name_kn":"ಟೊಮೇಟೊ ಹೈಬ್ರಿಡ್ F1 ಬೀಜ","description":"High disease resistance, 45-50 tons/ha yield potential","price":350,"unit":"per 10g packet","min_qty":1,"max_qty":50,"in_stock":True,"image":"🍅","brand":"Seminis","subsidy_available":False},
    {"id":"P003","category":"Seeds","name":"Maize DHM-117 Hybrid Seed","name_kn":"ಮೆಕ್ಕೆಜೋಳ DHM-117 ಹೈಬ್ರಿಡ್ ಬೀಜ","description":"Fall armyworm tolerant, 8-10 tonnes/acre potential","price":280,"unit":"per kg","min_qty":2,"max_qty":100,"in_stock":True,"image":"🌽","brand":"Pioneer","subsidy_available":True},
    {"id":"P004","category":"Fertilizer","name":"NPK 17-17-17 Complex Fertilizer","name_kn":"NPK 17-17-17 ಸಂಯುಕ್ತ ಗೊಬ್ಬರ","description":"Balanced nitrogen, phosphorus and potassium for all crops","price":1200,"unit":"per 50kg bag","min_qty":1,"max_qty":20,"in_stock":True,"image":"💊","brand":"IFFCO","subsidy_available":True},
    {"id":"P005","category":"Fertilizer","name":"DAP (Di-ammonium Phosphate)","name_kn":"DAP ಡೈ-ಅಮೋನಿಯಂ ಫಾಸ್ಫೇಟ್","description":"High phosphorus fertilizer for sowing. Standard for most Karnataka crops","price":1350,"unit":"per 50kg bag","min_qty":1,"max_qty":20,"in_stock":True,"image":"🌱","brand":"IFFCO","subsidy_available":True},
    {"id":"P006","category":"Pesticide","name":"Mancozeb 75% WP Fungicide","name_kn":"ಮ್ಯಾಂಕೋಜೆಬ್ 75% ಶಿಲೀಂಧ್ರನಾಶಕ","description":"Broad-spectrum fungicide for blight, rust, and leaf spot diseases","price":280,"unit":"per 500g","min_qty":1,"max_qty":20,"in_stock":True,"image":"🧪","brand":"Dhanuka","subsidy_available":False},
    {"id":"P007","category":"Pesticide","name":"Imidacloprid 17.8% SL Insecticide","name_kn":"ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ 17.8% ಕ್ರಿಮಿನಾಶಕ","description":"Controls sucking pests, whiteflies, aphids on all crops","price":320,"unit":"per 250ml","min_qty":1,"max_qty":20,"in_stock":True,"image":"🐜","brand":"Bayer","subsidy_available":False},
    {"id":"P008","category":"IoT","name":"Capacitive Soil Moisture Sensor Kit","name_kn":"ಮಣ್ಣಿನ ತೇವ ಸೆನ್ಸರ್ ಕಿಟ್","description":"Complete kit with Arduino Uno, sensor, LCD, jumper wires and USB cable","price":1299,"unit":"per kit","min_qty":1,"max_qty":10,"in_stock":True,"image":"🔌","brand":"Intellivor Kit","subsidy_available":False},
    {"id":"P009","category":"IoT","name":"ESP32 + DHT22 Weather Station Kit","name_kn":"ESP32 + DHT22 ಹವಾಮಾನ ಕೇಂದ್ರ ಕಿಟ್","description":"Complete weather monitoring kit with solar panel, pre-programmed","price":2899,"unit":"per kit","min_qty":1,"max_qty":5,"in_stock":True,"image":"🌡️","brand":"Intellivor Kit","subsidy_available":False},
    {"id":"P010","category":"Equipment","name":"Hand-Held Leaf Spray Pump (16L)","name_kn":"ಕೈ ಹಿಡಿ ಸ್ಪ್ರೇ ಪಂಪ್ (16L)","description":"Manual knapsack sprayer, chemical resistant, 1.5m wand","price":850,"unit":"per unit","min_qty":1,"max_qty":5,"in_stock":True,"image":"💦","brand":"Aspee","subsidy_available":False},
    {"id":"P011","category":"Equipment","name":"Digital Soil NPK Test Kit","name_kn":"ಡಿಜಿಟಲ್ ಮಣ್ಣು NPK ಪರೀಕ್ಷಾ ಕಿಟ್","description":"Test soil nitrogen, phosphorus, potassium in 5 minutes at home","price":1499,"unit":"per kit (30 tests)","min_qty":1,"max_qty":5,"in_stock":True,"image":"🧪","brand":"Soilens","subsidy_available":False},
]

# ══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ══════════════════════════════════════════════════════════════════════════════
_engine  = create_engine(DB_URL, connect_args={"check_same_thread":False} if "sqlite" in DB_URL else {})
_Session = sessionmaker(bind=_engine, autoflush=False, autocommit=False)
Base     = declarative_base()

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    phone         = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role          = Column(String, default="farmer")
    region        = Column(String, nullable=True)
    village       = Column(String, nullable=True)
    land_acres    = Column(Float, nullable=True)
    crops         = Column(String, nullable=True)
    lang          = Column(String, default="en")
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

class ScanRecord(Base):
    __tablename__ = "scans"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=True)
    scan_type  = Column(String)
    filename   = Column(String)
    result     = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunityPost(Base):
    __tablename__ = "community_posts"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=True)
    author     = Column(String)
    role       = Column(String, default="farmer")
    region     = Column(String, nullable=True)
    body       = Column(Text)
    tag        = Column(String, default="General")
    likes      = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MarketListing(Base):
    __tablename__ = "market_listings"
    id           = Column(Integer, primary_key=True, index=True)
    agent_id     = Column(Integer, nullable=True)
    agent_name   = Column(String)
    crop         = Column(String)
    quantity_kg  = Column(Float)
    price_per_qt = Column(Float)
    market       = Column(String)
    region       = Column(String, nullable=True)
    contact      = Column(String, nullable=True)
    is_buying    = Column(Boolean, default=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, nullable=True)
    user_name      = Column(String)
    user_phone     = Column(String)
    user_address   = Column(Text)
    items          = Column(Text)  # JSON: [{product_id, name, qty, price}]
    total_amount   = Column(Float)
    payment_method = Column(String, default="cod")  # cod | upi | razorpay
    payment_status = Column(String, default="pending")  # pending | paid | failed
    order_status   = Column(String, default="placed")  # placed | processing | shipped | delivered | cancelled
    razorpay_order_id = Column(String, nullable=True)
    notes          = Column(Text, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=_engine)

def get_db():
    db = _Session()
    try: yield db
    finally: db.close()

# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════
_security = HTTPBearer(auto_error=False)

def _hash(pw:str)->str: return _pwd_ctx.hash(pw) if BCRYPT_OK else hashlib.sha256(pw.encode()).hexdigest()
def _verify(plain:str,hashed:str)->bool: return _pwd_ctx.verify(plain,hashed) if BCRYPT_OK else hashlib.sha256(plain.encode()).hexdigest()==hashed
def _make_token(data:dict)->str:
    p={**data,"exp":datetime.utcnow()+timedelta(minutes=TOKEN_EXPIRE_M)}
    return jwt.encode(p,SECRET_KEY,algorithm=ALGORITHM) if JWT_OK else json.dumps(p)
def _decode_token(token:str)->dict:
    if JWT_OK: return jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
    return json.loads(token)

def _get_current_user(creds:Optional[HTTPAuthorizationCredentials]=Depends(_security), db:Session=Depends(get_db))->Optional[User]:
    if not creds: return None
    try:
        payload=_decode_token(creds.credentials)
        uid=payload.get("sub")
        if uid is None: return None
        return db.query(User).filter(User.id==int(uid)).first()
    except: return None

def _require_user(user:Optional[User]=Depends(_get_current_user))->User:
    if not user: raise HTTPException(status_code=401,detail="Authentication required")
    return user

def _require_agent(user:User=Depends(_require_user))->User:
    if user.role not in ("market_agent","admin"): raise HTTPException(status_code=403,detail="Market agent access required")
    return user

# ══════════════════════════════════════════════════════════════════════════════
# ML MODELS
# ══════════════════════════════════════════════════════════════════════════════
_disease_model: Optional[nn.Module] = None
_pest_model:    Optional[nn.Module] = None
_fert_model:    Any = None
_fert_encoders: Any = None

def _build_legacy_cnn(n:int)->nn.Module:
    return nn.Sequential(
        nn.Conv2d(3,16,3),nn.ReLU(),nn.MaxPool2d(2),
        nn.Conv2d(16,32,3),nn.ReLU(),nn.MaxPool2d(2),
        nn.Flatten(),nn.Linear(32*30*30,128),nn.ReLU(),nn.Linear(128,n),
    )

def _load_state(model:nn.Module,*candidates:Path)->bool:
    for p in candidates:
        if p.exists():
            try: model.load_state_dict(torch.load(p,map_location="cpu")); log.info("Loaded %s",p); return True
            except Exception as e: log.warning("Load failed %s: %s",p,e)
    return False

def _load_models():
    global _disease_model,_pest_model,_fert_model,_fert_encoders
    _disease_model=_build_legacy_cnn(NUM_DISEASE)
    _load_state(_disease_model,MODEL_DIR/"disease_model.pth",Path("disease_model.pth"))
    _disease_model.eval()
    _pest_model=_build_legacy_cnn(NUM_PEST)
    _load_state(_pest_model,MODEL_DIR/"pest_model.pth",Path("pest_model.pth"))
    _pest_model.eval()
    for mp,ep in [(MODEL_DIR/"fertilizer_model.pkl",MODEL_DIR/"fertilizer_encoders.pkl"),(Path("fertilizer_model.pkl"),Path("fertilizer_encoders.pkl"))]:
        if mp.exists() and ep.exists():
            try: _fert_model=joblib.load(mp); _fert_encoders=joblib.load(ep); break
            except: pass

_img_transform=T.Compose([T.Resize((128,128)),T.ToTensor(),T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
_iso=IsolationForest(contamination=0.2,random_state=42)
_iso.fit(np.array([[20,15,6,2022],[50,18,8,2021],[100,20,10,2020],[30,16,7,2023]]))

# ══════════════════════════════════════════════════════════════════════════════
# COHERE CLIENT (primary chatbot)
# ══════════════════════════════════════════════════════════════════════════════
_cohere_client: Optional[Any] = None
if COHERE_OK and COHERE_KEY:
    try:
        _cohere_client = _cohere.Client(api_key=COHERE_KEY)
        log.info("Cohere client ready")
    except Exception as e:
        log.warning("Cohere init failed: %s", e)

# Anthropic client for agent pipeline
_claude: Optional[Any] = None
if ANTHROPIC_OK and ANTHROPIC_KEY:
    try:
        _claude = _anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        log.info("Anthropic client ready (agents)")
    except Exception as e:
        log.warning("Anthropic init failed: %s", e)

# ══════════════════════════════════════════════════════════════════════════════
# COHERE CHATBOT PREAMBLE
# ══════════════════════════════════════════════════════════════════════════════
_COHERE_PREAMBLE = """You are Intellivor, a friendly and expert AI farming assistant for Indian farmers, especially in Karnataka.

You specialise in:
- Crop disease identification: cause, symptoms, organic AND chemical treatment
- Pest management: identification, thresholds, IPM strategies  
- Soil health and fertilizer recommendations for Karnataka soil types
- NDVI interpretation and satellite crop monitoring
- Irrigation scheduling and water management
- Weather impact on crops (monsoon, fungal risk, frost)
- Market prices, MSP, APMC rates across Karnataka districts
- IoT solutions for farming: sensor circuits, Arduino/ESP32, automation (explain simply)
- Government schemes: PM-KISAN, PMFBY, KCC, PMKSY, RKVY
- Product ordering for seeds, fertilizers, equipment
- Rural farmer guidance: explain technology in simple words with local examples

Guidelines:
- Use simple language suitable for rural farmers who may not have technical background
- When explaining IoT: say "it works like..." and compare to something familiar (mobile phone, radio)
- For disease/pest: always state cause + symptom + simple treatment in 3-4 sentences
- For government schemes: give the website, helpline number, and exact amount
- If farmer writes in Kannada (ಕನ್ನಡ), reply in Kannada
- Be warm, encouraging, and supportive — farming is hard work
- Responses: 2-4 sentences for simple questions, up to 8 sentences for complex IoT/disease queries"""

_FALLBACK_RULES = [
    (["blight","fungal","mold","rot","ಶಿಲೀಂಧ್ರ"],"Fungal diseases like blight are treated with Mancozeb 2.5 g/L or copper-based fungicides, applied every 7 days. Remove infected leaves, improve drainage, and avoid overhead irrigation. Organic option: neem oil @ 5 ml/L every 5 days. Act within 48 hours of noticing symptoms."),
    (["ndvi","satellite","vegetation","ಎನ್ ಡಿ ವಿ ಐ"],"NDVI measures crop health: above 0.6 = excellent (dark green), 0.4–0.6 = healthy, 0.2–0.4 = moderate stress (needs attention), below 0.2 = severe stress (urgent action). Think of it like a health score — higher is better. Low NDVI usually means poor irrigation, nutrient deficiency, or disease. Upload your satellite image to get a detailed analysis."),
    (["fertilizer","npk","urea","nitrogen","ಗೊಬ್ಬರ"],"For most Karnataka rice crops: apply NPK 17-17-17 @ 100 kg/acre as base dose at sowing. Top-dress with Urea 50 kg/acre at tillering (30 DAS). Add Zinc Sulfate 10 kg/acre to prevent deficiency. Always do a soil test first for best results — it costs only ₹200-500 at any Krishi Vigyan Kendra."),
    (["weather","rain","temperature","humidity","ಮಳೆ","ತಾಪಮಾನ"],"High humidity (>80%) increases fungal disease risk — avoid pesticide spraying during rain or strong wind. Most fungal pathogens thrive at 20–30°C. The best time to spray is early morning (6-8 AM) or late evening. Check the Weather page for daily crop risk advisory for your district."),
    (["price","market","sell","msp","ಬೆಲೆ","ಮಾರುಕಟ್ಟೆ"],"MSP for rice 2024-25 is ₹2,183/quintal; wheat ₹2,275/quintal. Sell through APMC or your registered FPO to get better prices. Visit the Marketplace section to check buyer offers in your district. For MSP procurement, register at farmers.gov.in or contact your nearest Agriculture Department office."),
    (["iot","sensor","arduino","esp32","circuit","ಸರ್ಕ್ಯೂಟ್","ಸೆನ್ಸರ್"],"IoT for farming is like giving your field a mobile phone — the sensors are the eyes and ears, Arduino/ESP32 is the brain, and Wi-Fi sends the data to your phone. A basic soil moisture sensor kit costs ₹800-1,500 and sends WhatsApp alerts when your crop needs water. Visit the IoT Guide section for step-by-step setup in simple language."),
    (["yield","harvest","production","ಇಳುವರಿ"],"Rice yield in Karnataka typically ranges 3–5 tonnes/acre with good management. Key factors: right certified variety (IR-64, BPT-5204), timely transplanting at 20-25 days, balanced NPK, integrated pest management. Use the Yield Prediction tool for a personalised forecast based on your conditions."),
    (["pm-kisan","pmfby","kcc","insurance","loan","scheme","ಯೋಜನೆ"],"PM-KISAN: ₹6,000/year in 3 instalments for all farmer landholders — register at pmkisan.gov.in or call 155261. PMFBY crop insurance: 1.5–2% premium of sum insured — apply at your nearest bank before sowing. KCC (Kisan Credit Card): up to ₹3 lakh at 4% interest — apply at any nationalised bank with land documents."),
    (["buy","order","shop","purchase","seeds","ಬೀಜ","ಕೊಳ್ಳಿ"],"You can buy certified seeds, fertilizers, IoT kits and farm equipment directly from the Intellivor Shop. We offer government-certified seeds, IFFCO fertilizers, and pre-programmed IoT kits. Visit the Shop section — Cash on Delivery (COD) is available for rural areas."),
    (["ಕನ್ನಡ","karnataka","ಕರ್ನಾಟಕ"],"ನಮಸ್ಕಾರ! ನಾನು ಐವರ ಕೃಷಿ AI. ಬೆಳೆ ರೋಗ, ಗೊಬ್ಬರ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ನೀರಾವರಿ, IoT ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆ — ಯಾವುದರ ಬಗ್ಗೆ ಸಹಾಯ ಬೇಕು? ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ಸಮಸ್ಯೆ ಹೇಳಿ."),
]

# ══════════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ══════════════════════════════════════════════════════════════════════════════
app = FastAPI(title="Intellivor API v4", version="4.0.0", docs_url="/docs")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def _startup(): _load_models()

# ══════════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════
class RegisterRequest(BaseModel):
    name:str; email:str; password:str
    phone:Optional[str]=None; role:str="farmer"
    region:Optional[str]=None; village:Optional[str]=None
    land_acres:Optional[float]=None; crops:Optional[str]=None; lang:str="en"

class LoginRequest(BaseModel):
    email:str; password:str

class ChatMessage(BaseModel):
    role:str; content:str

class ChatRequest(BaseModel):
    message:str; language:str="en"
    history:Optional[List[ChatMessage]]=[]

class YieldRequest(BaseModel):
    crop:str="Rice"; temperature:float=27.0; rainfall:float=120.0
    humidity:float=72.0; soil_type:str="Loamy"; area:float=1.0

class FertilizerRequest(BaseModel):
    soil:str; crop:str; temperature:float=27.0; rainfall:float=100.0; humidity:float=70.0
    nitrogen:Optional[float]=None; phosphorus:Optional[float]=None; potassium:Optional[float]=None

class CommunityPostIn(BaseModel):
    body:str; tag:str="General"; region:Optional[str]=None

class MarketListingIn(BaseModel):
    crop:str; quantity_kg:float; price_per_qt:float; market:str
    region:Optional[str]=None; contact:Optional[str]=None; is_buying:bool=False

class IoTRequest(BaseModel):
    problem:str; crop:Optional[str]=None; area_acres:Optional[float]=None

class WhatsAppRequest(BaseModel):
    number:str; message:str

class OrderItemIn(BaseModel):
    product_id:str; qty:int

class OrderRequest(BaseModel):
    items:List[OrderItemIn]; payment_method:str="cod"
    user_name:str; user_phone:str; user_address:str; notes:Optional[str]=None

class AgentQueryRequest(BaseModel):
    query:str; crop:str="Tomato"; region:str="Bengaluru"; language:str="en"
class AgentDiseaseRequest(BaseModel):
    query:str; crop:str="Tomato"; language:str="en"
class AgentWeatherRequest(BaseModel):
    region:str; language:str="en"
class AgentMarketRequest(BaseModel):
    crop:str; region:str; language:str="en"
class AgentIoTRequest(BaseModel):
    problem:str; crop:Optional[str]=None; language:str="en"
class AgentSynthRequest(BaseModel):
    query:str; crop:str; region:str
    disease_analysis:str; weather_advisory:str; market_advice:str; iot_advice:str=""; language:str="en"

# ══════════════════════════════════════════════════════════════════════════════
# UTILITY
# ══════════════════════════════════════════════════════════════════════════════
def _open_image(data:bytes)->Image.Image: return Image.open(io.BytesIO(data)).convert("RGB")

def _infer(model:nn.Module,img:Image.Image,classes:List[str])->tuple:
    tensor=_img_transform(img).unsqueeze(0)
    with torch.no_grad():
        out=model(tensor); probs=torch.softmax(out,dim=1); conf,pred=torch.max(probs,dim=1)
    idx=pred.item(); name=classes[idx] if idx<len(classes) else f"Class_{idx}"
    return name,float(conf.item())

def _extract_document_text(file_name:str,raw:bytes)->str:
    if not OCR_OK: return ""
    try:
        suffix=Path(file_name or "upload.jpg").suffix.lower()
        if suffix==".pdf":
            pages=convert_from_bytes(raw,first_page=1,last_page=1)
            if not pages: return ""
            return pytesseract.image_to_string(pages[0]).strip()
        return pytesseract.image_to_string(_open_image(raw)).strip()
    except Exception as e:
        log.warning("OCR extraction failed: %s",e)
        return ""

def _document_structured_data(text:str,file_name:str)->Dict[str,str]:
    compact=" ".join(text.split())
    cert=re.search(r"\b([A-Z]{2,4}[-/][A-Z0-9]{2,}[-/]\d{3,})\b",compact)
    date=re.search(r"\b(\d{1,2}[-/ ][A-Za-z]{3,9}[-/ ]\d{2,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b",compact)
    owner=re.search(r"(?:owner|name|farmer)[:\s-]+([A-Z][A-Za-z ]{2,40})",compact,re.IGNORECASE)
    stamp=re.search(r"(?:stamp(?:\s+duty)?|duty)[:\s-]*([0-9,]+)",compact,re.IGNORECASE)
    return {
        "certificate_number": cert.group(1) if cert else f"DOC-{Path(file_name or 'upload').stem[:12].upper()}",
        "issued_date": date.group(1) if date else "Unknown",
        "owner": owner.group(1).strip() if owner else "Unknown",
        "stamp_duty": stamp.group(1) if stamp else "",
    }

def _fmt(raw:str)->str:
    parts=raw.split("___")
    if len(parts)==2: return f"{parts[0]} — {parts[1].replace('_',' ').title()}"
    return raw.replace("_"," ")

def _is_online()->bool:
    try: socket.create_connection(("8.8.8.8",53),timeout=2); return True
    except: return False

def _cohere_call(prompt:str,preamble:str="",max_tokens:int=600)->str:
    if not _cohere_client: raise RuntimeError("Cohere not available")
    resp=_cohere_client.chat(message=prompt,preamble=preamble,max_tokens=max_tokens)
    return resp.text

def _claude_call(system:str,user_msg:str,max_tokens:int=500)->str:
    if not _claude: raise RuntimeError("Anthropic not available")
    r=_claude.messages.create(model="claude-haiku-4-5-20251001",max_tokens=max_tokens,system=system,messages=[{"role":"user","content":user_msg}])
    return r.content[0].text

def _send_whatsapp(number:str,body:str)->dict:
    if not TWILIO_OK or not (TWILIO_SID and TWILIO_TOKEN):
        return {"status":"skipped","reason":"Twilio not configured"}
    num=number.strip()
    if not num.startswith("+"): num="+91"+num.lstrip("0")
    try:
        client=TwilioClient(TWILIO_SID,TWILIO_TOKEN)
        msg=client.messages.create(from_=TWILIO_FROM,body=body,to=f"whatsapp:{num}")
        return {"status":"sent","sid":msg.sid}
    except Exception as e:
        return {"status":"failed","error":str(e),"help":"Ensure WhatsApp sandbox joined. Send 'join <word>' to +14155238886"}

def _save_scan_record(db:Session,scan_type:str,filename:Optional[str],result:Dict[str,Any],current_user:Optional[User]=None)->None:
    payload={
        "scan_type":scan_type,
        "filename":filename,
        "result":json.dumps(result),
        "risk_score":result.get("risk_score"),
        "created_at":datetime.utcnow(),
    }
    if current_user:
        payload["user_id"]=current_user.id
    try:
        conn=db.connection()
        cols={row[1] for row in conn.exec_driver_sql("PRAGMA table_info(scans)").fetchall()}
        insert_payload={k:v for k,v in payload.items() if k in cols}
        if not insert_payload:
            return
        columns=", ".join(insert_payload.keys())
        placeholders=", ".join(f":{k}" for k in insert_payload.keys())
        conn.execute(text(f"INSERT INTO scans ({columns}) VALUES ({placeholders})"), insert_payload)
        db.commit()
    except Exception as e:
        db.rollback()
        raise

# ══════════════════════════════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/",tags=["Health"])
def root(): return {"status":"ok","service":"Intellivor API v4","version":"4.0.0","online":_is_online()}

@app.get("/health",tags=["Health"])
def health():
    return {"status":"ok","version":"4.0.0","disease_model":_disease_model is not None,"pest_model":_pest_model is not None,"fertilizer_model":_fert_model is not None,"cohere":_cohere_client is not None,"anthropic":_claude is not None,"whatsapp":bool(TWILIO_SID and TWILIO_TOKEN),"payments":bool(RAZORPAY_KEY),"weather":bool(OWM_KEY),"online":_is_online()}

# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/auth/register",tags=["Auth"])
def register(req:RegisterRequest,db:Session=Depends(get_db)):
    if db.query(User).filter(User.email==req.email).first(): raise HTTPException(400,"Email already registered")
    user=User(name=req.name,email=req.email,password_hash=_hash(req.password),phone=req.phone,role=req.role,region=req.region,village=req.village,land_acres=req.land_acres,crops=req.crops,lang=req.lang)
    db.add(user); db.commit(); db.refresh(user)
    return {"token":_make_token({"sub":str(user.id),"role":user.role}),"user":{"id":user.id,"name":user.name,"email":user.email,"role":user.role,"region":user.region,"village":user.village,"phone":user.phone,"land_acres":user.land_acres,"crops":user.crops,"lang":user.lang}}

@app.post("/api/auth/login",tags=["Auth"])
def login(req:LoginRequest,db:Session=Depends(get_db)):
    user=db.query(User).filter(User.email==req.email).first()
    if not user or not _verify(req.password,user.password_hash): raise HTTPException(401,"Invalid credentials")
    return {"token":_make_token({"sub":str(user.id),"role":user.role}),"user":{"id":user.id,"name":user.name,"email":user.email,"role":user.role,"region":user.region,"village":user.village,"phone":user.phone,"land_acres":user.land_acres,"crops":user.crops,"lang":user.lang}}

@app.get("/api/auth/me",tags=["Auth"])
def me(user:User=Depends(_require_user)):
    return {"id":user.id,"name":user.name,"email":user.email,"role":user.role,"region":user.region,"village":user.village,"phone":user.phone,"land_acres":user.land_acres,"crops":user.crops,"lang":user.lang}

@app.put("/api/auth/update",tags=["Auth"])
def update_profile(data:dict,db:Session=Depends(get_db),user:User=Depends(_require_user)):
    for k,v in data.items():
        if k in ("name","phone","region","village","land_acres","crops","lang"): setattr(user,k,v)
    db.commit(); return {"status":"updated"}

# ══════════════════════════════════════════════════════════════════════════════
# DISEASE
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/disease/predict",tags=["Disease"])
async def predict_disease(file:UploadFile=File(...),language:str=Query("en"),current_user:Optional[User]=Depends(_get_current_user),db:Session=Depends(get_db)):
    raw=await file.read(); image=_open_image(raw)
    raw_class,confidence=_infer(_disease_model,image,DISEASE_CLASSES)
    display_name=_fmt(raw_class); is_healthy="healthy" in raw_class.lower()
    info=DISEASE_INFO.get(raw_class,{})
    cause=info.get(f"cause_{language}",info.get("cause_en","Environmental stress or infection."))
    solution=info.get(f"solution_{language}",info.get("solution_en","Apply appropriate treatment. Consult local agricultural officer."))
    organic=info.get("organic_en","Neem oil @ 5 ml/L spray every 5 days as broad-spectrum option.")
    severity=info.get("severity","Unknown")
    _save_scan_record(db,"disease",file.filename,{"class_name":display_name,"confidence":confidence},current_user)
    return {"class_name":display_name,"class_raw":raw_class,"confidence":round(confidence,4),"severity":severity,"cause":cause,"solution":solution,"organic":organic,"is_healthy":is_healthy}

# ══════════════════════════════════════════════════════════════════════════════
# PEST
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/pest/predict",tags=["Pest"])
async def predict_pest(file:UploadFile=File(...),language:str=Query("en")):
    raw=await file.read(); image=_open_image(raw)
    pest_name,confidence=_infer(_pest_model,image,PEST_CLASSES)
    is_healthy="healthy" in pest_name.lower()
    info=PEST_INFO.get(pest_name,{})
    solution=info.get(f"solution_{language}",info.get("solution_en","Consult local agricultural extension officer."))
    return {"pest_name":pest_name,"confidence":round(confidence,4),"is_healthy":is_healthy,"solution":solution}

# ══════════════════════════════════════════════════════════════════════════════
# SATELLITE NDVI
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/satellite/ndvi",tags=["Satellite"])
async def analyze_ndvi(file:UploadFile=File(...),language:str=Query("en"),current_user:Optional[User]=Depends(_get_current_user),db:Session=Depends(get_db)):
    raw=await file.read(); img=np.array(_open_image(raw)).astype(float)
    red=img[:,:,0]; nir=img[:,:,1]; ndvi=(nir-red)/(nir+red+1e-6)
    ndvi_mean=float(np.mean(ndvi)); ndvi_std=float(np.std(ndvi))
    ndvi_min=float(np.min(ndvi)); ndvi_max=float(np.max(ndvi))
    zones={"excellent":round(float(np.mean(ndvi>0.6))*100,1),"healthy":round(float(np.mean((ndvi>=0.4)&(ndvi<=0.6)))*100,1),"moderate":round(float(np.mean((ndvi>=0.2)&(ndvi<0.4)))*100,1),"stressed":round(float(np.mean((ndvi>=0.0)&(ndvi<0.2)))*100,1),"bare_soil":round(float(np.mean(ndvi<0.0))*100,1)}
    if ndvi_mean>=0.6: health="Excellent"; advice_en="🌱 Excellent crop health. Maintain current irrigation and fertilization schedule. Consider foliar micronutrient spray."; advice_kn="🌱 ಅತ್ಯುತ್ತಮ ಬೆಳೆ ಆರೋಗ್ಯ. ಪ್ರಸ್ತುತ ನೀರಾವರಿ ಮತ್ತು ಗೊಬ್ಬರ ಶೆಡ್ಯೂಲ್ ಮುಂದುವರಿಸಿ."
    elif ndvi_mean>=0.4: health="Healthy"; advice_en="✅ Good crop health. Monitor regularly. Light irrigation recommended if no rain in 5 days."; advice_kn="✅ ಉತ್ತಮ ಬೆಳೆ ಆರೋಗ್ಯ. 5 ದಿನ ಮಳೆ ಇಲ್ಲದಿದ್ದರೆ ಹಗುರ ನೀರಾವರಿ ಮಾಡಿ."
    elif ndvi_mean>=0.2: health="Moderate Stress"; advice_en="⚠️ Moderate stress detected. Increase irrigation frequency by 30%. Apply top-dress NPK fertilizer and inspect for early disease signs."; advice_kn="⚠️ ಮಧ್ಯಮ ಒತ್ತಡ ಕಂಡುಬಂದಿದೆ. ನೀರಾವರಿ 30% ಹೆಚ್ಚಿಸಿ. NPK ಗೊಬ್ಬರ ಹಾಕಿ."
    elif ndvi_mean>=0.0: health="Severe Stress"; advice_en="🚨 Severe crop stress! Urgent irrigation needed. Check for pest/disease infestation. Apply micronutrients. Contact KVK for emergency advisory."; advice_kn="🚨 ತೀವ್ರ ಬೆಳೆ ಒತ್ತಡ! ತುರ್ತು ನೀರಾವರಿ ಬೇಕು. ಕೀಟ/ರೋಗ ಪರಿಶೀಲಿಸಿ."
    else: health="Bare / Non-Crop"; advice_en="❌ No vegetation detected. Area shows bare soil or water body."; advice_kn="❌ ಸಸ್ಯ ಕಂಡುಬಂದಿಲ್ಲ. ಬರಿ ಮಣ್ಣು ಅಥವಾ ನೀರಿನ ಮೂಲ."
    advice=advice_kn if language=="kn" else advice_en
    _save_scan_record(db,"ndvi",file.filename,{"ndvi_mean":ndvi_mean,"health":health},current_user)
    return {"ndvi_mean":round(ndvi_mean,4),"ndvi_std":round(ndvi_std,4),"ndvi_min":round(ndvi_min,4),"ndvi_max":round(ndvi_max,4),"health":health,"advice":advice,"zones":zones,"irrigation_needed":ndvi_mean<0.4,"pest_risk_flag":ndvi_std>0.2,"estimated_yield_impact":f"{round(max(0,min(1,ndvi_mean))*100,1)}% of potential yield reachable"}

# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT VERIFY / FRAUD
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/fraud/analyze",tags=["Fraud"])
async def analyze_document_fraud(file:UploadFile=File(...),language:str=Query("en"),current_user:Optional[User]=Depends(_get_current_user),db:Session=Depends(get_db)):
    raw=await file.read()
    text=_extract_document_text(file.filename or "document",raw)
    structured=_document_structured_data(text,file.filename or "document")

    text_len=len(text)
    digit_count=sum(ch.isdigit() for ch in text)
    uppercase_count=sum(ch.isupper() for ch in text)
    features=np.array([[text_len,digit_count,uppercase_count,datetime.utcnow().year]])

    ml_flag="Normal"
    try:
        pred=int(_iso.predict(features)[0])
        ml_flag="Suspicious" if pred==-1 else "Normal"
    except Exception as e:
        log.warning("Fraud model inference failed: %s",e)

    risk_reasons=[]
    risk_score=18
    if not text.strip():
        risk_score+=30
        risk_reasons.append("OCR could not extract enough text from the document." if language=="en" else "ದಾಖಲೆಯಿಂದ ಸಾಕಷ್ಟು ಪಠ್ಯವನ್ನು OCR ಹೊರತೆಗೆದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.")
    if "Unknown" in structured.values():
        risk_score+=15
        risk_reasons.append("Key identity fields are missing or unclear." if language=="en" else "ಮುಖ್ಯ ಗುರುತು ಮಾಹಿತಿಗಳು ಕಾಣೆಯಾಗಿವೆ ಅಥವಾ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ.")
    if text_len and text_len<40:
        risk_score+=12
        risk_reasons.append("Document content appears unusually short." if language=="en" else "ದಾಖಲೆಯ ವಿಷಯ ಅಸಾಮಾನ್ಯವಾಗಿ ಕಡಿಮೆ ಕಾಣುತ್ತದೆ.")
    if ml_flag=="Suspicious":
        risk_score+=24
        risk_reasons.append("ML anomaly detector flagged an unusual document pattern." if language=="en" else "ಎಂಎಲ್ ಅನಾಮಲಿ ಡಿಟೆಕ್ಟರ್ ಅಸಾಮಾನ್ಯ ದಾಖಲೆ ಮಾದರಿಯನ್ನು ಗುರುತಿಸಿದೆ.")

    risk_score=max(5,min(95,risk_score))
    if risk_score>=70:
        risk_level="High"
        recommendation="Reject and escalate for field officer review" if language=="en" else "ತಿರಸ್ಕರಿಸಿ ಮತ್ತು ಕ್ಷೇತ್ರಾಧಿಕಾರಿ ಪರಿಶೀಲನೆಗೆ ಕಳುಹಿಸಿ"
    elif risk_score>=40:
        risk_level="Medium"
        recommendation="Manual review recommended. Document appears modified." if language=="en" else "ಕೈಯಾರೆ ಪರಿಶೀಲನೆ ಶಿಫಾರಸು. ದಾಖಲೆ ಬದಲಾಯಿಸಿರುವ ಸಾಧ್ಯತೆ ಇದೆ."
    else:
        risk_level="Low"
        recommendation="Looks consistent with expected document structure." if language=="en" else "ದಾಖಲೆ ನಿರೀಕ್ಷಿತ ರಚನೆಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ."

    if not risk_reasons:
        risk_reasons.append("No major anomalies detected in the uploaded document." if language=="en" else "ಅಪ್ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳಲ್ಲಿ ಯಾವುದೇ ಪ್ರಮುಖ ಅಸಾಮಾನ್ಯತೆ ಕಂಡುಬಂದಿಲ್ಲ.")

    _save_scan_record(db,"fraud",file.filename,{"risk_score":risk_score,"risk_level":risk_level,"ml_flag":ml_flag},current_user)

    return {"risk_score":risk_score,"risk_level":risk_level,"recommendation":recommendation,"risk_reasons":risk_reasons,"ml_flag":ml_flag,"structured_data":structured}

# ══════════════════════════════════════════════════════════════════════════════
# COHERE CHATBOT
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/chat",tags=["Chatbot"])
async def chatbot(request:ChatRequest):
    q=request.message; lang=request.language

    # Build conversation history for Cohere
    if _cohere_client:
        try:
            chat_history=[]
            for msg in (request.history or [])[-10:]:
                role="USER" if msg.role in ("user","USER") else "CHATBOT"
                chat_history.append({"role":role,"message":msg.content})
            
            lang_suffix="\n\nIMPORTANT: Respond entirely in Kannada (ಕನ್ನಡ) script." if lang=="kn" else ""
            resp=_cohere_client.chat(
                message=q,
                preamble=_COHERE_PREAMBLE+lang_suffix,
                chat_history=chat_history,
                max_tokens=600,
                temperature=0.7,
            )
            return {"reply":resp.text,"source":"cohere"}
        except Exception as e:
            log.warning("Cohere chat error: %s",e)

    # Fallback to Anthropic if available
    if _claude:
        try:
            messages=[{"role":m.role if m.role in ("user","assistant") else "user","content":m.content} for m in (request.history or [])[-10:]]
            messages.append({"role":"user","content":q})
            lang_suffix="\n\nRespond in Kannada (ಕನ್ನಡ)." if lang=="kn" else ""
            r=_claude.messages.create(model="claude-haiku-4-5-20251001",max_tokens=600,system=_COHERE_PREAMBLE+lang_suffix,messages=messages)
            return {"reply":r.content[0].text,"source":"anthropic"}
        except Exception as e:
            log.warning("Anthropic fallback error: %s",e)

    # Rule-based fallback
    q_lower=q.lower()
    for keywords,response in _FALLBACK_RULES:
        if any(k in q_lower for k in keywords): return {"reply":response,"source":"fallback"}

    default={"en":"I'm Intellivor, your AI farming assistant. Ask me about crop diseases, fertilizers, market prices, IoT solutions, or government schemes for farmers. How can I help you today?","kn":"ನಾನು ಐವರ ಕೃಷಿ AI. ಬೆಳೆ ರೋಗ, ಗೊಬ್ಬರ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, IoT ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆ ಬಗ್ಗೆ ಕೇಳಿ. ಇಂದು ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಏನು ಸಹಾಯ ಬೇಕು?"}
    return {"reply":default.get(lang,default["en"]),"source":"fallback"}

# ══════════════════════════════════════════════════════════════════════════════
# WEATHER — REAL-TIME (no dummy fallback)
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/weather",tags=["Weather"])
async def get_weather(city:str=Query("Bengaluru"),language:str=Query("en"),lat:Optional[float]=None,lon:Optional[float]=None):
    if not OWM_KEY:
        # Return clearly marked demo data when no API key
        return {
            "city":city,"temp":28.0,"feels_like":31.0,"humidity":72,"wind_speed":3.2,
            "pressure":1012,"visibility":9.5,"description":"Partly cloudy","icon":"⛅",
            "risk":"Weather API key not set. Set OPENWEATHER_API_KEY in .env for real data.",
            "risk_items":["⚠️ Demo data — set OPENWEATHER_API_KEY for live weather"],
            "forecast":[{"dt":f"2026-{4+i:02d}-01 12:00:00","temp":28+i,"desc":"Partly cloudy","icon":"⛅"} for i in range(5)],
            "is_demo":True,
        }
    try:
        if lat and lon:
            url=f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OWM_KEY}&units=metric"
            furl=f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OWM_KEY}&units=metric&cnt=40"
        else:
            url=f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OWM_KEY}&units=metric"
            furl=f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={OWM_KEY}&units=metric&cnt=40"

        r=http.get(url,timeout=6).json()
        if "main" not in r:
            raise ValueError(f"OWM error: {r.get('message','bad response')}")
        
        temp=r["main"]["temp"]; humidity=r["main"]["humidity"]
        wind=r.get("wind",{}).get("speed",0)
        desc=r["weather"][0]["description"].capitalize()
        icon_code=r["weather"][0]["icon"]
        icon_map={"01":"☀️","02":"🌤️","03":"⛅","04":"☁️","09":"🌧️","10":"🌦️","11":"⛈️","13":"❄️","50":"🌫️"}
        icon=icon_map.get(icon_code[:2],"🌡️")
        actual_city=r.get("name",city)
        
        # 5-day forecast
        forecast=[]
        try:
            fr=http.get(furl,timeout=6).json()
            seen_days=set()
            today=str(datetime.utcnow().date())
            for item in fr.get("list",[]):
                day=item["dt_txt"][:10]
                if day!=today and day not in seen_days:
                    seen_days.add(day)
                    forecast.append({"dt":item["dt_txt"],"temp":round(item["main"]["temp"],1),"desc":item["weather"][0]["description"].capitalize(),"icon":icon_map.get(item["weather"][0]["icon"][:2],"🌡️"),"humidity":item["main"]["humidity"],"wind":round(item.get("wind",{}).get("speed",0),1)})
                if len(seen_days)>=5: break
        except: pass

        # Agri risk advisory
        risk_items=[]
        if humidity>80: risk_items.append("🍄 High humidity (>80%) — elevated fungal disease risk. Avoid overhead irrigation.")
        if wind>8: risk_items.append(f"💨 Strong winds ({wind:.1f} m/s) — do not spray pesticides now.")
        if temp>38: risk_items.append(f"🌡️ Heat stress ({temp:.1f}°C) — irrigate early morning, use shade nets.")
        if temp<10: risk_items.append(f"❄️ Cold stress ({temp:.1f}°C) — protect sensitive crops with covers.")
        primary_risk=" | ".join(risk_items) if risk_items else None
        
        return {"city":actual_city,"temp":round(temp,1),"feels_like":round(r["main"].get("feels_like",temp),1),"humidity":humidity,"wind_speed":round(wind,1),"pressure":r["main"].get("pressure",1013),"visibility":round(r.get("visibility",10000)/1000,1),"description":desc,"icon":icon,"risk":primary_risk,"risk_items":risk_items,"forecast":forecast,"is_demo":False}
    except Exception as e:
        log.warning("Weather fetch failed: %s",e)
        raise HTTPException(503,detail=f"Weather service error: {str(e)[:100]}")

# ══════════════════════════════════════════════════════════════════════════════
# MARKETPLACE
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/market/prices",tags=["Marketplace"])
async def market_prices():
    if DATAGOV_KEY:
        try:
            url=f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={DATAGOV_KEY}&format=json&filters%5Bstate%5D=Karnataka&limit=20"
            resp=http.get(url,timeout=8).json()
            records=resp.get("records",[])
            if records: return [{"commodity":r.get("commodity",""),"price":int(r.get("modal_price",0)),"unit":"₹/quintal","trend":"—","exchange":r.get("market","")} for r in records[:15]]
        except Exception as e: log.warning("Data.gov.in error: %s",e)
    return STATIC_PRICES

@app.get("/api/market/listings",tags=["Marketplace"])
async def get_listings(db:Session=Depends(get_db)):
    rows=db.query(MarketListing).filter(MarketListing.is_active==True).order_by(MarketListing.created_at.desc()).limit(60).all()
    return [{"id":r.id,"agent_name":r.agent_name,"crop":r.crop,"quantity_kg":r.quantity_kg,"price_per_qt":r.price_per_qt,"market":r.market,"region":r.region,"contact":r.contact,"is_buying":r.is_buying,"created_at":r.created_at.isoformat()} for r in rows]

@app.post("/api/market/listing",tags=["Marketplace"])
async def create_listing(req:MarketListingIn,db:Session=Depends(get_db),current_user:User=Depends(_require_user)):
    listing=MarketListing(agent_id=current_user.id,agent_name=current_user.name,crop=req.crop,quantity_kg=req.quantity_kg,price_per_qt=req.price_per_qt,market=req.market,region=req.region or current_user.region,contact=req.contact or current_user.phone or "",is_buying=req.is_buying)
    db.add(listing); db.commit(); db.refresh(listing)
    return {"status":"listed","id":listing.id,"message":f"{'Buy' if req.is_buying else 'Sell'} listing for {req.crop} published."}

@app.delete("/api/market/listing/{listing_id}",tags=["Marketplace"])
async def delete_listing(listing_id:int,db:Session=Depends(get_db),current_user:User=Depends(_require_user)):
    row=db.query(MarketListing).filter(MarketListing.id==listing_id).first()
    if not row: raise HTTPException(404,"Not found")
    if row.agent_id!=current_user.id and current_user.role!="admin": raise HTTPException(403,"Not authorised")
    row.is_active=False; db.commit()
    return {"status":"deleted"}

# ══════════════════════════════════════════════════════════════════════════════
# SHOP & ORDERS
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/shop/products",tags=["Shop"])
async def get_products(category:Optional[str]=None):
    if category: return [p for p in SHOP_PRODUCTS if p["category"]==category]
    return SHOP_PRODUCTS

@app.get("/api/shop/product/{product_id}",tags=["Shop"])
async def get_product(product_id:str):
    p=next((x for x in SHOP_PRODUCTS if x["id"]==product_id),None)
    if not p: raise HTTPException(404,"Product not found")
    return p

@app.post("/api/orders/create",tags=["Orders"])
async def create_order(req:OrderRequest,db:Session=Depends(get_db),current_user:Optional[User]=Depends(_get_current_user)):
    # Calculate total
    items_detail=[]
    total=0.0
    for item in req.items:
        p=next((x for x in SHOP_PRODUCTS if x["id"]==item.product_id),None)
        if not p: raise HTTPException(404,f"Product {item.product_id} not found")
        if item.qty<p["min_qty"] or item.qty>p["max_qty"]: raise HTTPException(400,f"Quantity for {p['name']} must be {p['min_qty']}–{p['max_qty']}")
        subtotal=p["price"]*item.qty
        total+=subtotal
        items_detail.append({"product_id":p["id"],"name":p["name"],"unit":p["unit"],"qty":item.qty,"unit_price":p["price"],"subtotal":subtotal})
    
    order=Order(user_id=current_user.id if current_user else None,user_name=req.user_name,user_phone=req.user_phone,user_address=req.user_address,items=json.dumps(items_detail),total_amount=total,payment_method=req.payment_method,payment_status="pending" if req.payment_method!="cod" else "cod_pending",order_status="placed",notes=req.notes)
    db.add(order); db.commit(); db.refresh(order)
    
    order_id=f"IV{order.id:06d}"
    
    # Razorpay order creation (if online payment)
    razorpay_data=None
    if req.payment_method in ("upi","razorpay") and RAZORPAY_KEY and RAZORPAY_SECRET:
        try:
            rz_resp=http.post("https://api.razorpay.com/v1/orders",auth=(RAZORPAY_KEY,RAZORPAY_SECRET),json={"amount":int(total*100),"currency":"INR","receipt":order_id,"notes":{"user_name":req.user_name,"user_phone":req.user_phone}},timeout=10)
            rz_data=rz_resp.json()
            if "id" in rz_data:
                order.razorpay_order_id=rz_data["id"]; db.commit()
                razorpay_data={"razorpay_order_id":rz_data["id"],"razorpay_key":RAZORPAY_KEY,"amount":int(total*100),"currency":"INR"}
        except Exception as e: log.warning("Razorpay error: %s",e)
    
    # WhatsApp confirmation
    order_items_text = ", ".join(f"{item['name']} ×{item['qty']}" for item in items_detail)
    wa_msg=(f"🌾 *Intellivor Order Confirmed!*\n\n"
            f"Order ID: {order_id}\n"
            f"Items: {order_items_text}\n"
            f"Total: ₹{total:,.0f}\n"
            f"Payment: {req.payment_method.upper()}\n"
            f"Delivery to: {req.user_address[:60]}...\n\n"
            f"_We will contact you within 24 hours. Thank you!_")
    wa_result=_send_whatsapp(req.user_phone, wa_msg)
    wa_note = (
        f"WhatsApp confirmation sent to {req.user_phone}."
        if wa_result.get("status") == "sent"
        else f"WhatsApp not sent: {wa_result.get('error') or wa_result.get('reason','unknown error')}."
    )

    return {"status":"placed","order_id":order_id,"db_id":order.id,"total_amount":total,"items":items_detail,"payment_method":req.payment_method,"razorpay":razorpay_data,"whatsapp":wa_result,"message":f"Order {order_id} placed successfully! {'COD — pay on delivery.' if req.payment_method=='cod' else 'Please complete payment.'} {wa_note}"}

@app.post("/api/orders/verify-payment",tags=["Orders"])
async def verify_payment(data:dict,db:Session=Depends(get_db)):
    """Razorpay payment verification webhook."""
    import hmac, hashlib
    order_id=data.get("razorpay_order_id","")
    payment_id=data.get("razorpay_payment_id","")
    signature=data.get("razorpay_signature","")
    expected=hmac.new(RAZORPAY_SECRET.encode(),f"{order_id}|{payment_id}".encode(),hashlib.sha256).hexdigest()
    if expected==signature:
        order=db.query(Order).filter(Order.razorpay_order_id==order_id).first()
        if order: order.payment_status="paid"; order.order_status="processing"; db.commit()
        return {"status":"verified","payment_id":payment_id}
    return {"status":"failed","reason":"Signature mismatch"}

@app.get("/api/orders/my",tags=["Orders"])
async def my_orders(db:Session=Depends(get_db),current_user:User=Depends(_require_user)):
    rows=db.query(Order).filter(Order.user_id==current_user.id).order_by(Order.created_at.desc()).limit(20).all()
    return [{"id":r.id,"order_id":f"IV{r.id:06d}","items":json.loads(r.items) if r.items else [],"total_amount":r.total_amount,"payment_method":r.payment_method,"payment_status":r.payment_status,"order_status":r.order_status,"created_at":r.created_at.isoformat(),"delivery_address":r.user_address} for r in rows]

@app.put("/api/orders/{order_id}/status",tags=["Orders"])
async def update_order_status(order_id:int,data:dict,db:Session=Depends(get_db),current_user:User=Depends(_require_user)):
    if current_user.role not in ("admin","market_agent"): raise HTTPException(403,"Admin only")
    order=db.query(Order).filter(Order.id==order_id).first()
    if not order: raise HTTPException(404)
    order.order_status=data.get("status",order.order_status)
    db.commit()
    # Notify customer
    if order.user_phone:
        _send_whatsapp(order.user_phone,f"🌾 Intellivor Order Update\n\nOrder IV{order.id:06d} is now: *{order.order_status.upper()}*\n\nThank you for shopping with Intellivor!")
    return {"status":"updated","order_status":order.order_status}

# ══════════════════════════════════════════════════════════════════════════════
# COMMUNITY
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/community/post",tags=["Community"])
async def create_post(post:CommunityPostIn,db:Session=Depends(get_db),current_user:User=Depends(_require_user)):
    record=CommunityPost(user_id=current_user.id,author=current_user.name,role=current_user.role,region=post.region or current_user.region,body=post.body,tag=post.tag)
    db.add(record); db.commit(); db.refresh(record)
    return {"status":"ok","id":record.id,"created_at":record.created_at.isoformat()}

@app.get("/api/community/posts",tags=["Community"])
async def get_posts(limit:int=50,tag:Optional[str]=None,db:Session=Depends(get_db)):
    q=db.query(CommunityPost).order_by(CommunityPost.created_at.desc())
    if tag: q=q.filter(CommunityPost.tag==tag)
    posts=q.limit(limit).all()
    return [{"id":p.id,"author":p.author,"role":p.role,"region":p.region,"body":p.body,"tag":p.tag,"likes":p.likes,"created_at":p.created_at.isoformat()} for p in posts]

@app.post("/api/community/like/{post_id}",tags=["Community"])
async def like_post(post_id:int,db:Session=Depends(get_db)):
    p=db.query(CommunityPost).filter(CommunityPost.id==post_id).first()
    if p: p.likes+=1; db.commit()
    return {"likes":p.likes if p else 0}

# ══════════════════════════════════════════════════════════════════════════════
# FERTILIZER
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/fertilizer/recommend",tags=["Fertilizer"])
async def recommend_fertilizer(req:FertilizerRequest):
    fert_name=None
    if _fert_model and _fert_encoders:
        try:
            import pandas as pd
            row={"Soil_Type":req.soil,"Crop_Type":req.crop,"Temperature":req.temperature,"Rainfall":req.rainfall,"Humidity":req.humidity}
            if req.nitrogen is not None: row["Nitrogen_Level"]=req.nitrogen
            if req.phosphorus is not None: row["Phosphorus_Level"]=req.phosphorus
            if req.potassium is not None: row["Potassium_Level"]=req.potassium
            df=pd.DataFrame([row])
            for col in df.columns:
                if df[col].dtype==object and col in _fert_encoders:
                    df[col]=_fert_encoders[col].transform(df[col].astype(str).str.strip().str.lower())
            df=df.reindex(columns=_fert_model.feature_names_in_,fill_value=0)
            pred=_fert_model.predict(df)[0]
            if "Recommended_Fertilizer" in _fert_encoders: fert_name=_fert_encoders["Recommended_Fertilizer"].inverse_transform([pred])[0]
            else: fert_name=str(pred)
        except Exception as e: log.warning("Fertilizer ML error: %s",e)
    rule=FERT_RULES.get((req.crop,req.soil))
    if not fert_name: fert_name=rule["fertilizer"] if rule else "NPK 17-17-17 @ 100 kg/acre"
    dose_schedule=rule["dose_schedule"] if rule else "Apply as basal; top-dress at 30 DAS"
    notes=[]
    if req.nitrogen is not None and req.nitrogen<50: notes.append("Low nitrogen — increase Urea by 20%")
    if req.phosphorus is not None and req.phosphorus<25: notes.append("Low phosphorus — add DAP 20 kg/acre")
    if req.potassium is not None and req.potassium<150: notes.append("Low potassium — apply MOP 15 kg/acre")
    _prices={"NPK 17-17-17":1200,"NPK 19-19-19":1400,"DAP":1350,"Urea":320,"MOP":900}
    price=next((v for k,v in _prices.items() if k.split()[0] in fert_name),800)
    return {"fertilizer":fert_name,"dose_schedule":dose_schedule,"price_estimate":f"₹{price}/bag (50 kg)","timing":"Apply at sowing + top-dress at 30 DAS","notes":notes,"organic_option":"Compost 2 tonne/acre + Vermicompost 500 kg as partial substitute","govt_scheme":"PMKSY subsidy available — contact local agriculture dept. for 30-50% subsidy on inputs"}

# ══════════════════════════════════════════════════════════════════════════════
# YIELD
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/yield/predict",tags=["Yield"])
async def predict_yield(req:YieldRequest):
    coeff=CROP_COEFF.get(req.crop,CROP_COEFF["Rice"]); soil_factor=SOIL_MUL.get(req.soil_type,1.0)
    per_acre=(coeff["base"]+coeff["t"]*req.temperature+coeff["r"]*req.rainfall+coeff["h"]*req.humidity)*soil_factor
    total=round(per_acre*req.area,2); per_acre=round(per_acre,2)
    recs=[]
    if req.temperature>35: recs.append("Use shade nets; irrigate in early morning to reduce heat stress.")
    if req.humidity<40: recs.append("Apply mulching to retain soil moisture.")
    if req.rainfall<50: recs.append("Setup drip or sprinkler irrigation.")
    if not recs: recs.append(f"Optimal conditions for {req.crop}. Maintain current practices.")
    msp_rates={"Rice":2183,"Wheat":2275,"Maize":2090,"Cotton":7121,"Ragi":4291}
    msp=msp_rates.get(req.crop,2200)
    return {"predicted_yield":total,"unit":"tonnes / total area","per_acre":per_acre,"confidence":0.84,"recommendation":" ".join(recs),"msp_estimate":f"₹{total*msp*10:,.0f} (at MSP ₹{msp}/quintal)"}

# ══════════════════════════════════════════════════════════════════════════════
# IOT
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/iot/circuits",tags=["IoT"])
async def get_iot_circuits(): return list(IOT_CIRCUITS.keys())

@app.get("/api/iot/circuit/{circuit_id}",tags=["IoT"])
async def get_circuit(circuit_id:str,language:str=Query("en")):
    c=IOT_CIRCUITS.get(circuit_id)
    if not c: raise HTTPException(404,f"Circuit '{circuit_id}' not found")
    return c

@app.post("/api/iot/recommend",tags=["IoT"])
async def recommend_iot(req:IoTRequest):
    problem=req.problem.lower()
    kw_map={"soil_moisture":["moisture","dry","water","irrigation","drought","ಒಣ","ನೀರು","ತೇವಾಂಶ"],"weather_station":["weather","rain","temperature","wind","humidity","ಮಳೆ","ತಾಪಮಾನ","ಹವಾಮಾನ"],"auto_irrigation":["automat","drip","watering","irrigat","pump","ಸ್ವಯಂ","ತೊಟ್ಟಿ","ಪಂಪ್"],"pest_trap":["pest","insect","bug","moth","trap","ಕೀಟ","ಬಲೆ"],"leaf_sensor":["fungal","blight","wet","disease","leaf","ರೋಗ","ಎಲೆ","ಶಿಲೀಂಧ್ರ"],"drone_sprayer":["spray","drone","aerial","large","ಡ್ರೋನ್","ಸಿಂಪಡಿ"]}
    matched=[]
    for cid,kws in kw_map.items():
        if any(k in problem for k in kws): matched.append({**IOT_CIRCUITS[cid],"id":cid})
    if not matched: matched=[{**IOT_CIRCUITS["soil_moisture"],"id":"soil_moisture"},{**IOT_CIRCUITS["weather_station"],"id":"weather_station"}]
    return {"problem":req.problem,"recommendations":matched[:3],"total_cost_estimate":"₹1,500 – ₹15,000 depending on setup","support_message":"Call Intellivor IoT helpline: 1800-XXX-XXXX (toll-free) for setup assistance in Kannada"}

# ══════════════════════════════════════════════════════════════════════════════
# WHATSAPP
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/api/alerts/whatsapp",tags=["Alerts"])
async def send_whatsapp(req:WhatsAppRequest,current_user:Optional[User]=Depends(_get_current_user)):
    sender=current_user.name if current_user else "Intellivor"
    body=f"🌾 *Intellivor Alert* — {sender}\n\n{req.message}\n\n_Sent via Intellivor Smart Farming_"
    result=_send_whatsapp(req.number,body)
    return result

# ══════════════════════════════════════════════════════════════════════════════
# HISTORY
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/scans/history",tags=["History"])
async def scan_history(limit:int=20,current_user:User=Depends(_require_user),db:Session=Depends(get_db)):
    rows=db.query(ScanRecord).filter(ScanRecord.user_id==current_user.id).order_by(ScanRecord.created_at.desc()).limit(limit).all()
    return [{"id":r.id,"scan_type":r.scan_type,"filename":r.filename,"result":json.loads(r.result) if r.result else {},"created_at":r.created_at.isoformat()} for r in rows]

# ══════════════════════════════════════════════════════════════════════════════
# AGENTIC AI — 6-AGENT PIPELINE (with IoT agent added)
# ══════════════════════════════════════════════════════════════════════════════
def _ai_call(system:str,user_msg:str,max_tokens:int=500,lang:str="en")->str:
    """Try Cohere first (chat), then Anthropic, then raise."""
    lang_suffix="\n\nRespond entirely in Kannada (ಕನ್ನಡ)." if lang=="kn" else ""
    if _cohere_client:
        try:
            r=_cohere_client.chat(message=user_msg,preamble=system+lang_suffix,max_tokens=max_tokens,temperature=0.6)
            return r.text
        except Exception as e: log.warning("Cohere agent error: %s",e)
    if _claude:
        try:
            r=_claude.messages.create(model="claude-haiku-4-5-20251001",max_tokens=max_tokens,system=system+lang_suffix,messages=[{"role":"user","content":user_msg}])
            return r.content[0].text
        except Exception as e: log.warning("Anthropic agent error: %s",e)
    raise RuntimeError("No AI service available")

@app.post("/api/agent/plan",tags=["Agents"])
async def agent_plan(req:AgentQueryRequest):
    system="You are the Planner Agent for Intellivor AI farming platform. Analyse the farmer's query and in 2-3 bullet points state: (1) The main problem, (2) Key data needed (weather, disease, market, IoT), (3) Which agents to invoke first. Be concise and practical."
    try: plan=_ai_call(system,f"Crop: {req.crop}\nRegion: {req.region}\nQuery: {req.query[:200]}",350,req.language)
    except: plan=f"• Analysing: {req.query[:80]}\n• Agents: Disease + Weather + Market + IoT\n• Priority: Disease diagnosis first"
    return {"plan":plan,"agents":["disease","weather","market","iot"]}

@app.post("/api/agent/disease",tags=["Agents"])
async def agent_disease(req:AgentDiseaseRequest):
    system="You are the Disease & Pest Specialist Agent. Given a farmer's description, identify the most likely disease or pest, explain the cause, and give treatment (chemical + organic). Format as 4-5 clear bullet points. Use simple language."
    user_msg=f"Crop: {req.crop}\nFarmer says: {req.query}"
    try: analysis=_ai_call(system,user_msg,400,req.language)
    except:
        info=DISEASE_INFO.get(f"{req.crop}___Early_blight",{})
        analysis=f"• Likely: {req.crop} fungal infection\n• Cause: {info.get('cause_en','Excess moisture, fungal spores')}\n• Treatment: {info.get('solution_en','Apply Mancozeb 2.5g/L every 7 days')}\n• Organic: {info.get('organic_en','Neem oil 5ml/L spray')}\n• Act within 48 hours of first signs"
    return {"analysis":analysis}

@app.post("/api/agent/weather",tags=["Agents"])
async def agent_weather(req:AgentWeatherRequest):
    weather_ctx=""
    if OWM_KEY:
        try:
            r=http.get(f"https://api.openweathermap.org/data/2.5/weather?q={req.region}&appid={OWM_KEY}&units=metric",timeout=6).json()
            if "main" in r:
                temp=r["main"]["temp"]; hum=r["main"]["humidity"]; wind=r.get("wind",{}).get("speed",0); desc=r["weather"][0]["description"]
                weather_ctx=f"LIVE weather in {req.region}: {temp}°C, {hum}% humidity, wind {wind}m/s, {desc}."
        except: pass
    if not weather_ctx: weather_ctx=f"Weather in {req.region}: approximately 29°C, 74% humidity, partly cloudy. (Live data unavailable — set OPENWEATHER_API_KEY)"
    system="You are the Weather & Agri-Risk Agent. Given current weather, provide 4-5 bullet advisory covering: spray window suitability, irrigation recommendation, fungal disease risk, best field operation times. Be specific and practical for a farmer."
    try: advisory=_ai_call(system,weather_ctx,350,req.language)
    except: advisory=f"• {weather_ctx}\n• Spray: Early morning 6-8 AM or late evening\n• Irrigation: If humidity <60%, irrigate at dawn\n• Fungal risk: Moderate. Monitor after rain.\n• Field ops: Best 7-10 AM before peak heat"
    return {"advisory":advisory,"weather_raw":weather_ctx}

@app.post("/api/agent/market",tags=["Agents"])
async def agent_market(req:AgentMarketRequest):
    prices={"Rice":2280,"Wheat":2150,"Maize":1920,"Tomato":1640,"Onion":1380,"Cotton":6200,"Ragi":3846,"Groundnut":5850}
    price=prices.get(req.crop,1500)
    system="You are the Market Intelligence Agent. Given crop, APMC price, and region, provide 4-5 bullet advisory: price assessment (high/fair/low vs MSP), sell-now vs hold, best nearby APMC market, relevant government scheme. Be specific and actionable."
    user_msg=f"Crop: {req.crop}\nCurrent APMC price: ₹{price}/quintal\nRegion: {req.region}"
    try: advice=_ai_call(system,user_msg,350,req.language)
    except:
        msp={"Rice":2183,"Wheat":2275,"Maize":2090,"Cotton":7121,"Ragi":4291}.get(req.crop)
        advice=f"• {req.crop}: ₹{price}/quintal in {req.region}\n"+(f"• MSP: ₹{msp}/q — {'above' if price>msp else 'below'} MSP\n" if msp else "")+"• Recommendation: Sell within 3-5 days if trend positive\n• Nearest: APMC Bangalore / APMC Tumkur\n• Register at pmkisan.gov.in for ₹6,000/year support"
    return {"advice":advice,"price":price,"crop":req.crop}

@app.post("/api/agent/iot",tags=["Agents"])
async def agent_iot_advice(req:AgentIoTRequest):
    system="You are the IoT Technology Advisor for farmers. Recommend the simplest IoT solution for the farmer's problem. Explain what it does in one simple sentence (no jargon). List 3-4 components with price. State total cost. End with 'Intellivor has ready-made kits — visit the Shop section.'"
    user_msg=f"Farmer's problem: {req.problem}\nCrop: {req.crop or 'not specified'}"
    try: advice=_ai_call(system,user_msg,350,req.language)
    except:
        advice=("• For soil and irrigation issues: Soil Moisture Monitor Kit\n"
                "• What it does: Sends WhatsApp alert when crop needs water\n"
                "• Components: Arduino (₹500) + Soil Sensor (₹250) + Wi-Fi module (₹300)\n"
                "• Total cost: ₹1,000-1,500\n"
                "• Intellivor has ready-made kits — visit the Shop section.")
    return {"advice":advice}

@app.post("/api/agent/synthesize",tags=["Agents"])
async def agent_synthesize(req:AgentSynthRequest):
    system=("You are the Synthesis Agent for Intellivor. You receive outputs from 4 specialist agents and produce ONE prioritised ACTION PLAN for the farmer.\n"
            "Format EXACTLY as:\n"
            "🌿 DISEASE/PEST ACTION\n[specific steps with timing]\n\n"
            "🌦️ WEATHER WINDOW\n[when to spray/irrigate based on forecast]\n\n"
            "🛒 MARKET TIMING\n[sell/hold advice with reasoning]\n\n"
            "🔌 IoT QUICK WIN\n[one simple sensor that would help most]\n\n"
            "📋 THIS WEEK CHECKLIST\n✅ Day 1:\n✅ Day 3:\n✅ Day 5:\n✅ Day 7:\n\n"
            "Be specific, compassionate, and avoid all jargon.")
    user_msg=(f"Original query: {req.query}\nCrop: {req.crop} | Region: {req.region}\n\n"
              f"--- Disease Agent ---\n{req.disease_analysis}\n\n"
              f"--- Weather Agent ---\n{req.weather_advisory}\n\n"
              f"--- Market Agent ---\n{req.market_advice}\n\n"
              f"--- IoT Agent ---\n{req.iot_advice}")
    try: action_plan=_ai_call(system,user_msg,700,req.language)
    except:
        action_plan=(f"🌿 DISEASE/PEST ACTION\n{req.disease_analysis}\n\n"
                     f"🌦️ WEATHER WINDOW\n{req.weather_advisory}\n\n"
                     f"🛒 MARKET TIMING\n{req.market_advice}\n\n"
                     f"🔌 IoT QUICK WIN\nSoil moisture sensor — costs ₹1,200, saves water automatically\n\n"
                     "📋 THIS WEEK CHECKLIST\n✅ Day 1: Apply fungicide early morning\n✅ Day 3: Inspect and remove infected material\n✅ Day 5: Check market price — sell if favourable\n✅ Day 7: Second spray if humidity stays above 80%")
    return {"action_plan":action_plan}

if __name__=="__main__":
    import uvicorn
    uvicorn.run("backend1:app",host="0.0.0.0",port=8000,reload=True,log_level="info")
