"""
Model service — loads the ITLEL ensemble model and provides inference + explainability.
Falls back to dummy scoring if model files are not available.
"""

import os
import numpy as np
from pathlib import Path
from textblob import TextBlob

# Root directory (one level up from backend/)
ROOT_DIR = Path(__file__).resolve().parent.parent

MODEL_LOADED = False
bundle = None
tab1 = None
tab2 = None
background_data = None
feature_names = None

# ── Text mappings for numeric PHQ-9 options ──────────────────────────────────
# The model was trained on TextBlob sentiment of free-text responses.
# These representative phrases map each numeric option to approximate text.
OPTION_TEXT_MAP = {
    0: "I have not experienced this at all. I feel perfectly fine regarding this.",
    1: "I have felt this way on several days. It happens sometimes but not often.",
    2: "I have experienced this more than half the days. It bothers me frequently.",
    3: "I experience this nearly every day. It is a constant struggle and concern.",
}


def text_to_sentiment(text: str) -> float:
    """Convert text to TextBlob polarity score."""
    return round(TextBlob(str(text)).sentiment.polarity, 4)


def answers_to_features(answers: list[int]) -> np.ndarray:
    """Convert 9 numeric answers (0-3) to sentiment feature vector."""
    features = []
    for val in answers:
        text = OPTION_TEXT_MAP.get(val, OPTION_TEXT_MAP[0])
        features.append(text_to_sentiment(text))
    return np.array(features, dtype=np.float64)


def try_load_models():
    """Attempt to load models at startup. Sets MODEL_LOADED flag."""
    global MODEL_LOADED, bundle, tab1, tab2, background_data, feature_names

    ensemble_path = ROOT_DIR / "ensemble_model.pkl"
    tab_path = ROOT_DIR / "tab_models.pt"
    csv_path = ROOT_DIR / "processed_dataset.csv"

    if not ensemble_path.exists() or not tab_path.exists():
        print(f"[model_service] Model files not found at {ROOT_DIR}")
        print("[model_service] Running in FALLBACK mode (dummy scoring)")
        MODEL_LOADED = False
        return

    try:
        import joblib
        import torch
        import torch.nn as nn
        import pandas as pd

        # TabTransformer class (must match training)
        class TabTransformer(nn.Module):
            def __init__(self, n_feat, n_cls, d=32):
                super().__init__()
                self.embed = nn.Linear(1, d)
                self.tf = nn.TransformerEncoder(
                    nn.TransformerEncoderLayer(d, 2, 64, batch_first=True, dropout=0.1), 2
                )
                self.head = nn.Sequential(
                    nn.Linear(n_feat * d, 64), nn.ReLU(), nn.Dropout(0.1), nn.Linear(64, n_cls)
                )

            def forward(self, x):
                x = self.tf(self.embed(x.unsqueeze(-1)))
                return self.head(x.flatten(1))

        bundle = joblib.load(str(ensemble_path))
        td = torch.load(str(tab_path), weights_only=False)

        tab1 = TabTransformer(td["n_feat"], td["n_classes"])
        tab1.load_state_dict(td["tab1"])
        tab2 = TabTransformer(td["n_feat"], td["n_classes"])
        tab2.load_state_dict(td["tab2"])

        # Load background data for SHAP/LIME
        if csv_path.exists():
            df = pd.read_csv(str(csv_path))
            background_data = df.drop(columns=["ID", "PHQ-9 Score", "Severity Level"]).values
            feature_names = list(df.drop(columns=["ID", "PHQ-9 Score", "Severity Level"]).columns)
        else:
            feature_names = [f"Q{i+1}_sentiment" for i in range(9)]

        MODEL_LOADED = True
        print("[model_service] Models loaded successfully!")

    except Exception as e:
        print(f"[model_service] Failed to load models: {e}")
        MODEL_LOADED = False


def _tab_proba(m, X):
    """Get TabTransformer prediction probabilities."""
    import torch
    m.eval()
    with torch.no_grad():
        return torch.softmax(m(torch.FloatTensor(X)), 1).numpy()


def ensemble_predict_proba(X_raw: np.ndarray) -> np.ndarray:
    """Run full ensemble prediction pipeline."""
    Xs = bundle["scaler"].transform(X_raw)
    xgb_meta = np.hstack([bundle["xgb1"].predict_proba(Xs), bundle["xgb2"].predict_proba(Xs)])
    tab_meta = np.hstack([_tab_proba(tab1, Xs), _tab_proba(tab2, Xs)])
    return 0.6 * bundle["svm"].predict_proba(xgb_meta) + 0.4 * bundle["knn"].predict_proba(tab_meta)


