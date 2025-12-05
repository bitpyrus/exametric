import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { examData, Question } from '@/data/examQuestions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/components/exam/AudioRecorder';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Volume2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useTabVisibility, TabChangeEvent } from '@/hooks/useTabVisibility';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, push, set, get } from 'firebase/database';
import Navigation from '@/components/Navigation';
import { uploadAudioForTranscription } from '@/lib/speechApi';
import { uploadAudioBlob } from '@/lib/storage';

// Interface for answer data with tracking metadata
interface AnswerData {
  text?: string;
  audioUrl?: string;
  storagePath?: string;
  timeToAnswerMs?: number;
  questionDisplayedAt?: string;
  answeredAt?: string;
  audioQuestionDurationMs?: number;
}


// Helper to get a random subset of keys
function getRandomIds<T extends Record<string, any>>(obj: T, count: number): string[] {
  const keys = Object.keys(obj);
  // Fisher–Yates shuffle
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys.slice(0, count);
}

// Pick 5 written IDs based on section2_standard (Q1..Q12)
const WRITTEN_QUESTION_IDS = getRandomIds(
  examData.exam.sets.section2_standard.questions,
  5
);

// Pick 5 audio IDs based on section3_standard (Q1..Q12)
const AUDIO_QUESTION_IDS = getRandomIds(
  examData.exam.sets.section3_standard.questions,
  5
);

type SectionId = 'section1_accomodation' | 'section2_standard' | 'section2_control' | 'section3_standard' | 'section3_control';

function getSectionQuestions(sectionId: SectionId): Question[] {
  const section = examData.exam.sets[sectionId];
  let questions = Object.values(section.questions);

  // Filter written sections by WRITTEN_QUESTION_IDS
  if (sectionId === 'section2_standard' || sectionId === 'section2_control') {
    questions = questions.filter((q) => WRITTEN_QUESTION_IDS.includes(q.id));
  }

  // Filter audio sections by AUDIO_QUESTION_IDS
  if (sectionId === 'section3_standard' || sectionId === 'section3_control') {
    questions = questions.filter((q) => AUDIO_QUESTION_IDS.includes(q.id));
  }

  // section1_accomodation is unchanged
  return questions;
}

