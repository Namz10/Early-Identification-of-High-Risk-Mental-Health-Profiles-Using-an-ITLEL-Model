# Early Identification of High-Risk Mental Health Profiles Using an ITLEL Model

Mental health disorders are a growing global concern affecting people across different age groups & social backgrounds. Early identification of high-risk individuals is essential for timely support. This project proposes an **Interpretable Triple-Layer Ensemble Learning (ITLEL)** model that uses machine learning to analyze behavioral and psychological factors for early mental health risk detection.

## Architecture

```
Patient Input → Feature Processing → Triple-Layer Ensemble → Explainability (SHAP + LIME) → LLM Recommendations → PDF Report
```

### Triple-Layer Ensemble

| Layer | Component |
|-------|-----------|
| Layer 1 | XGBoost (2 tunings) + TabTransformer (2 seeds) |
| Layer 2 | SVM meta-learner (XGBoost) + KNN meta-learner (TabTransformer) |
| Layer 3 | Weighted ensemble → Risk score (0–1) → High / Medium / Low |

## Dataset

**PHQ-9 Student Depression Dataset** — 250 responses across 9 PHQ-9 questionnaire items with descriptive text answers, PHQ-9 scores, and severity labels (Minimal / Mild / Moderate / Moderately Severe / Severe).

## Pipeline

| Step | Script | Description |
|------|--------|-------------|
| 1 | `preprocess.py` | Sentiment analysis (TextBlob) on text responses, encodes severity labels |
| 2 | `train_ensemble.py` | Trains the triple-layer ensemble, saves models |
| 3 | `explain.py` | SHAP + LIME explainability, risk classification |

## Setup

```bash
pip install pandas textblob openpyxl xgboost scikit-learn torch shap lime joblib
```

## Usage

```bash
python preprocess.py
python train_ensemble.py
python explain.py
```

## Results

| Metric | Value |
|--------|-------|
| Accuracy | 90.00% |
| ROC AUC | 98.72% |

## License

MIT
