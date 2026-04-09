from typing import List

def run_inference(phq9_responses: List[int]) -> dict:
    """
    Mock inference function for PHQ-9.
    In production, this would call the actual ML model and SHAP explainer.
    """
    raw_score = sum(phq9_responses)
    
    if raw_score >= 15:
        risk_level = "High"
    elif raw_score >= 10:
        risk_level = "Moderate"
    else:
        risk_level = "Low"
        
    # Mock confidence score
    confidence_score = 0.85 + (raw_score % 10) / 100.0
    
    # Mock SHAP values (top contributors to depression risk)
    # Mapping indices based on common PHQ-9 interpretation
    feature_names = [
        "anhedonia", "depressed_mood", "sleep_disturbance", "fatigue", 
        "appetite_change", "self_worth_issues", "concentration_problems", 
        "psychomotor_agitation", "suicidal_ideation"
    ]
    
    shap_values = {}
    for i, score in enumerate(phq9_responses):
        # High score in a question increases SHAP impact
        shap_values[feature_names[i]] = (score * 0.1) + ((raw_score / 27) * 0.05)
        
    return {
        "risk_level": risk_level,
        "confidence_score": confidence_score,
        "shap_values": shap_values
    }
