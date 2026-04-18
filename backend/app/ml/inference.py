import joblib
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import shap
import os
from typing import List, Dict, Any

# --- MODEL DEFINITION (Must match training script) ---
class TabTransformer(nn.Module):
    def __init__(self, n_feat, n_cls, d=32):
        super().__init__()
        self.embed = nn.Linear(1, d)
        self.tf = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d, 2, 64, batch_first=True, dropout=0.1), 2
        )
        self.head = nn.Sequential(nn.Linear(n_feat * d, 64), nn.ReLU(), nn.Dropout(0.1), nn.Linear(64, n_cls))

    def forward(self, x):
        x = self.tf(self.embed(x.unsqueeze(-1)))
        return self.head(x.flatten(1))

# --- GLOBAL MODEL CACHE ---
MODELS = {}

def load_models():
    if MODELS: return MODELS
    
    # Paths (adjust to your project structure if needed)
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    ensemble_path = os.path.join(base_path, "ensemble_model.pkl")
    pytorch_path = os.path.join(base_path, "tab_models.pt")
    data_path = os.path.join(base_path, "processed_dataset.csv")

    # Load Ensemble Bundle
    bundle = joblib.load(ensemble_path)
    
    # Load PyTorch Models
    td = torch.load(pytorch_path, weights_only=False)
    tab1 = TabTransformer(td["n_feat"], td["n_classes"])
    tab1.load_state_dict(td["tab1"])
    tab2 = TabTransformer(td["n_feat"], td["n_classes"])
    tab2.load_state_dict(td["tab2"])
    
    # Background data for SHAP
    df = pd.read_csv(data_path)
    X_bg = df.drop(columns=["ID", "PHQ-9 Score", "Severity Level"]).values
    fnames = list(df.drop(columns=["ID", "PHQ-9 Score", "Severity Level"]).columns)

    MODELS.update({
        "scaler": bundle["scaler"],
        "xgb1": bundle["xgb1"],
        "xgb2": bundle["xgb2"],
        "svm": bundle["svm"],
        "knn": bundle["knn"],
        "tab1": tab1,
        "tab2": tab2,
        "X_bg": X_bg,
        "fnames": fnames
    })
    return MODELS

def _tab_proba(m, X):
    m.eval()
    with torch.no_grad():
        return torch.softmax(m(torch.FloatTensor(X)), 1).numpy()

def get_risk_score(X_raw):
    m = load_models()
    Xs = m["scaler"].transform(X_raw)
    
    xgb_meta = np.hstack([m["xgb1"].predict_proba(Xs), m["xgb2"].predict_proba(Xs)])
    tab_meta = np.hstack([_tab_proba(m["tab1"], Xs), _tab_proba(m["tab2"], Xs)])
    
    # Ensemble weighted average (SVM 60%, KNN 40%)
    svm_p = m["svm"].predict_proba(xgb_meta)
    knn_p = m["knn"].predict_proba(tab_meta)
    p = 0.6 * svm_p + 0.4 * knn_p
    
    # Calculate continuous risk score (0-1) across classes
    return np.sum(p * np.arange(p.shape[1]), axis=1) / (p.shape[1] - 1)

def run_inference(phq9_responses: List[int]) -> Dict[str, Any]:
    """
    Legit ITLEL Ensemble Inference Pipeline with SHAP Explainability.
    """
    m = load_models()
    X_sample = np.array(phq9_responses).reshape(1, -1)
    
    # 1. Calculate Risk Score and Level
    score = float(get_risk_score(X_sample)[0])
    
    # Map score to clinical levels
    if score >= 0.75: risk_level = "Severe"
    elif score >= 0.50: risk_level = "Moderate"
    elif score >= 0.25: risk_level = "Mild"
    else: risk_level = "Minimal"
    
    # 2. Confidence Score (using max probability of class)
    Xs = m["scaler"].transform(X_sample)
    xgb_meta = np.hstack([m["xgb1"].predict_proba(Xs), m["xgb2"].predict_proba(Xs)])
    tab_meta = np.hstack([_tab_proba(m["tab1"], Xs), _tab_proba(m["tab2"], Xs)])
    p = 0.6 * m["svm"].predict_proba(xgb_meta) + 0.4 * m["knn"].predict_proba(tab_meta)
    confidence = float(np.max(p))

    # 3. SHAP Explainability (KernelExplainer for Ensemble)
    # Using a small background sample for performance
    bg_sample = shap.sample(m["X_bg"], 50)
    explainer = shap.KernelExplainer(get_risk_score, bg_sample)
    shap_values = explainer.shap_values(X_sample)[0]
    
    # Mapping indices back to feature names used in dataset columns
    # We simplify names for the UI
    ui_feature_names = [
        "Anhedonia", "Depressed Mood", "Sleep Issue", "Energy", 
        "Appetite", "Self-Worth", "Concentration", "Psychomotor", "Self-Harm"
    ]
    
    shap_dict = {
        ui_feature_names[i]: float(shap_values[i]) 
        for i in range(len(ui_feature_names))
    }

    return {
        "risk_level": risk_level,
        "confidence_score": confidence,
        "shap_values": shap_dict,
        "risk_score_raw": score
    }
