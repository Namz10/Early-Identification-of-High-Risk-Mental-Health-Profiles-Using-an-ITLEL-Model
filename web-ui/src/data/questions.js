export const questions = [
  {
    id: 1,
    text: "Little interest or pleasure in doing things",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 2,
    text: "Feeling down, depressed, or hopeless",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 3,
    text: "Trouble falling or staying asleep, or sleeping too much",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 4,
    text: "Feeling tired or having little energy",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 5,
    text: "Poor appetite or overeating",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 6,
    text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 7,
    text: "Trouble concentrating on things, such as reading or watching television",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 8,
    text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being fidgety or restless",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
  {
    id: 9,
    text: "Thoughts that you would be better off dead, or of hurting yourself in some way",
    subtext: "How often have you been bothered by this over the last 2 weeks?",
  },
];

export const options = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

export const riskLevels = [
  {
    range: [0, 4],
    label: "Minimal",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    darkBgColor: "#1B3A1D",
    emoji: "🟢",
    description: "Your responses suggest minimal signs of depression. Continue maintaining healthy habits and self-care routines.",
    suggestions: [
      "Continue your current wellness habits",
      "Stay connected with friends and family",
      "Maintain regular sleep and exercise routines",
    ],
  },
  {
    range: [5, 9],
    label: "Mild",
    color: "#8BC34A",
    bgColor: "#F1F8E9",
    darkBgColor: "#1D3319",
    emoji: "🟡",
    description: "Your responses indicate mild symptoms. These are common and manageable, but it's worth monitoring how you feel.",
    suggestions: [
      "Practice regular self-care and stress management",
      "Consider talking to someone you trust about how you feel",
      "Monitor your symptoms over the next few weeks",
      "Engage in physical activity and mindfulness exercises",
    ],
  },
  {
    range: [10, 14],
    label: "Moderate",
    color: "#FFC107",
    bgColor: "#FFF8E1",
    darkBgColor: "#332B00",
    emoji: "🟠",
    description: "Your responses suggest moderate symptoms of depression. Professional support could be beneficial.",
    suggestions: [
      "Consider scheduling an appointment with a mental health professional",
      "Talk to your primary care provider",
      "Explore counseling or therapy options",
      "Practice self-care and lean on your support network",
    ],
  },
  {
    range: [15, 19],
    label: "Moderately Severe",
    color: "#FF9800",
    bgColor: "#FFF3E0",
    darkBgColor: "#331F00",
    emoji: "🔴",
    description: "Your responses indicate moderately severe symptoms. We strongly recommend seeking professional help.",
    suggestions: [
      "Please reach out to a mental health professional soon",
      "Contact your doctor to discuss treatment options",
      "Consider therapy, counseling, or medication management",
      "Reach out to a crisis helpline if you need immediate support",
    ],
  },
  {
    range: [20, 27],
    label: "Severe",
    color: "#F44336",
    bgColor: "#FFEBEE",
    darkBgColor: "#3A1215",
    emoji: "🔴",
    description: "Your responses suggest severe symptoms of depression. Please seek professional help as soon as possible.",
    suggestions: [
      "Please contact a mental health professional immediately",
      "If you are in crisis, call a helpline or go to the nearest emergency room",
      "Talk to someone you trust right away",
      "Remember: seeking help is a sign of strength, not weakness",
    ],
  },
];

export function getRiskLevel(score) {
  return riskLevels.find(
    (level) => score >= level.range[0] && score <= level.range[1]
  );
}
