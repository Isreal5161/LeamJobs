import { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaBriefcase, FaCheck, FaTimes } from 'react-icons/fa';
import type { SeekerDashboardJob } from '../../services/api';
import '../../styles/interview-practice-modal.css';

export type InterviewQuestion = {
  id: string;
  type: 'technical' | 'behavioral' | 'role' | 'situational';
  question: string;
  answerType: 'multiple_choice' | 'text';
  options?: string[];
};

type InterviewPracticeModalProps = {
  job: Pick<SeekerDashboardJob, 'title' | 'skills' | 'company'>;
  onClose: () => void;
};

type InterviewPhase = 'intro' | 'questions' | 'analyzing' | 'results';

const makePreviewQuestions = (job: InterviewPracticeModalProps['job']): InterviewQuestion[] => {
  const primarySkill = job.skills[0] || 'a core skill for this role';

  return [
    { id: 'q1', type: 'role', question: `Which responsibility in the ${job.title} role most closely matches your experience, and why?`, answerType: 'text' },
    { id: 'q2', type: 'behavioral', question: 'Tell us about a time you adapted your communication style to resolve a work challenge.', answerType: 'text' },
    {
      id: 'q3',
      type: 'technical',
      question: `When approaching an unfamiliar task involving ${primarySkill}, what would you do first?`,
      answerType: 'multiple_choice',
      options: [
        'Clarify the goal, constraints, and expected outcome',
        'Choose the first approach that comes to mind',
        'Wait for someone else to define every step',
        'Start work before checking the requirements',
      ],
    },
    {
      id: 'q4',
      type: 'situational',
      question: 'A priority changes shortly before a deadline. How would you respond?',
      answerType: 'multiple_choice',
      options: [
        'Confirm the new priority and agree on the most important outcome',
        'Continue with the original plan without telling anyone',
        'Drop all current work and make no effort to clarify impact',
        'Wait until the deadline passes before raising the change',
      ],
    },
    { id: 'q5', type: 'technical', question: `Walk us through how you would apply ${primarySkill} to a real task in this role.`, answerType: 'text' },
    {
      id: 'q6',
      type: 'behavioral',
      question: 'A teammate disagrees with your approach. What is the most constructive next step?',
      answerType: 'multiple_choice',
      options: [
        'Listen to their reasoning and compare both approaches against the goal',
        'Insist on your approach because you suggested it first',
        'Avoid discussing the disagreement and proceed alone',
        'Escalate immediately without trying to understand the concern',
      ],
    },
    { id: 'q7', type: 'role', question: `What would you focus on learning first to contribute effectively as a ${job.title}?`, answerType: 'text' },
    { id: 'q8', type: 'situational', question: 'Describe how you would handle an assignment when key details are unclear and the work is time-sensitive.', answerType: 'text' },
  ];
};

// DEVELOPMENT PREVIEW ONLY: Replace these sample results with validated server evaluation before production use.
const previewResults = {
  readinessScore: 78,
  categories: [
    { label: 'Technical Knowledge', score: 82 },
    { label: 'Communication', score: 76 },
    { label: 'Problem Solving', score: 80 },
    { label: 'Role Understanding', score: 74 },
    { label: 'Behavioral Responses', score: 79 },
  ],
  strengths: [
    'A clear, structured approach to workplace challenges',
    'Strong attention to collaboration and communication',
    'Thoughtful consideration of role priorities',
  ],
  improvementAreas: [
    'Add specific examples and outcomes to written answers',
    'Connect more answers directly to the role requirements',
    'Explain the reasoning behind important decisions',
  ],
};

