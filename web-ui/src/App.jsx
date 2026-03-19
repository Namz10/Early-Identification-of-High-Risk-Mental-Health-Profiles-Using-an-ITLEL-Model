import { useState } from 'react';
import DarkModeToggle from './components/DarkModeToggle';
import LandingPage from './components/LandingPage';
import Assessment from './components/Assessment';
import ResultPage from './components/ResultPage';
import { questions } from './data/questions';

const VIEWS = { LANDING: 'landing', ASSESSMENT: 'assessment', RESULT: 'result' };

export default function App() {
  const [view, setView] = useState(VIEWS.LANDING);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));

  const startAssessment = () => {
    setAnswers(Array(questions.length).fill(null));
    setView(VIEWS.ASSESSMENT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeAssessment = () => {
    setView(VIEWS.RESULT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retake = () => {
    startAssessment();
  };

  return (
    <div className="app">
      <div className="app-bg" aria-hidden="true" />
      <DarkModeToggle />

      <div className="app-content">
        {view === VIEWS.LANDING && (
          <LandingPage onStart={startAssessment} />
        )}

        {view === VIEWS.ASSESSMENT && (
          <Assessment
            answers={answers}
            setAnswers={setAnswers}
            onComplete={completeAssessment}
          />
        )}

        {view === VIEWS.RESULT && (
          <ResultPage answers={answers} onRetake={retake} />
        )}
      </div>
    </div>
  );
}
