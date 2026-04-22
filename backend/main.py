from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
from io import StringIO, BytesIO
import json
import os
import httpx
from typing import Optional
import re

app = FastAPI(title="Bias Detector API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# ─── Bias Detection ───────────────────────────────────────────────────────────

def detect_bias(df: pd.DataFrame) -> dict:
    results = {}
    sensitive_cols = []

    col_lower = {c: c.lower() for c in df.columns}
    gender_col = next((c for c, l in col_lower.items() if "gender" in l or "sex" in l), None)
    age_col    = next((c for c, l in col_lower.items() if "age" in l), None)
    income_col = next((c for c, l in col_lower.items() if "income" in l or "salary" in l or "wage" in l), None)
    target_col = next((c for c, l in col_lower.items() if l in ("hired", "approved", "label", "target", "outcome", "result")), None)

    if gender_col:
        sensitive_cols.append(gender_col)
        g = df[gender_col].value_counts(normalize=True).to_dict()
        results["gender"] = {
            "distribution": {str(k): round(v * 100, 2) for k, v in g.items()},
            "bias_score": _distribution_bias(list(g.values())),
            "count": df[gender_col].value_counts().to_dict(),
        }
        if target_col and target_col in df.columns:
            pos_rates = df.groupby(gender_col)[target_col].mean().to_dict()
            results["gender"]["positive_rates"] = {str(k): round(v * 100, 2) for k, v in pos_rates.items()}
            if len(pos_rates) >= 2:
                vals = list(pos_rates.values())
                results["gender"]["disparate_impact"] = round(min(vals) / max(vals), 3) if max(vals) > 0 else 1.0

    if age_col and pd.api.types.is_numeric_dtype(df[age_col]):
        sensitive_cols.append(age_col)
        bins = [0, 30, 45, 60, 200]
        labels = ["<30", "30-45", "45-60", "60+"]
        df["_age_group"] = pd.cut(df[age_col], bins=bins, labels=labels, right=False)
        ag = df["_age_group"].value_counts(normalize=True).sort_index().to_dict()
        results["age"] = {
            "distribution": {str(k): round(v * 100, 2) for k, v in ag.items()},
            "bias_score": _distribution_bias(list(ag.values())),
            "mean_age": round(df[age_col].mean(), 1),
            "std_age": round(df[age_col].std(), 1),
        }
        if target_col and target_col in df.columns:
            pos_rates = df.groupby("_age_group", observed=True)[target_col].mean().to_dict()
            results["age"]["positive_rates"] = {str(k): round(v * 100, 2) for k, v in pos_rates.items()}
        df.drop(columns=["_age_group"], inplace=True)

    if income_col and pd.api.types.is_numeric_dtype(df[income_col]):
        sensitive_cols.append(income_col)
        q1, q2, q3 = df[income_col].quantile([0.33, 0.66, 1.0])
        bins = [-np.inf, q1, q2, np.inf]
        labels = ["Low", "Medium", "High"]
        df["_income_group"] = pd.cut(df[income_col], bins=bins, labels=labels)
        ig = df["_income_group"].value_counts(normalize=True).to_dict()
        results["income"] = {
            "distribution": {str(k): round(v * 100, 2) for k, v in ig.items()},
            "bias_score": _distribution_bias(list(ig.values())),
            "mean_income": round(df[income_col].mean(), 2),
            "median_income": round(df[income_col].median(), 2),
        }
        if target_col and target_col in df.columns:
            pos_rates = df.groupby("_income_group", observed=True)[target_col].mean().to_dict()
            results["income"]["positive_rates"] = {str(k): round(v * 100, 2) for k, v in pos_rates.items()}
        df.drop(columns=["_income_group"], inplace=True)

    overall = _overall_fairness_score(results)
    return {
        "bias_metrics": results,
        "overall_fairness_score": overall,
        "sensitive_columns": sensitive_cols,
        "target_column": target_col,
        "total_rows": len(df),
        "columns": list(df.columns),
    }


def _distribution_bias(values: list) -> float:
    if not values or len(values) < 2:
        return 0.0
    ideal = 1.0 / len(values)
    deviation = sum(abs(v - ideal) for v in values) / len(values)
    return round(min(deviation * 200, 100), 1)


def _overall_fairness_score(metrics: dict) -> float:
    scores = []
    for key, val in metrics.items():
        if "bias_score" in val:
            scores.append(100 - val["bias_score"])
        if "disparate_impact" in val:
            di = val["disparate_impact"]
            scores.append(min(di / 0.8, 1.0) * 100)
    return round(np.mean(scores), 1) if scores else 100.0


# ─── Suggestions (No CSV changes) ────────────────────────────────────────────

def generate_suggestions(bias_metrics: dict, target_col: str | None, total_rows: int) -> list[dict]:
    """
    Returns actionable, data-driven suggestions based on detected bias.
    The original CSV is NEVER modified — suggestions are recommendations only.
    """
    suggestions = []

    col_lower_keys = list(bias_metrics.keys())

    # ── Gender suggestions ────────────────────────────────────────────────────
    if "gender" in bias_metrics:
        g = bias_metrics["gender"]
        dist = g.get("distribution", {})
        bias_score = g.get("bias_score", 0)
        di = g.get("disparate_impact")
        pos_rates = g.get("positive_rates", {})

        # Distribution imbalance
        if dist and bias_score > 15:
            groups = sorted(dist.items(), key=lambda x: x[1])
            minority = groups[0]
            majority = groups[-1]
            gap = round(majority[1] - minority[1], 1)
            suggestions.append({
                "category": "Gender",
                "severity": "High" if bias_score > 40 else "Medium",
                "issue": f"Gender distribution is skewed — {majority[0]} ({majority[1]}%) vs {minority[0]} ({minority[1]}%), a {gap}% gap.",
                "suggestion": f"Collect more data from underrepresented group '{minority[0]}' to close the {gap}% gap. Target at least {round(majority[1] * 0.8)}% representation.",
                "technique": "Data Collection / Stratified Sampling",
                "impact": "Reduces demographic underrepresentation in the dataset.",
            })

        # Disparate impact in outcomes
        if di is not None and di < 0.8 and pos_rates:
            groups_sorted = sorted(pos_rates.items(), key=lambda x: x[1])
            low_grp, low_rate = groups_sorted[0]
            high_grp, high_rate = groups_sorted[-1]
            suggestions.append({
                "category": "Gender",
                "severity": "Critical" if di < 0.5 else "High",
                "issue": f"Disparate Impact Ratio = {di} (legal threshold: 0.8). '{low_grp}' has only {low_rate}% positive rate vs '{high_grp}' at {high_rate}%.",
                "suggestion": f"Audit the decision-making criteria for '{target_col or 'outcome'}'. Remove or re-weight features that act as proxies for gender (e.g. job title, department). Apply fairness constraints during model training.",
                "technique": "Disparate Impact Removal / Reweighing",
                "impact": f"Brings DI ratio from {di} closer to the 0.8 threshold, reducing discriminatory outcomes.",
            })

        # Positive rate gap without DI
        if pos_rates and di is None:
            rates = list(pos_rates.values())
            if max(rates) - min(rates) > 20:
                suggestions.append({
                    "category": "Gender",
                    "severity": "Medium",
                    "issue": f"Positive rate gap across gender groups exceeds 20%.",
                    "suggestion": "Review selection criteria for consistency across gender groups. Consider calibrated threshold adjustment per group.",
                    "technique": "Equalized Odds / Calibration",
                    "impact": "Equalizes outcome probability across gender groups.",
                })

    # ── Age suggestions ───────────────────────────────────────────────────────
    if "age" in bias_metrics:
        a = bias_metrics["age"]
        bias_score = a.get("bias_score", 0)
        dist = a.get("distribution", {})
        pos_rates = a.get("positive_rates", {})

        if bias_score > 15 and dist:
            groups = sorted(dist.items(), key=lambda x: x[1])
            minority = groups[0]
            majority = groups[-1]
            suggestions.append({
                "category": "Age",
                "severity": "High" if bias_score > 40 else "Medium",
                "issue": f"Age group '{majority[0]}' dominates at {majority[1]}% while '{minority[0]}' is only {minority[1]}% of the dataset.",
                "suggestion": f"Ensure recruitment/data collection spans all age groups equally. Target ≥20% representation per age band. Check if age-correlated features (e.g. years of experience) are creating indirect bias.",
                "technique": "Stratified Sampling by Age Group",
                "impact": "Reduces age-based representation bias in training data.",
            })

        if pos_rates:
            rates = list(pos_rates.values())
            if rates and max(rates) - min(rates) > 25:
                worst = min(pos_rates, key=pos_rates.get)
                best = max(pos_rates, key=pos_rates.get)
                suggestions.append({
                    "category": "Age",
                    "severity": "High",
                    "issue": f"Age group '{worst}' has a {pos_rates[worst]}% success rate vs '{best}' at {pos_rates[best]}% — a {round(pos_rates[best]-pos_rates[worst],1)}% gap.",
                    "suggestion": "Remove age as a direct feature if not legally required. Audit correlated proxies (graduation year, tenure). Apply individual fairness constraints.",
                    "technique": "Feature Removal / Fairness-Aware Training",
                    "impact": "Prevents age from being a predictive signal in model decisions.",
                })

    # ── Income suggestions ────────────────────────────────────────────────────
    if "income" in bias_metrics:
        inc = bias_metrics["income"]
        bias_score = inc.get("bias_score", 0)
        dist = inc.get("distribution", {})
        mean_inc = inc.get("mean_income", 0)
        median_inc = inc.get("median_income", 0)

        if bias_score > 15 and dist:
            groups = sorted(dist.items(), key=lambda x: x[1])
            minority = groups[0]
            majority = groups[-1]
            suggestions.append({
                "category": "Income",
                "severity": "High" if bias_score > 40 else "Medium",
                "issue": f"Income distribution skewed — '{majority[0]}' income group is {majority[1]}% of dataset vs '{minority[0]}' at {minority[1]}%.",
                "suggestion": "Apply income-group stratified sampling. If income is used as a feature, consider binning into equal-width brackets or removing it to prevent socioeconomic proxy bias.",
                "technique": "Stratified Sampling / Feature Engineering",
                "impact": "Prevents income level from creating compounding disadvantage in outcomes.",
            })

        if mean_inc and median_inc and abs(mean_inc - median_inc) / (median_inc + 1) > 0.3:
            suggestions.append({
                "category": "Income",
                "severity": "Medium",
                "issue": f"Large mean-median gap (mean: {mean_inc:,.0f}, median: {median_inc:,.0f}) suggests outlier skew.",
                "suggestion": "Consider log-transforming income or capping at the 95th percentile to reduce the influence of extreme values on model training.",
                "technique": "Log Transform / Winsorization",
                "impact": "Reduces influence of income outliers, preventing model from over-indexing on extremes.",
            })

    # ── General suggestions always included ──────────────────────────────────
    suggestions.append({
        "category": "General",
        "severity": "Info",
        "issue": "Ongoing fairness monitoring is not reflected in this dataset.",
        "suggestion": "Set up periodic bias audits (every model retraining cycle). Use tools like Fairlearn or AIF360 to measure fairness metrics in production.",
        "technique": "Fairness Monitoring / MLOps",
        "impact": "Ensures bias does not re-emerge as the dataset grows or model is retrained.",
    })

    return suggestions


# ─── Gemini Integration ───────────────────────────────────────────────────────

async def get_gemini_explanation(bias_data: dict) -> str:
    if not GEMINI_API_KEY:
        return _fallback_explanation(bias_data)

    prompt = f"""You are a fairness and AI ethics expert. Analyze this bias report and provide:
1. A clear explanation of detected biases
2. Why these biases are problematic
3. Specific improvement suggestions
4. A fairness summary

Bias Report:
- Overall Fairness Score: {bias_data.get('overall_fairness_score')}%
- Total Records: {bias_data.get('total_rows')}
- Metrics: {json.dumps(bias_data.get('bias_metrics', {}), indent=2)}

Keep the response concise, professional, and actionable. Use bullet points."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return _fallback_explanation(bias_data)


def _fallback_explanation(bias_data: dict) -> str:
    score = bias_data.get("overall_fairness_score", 0)
    metrics = bias_data.get("bias_metrics", {})
    lines = [f"**Fairness Score: {score}%**\n"]

    if "gender" in metrics:
        bs = metrics["gender"].get("bias_score", 0)
        lines.append(f"• **Gender Bias Score: {bs}%** — {'High bias detected. Distribution is significantly skewed.' if bs > 30 else 'Moderate bias present.' if bs > 15 else 'Low bias detected.'}")
        if "disparate_impact" in metrics["gender"]:
            di = metrics["gender"]["disparate_impact"]
            lines.append(f"  - Disparate Impact Ratio: {di} (threshold: 0.8 — {'⚠️ Below threshold' if di < 0.8 else '✅ Acceptable'})")

    if "age" in metrics:
        bs = metrics["age"].get("bias_score", 0)
        lines.append(f"• **Age Bias Score: {bs}%** — {'Age groups are heavily imbalanced.' if bs > 30 else 'Some age group disparity present.'}")

    if "income" in metrics:
        bs = metrics["income"].get("bias_score", 0)
        lines.append(f"• **Income Bias Score: {bs}%** — {'Income distribution is skewed.' if bs > 30 else 'Income spread is moderate.'}")

    lines.append("\n**Recommendations:**")
    lines.append("• Apply oversampling (SMOTE) to underrepresented groups")
    lines.append("• Use fairness-aware ML algorithms during model training")
    lines.append("• Regularly audit model outputs across demographic groups")
    lines.append("• Consider adversarial debiasing techniques")

    return "\n".join(lines)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Bias Detector API running", "version": "1.0.0"}


@app.post("/api/analyze")
async def analyze_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")
    content = await file.read()
    try:
        df = pd.read_csv(StringIO(content.decode("utf-8")))
    except Exception as e:
        raise HTTPException(400, f"Failed to parse CSV: {str(e)}")

    if df.empty or len(df.columns) < 2:
        raise HTTPException(400, "Dataset must have at least 2 columns and 1 row")

    bias_results = detect_bias(df)
    explanation = await get_gemini_explanation(bias_results)
    bias_results["explanation"] = explanation
    bias_results["filename"] = file.filename
    return bias_results


@app.post("/api/suggestions")
async def get_suggestions(file: UploadFile = File(...)):
    """
    Analyze the dataset for bias and return actionable suggestions.
    The original CSV data is NEVER modified — this is a read-only analysis.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")
    content = await file.read()
    try:
        df = pd.read_csv(StringIO(content.decode("utf-8")))
    except Exception:
        raise HTTPException(400, "Failed to parse CSV")

    if df.empty or len(df.columns) < 2:
        raise HTTPException(400, "Dataset must have at least 2 columns and 1 row")

    # Detect bias (read-only, df is not modified)
    bias_results = detect_bias(df.copy())

    # Generate suggestions based on metrics
    suggestions = generate_suggestions(
        bias_results["bias_metrics"],
        bias_results.get("target_column"),
        bias_results["total_rows"],
    )

    # Get Gemini explanation
    explanation = await get_gemini_explanation(bias_results)

    return {
        "bias_metrics": bias_results["bias_metrics"],
        "overall_fairness_score": bias_results["overall_fairness_score"],
        "sensitive_columns": bias_results["sensitive_columns"],
        "target_column": bias_results["target_column"],
        "total_rows": bias_results["total_rows"],
        "columns": bias_results["columns"],
        "suggestions": suggestions,
        "explanation": explanation,
        "note": "Original dataset is unchanged. These are recommendations only.",
    }


@app.get("/api/sample-dataset")
def get_sample_dataset():
    sample_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample_biased_dataset.csv")
    try:
        df = pd.read_csv(sample_path)
        return {"csv": df.to_csv(index=False), "rows": len(df), "columns": list(df.columns)}
    except FileNotFoundError:
        raise HTTPException(404, "Sample dataset not found")