def get_risk_score(X_raw: np.ndarray) -> np.ndarray:
    """Compute continuous risk score (0-1) from ensemble probabilities."""
    p = ensemble_predict_proba(X_raw)
    return np.sum(p * np.arange(p.shape[1]), axis=1) / (p.shape[1] - 1)


def classify_risk(score: float) -> str:
    """Map risk score to category."""
    if score >= 0.66:
        return "High"
    if score >= 0.33:
        return "Medium"
    return "Low"


def predict_with_model(answers: list[int]) -> dict:
    """Run full model prediction with SHAP + LIME explainability."""
    import shap
    from lime.lime_tabular import LimeTabularExplainer

    features = answers_to_features(answers)
    sample = features.reshape(1, -1)

    # Prediction
    proba = ensemble_predict_proba(sample)[0]
    risk_score = float(get_risk_score(sample)[0])
    risk_category = classify_risk(risk_score)
    predicted_class = int(np.argmax(proba))

    severity_labels = ["Minimal", "Mild", "Moderate", "Moderately Severe", "Severe"]
    fnames = feature_names or [f"Q{i+1}" for i in range(9)]

    result = {
        "risk_score": risk_score,
        "risk_category": risk_category,
        "predicted_severity": severity_labels[predicted_class] if predicted_class < len(severity_labels) else "Unknown",
        "probabilities": {
            severity_labels[i]: round(float(proba[i]), 4)
            for i in range(len(proba))
            if i < len(severity_labels)
        },
        "feature_sentiments": {fnames[i]: float(features[i]) for i in range(len(features))},
        "shap_values": None,
        "lime_values": None,
        "model_used": True,
    }

    # SHAP explainability
    try:
        bg = shap.sample(background_data, 50) if background_data is not None else sample
        shap_ex = shap.KernelExplainer(get_risk_score, bg)
        shap_vals = shap_ex.shap_values(sample)[0]
        result["shap_values"] = {fnames[i]: round(float(shap_vals[i]), 6) for i in range(len(shap_vals))}
    except Exception as e:
        print(f"[model_service] SHAP failed: {e}")
        result["shap_values"] = None

    # LIME explainability
    try:
        bg_data = background_data if background_data is not None else sample
        lime_ex = LimeTabularExplainer(bg_data, feature_names=fnames, mode="regression")
        lime_result = lime_ex.explain_instance(features, get_risk_score, num_features=len(fnames))
        result["lime_values"] = dict(lime_result.as_list())
    except Exception as e:
        print(f"[model_service] LIME failed: {e}")
        result["lime_values"] = None

    return result


def predict_dummy(answers: list[int]) -> dict:
    """Fallback dummy scoring when model files are not available."""
    total_score = sum(answers)
    max_score = 27

    # Map PHQ-9 total to risk tiers
    if total_score <= 4:
        severity = "Minimal"
        risk_category = "Low"
        risk_score = total_score / max_score
    elif total_score <= 9:
        severity = "Mild"
        risk_category = "Low"
        risk_score = total_score / max_score
    elif total_score <= 14:
        severity = "Moderate"
        risk_category = "Medium"
        risk_score = total_score / max_score
    elif total_score <= 19:
        severity = "Moderately Severe"
        risk_category = "High"
        risk_score = total_score / max_score
    else:
        severity = "Severe"
        risk_category = "High"
        risk_score = total_score / max_score

    # Generate dummy SHAP values based on answer weights
    feature_names_dummy = [f"Q{i+1}" for i in range(9)]
    dummy_shap = {}
    for i, name in enumerate(feature_names_dummy):
        # Higher answer values contribute more to risk
        dummy_shap[name] = round(answers[i] / max_score, 4)

    return {
        "risk_score": round(risk_score, 4),
        "risk_category": risk_category,
        "predicted_severity": severity,
        "probabilities": {
            "Minimal": round(max(0, 1 - total_score / 6), 4),
            "Mild": round(max(0, 1 - abs(total_score - 7) / 5), 4),
            "Moderate": round(max(0, 1 - abs(total_score - 12) / 5), 4),
            "Moderately Severe": round(max(0, 1 - abs(total_score - 17) / 5), 4),
            "Severe": round(max(0, 1 - abs(total_score - 24) / 5), 4),
        },
        "feature_sentiments": {f"Q{i+1}": answers[i] for i in range(9)},
        "shap_values": dummy_shap,
        "lime_values": {f"Q{i+1} > 0": round(answers[i] * 0.037, 4) for i in range(9)},
        "model_used": False,
    }


def predict(answers: list[int]) -> dict:
    """Main entry point — uses real model if available, otherwise dummy."""
    if MODEL_LOADED:
        return predict_with_model(answers)
    return predict_dummy(answers)
