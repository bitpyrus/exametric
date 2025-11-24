import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import Navigation from '@/components/Navigation';

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

  const [currentSection, setCurrentSection] = useState<SectionId>('section1_accomodation');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { text?: string; audioUrl?: string }>>({});
  const [textAnswer, setTextAnswer] = useState('');
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }
  }, [user, navigate]);

  useEffect(() => {
    // Auto-speak audio questions
    if (currentQuestion.type === 'audio' && currentQuestion.tts_text) {
      speak(currentQuestion.tts_text);
    }
    return () => stop();
  }, [currentQuestion, currentSection, currentQuestionIndex]);

  useEffect(() => {
    // Load existing answer for current question
    const existingAnswer = answers[questionKey];
    setTextAnswer(existingAnswer?.text || '');
  }, [questionKey, answers]);

  const handleTextAnswerSave = () => {
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

    setAnswers((prev) => ({
      ...prev,
      [questionKey]: { text: textAnswer },
    }));

    toast({
      title: 'Answer saved',
      description: 'Moving to next question.',
    });

    handleNext();
  };

  const handleAudioRecorded = async (blob: Blob) => {
    try {
      console.log('Processing audio recording...');
      
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];

            // TODO  This is not real API key
            const GOOGLE_API_KEY = 'AIzaSyD9Eq7tAmxx6o1iFBYb-s-3fLKqIl-8DDU';
            
            const response = await fetch(
              `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 48000,
                    languageCode: 'en-US',
                  },
                  audio: {
                    content: base64Audio,
                  },
                }),
              }
            );

            if (!response.ok) {
              const error = await response.json();
              console.error('Google Speech-to-Text error:', error);
              throw new Error('Failed to transcribe audio');
            }

            const result = await response.json();
            const text = result.results?.[0]?.alternatives?.[0]?.transcript || '';
            
            if (!text) {
              throw new Error('No transcription received');
            }

            console.log('Transcribed text:', text);

            setAnswers((prev) => ({
              ...prev,
              [questionKey]: { text },
            }));

            toast({
              title: 'Answer saved',
              description: 'Moving to next question.',
            });

            handleNext();
            resolve(null);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: 'Transcription failed',
        description: 'Failed to process audio. Please try again.',
        variant: 'destructive',
      });
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
        const isCorrect = question.answers.some(
          (ans) => ans.toLowerCase().trim() === normalizedUserAnswer
        );
        
        if (isCorrect) correctAnswers++;
        
        analysis[questionKey] = {
          correct: isCorrect,
          userAnswer: userAnswer.text,
          expectedAnswers: question.answers,
        };
      }
    });

    return { correctAnswers, analysis };
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmed = window.confirm(
        `You have answered ${answeredCount} out of ${totalQuestions} questions. Submit anyway?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const { correctAnswers, analysis } = calculateScore();
      const score = answeredCount > 0 ? Math.round((correctAnswers / answeredCount) * 100) : 0;

      const examData = {
        userId: user?.id,
        email: user?.email,
        answers,
        analysis,
        score,
        correctAnswers,
        timestamp: new Date().toISOString(),
        timeSpent,
        totalQuestions,
        answeredCount,
      };

      console.log('Submitting exam data to Realtime Database:', examData);
      
      const resultsRef = ref(database, `examResults/${user?.id}`);
      const newResultRef = push(resultsRef);
      await set(newResultRef, examData);
      
      console.log('Exam submitted successfully with ID:', newResultRef.key);

      toast({
        title: 'Exam submitted!',
        description: `Your score: ${score}%. Results saved successfully.`,
      });

      navigate('/results');
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      let errorMessage = 'Failed to submit exam. Please try again.';
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firebase Security Rules.';
      } else if (error?.code === 'unavailable') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      toast({
        title: 'Submission failed',
        description: errorMessage,
        variant: 'destructive',
      });
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
                            <div
                              className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-all"
                            >
                              <RadioGroupItem value={option} id={`option-${index}`} />
                              <Label 
                                htmlFor={`option-${index}`} 
                                className="flex-1 cursor-pointer text-base"
                              >
                                {option}
                              </Label>
                            </div>
                            
                            {/* Show text input when "other" is selected */}
                            {option.toLowerCase() === 'other' && textAnswer.startsWith('other:') && (
                              <div className="space-y-4">
                                <Textarea
                                  value={textAnswer.replace('other:', '')}
                                  onChange={(e) => setTextAnswer(`other:${e.target.value}`)}
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
                        (textAnswer.startsWith('other:') && textAnswer.replace('other:', '').trim() === '')
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
