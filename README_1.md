# 🌾 Intellivor v4.0 — AI Smart Farming Ecosystem

> **Empowering Karnataka Farmers with AI, IoT & Market Intelligence**  
> Built for rural-first, multilingual (English + ಕನ್ನಡ) farming communities.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [AI Agent Pipeline](#ai-agent-pipeline)
- [IoT Circuits](#iot-circuits)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Intellivor** is a production-grade AI-powered smart farming platform designed for smallholder farmers in Karnataka, India. It combines computer vision for crop disease detection, a multi-agent AI advisory pipeline, real-time weather forecasting, APMC market price intelligence, an IoT kit recommendation engine, and an integrated e-commerce shop — all accessible in English and Kannada.

The platform is designed with a **rural-first UX**: simple language, voice-first flows, and WhatsApp order confirmations via Twilio.

---

## Features

### 🤖 AI & Machine Learning
- **Crop Disease Detection** — ResNet-based CNN trained on 38 disease classes (PlantVillage dataset). Upload a leaf image and get instant diagnosis with chemical + organic treatment advice.
- **Pest Detection** — YOLOv8n object detection model (`yolov8n.pt`) covering 22 pest classes across Maize, Tomato, Cassava, Cashew, etc.
- **Fertilizer Recommendation** — Rule-based engine using crop type and soil type to recommend specific NPK doses and application schedules.
- **Irrigation Calculator** — Crop-coefficient-based water requirement estimation adjusted for soil type, temperature, rainfall, and humidity.
- **Anomaly Detection** — Isolation Forest model for IoT sensor data anomaly detection.

### 🧠 6-Agent Agentic AI Pipeline
| Agent | Role |
|---|---|
| **Planner** | Decomposes farmer query; decides which agents to invoke |
| **Disease** | Identifies disease/pest and recommends treatment |
| **Weather** | Live weather advisory — spray windows, fungal risk, irrigation |
| **Market** | APMC price analysis, MSP comparison, sell/hold recommendation |
| **IoT** | Recommends the simplest IoT solution for the farmer's problem |
| **Synthesizer** | Combines all agent outputs into a single prioritised weekly action plan |

- Primary AI: **Cohere** (chat)
- Fallback AI: **Anthropic Claude** (agent pipeline)

### 🌦️ Real-Time Weather
- Live data from **OpenWeatherMap API**
- Agricultural advisories: spray windows, irrigation schedules, fungal risk levels

### 📈 Market Intelligence
- APMC price feed for 10+ Karnataka commodities (Rice, Wheat, Maize, Tomato, Cotton, Ragi, Groundnut, etc.)
- MSP comparison and sell/hold advisory
- Data.gov.in integration for government mandi prices

### 🛒 E-Commerce Shop
- Product catalog: Seeds, Fertilizers, Pesticides, IoT Kits, Equipment
- Razorpay UPI payment integration
- WhatsApp order confirmations via Twilio
- Subsidy-eligible product tagging

### 🔌 IoT Kit Guides
Six plug-and-play circuit guides with step-by-step assembly instructions and code snippets:
- Soil Moisture Monitor
- Weather Station (ESP32 + DHT22)
- Auto Drip Irrigation Controller
- Pest Trap Counter
- Leaf Wetness Disease Alert
- Drone Sprayer (Advanced)

### 📄 OCR & Document Processing
- Upload agri invoices, land records, or government documents (PDF/image)
- Tesseract OCR extracts text; fuzzy-match searches for crop/product names

### 💬 Multilingual Chatbot
- Cohere-powered chat with Anthropic fallback
- Full Kannada (ಕನ್ನಡ) support across all advisory outputs

### 🔐 Auth & User Profiles
- JWT-based authentication (7-day tokens)
- Role-based access: Farmer, Agronomist, Dealer, Researcher
- Profile stores region, village, land size, crops, and language preference

---

## Project Structure

```
intellivor/
├── backend1.py          # FastAPI backend — all API routes, ML models, agent pipeline
├── App.jsx              # React frontend — full UI with sidebar navigation
├── pher.html            # Standalone Swarm Intelligence Pheromone Simulation
├── yolov8n.pt           # YOLOv8 nano weights for pest detection
├── Ani.py               # Animation / utility script
├── models/              # Auto-created: stores trained ML model files
├── uploads/             # Auto-created: stores user-uploaded scan images
├── intellivor.db        # SQLite database (auto-created, or configure PostgreSQL)
└── .env                 # API keys and secrets (never commit this)
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | SQLAlchemy (SQLite default / PostgreSQL ready) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| ML / CV | PyTorch, TorchVision, Ultralytics YOLOv8, scikit-learn |
| OCR | Tesseract + pdf2image |
| AI Chat | Cohere (primary) + Anthropic Claude (fallback) |
| Weather | OpenWeatherMap API |
| Payments | Razorpay UPI |
| Notifications | Twilio WhatsApp |
| Other | pandas, numpy, rapidfuzz, aiofiles, python-dotenv |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React (JSX) |
| Styling | CSS Variables + inline CSS (no external CSS framework) |
| Fonts | Google Fonts — Nunito, Lora, JetBrains Mono |
| State | React Hooks (useState, useEffect, useRef, useCallback) |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ (for React frontend)
- Tesseract OCR installed on system
- CUDA-capable GPU (optional, for faster inference)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/intellivor.git
cd intellivor
```

### 2. Backend Setup

```bash
# Install all Python dependencies
pip install fastapi "uvicorn[standard]" python-multipart pillow numpy \
            torch torchvision scikit-learn joblib \
            cohere twilio requests python-jose[cryptography] \
            passlib[bcrypt] sqlalchemy python-dotenv aiofiles \
            pytesseract pdf2image rapidfuzz pandas anthropic

# Create your .env file (see Environment Variables section)
cp .env.example .env

# Run the backend
uvicorn backend1:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Place Model Files

Place `yolov8n.pt` in the `models/` directory. The disease detection CNN weights are auto-initialised on first run.

```bash
mkdir -p models
cp yolov8n.pt models/
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Authentication
JWT_SECRET=your_secure_random_secret_here

# AI Services
COHERE_API_KEY=your_cohere_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Weather
OPENWEATHER_API_KEY=your_openweathermap_key

# WhatsApp Notifications
TWILIO_SID=your_twilio_account_sid
TWILIO_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Payments
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Government Data
DATAGOV_API_KEY=your_datagov_api_key

# Database (defaults to SQLite if not set)
DATABASE_URL=sqlite:///./intellivor.db
# For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/intellivor
```

> ⚠️ **Never commit your `.env` file.** Add it to `.gitignore`.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user profile |

### AI Scans
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/scan/disease` | Upload leaf image → disease diagnosis |
| POST | `/api/scan/pest` | Upload image → YOLOv8 pest detection |
| POST | `/api/scan/document` | Upload PDF/image → OCR text extraction |

### Advisory
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/fertilizer/recommend` | Fertilizer recommendation by crop + soil |
| POST | `/api/irrigation/calculate` | Water requirement estimation |
| GET | `/api/weather/{region}` | Live weather + agri advisory |
| GET | `/api/market/prices` | APMC commodity prices |

### AI Agents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agent/plan` | Planner agent — query decomposition |
| POST | `/api/agent/disease` | Disease specialist agent |
| POST | `/api/agent/weather` | Weather advisory agent |
| POST | `/api/agent/market` | Market intelligence agent |
| POST | `/api/agent/iot` | IoT recommendation agent |
| POST | `/api/agent/synthesize` | Synthesis agent — unified action plan |

### IoT
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/iot/circuits` | List all IoT circuit guides |
| GET | `/api/iot/circuit/{id}` | Get specific circuit details |
| POST | `/api/iot/recommend` | Recommend IoT solution for a problem |

### Shop & Payments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/shop/products` | List all products |
| POST | `/api/orders/create` | Create a new order |
| POST | `/api/payments/create` | Initiate Razorpay payment |
| POST | `/api/alerts/whatsapp` | Send WhatsApp alert |

### History
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/scans/history` | User's scan history |

Full interactive API docs available at: `http://localhost:8000/docs`

---

## AI Agent Pipeline

The 6-agent pipeline works sequentially to produce a comprehensive, personalised weekly action plan:

```
Farmer Query
     │
     ▼
[1. Planner Agent]  ──── Identifies problem type & assigns agents
     │
     ├──► [2. Disease Agent]   ──── Diagnoses crop issue
     ├──► [3. Weather Agent]   ──── Fetches live weather, advises spray window
     ├──► [4. Market Agent]    ──── Checks APMC prices vs MSP
     └──► [5. IoT Agent]       ──── Suggests lowest-cost sensor solution
                │
                ▼
        [6. Synthesizer Agent]  ──── Unified weekly checklist (Day 1–7)
```

All agents support Kannada output by appending a language suffix to the system prompt.

---

## IoT Circuits

| Circuit | Difficulty | Cost (INR) | Rural Friendly |
|---|---|---|---|
| Soil Moisture Monitor | Beginner | ₹800 – ₹1,200 | ✅ Yes |
| Weather Station | Intermediate | ₹1,800 – ₹2,500 | ✅ Yes |
| Auto Drip Irrigation | Intermediate | ₹2,500 – ₹4,000 | ✅ Yes |
| Pest Trap Counter | Beginner | ₹600 – ₹1,000 | ✅ Yes |
| Leaf Wetness Alert | Intermediate | ₹1,200 – ₹2,000 | ✅ Yes |
| Drone Sprayer | Advanced | ₹18,000 – ₹28,000 | ❌ No |

Each circuit guide includes: component list, wiring diagram description, step-by-step assembly, and a ready-to-use code snippet (Arduino / MicroPython).

---

## Bonus: Pheromone Swarm Simulation (`pher.html`)

A standalone browser-based swarm intelligence simulation inspired by ant colony optimisation. Agents navigate a canvas using pheromone trails to find optimal paths — included as a visual demonstration of emergent AI behaviour for educational use.

Open `pher.html` directly in any modern browser — no server required.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure code follows existing style and all API keys are removed before submitting.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [PlantVillage Dataset](https://plantvillage.psu.edu/) — crop disease training data
- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) — pest detection
- [Cohere](https://cohere.com/) — primary chatbot AI
- [Anthropic Claude](https://www.anthropic.com/) — agent pipeline fallback
- Karnataka APMC — market price reference data

---

*Built with ❤️ for Karnataka farmers. ನಮ್ಮ ರೈತರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.*
