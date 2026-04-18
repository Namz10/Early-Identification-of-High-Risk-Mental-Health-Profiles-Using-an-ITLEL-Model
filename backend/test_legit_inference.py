import sys
import os
# Add backend app to path if needed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "app")))

from app.ml.inference import run_inference

def test():
    print("Testing ML Inference...")
    try:
        # Standard responses (Mild/Minimal range)
        responses = [1, 0, 1, 0, 0, 1, 0, 0, 0]
        result = run_inference(responses)
        print("Success!")
        print(f"Risk Level: {result['risk_level']}")
        print(f"Risk Score: {result['risk_score_raw']:.4f}")
        print(f"Confidence: {result['confidence_score']:.4f}")
        print(f"SHAP Keys: {list(result['shap_values'].keys())}")
    except Exception as e:
        print(f"Inference failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test()
