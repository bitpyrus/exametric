import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { examData, Question } from '@/data/examQuestions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/components/exam/AudioRecorder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Volume2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navigation from '@/components/Navigation';

type SectionId = 'section1_standard' | 'section1_control' | 'section2_standard' | 'section2_control';

export default function Exam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const [currentSection, setCurrentSection] = useState<SectionId>('section1_standard');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { text?: string; audioUrl?: string }>>({});
  const [textAnswer, setTextAnswer] = useState('');
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = Object.keys(examData.exam.sets) as SectionId[];
  const currentSectionData = examData.exam.sets[currentSection];
  const questions = Object.values(currentSectionData.questions);
  const currentQuestion = questions[currentQuestionIndex];
  const questionKey = `${currentSection}_${currentQuestion.id}`;

  const totalQuestions = sections.reduce(
    (sum, sectionId) => sum + Object.keys(examData.exam.sets[sectionId].questions).length,
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
    if (!textAnswer.trim()) {
      toast({
        title: 'Answer required',
        description: 'Please provide an answer before continuing.',
        variant: 'destructive',
      });
      return;
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
      // Upload audio to Firebase Storage
      const audioRef = ref(storage, `exam-audio/${user?.id}/${questionKey}_${Date.now()}.webm`);
      await uploadBytes(audioRef, blob);
      const audioUrl = await getDownloadURL(audioRef);

      setAnswers((prev) => ({
        ...prev,
        [questionKey]: { audioUrl },
      }));

      toast({
        title: 'Audio saved',
        description: 'Moving to next question.',
      });

      handleNext();
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to save audio. Please try again.',
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
      const [sectionId, questionId] = questionKey.split('_') as [SectionId, string];
      const question = examData.exam.sets[sectionId].questions[questionId];
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
      } else if (userAnswer.audioUrl) {
        // Audio answers need manual grading
        analysis[questionKey] = {
          correct: false,
          userAnswer: 'Audio response',
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
      const score = Math.round((correctAnswers / answeredCount) * 100);

      await addDoc(collection(db, 'examResults'), {
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
      });

      toast({
        title: 'Exam submitted!',
        description: `Your score: ${score}%. Results saved successfully.`,
      });

      navigate('/results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: 'Submission failed',
        description: 'Failed to submit exam. Please try again.',
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