export default function Exam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const { tabChangeEvents, tabChangeCount } = useTabVisibility();

  const EXAM_DURATION_MS = 20 * 60 * 1000; // 20 minutes
  const PROGRESS_PATH = (uid: string | undefined) => `examProgress/${uid}`;

  const [currentSection, setCurrentSection] = useState<SectionId>('section1_accomodation');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  const [textAnswer, setTextAnswer] = useState('');
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(EXAM_DURATION_MS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracking: when the current question was displayed
  const questionStartTimeRef = useRef<number>(Date.now());
  // Tracking: audio question duration for current question
  const currentAudioDurationRef = useRef<number | null>(null);

  const sections = Object.keys(examData.exam.sets) as SectionId[];
  const currentSectionData = examData.exam.sets[currentSection];
  const questions = getSectionQuestions(currentSection);
  const currentQuestion = questions[currentQuestionIndex];
  const questionKey = `${currentSection}_${currentQuestion.id}`;

  const totalQuestions = sections.reduce(
    (sum, sectionId) => sum + getSectionQuestions(sectionId).length,
    0
  );

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Prevent admin users from taking the exam
    if (user.role === 'admin') {
      toast({ title: 'Access denied', description: 'Admins cannot take the exam. Use the admin review page.' });
      navigate('/admin/review');
      return;
    }

    // Check if the user already has a submitted result -> prevent retake
    (async () => {
      try {
        const resultsSnapshot = await get(ref(database, `examResults/${user.id}`));
        if (resultsSnapshot.exists()) {
          // User has previous results — prevent retake
          toast({
            title: 'Exam already taken',
            description: 'You have already submitted this exam. You cannot retake it.',
            variant: 'destructive',
          });
          navigate('/results');
          return;
        }

        // Try to load progress
        const progressSnapshot = await get(ref(database, PROGRESS_PATH(user.id)));
        if (progressSnapshot.exists()) {
          const data = progressSnapshot.val();
          if (data.submitted) {
            toast({ title: 'Exam already submitted', description: 'You have already submitted this exam.' });
            navigate('/results');
            return;
          }

          // Resume in-progress exam
          if (data.answers) setAnswers(data.answers);
          if (data.currentSection) setCurrentSection(data.currentSection as SectionId);
          if (typeof data.currentQuestionIndex === 'number') setCurrentQuestionIndex(data.currentQuestionIndex);
          if (typeof data.startTimestamp === 'number') {
            setStartTimestamp(data.startTimestamp);
            const elapsed = Date.now() - data.startTimestamp;
            const remaining = Math.max(EXAM_DURATION_MS - elapsed, 0);
            setTimeLeftMs(remaining);
            if (remaining <= 0) {
              // Time's up, auto-submit
              toast({ title: 'Time is up', description: 'Exam time expired. Submitting your answers.' });
              handleSubmit();
            }
          }
        } else {
          // No progress — set start timestamp now and save
          const ts = Date.now();
          setStartTimestamp(ts);
          await set(ref(database, PROGRESS_PATH(user.id)), {
            startTimestamp: ts,
            currentSection,
            currentQuestionIndex,
            answers: {},
            submitted: false,
          });
        }
      } catch (err) {
        console.error('Error loading progress:', err);
      }
    })();
  }, [user, navigate]);

  // Timer tick
  useEffect(() => {
    if (startTimestamp === null) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const remaining = Math.max(EXAM_DURATION_MS - elapsed, 0);
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        toast({ title: 'Time is up', description: 'Exam time expired. Submitting your answers.' });
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTimestamp]);

  useEffect(() => {
    // Track question start time and auto-speak audio questions
    questionStartTimeRef.current = Date.now();
    currentAudioDurationRef.current = null;

    if (currentQuestion.type === 'audio' && currentQuestion.tts_text) {
      speak(currentQuestion.tts_text).then((result) => {
        // Store the duration of the audio question
        currentAudioDurationRef.current = result.durationMs;
      }).catch(() => {
        // Speech synthesis failed, but we continue
      });
    }
    return () => stop();
  }, [currentQuestion, currentSection, currentQuestionIndex, speak, stop]);

  useEffect(() => {
    // Load existing answer for current question
    const existingAnswer = answers[questionKey];
    setTextAnswer(existingAnswer?.text || '');
  }, [questionKey, answers]);

  const saveProgress = async (updatedAnswers?: typeof answers, cs?: SectionId, cqIdx?: number, ts?: number, tabEvents?: TabChangeEvent[]) => {
    if (!user) return;
    try {
      const payload = {
        startTimestamp: ts ?? startTimestamp,
        currentSection: cs ?? currentSection,
        currentQuestionIndex: typeof cqIdx === 'number' ? cqIdx : currentQuestionIndex,
        answers: updatedAnswers ?? answers,
        submitted: false,
        tabChangeEvents: tabEvents ?? tabChangeEvents,
        tabChangeCount: tabEvents?.filter((e) => e.wasHidden).length ?? tabChangeCount,
      };
      await set(ref(database, PROGRESS_PATH(user.id)), payload);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  // Helper to calculate time to answer and create answer metadata
  const createAnswerMetadata = useCallback((): Partial<AnswerData> => {
    const now = Date.now();
    const timeToAnswerMs = now - questionStartTimeRef.current;
    return {
      timeToAnswerMs,
      questionDisplayedAt: new Date(questionStartTimeRef.current).toISOString(),
      answeredAt: new Date(now).toISOString(),
      audioQuestionDurationMs: currentAudioDurationRef.current ?? undefined,
    };
  }, []);

  const handleTextAnswerSave = async() => {
    if (currentQuestion.type === 'multiple') {
      if (textAnswer.startsWith('other:') && textAnswer.replace('other:', '').trim() === '') {
        toast({
          title: 'Answer required',
          description: 'Please specify your answer for "other".',
          variant: 'destructive',
        });
        return;
      }
      
      if (!textAnswer) {
        toast({
          title: 'Answer required',
          description: 'Please select an option before continuing.',
          variant: 'destructive',
        });
        return;
      }
    } else { 
      if (!textAnswer.trim()) {
        toast({
          title: 'Answer required',
          description: 'Please provide an answer before continuing.',
          variant: 'destructive',
        });
        return;
      }
    }

    const updated = {
      ...answers,
      [questionKey]: { 
        text: textAnswer,
        ...createAnswerMetadata(),
      },
    };

    setAnswers(updated);
    await saveProgress(updated);

    toast({
      title: 'Answer saved',
      description: 'Moving to next question.',
    });

    handleNext();
  };

  const handleAudioRecorded = async (blob: Blob) => {
    if (!user) {
      toast({ title: 'Not authenticated', description: 'Please sign in to submit audio.', variant: 'destructive' });
      return;
    }

    try {
      console.log('Uploading audio to Storage...');
      const storagePath = `examAnswers/${user.id}/${questionKey}/${Date.now()}.webm`;
      const { url: audioUrl, path } = await uploadAudioBlob(blob, storagePath);

      // Get answer metadata including time to answer and audio question duration
      const answerMetadata = createAnswerMetadata();

      // Save audio URL to answers immediately to preserve data even if STT fails
      const partial = {
        ...answers,
        [questionKey]: { 
          audioUrl, 
          storagePath: path,
          ...answerMetadata,
        },
      };
      setAnswers(partial);
      await saveProgress(partial);

      toast({ title: 'Audio uploaded', description: 'Stored audio will be processed for transcription.' });

      // Attempt transcription (best-effort). If it fails, leave transcript empty for manual review.
      try {
        const metadata = { questionKey, languageCode: 'en-US', expectedAnswers: currentQuestion.answers };
        const result = await uploadAudioForTranscription(blob, metadata);
        const text = result.transcript;
        if (text) {
          const withText = { ...partial, [questionKey]: { ...partial[questionKey], text } };
          setAnswers(withText);
          await saveProgress(withText);
          toast({ title: 'Transcription saved', description: 'Speech-to-text processed (may be manual-reviewed).' });
        }
      } catch (sttErr) {
        console.warn('STT failed, audio retained for manual processing', sttErr);
      }

      if (import.meta.env.VITE_AUTO_NEXT_AFTER_SPEECH === 'true') {
        handleNext();
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      toast({ title: 'Audio upload failed', description: error instanceof Error ? error.message : 'Failed to upload audio.', variant: 'destructive' });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTextAnswer('');
    } else {
      // Move to next section
      const currentSectionIdx = sections.indexOf(currentSection);
      if (currentSectionIdx < sections.length - 1) {
        setCurrentSection(sections[currentSectionIdx + 1]);
        setCurrentQuestionIndex(0);
        setTextAnswer('');
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      // Move to previous section
      const currentSectionIdx = sections.indexOf(currentSection);
      if (currentSectionIdx > 0) {
        const prevSection = sections[currentSectionIdx - 1];
        setCurrentSection(prevSection);
        const prevQuestions = Object.values(examData.exam.sets[prevSection].questions);
        setCurrentQuestionIndex(prevQuestions.length - 1);
      }
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    const analysis: Record<string, { correct: boolean; userAnswer: string; expectedAnswers: string[] }> = {};

    Object.keys(answers).forEach((questionKey) => {
      const parts = questionKey.split('_');
      const questionId = parts.pop() as string;
      const sectionId = parts.join('_') as SectionId;
      
      const section = examData.exam.sets[sectionId];
      if (!section) {
        console.error(`Section not found: ${sectionId}`);
        return;
      }
      
      const question = section.questions[questionId];
      if (!question) {
        console.error(`Question not found: ${questionId} in section ${sectionId}`);
        return;
      }
      
      const userAnswer = answers[questionKey];

      if (userAnswer.text) {
        const normalizedUserAnswer = userAnswer.text.toLowerCase().trim();
        const isCorrect = question.answers?.some(
          (ans) => ans.toLowerCase().trim() === normalizedUserAnswer
        ) ?? false;
        
        if (isCorrect) correctAnswers++;
        
        analysis[questionKey] = {
          correct: isCorrect,
          userAnswer: userAnswer.text,
          expectedAnswers: question.answers ?? [],
        };
      }
    });

    return { correctAnswers, analysis };
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (Object.keys(answers).length < totalQuestions) {
      const confirmed = window.confirm(`You have answered ${Object.keys(answers).length} out of ${totalQuestions} questions. Submit anyway?`);
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    try {
      const timeSpent = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;
      const { correctAnswers, analysis } = calculateScore();
      const score = Object.keys(answers).length > 0 ? Math.round((correctAnswers / Object.keys(answers).length) * 100) : 0;

      const examResult = {
        userId: user?.id,
        email: user?.email,
        answers,
        analysis,
        score,
        correctAnswers,
        timestamp: new Date().toISOString(),
        timeSpent,
        totalQuestions,
        answeredCount: Object.keys(answers).length,
        // Tab change tracking data
        tabChangeEvents,
        tabChangeCount,
      };

      const resultsRef = ref(database, `examResults/${user.id}`);
      const newResultRef = push(resultsRef);
      await set(newResultRef, examResult);

      // Remove progress after successful submit
      await set(ref(database, PROGRESS_PATH(user.id)), { submitted: true });

      toast({ title: 'Exam submitted!', description: `Your score: ${score}%. Results saved successfully.` });
      navigate('/results');
    } catch (error: unknown) {
      console.error('Error submitting exam:', error);
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      let errorMessage = 'Failed to submit exam. Please try again.';
      if (message.includes('permission-denied')) errorMessage = 'Permission denied. Please check Firebase Security Rules.';
      if (message.includes('unavailable')) errorMessage = 'Network error. Please check your internet connection.';
      toast({ title: 'Submission failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFirstQuestion = currentSection === sections[0] && currentQuestionIndex === 0;
  const isLastQuestion =
    currentSection === sections[sections.length - 1] &&
    currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{examData.exam.title}</CardTitle>
            <CardDescription>{examData.exam.description}</CardDescription>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress: {answeredCount} / {totalQuestions}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Time left: {new Date(timeLeftMs).toISOString().substr(11, 8)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentSectionData.title}</h3>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-lg font-medium flex-1">{currentQuestion.question}</p>
                  {currentQuestion.type === 'audio' && currentQuestion.tts_text && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => speak(currentQuestion.tts_text!)}
                      disabled={isSpeaking}
                    >
                      <Volume2 className={`h-5 w-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    </Button>
                  )}
                </div>

                {currentQuestion.type === 'blank' && (
                  <div className="space-y-4">
                    <Textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={6}
                      className="resize-none"
                    />
                    <Button onClick={handleTextAnswerSave} className="w-full">
                      Save & Continue
                    </Button>
                  </div>
                )}

                {currentQuestion.type === 'multiple' && currentQuestion.options && (
                  <div className="space-y-4">
                    <RadioGroup
                      value={textAnswer.startsWith('other:') ? 'other' : textAnswer}
                      onValueChange={(value) => {
                        if (value.toLowerCase() === 'other') {
                          setTextAnswer('other:');
                        } else {
                          setTextAnswer(value);
                        }
                      }}
                    >
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index}>
                            <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-all">
                              <RadioGroupItem value={option} id={`option-${index}`} />
                              <Label
                                htmlFor={`option-${index}`}
                                className="flex-1 cursor-pointer text-base"
                              >
                                {option}
                              </Label>
                            </div>
                            {option.toLowerCase() === 'other' &&
                              textAnswer.startsWith('other:') && (
                                <div className="space-y-4">
                                  <Textarea
                                    value={textAnswer.replace('other:', '')}
                                    onChange={(e) =>
                                      setTextAnswer(`other:${e.target.value}`)
                                    }
                                    placeholder="Please specify..."
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                    <Button
                      onClick={handleTextAnswerSave}
                      className="w-full"
                      disabled={
                        !textAnswer ||
                        (textAnswer.startsWith('other:') &&
                          textAnswer.replace('other:', '').trim() === '')
                      }
                    >
                      Save & Continue
                    </Button>
                  </div>
                )}

                {currentQuestion.type === 'audio' && (
                  <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {!isLastQuestion ? (
                <Button variant="outline" onClick={handleNext}>
                  Skip
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
