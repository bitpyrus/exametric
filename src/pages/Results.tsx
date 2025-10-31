import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navigation from '@/components/Navigation';
import { Clock, CheckCircle2, FileText, Mic, Award, XCircle, Target } from 'lucide-react';

interface ExamResult {
  id: string;
  timestamp: string;
  timeSpent: number;
  totalQuestions: number;
  answeredCount: number;
  score?: number;
  correctAnswers?: number;
  analysis?: Record<string, { correct: boolean; userAnswer: string; expectedAnswers: string[] }>;
  answers: Record<string, { text?: string; audioUrl?: string }>;
}

export default function Results() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchResults = async () => {
      try {
        const q = query(
          collection(db, 'examResults'),
          where('userId', '==', user.id),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedResults: ExamResult[] = [];
        
        querySnapshot.forEach((doc) => {
          fetchedResults.push({
            id: doc.id,
            ...doc.data(),
          } as ExamResult);
        });
        
        setResults(fetchedResults);
        if (fetchedResults.length > 0) {
          setSelectedResult(fetchedResults[0]);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [user, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading results...</p>
        </main>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>No Results Yet</CardTitle>
              <CardDescription>You haven't completed any exams yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/exam')}>Take Exam</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const textAnswers = selectedResult
    ? Object.entries(selectedResult.answers).filter(([_, ans]) => ans.text)
    : [];
  const audioAnswers = selectedResult
    ? Object.entries(selectedResult.answers).filter(([_, ans]) => ans.audioUrl)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Results List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Exam Attempts</CardTitle>
              <CardDescription>Your exam history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.map((result) => (
                <Button
                  key={result.id}
                  variant={selectedResult?.id === result.id ? 'default' : 'outline'}
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {formatDate(result.timestamp)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {result.answeredCount}/{result.totalQuestions} answered
                    </span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Selected Result Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedResult && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Summary</CardTitle>
                    <CardDescription>
                      Completed on {formatDate(selectedResult.timestamp)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      {selectedResult.score !== undefined && (
                        <div className="flex items-center gap-3">
                          <Award className="h-8 w-8 text-accent" />
                          <div>
                            <p className="text-2xl font-bold">
                              {selectedResult.score}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Score
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Target className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">
                            {selectedResult.correctAnswers || 0}/{selectedResult.answeredCount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Correct Answers
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">
                            {formatTime(selectedResult.timeSpent)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Time Spent
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">
                            {Math.round((selectedResult.answeredCount / selectedResult.totalQuestions) * 100)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Completion
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Analysis */}
                {selectedResult.analysis && Object.keys(selectedResult.analysis).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Answer Analysis ({Object.keys(selectedResult.analysis).length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(selectedResult.analysis).map(([key, result]) => (
                        <div key={key} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-muted-foreground">
                              {key}
                            </p>
                            <Badge variant={result.correct ? "default" : "destructive"}>
                              {result.correct ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" /> Correct</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Incorrect</>
                              )}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">Your answer:</span> {result.userAnswer}
                            </p>
                            {!result.correct && result.userAnswer !== 'Audio response' && (
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Expected:</span> {result.expectedAnswers.join(' or ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Text Answers (if no analysis) */}
                {textAnswers.length > 0 && !selectedResult.analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Written Answers ({textAnswers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {textAnswers.map(([key, answer]) => (
                        <div key={key} className="border-b pb-4 last:border-0">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {key}
                          </p>
                          <p className="text-sm">{answer.text}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Audio Answers */}
                {audioAnswers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5" />
                        Audio Answers ({audioAnswers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {audioAnswers.map(([key, answer]) => (
                        <div key={key} className="border-b pb-4 last:border-0">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {key}
                          </p>
                          <audio src={answer.audioUrl} controls className="w-full" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