function InterviewPracticeModal({ job, onClose }: InterviewPracticeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const actionLockRef = useRef(false);
  const actionTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const questions = useMemo(() => makePreviewQuestions(job), [job]);
  const question = questions[questionIndex];
  const currentAnswer = answers[question?.id] ?? '';
  const isAnswered = question?.answerType === 'text' ? currentAnswer.trim().length > 0 : currentAnswer.length > 0;
  const progress = question ? Math.round(((questionIndex + 1) / questions.length) * 100) : 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(focusTimer);
  }, [phase, questionIndex, showExitConfirm]);

  useEffect(() => {
    if (phase !== 'analyzing' || showExitConfirm) return undefined;
    const timer = window.setTimeout(() => setPhase('results'), 1800);
    return () => window.clearTimeout(timer);
  }, [phase, showExitConfirm]);

  const requestClose = () => {
    if (phase === 'intro' || phase === 'results') {
      onClose();
      return;
    }
    setShowExitConfirm(true);
  };

  const changeAnswer = (value: string) => {
    setAnswers((current) => ({ ...current, [question.id]: value }));
  };

  const moveQuestion = (nextIndex: number) => {
    if (actionLockRef.current || nextIndex < 0 || nextIndex >= questions.length) return;
    actionLockRef.current = true;
    setQuestionIndex(nextIndex);
    actionTimerRef.current = window.setTimeout(() => {
      actionLockRef.current = false;
      actionTimerRef.current = null;
    }, 180);
  };

  const finishInterview = () => {
    if (!isAnswered || actionLockRef.current) return;
    actionLockRef.current = true;
    setPhase('analyzing');
    actionTimerRef.current = window.setTimeout(() => {
      actionLockRef.current = false;
      actionTimerRef.current = null;
    }, 1800);
  };

  const restartInterview = () => {
    setAnswers({});
    setQuestionIndex(0);
    setShowExitConfirm(false);
    actionLockRef.current = false;
    setPhase('intro');
  };

  return (
    <dialog
      ref={dialogRef}
      className="interview-practice-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-practice-title"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="interview-practice-shell">
        <header className="interview-practice-header">
          <div className="interview-practice-brand">
            <span className="interview-practice-brand__name">LeamJobs</span>
            <span className="interview-practice-brand__divider" aria-hidden="true" />
            <span className="interview-practice-brand__label">AI Interview Practice</span>
          </div>
          <button type="button" className="interview-practice-close" aria-label="Close interview practice" onClick={requestClose}>
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        {showExitConfirm ? (
          <main className="interview-practice-exit" aria-labelledby="interview-practice-exit-title" aria-describedby="interview-practice-exit-copy">
            <span className="interview-practice-kicker">Leave practice?</span>
            <h2 id="interview-practice-exit-title" ref={headingRef} tabIndex={-1}>Exit interview?</h2>
            <p id="interview-practice-exit-copy">Your current answers will be lost.</p>
            <div className="interview-practice-exit__actions">
              <button type="button" className="interview-practice-button interview-practice-button--secondary" onClick={() => setShowExitConfirm(false)}>Continue Interview</button>
              <button type="button" className="interview-practice-button interview-practice-button--primary" onClick={onClose}>Exit</button>
            </div>
          </main>
        ) : null}

        {!showExitConfirm && phase === 'intro' ? (
          <>
            <main className="interview-practice-main interview-practice-intro">
              <span className="interview-practice-preview-tag">UI preview · sample questions</span>
              <h1 id="interview-practice-title" ref={headingRef} tabIndex={-1}>AI Interview Practice</h1>
              <p className="interview-practice-intro__lead">Prepare for this role with a short AI-powered mock interview.</p>

              <section className="interview-practice-role" aria-label="Interview role">
                <span className="interview-practice-role__icon"><FaBriefcase aria-hidden="true" /></span>
                <div className="interview-practice-role__details">
                  <h2>{job.title}</h2>
                  {job.company?.name ? <p>{job.company.name}</p> : null}
                  <div className="interview-practice-role__facts">
                    <span>{questions.length} questions</span>
                    <span aria-hidden="true">·</span>
                    <span>~{questions.length} minutes</span>
                  </div>
                </div>
              </section>

              <section className="interview-practice-what" aria-labelledby="interview-practice-what-title">
                <h2 id="interview-practice-what-title">What you’ll practice</h2>
                <ul>
                  <li><FaCheck aria-hidden="true" /> Role-specific questions</li>
                  <li><FaCheck aria-hidden="true" /> Behavioral scenarios</li>
                  <li><FaCheck aria-hidden="true" /> Technical and skill questions</li>
                  <li><FaCheck aria-hidden="true" /> Situational decision making</li>
                </ul>
              </section>
              <p className="interview-practice-preview-note">Sample questions are being used to preview the experience. No AI evaluation runs in this demo.</p>
            </main>
            <footer className="interview-practice-footer interview-practice-footer--intro">
              <button type="button" className="interview-practice-button interview-practice-button--secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="interview-practice-button interview-practice-button--primary" onClick={() => setPhase('questions')}>Start Interview <FaArrowRight aria-hidden="true" /></button>
            </footer>
          </>
        ) : null}

        {!showExitConfirm && phase === 'questions' && question ? (
          <>
            <main className="interview-practice-main interview-practice-question-flow">
              <div className="interview-practice-progress" aria-label={`Question ${questionIndex + 1} of ${questions.length}`}>
                <div className="interview-practice-progress__labels">
                  <span>Question {questionIndex + 1} of {questions.length}</span>
                  <span>{progress}%</span>
                </div>
                <div className="interview-practice-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Interview progress">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              <section key={question.id} className="interview-practice-question" aria-labelledby="interview-practice-question-title">
                <span className="interview-practice-question__preview">SAMPLE INTERVIEW</span>
                <span className={`interview-practice-question__type interview-practice-question__type--${question.type}`}>{question.type}</span>
                <h1 id="interview-practice-title" className="interview-practice-question__count" ref={headingRef} tabIndex={-1}>AI Interview Practice</h1>
                <h2 id="interview-practice-question-title" className="interview-practice-question__text">{question.question}</h2>

                {question.answerType === 'multiple_choice' ? (
                  <fieldset className="interview-practice-options">
                    <legend className="interview-practice-options__legend">Choose one answer</legend>
                    {question.options?.map((option, index) => (
                      <label key={option} className={`interview-practice-option${currentAnswer === option ? ' interview-practice-option--selected' : ''}`}>
                        <input type="radio" name={`answer-${question.id}`} value={option} checked={currentAnswer === option} onChange={() => changeAnswer(option)} />
                        <span className="interview-practice-option__key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                        <span className="interview-practice-option__text">{option}</span>
                        <span className="interview-practice-option__selected" aria-hidden="true"><FaCheck /></span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <div className="interview-practice-answer">
                    <label htmlFor={`answer-${question.id}`}>Your answer</label>
                    <textarea
                      id={`answer-${question.id}`}
                      value={currentAnswer}
                      onChange={(event) => changeAnswer(event.target.value)}
                      placeholder="Write your answer here..."
                      rows={6}
                      maxLength={2000}
                    />
                    <span className="interview-practice-answer__count">{currentAnswer.length}/2000</span>
                  </div>
                )}
              </section>
            </main>
            <footer className="interview-practice-footer interview-practice-footer--questions">
              <button type="button" className="interview-practice-button interview-practice-button--secondary" onClick={() => moveQuestion(questionIndex - 1)} disabled={questionIndex === 0 || actionLockRef.current}>
                <FaArrowLeft aria-hidden="true" /> Previous
              </button>
              {questionIndex === questions.length - 1 ? (
                <button type="button" className="interview-practice-button interview-practice-button--primary" onClick={finishInterview} disabled={!isAnswered || actionLockRef.current}>Finish Interview <FaCheck aria-hidden="true" /></button>
              ) : (
                <button type="button" className="interview-practice-button interview-practice-button--primary" onClick={() => moveQuestion(questionIndex + 1)} disabled={!isAnswered || actionLockRef.current}>Next <FaArrowRight aria-hidden="true" /></button>
              )}
            </footer>
          </>
        ) : null}

        {!showExitConfirm && phase === 'analyzing' ? (
          <main className="interview-practice-main interview-practice-analyzing" aria-live="polite" aria-busy="true">
            <span className="interview-practice-spinner" aria-hidden="true" />
            <span className="interview-practice-kicker">Interview complete</span>
            <h1 id="interview-practice-title" ref={headingRef} tabIndex={-1}>We’re reviewing your responses...</h1>
            <p>Analyzing your responses against the requirements for {job.title}.</p>
            <span className="interview-practice-preview-tag">UI preview · no AI evaluation request is being made</span>
          </main>
        ) : null}

        {!showExitConfirm && phase === 'results' ? (
          <>
            <main className="interview-practice-main interview-practice-results">
              <div className="interview-practice-results__heading">
                <span className="interview-practice-preview-tag">Development preview · sample values only</span>
                <span className="interview-practice-kicker">Interview complete</span>
                <h1 id="interview-practice-title" ref={headingRef} tabIndex={-1}>Job readiness</h1>
                <p>This sample assessment is for interface review only, not an AI evaluation or hiring prediction.</p>
              </div>

              <section className="interview-practice-score" aria-label={`Sample job readiness score ${previewResults.readinessScore} percent`}>
                <div className="interview-practice-score__ring" style={{ '--score': `${previewResults.readinessScore}%` } as React.CSSProperties}>
                  <span>{previewResults.readinessScore}<small>%</small></span>
                </div>
                <div>
                  <strong>Good preparation</strong>
                  <p>Sample score · not AI-evaluated</p>
                </div>
              </section>

              <section className="interview-practice-categories" aria-label="Sample category scores">
                {previewResults.categories.map((category) => (
                  <div className="interview-practice-category" key={category.label}>
                    <div className="interview-practice-category__label"><span>{category.label}</span><strong>{category.score}%</strong></div>
                    <div className="interview-practice-category__track" role="progressbar" aria-label={`${category.label}, sample score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.score}><span style={{ width: `${category.score}%` }} /></div>
                  </div>
                ))}
              </section>

              <section className="interview-practice-result-section">
                <h2>What you did well</h2>
                <ul>{previewResults.strengths.map((item) => <li key={item}><FaCheck aria-hidden="true" />{item}</li>)}</ul>
              </section>
              <section className="interview-practice-result-section">
                <h2>Areas to improve</h2>
                <ul>{previewResults.improvementAreas.map((item) => <li key={item}><span aria-hidden="true">•</span>{item}</li>)}</ul>
              </section>
              <section className="interview-practice-recommendation">
                <h2>AI recommendation <span>Preview</span></h2>
                <p>For the {job.title} role, practice connecting your examples to the responsibilities and skills listed in the job description.</p>
              </section>
            </main>
            <footer className="interview-practice-footer interview-practice-footer--results">
              <button type="button" className="interview-practice-button interview-practice-button--secondary" onClick={restartInterview}>Practice Again</button>
              <button type="button" className="interview-practice-button interview-practice-button--primary" onClick={onClose}>Back to Job</button>
            </footer>
          </>
        ) : null}
      </div>
    </dialog>
  );
}

export default InterviewPracticeModal;