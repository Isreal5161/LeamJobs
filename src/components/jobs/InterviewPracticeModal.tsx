import { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaBriefcase, FaCheck, FaTimes } from 'react-icons/fa';
import { getAiRateLimitCopy, isAiRateLimitError, requestInterviewEvaluation, requestInterviewStart, type InterviewAnswer, type InterviewEvaluation, type InterviewQuestion, type SeekerDashboardJob } from '../../services/api';
import '../../styles/interview-practice-modal.css';

type InterviewPracticeModalProps = {
  job: Pick<SeekerDashboardJob, 'id' | 'title' | 'company'>;
  token: string;
  onClose: () => void;
};

type InterviewPhase = 'intro' | 'starting' | 'questions' | 'analyzing' | 'evaluationError' | 'results';

const getInterviewErrorMessage = (result: { status: number; error: { code?: string; message: string; retryAfterSeconds?: number | null } }) => {
  if (isAiRateLimitError(result.status, result.error)) {
    const copy = getAiRateLimitCopy(result.error.retryAfterSeconds);
    return `${copy.description} ${copy.detail}`;
  }
  if (result.status === 401) return 'Your session has expired. Please sign in again.';
  if (result.status === 403) return result.error.message;
  if (result.status === 0) return "We couldn't connect to LeamJobs. Check your connection and try again.";
  if (result.error.code === 'AI_INTERVIEW_SESSION_USED') return 'This interview session has already been evaluated. Start a new interview to practice again.';
  if (result.error.code === 'AI_INTERVIEW_SESSION_INVALID') return 'Your interview session expired. Start a new interview to continue practicing.';
  if ([502, 503, 504].includes(result.status)) return 'AI Interview Practice is temporarily unavailable. Please try again in a moment.';
  return 'We could not complete this interview right now. Please try again.';
};

const evaluationCategories: Array<{ key: keyof InterviewEvaluation['categories']; label: string }> = [
  { key: 'technicalKnowledge', label: 'Technical Knowledge' },
  { key: 'communication', label: 'Communication' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'roleUnderstanding', label: 'Role Understanding' },
  { key: 'behavioralResponses', label: 'Behavioral Responses' },
];

