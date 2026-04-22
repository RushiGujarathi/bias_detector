# ⚖️ UnbiasedAI — Bias Detection & Auto Fairness Fixer

> A hackathon-ready web application that detects bias in CSV datasets and automatically suggests and applies fairness improvements using AI.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![React](https://img.shields.io/badge/react-18-blue)
![FastAPI](https://img.shields.io/badge/fastapi-0.111-teal)

---

## 🗂 Folder Structure

```
bias-detector/
├── backend/
│   ├── main.py                   # FastAPI app — all endpoints + ML logic
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variable template
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Main app with full UI
│       ├── index.css             # Global design system CSS
│       ├── components/
│       │   ├── Header.jsx        # Top nav bar
│       │   ├── UploadZone.jsx    # Drag & drop CSV upload
│       │   ├── BiasDashboard.jsx # Bias score charts & heatmap
│       │   ├── ScoreRing.jsx     # SVG fairness score ring
│       │   ├── ComparisonView.jsx# Before vs After charts
│       │   └── ExplanationPanel.jsx # Gemini AI explanation
│       └── utils/
│           └── api.js            # Axios API calls
└── data/
    └── sample_biased_dataset.csv # Pre-built biased dataset for testing
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free)

---

### 1. Backend Setup

```bash
cd bias-detector/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the backend
uvicorn main:app --reload --port 8000
```

Backend will be live at: **http://localhost:8000**
API docs (Swagger): **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd bias-detector/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env → VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will be live at: **http://localhost:3000**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key from [AI Studio](https://aistudio.google.com) | Optional (falls back to built-in analysis) |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend URL | `http://localhost:8000` |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/analyze` | Upload CSV → get bias report + Gemini explanation |
| `POST` | `/api/fix` | Upload CSV → auto-fix + before/after comparison |
| `POST` | `/api/download-fixed` | Upload CSV → download rebalanced CSV |
| `GET` | `/api/sample-dataset` | Get the built-in sample biased dataset |

---

## 🧠 How Bias Detection Works

### Detected Biases
1. **Gender Bias** — Distribution imbalance + disparate impact ratio (threshold: 0.8)
2. **Age Bias** — Age group representation (`<30`, `30–45`, `45–60`, `60+`)
3. **Income Bias** — Quartile-based income group analysis

### Metrics Used
- **Distribution Bias Score** (0–100): Deviation from equal representation
- **Disparate Impact Ratio**: min_group_rate / max_group_rate (≥ 0.8 = fair)
- **Positive Rate Gap**: Outcome probability difference across demographic groups
- **Overall Fairness Score** (0–100): Composite metric

### Auto-Fix Steps
1. **Gender rebalancing** via oversampling (sklearn `resample`)
2. **Target variable balancing** (equal class distribution)
3. **Age outlier removal** (5th–95th percentile clipping)

---

## 📊 Charts Included

- **Fairness Score Ring** — SVG animated score gauge
- **Bias Radar Chart** — Multi-factor bias view (before & after)
- **Bias Score Bar Chart** — Per-category comparison
- **Distribution Bar Charts** — Gender, age, income breakdowns
- **Hire Rate by Gender** — Outcome disparity visualization
- **Before vs After Comparison** — Full radar + bar overlay

---

## 🌐 Deployment

### Backend → Render

1. Push `bias-detector/backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set:
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment variable**: `GEMINI_API_KEY=your_key_here`
5. Deploy → copy the service URL (e.g. `https://bias-api.onrender.com`)

### Frontend → Netlify

1. Push `bias-detector/frontend/` to a GitHub repo (or separate folder)
2. Go to [netlify.com](https://netlify.com) → New Site from Git
3. Set:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment variable**: `VITE_API_URL=https://bias-api.onrender.com`
4. Deploy ✅

---

## 🧪 Testing with Sample Dataset

The sample dataset (`data/sample_biased_dataset.csv`) is pre-built with:
- **50 records** — heavily skewed toward male hires
- Gender distribution: ~70% Male / 30% Female
- Hire rate: ~95% Male / ~5% Female
- Age bias: skewed toward 25–45 range
- Disparate impact ratio: ~0.05 (far below 0.8 threshold)

Click **"Load Sample"** in the UI to test without uploading a file.

---

## 🏆 Hackathon Highlights

| Feature | Implementation |
|---|---|
| AI Bias Detection | pandas + scikit-learn statistical analysis |
| Fairness Metrics | Disparate Impact, Distribution Score, Rate Gap |
| Auto Fix | Oversampling (resample), outlier removal |
| AI Explanation | Google Gemini 2.0 Flash |
| Charts | Recharts — Radar, Bar, Custom SVG Ring |
| UI | React + custom CSS design system, dark theme |
| Drag & Drop | react-dropzone |
| Deployment Ready | Render (backend) + Netlify (frontend) |

---

## 📄 License

MIT © 2024 UnbiasedAI
