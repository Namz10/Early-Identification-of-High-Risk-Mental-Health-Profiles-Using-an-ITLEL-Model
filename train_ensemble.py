import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
from xgboost import XGBClassifier
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import joblib

df = pd.read_csv("processed_dataset.csv")
X = df.drop(columns=["ID", "PHQ-9 Score", "Severity Level"]).values
y = df["Severity Level"].values
n_classes = len(np.unique(y))

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
scaler = StandardScaler()
X_tr = scaler.fit_transform(X_tr)
X_te = scaler.transform(X_te)

xgb1 = XGBClassifier(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42, eval_metric="mlogloss")
xgb2 = XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.05, random_state=99, eval_metric="mlogloss")
xgb1.fit(X_tr, y_tr)
xgb2.fit(X_tr, y_tr)

xgb_meta_tr = np.hstack([xgb1.predict_proba(X_tr), xgb2.predict_proba(X_tr)])
xgb_meta_te = np.hstack([xgb1.predict_proba(X_te), xgb2.predict_proba(X_te)])


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


def train_tab(X, y, seed, epochs=100):
    torch.manual_seed(seed)
    m = TabTransformer(X.shape[1], len(np.unique(y)))
    opt = torch.optim.Adam(m.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()
    dl = DataLoader(TensorDataset(torch.FloatTensor(X), torch.LongTensor(y)), batch_size=32, shuffle=True)
    m.train()
    for _ in range(epochs):
        for xb, yb in dl:
            opt.zero_grad()
            loss_fn(m(xb), yb).backward()
            opt.step()
    return m


def tab_proba(m, X):
    m.eval()
    with torch.no_grad():
        return torch.softmax(m(torch.FloatTensor(X)), 1).numpy()


tab1 = train_tab(X_tr, y_tr, 42)
tab2 = train_tab(X_tr, y_tr, 99)

tab_meta_tr = np.hstack([tab_proba(tab1, X_tr), tab_proba(tab2, X_tr)])
tab_meta_te = np.hstack([tab_proba(tab1, X_te), tab_proba(tab2, X_te)])

svm = SVC(probability=True, kernel="rbf", random_state=42)
svm.fit(xgb_meta_tr, y_tr)

knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(tab_meta_tr, y_tr)

svm_p = svm.predict_proba(xgb_meta_te)
knn_p = knn.predict_proba(tab_meta_te)

final_proba = 0.6 * svm_p + 0.4 * knn_p
final_pred = np.argmax(final_proba, axis=1)
risk_score = np.sum(final_proba * np.arange(n_classes), axis=1) / (n_classes - 1)

print(f"Accuracy: {accuracy_score(y_te, final_pred):.4f}")
print(f"ROC AUC:  {roc_auc_score(y_te, final_proba, multi_class='ovr'):.4f}")
print(classification_report(y_te, final_pred, target_names=["Minimal","Mild","Moderate","Mod Severe","Severe"]))

joblib.dump({"scaler": scaler, "xgb1": xgb1, "xgb2": xgb2, "svm": svm, "knn": knn, "n_classes": n_classes}, "ensemble_model.pkl")
torch.save({"tab1": tab1.state_dict(), "tab2": tab2.state_dict(), "n_feat": X.shape[1], "n_classes": n_classes}, "tab_models.pt")