function InterviewPracticeModal({ job, token, onClose }: InterviewPracticeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const actionLockRef = useRef(false);
  const actionTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionToken, setSessionToken] = useState('');
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [requestError, setRequestError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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

  const beginInterview = async () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setRequestError('');
    setPhase('starting');
    try {
      const result = await requestInterviewStart({ jobId: job.id }, token);
      if (!result.ok) {
        setRequestError(getInterviewErrorMessage(result));
        setPhase('intro');
        return;
      }
      setQuestions(result.data.data.questions);
      setSessionToken(result.data.data.sessionToken);
      setQuestionIndex(0);
      setAnswers({});
      setEvaluation(null);
      setPhase('questions');
    } catch {
      setRequestError('AI Interview Practice is temporarily unavailable. Please try again in a moment.');
      setPhase('intro');
    } finally {
      actionLockRef.current = false;
    }
  };

  const evaluateAnswers = async () => {
    if (!sessionToken || actionLockRef.current) return;
    actionLockRef.current = true;
    setRequestError('');
    setPhase('analyzing');
    const submittedAnswers: InterviewAnswer[] = questions.map((item) => ({ questionId: item.id, answer: (answers[item.id] ?? '').trim() }));
    try {
      const result = await requestInterviewEvaluation({ sessionToken, answers: submittedAnswers }, token);
      if (!result.ok) {
        setRequestError(getInterviewErrorMessage(result));
        setPhase('evaluationError');
        return;
      }
      setEvaluation(result.data.data);
      setPhase('results');
    } catch {
      setRequestError('AI Interview Practice is temporarily unavailable. Please try again in a moment.');
      setPhase('evaluationError');
    } finally {
      actionLockRef.current = false;
    }
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
    void evaluateAnswers();
  };

  const restartInterview = () => {
    setAnswers({});
    setQuestionIndex(0);
    setQuestions([]);
    setSessionToken('');
    setEvaluation(null);
    setRequestError('');
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
      aria-labelledby="interview-practice-dialog-title"
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
            <span id="interview-practice-dialog-title" className="interview-practice-brand__label">AI Interview Practice</span>
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
              <h1 id="interview-practice-title" ref={headingRef} tabIndex={-1}>AI Interview Practice</h1>
              <p className="interview-practice-intro__lead">Prepare for this role with a short AI-powered mock interview.</p>

              <section className="interview-practice-role" aria-label="Interview role">
                <span className="interview-practice-role__icon"><FaBriefcase aria-hidden="true" /></span>
                <div className="interview-practice-role__details">
                  <h2>{job.title}</h2>
                  {job.company?.name ? <p>{job.company.name}</p> : null}
                  <div className="interview-practice-role__facts">
                    <span>8–10 questions</span>
                    <span aria-hidden="true">·</span>
                    <span>~10 minutes</span>
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
              {requestError ? <p className="interview-practice-request-error" role="alert">{requestError}</p> : null}
            </main>
            <footer className="interview-practice-footer interview-practice-footer--intro">
              <button type="button" className="interview-practice-button interview-practice-button--secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="interview-practice-button interview-practice-button--primary" onClick={() => void beginInterview()} disabled={actionLockRef.current}>Start Interview <FaArrowRight aria-hidden="true" /></button>
            </footer>
          </>
        ) : null}

        {!showExitConfirm && phase === 'starting' ? (
          <main className="interview-practice-main interview-practice-analyzing" aria-live="polite" aria-busy="true">
            <span className="interview-practice-spinner" aria-hidden="true" />
            <span className="interview-practice-kicker">Preparing your session</span>
            <h1 id="interview-practice-title" ref={headingRef} tabIndex={-1}>Building questions for {job.title}...</h1>
            <p>Your interview questions are being tailored to the approved job details.</p>
          </main>
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
                <span className={`interview-practice-question__type interview-practice-question__type--${question.type}`}>{question.type}</span>
                <h1 id="interview-practice-title" className="interview-practice-question__count" ref={headingRef} tabIndex={-1}>AI Interview Practice</h1>
                <h2 id="interview-practice-question-title" className="interview-practice-question__text">{question.question}</h2>

                {question.answerType === 'multiple_choice' ? (
                  <fieldset className="interview-practice-options">
                    <legend className="interview-practice-options__legend">Choose one answer</legend>
                    {question.options.map((option, index) => (
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
          </main>
        ) : null}

        {!showExitConfirm && phase === 'evaluationError' ? (
          <>
            <main className="interview-practice-main interview-practice-analyzing" aria-live="assertive">
              <span className="interview-practice-kicker">Evaluation unavailable</span>
              <h1 id="interview-practice-title" ref={headingRef} tabIndex={-1}>We couldn’t finish your assessment</h1>
              <p className="interview-practice-request-error" role="alert">{requestError}</p>
            </main>
            <footer className="interview-practice-footer interview-practice-footer--results">
              <button type="button" className="interview-practice-button interview-practice-button--secondary" onClick={restartInterview}>Start a New Interview</button>
              {requestError.includes('already been evaluated') || requestError.includes('session expired') ? null : <button type="button" className="interview-practice-button interview-practice-button--primary" onClick={() => void evaluateAnswers()} disabled={actionLockRef.current}>Retry Evaluation</button>}
            </footer>
          </>
        ) : null}

        {!showExitConfirm && phase === 'results' && evaluation ? (
          <>
            <main className="interview-practice-main interview-practice-results">
              <div className="interview-practice-results__heading">
                <span className="interview-practice-kicker">Interview complete</span>
                <h1 id="interview-practice-title" ref={headingRef} tabIndex={-1}>Job readiness</h1>
                <p>This is an AI practice assessment based on your responses, not a prediction of hiring success.</p>
              </div>

              <section className="interview-practice-score" aria-label={`Job readiness score ${evaluation.readinessScore} percent`}>
                <div className="interview-practice-score__ring" style={{ '--score': `${evaluation.readinessScore}%` } as React.CSSProperties}>
                  <span>{evaluation.readinessScore}<small>%</small></span>
                </div>
                <div>
                  <strong>{evaluation.readinessScore >= 80 ? 'Strong preparation' : evaluation.readinessScore >= 60 ? 'Good preparation' : 'Preparation in progress'}</strong>
                  <p>AI practice assessment</p>
                </div>
              </section>

              <section className="interview-practice-categories" aria-label="Readiness category scores">
                {evaluationCategories.map((category) => (
                  <div className="interview-practice-category" key={category.label}>
                    <div className="interview-practice-category__label"><span>{category.label}</span><strong>{evaluation.categories[category.key]}%</strong></div>
                    <div className="interview-practice-category__track" role="progressbar" aria-label={`${category.label} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={evaluation.categories[category.key]}><span style={{ width: `${evaluation.categories[category.key]}%` }} /></div>
                  </div>
                ))}
              </section>

              <section className="interview-practice-result-section">
                <h2>What you did well</h2>
                <ul>{evaluation.strengths.map((item) => <li key={item}><FaCheck aria-hidden="true" />{item}</li>)}</ul>
              </section>
              <section className="interview-practice-result-section">
                <h2>Areas to improve</h2>
                <ul>{evaluation.improvementAreas.map((item) => <li key={item}><span aria-hidden="true">•</span>{item}</li>)}</ul>
              </section>
              <section className="interview-practice-recommendation">
                <h2>AI recommendation</h2>
                <p>{evaluation.recommendation}</p>
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