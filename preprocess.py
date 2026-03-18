import pandas as pd
from textblob import TextBlob

df = pd.read_excel("PHQ9_Student_Depression_Dataset_Updated.xlsx")

text_cols = df.columns[1:10]
for col in text_cols:
    df[col] = df[col].apply(lambda x: round(TextBlob(str(x)).sentiment.polarity, 4))

severity_map = {"Minimal": 0, "Mild": 1, "Moderate": 2, "Moderately Severe": 3, "Severe": 4}
df["Severity Level"] = df["Severity Level"].map(severity_map)

df.to_csv("processed_dataset.csv", index=False)
