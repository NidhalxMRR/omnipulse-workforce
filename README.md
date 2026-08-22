# ⚡ OmniPulse | Call Center & Remote Workforce Intelligence Platform

A real-time, multi-tenant performance tracking and operations platform designed for remote customer support teams, call center agents, and browser-heavy knowledge workers.

---

## 🌟 Key Features

* **Live Operations Floor Matrix**: Real-time supervisor dashboard displaying 100+ agents with sub-second status changes (Active CRM, In Call, Wrap-Up, Idle, Break).
* **WebRTC & Call-Center Telemetry**: Automatically detects when agents are in active voice calls (Genesys, Five9, Zendesk Talk, Amazon Connect, Twilio Flex) via WebRTC audio stream hooks.
* **Wrap-Up (After-Call Work) Tracking**: Automatically tracks post-call ticket resolution intervals.
* **Privacy-by-Design & Zero Keylogging**: Complies with GDPR/HIPAA standards—monitors active applications and domains without capturing keystrokes or sensitive customer data.
* **Manifest V3 Chrome Extension**: Lightweight client that batches heartbeats every 15s and detects system idle states.
* **1-Command Docker Deployment**: Ready to run with PostgreSQL 16, Node.js Express WebSocket API, and Vite React Supervisor UI.

---

## 🚀 Quick Start with Docker

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Launch the Full Stack
From the project root directory, run:

```bash
docker compose up --build
```

This will automatically spin up:
1. **PostgreSQL Database** on `localhost:5432` (with seeded teams & agents).
2. **Realtime Ingestion & WebSocket API** on `http://localhost:5000`.
3. **Supervisor Operations Dashboard** on `http://localhost:3000`.

Open your browser and navigate to: **`http://localhost:3000`**

---

## 🔌 Installing the Agent Chrome Extension

1. Open Google Chrome or Microsoft Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right corner).
3. Click **"Load unpacked"** and select the `/extension` directory in this repository.
4. Click the extension icon in your browser toolbar to view your status or pause your shift!

---

## 📁 Repository Structure

```
.
├── .env.example              # Sample environment variables & DB coordinates
├── .env                      # Active environment configuration
├── docker-compose.yml        # Multi-container orchestration (DB, API, Frontend)
├── ARCHITECTURE.md           # Full enterprise architectural specification
│
├── backend/                  # Realtime Ingestion & WebSocket Gateway (Node.js)
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js          # HTTP & WebSocket server entry point
│   │   ├── db.js             # PostgreSQL connection pool & migrations
│   │   ├── schema.sql        # Database schema, indices, & seed data
│   │   ├── services/
│   │   │   ├── classifier.js # Call center state & domain classifier
│   │   │   └── websocket.js  # Live presence broadcasting hub
│   │   └── routes/
│   │       ├── heartbeat.js  # Telemetry ingestion endpoint
│   │       ├── agents.js     # Agent matrix & live state API
│   │       └── analytics.js  # AHT, occupancy, and adherence metrics
│
├── frontend/                 # Supervisor Real-Time Floor Web App (React + Tailwind)
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx           # Realtime floor, filters, and tab navigation
│       └── components/
│           ├── LiveFloorGrid.jsx       # Real-time agent status cards
│           ├── AgentTimelineModal.jsx  # Detailed activity breakdown & controls
│           ├── AnalyticsView.jsx       # Call Center KPI scorecards & AHT
│           └── ShiftManager.jsx        # Category & domain whitelist rules
│
└── extension/                # Agent Client Tracker (Chrome Manifest V3)
    ├── manifest.json
    ├── background.js         # Tab focus, idle detection & WebRTC hooks
    ├── popup.html            # Agent shift & break controller
    └── popup.js
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/heartbeat` | Ingests telemetry batches from Chrome extension / desktop watcher |
| `GET` | `/api/v1/agents` | Fetches live agent matrix and current presence states |
| `GET` | `/api/v1/agents/teams` | Lists departments / call center queues |
| `POST` | `/api/v1/agents/:id/state` | Supervisor manual override (e.g. Put on Break / Force Active) |
| `GET` | `/api/v1/analytics/summary` | Executive dashboard metrics (AHT, Adherence %, Occupancy Rate) |
| `GET` | `/api/v1/analytics/agent/:id/timeline` | Activity logs and top apps for an individual agent |
| `WS` | `ws://localhost:5000` | Sub-second WebSocket stream for instant agent status updates |
