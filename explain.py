import numpy as np
import pandas as pd
import shap
from lime.lime_tabular import LimeTabularExplainer
import joblib
import torch
import torch.nn as nn
import json


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


bundle = joblib.load("ensemble_model.pkl")
td = torch.load("tab_models.pt", weights_only=False)
tab1 = TabTransformer(td["n_feat"], td["n_classes"])
tab1.load_state_dict(td["tab1"])
tab2 = TabTransformer(td["n_feat"], td["n_classes"])
tab2.load_state_dict(td["tab2"])


def _tab_proba(m, X):
    m.eval()
    with torch.no_grad():
        return torch.softmax(m(torch.FloatTensor(X)), 1).numpy()


def ensemble_predict_proba(X_raw):
    Xs = bundle["scaler"].transform(X_raw)
    xgb_meta = np.hstack([bundle["xgb1"].predict_proba(Xs), bundle["xgb2"].predict_proba(Xs)])
    tab_meta = np.hstack([_tab_proba(tab1, Xs), _tab_proba(tab2, Xs)])
    return 0.6 * bundle["svm"].predict_proba(xgb_meta) + 0.4 * bundle["knn"].predict_proba(tab_meta)


def get_risk_score(X_raw):
    p = ensemble_predict_proba(X_raw)
    return np.sum(p * np.arange(p.shape[1]), axis=1) / (p.shape[1] - 1)


def classify_risk(score):
    if score >= 0.66:
        return "High"
    if score >= 0.33:
        return "Medium"
    return "Low"


def explain(sample, X_bg, feature_names):
    risk = float(get_risk_score(sample.reshape(1, -1))[0])
    category = classify_risk(risk)

    shap_ex = shap.KernelExplainer(get_risk_score, shap.sample(X_bg, 50))
    shap_vals = shap_ex.shap_values(sample.reshape(1, -1))[0]

    lime_ex = LimeTabularExplainer(X_bg, feature_names=feature_names, mode="regression")
    lime_result = lime_ex.explain_instance(sample, get_risk_score, num_features=len(feature_names))

    return {
        "risk_score": risk,
        "risk_category": category,
        "shap_values": {fn: float(sv) for fn, sv in zip(feature_names, shap_vals)},
        "lime_values": dict(lime_result.as_list()),
        "feature_values": {fn: float(fv) for fn, fv in zip(feature_names, sample)},
    }


if __name__ == "__main__":
    df = pd.read_csv("processed_dataset.csv")
    X = df.drop(columns=["ID", "PHQ-9 Score", "Severity Level"]).values
    fnames = list(df.drop(columns=["ID", "PHQ-9 Score", "Severity Level"]).columns)

    result = explain(X[0], X, fnames)

    with open("explanation_result.json", "w") as f:
        json.dump(result, f, indent=2)

    print(f"Risk: {result['risk_score']:.4f} | Category: {result['risk_category']}")
