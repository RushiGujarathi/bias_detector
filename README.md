# ⚖️ UnbiasedAI — Bias Detection & Fairness Advisor

github link-https://github.com/RushiGujarathi/bias_detector
Drive link-https://drive.google.com/file/d/1tWEDesEjvE-I5EectwgBfU5MuwxER5WX/view?usp=drive_link

**Live Demo:** 
Frontend:https://bias-detector-eight.vercel.app/ 
Backend API:https://bias-detector-f9iv.onrender.com/

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**frontend/.env**
```
VITE_API_URL=https://bias-detector-f9iv.onrender.com/
```

Runs at: http://localhost:3000

---

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

**backend/.env**
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get free Gemini API key: https://aistudio.google.com/app/apikey
(App works without it too — uses built-in analysis)

Runs at: http://localhost:8000
