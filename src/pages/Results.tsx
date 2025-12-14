import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import Navigation from '@/components/Navigation';
import { Clock, FileText, Mic, Eye } from 'lucide-react';

interface TabChangeEvent {
  timestamp: string;
  wasHidden: boolean;
  durationHiddenMs?: number;
}

interface AnswerData {
  text?: string;
  audioUrl?: string;
  timeToAnswerMs?: number;
  questionDisplayedAt?: string;
  answeredAt?: string;
  audioQuestionDurationMs?: number;
}

interface ExamResult {
  id: string;
  timestamp: string;
  timeSpent: number;
  totalQuestions: number;
  answeredCount: number;
  score?: number;
  correctAnswers?: number;
  analysis?: Record<string, { correct: boolean; userAnswer: string; expectedAnswers?: string[] }>;
  answers: Record<string, AnswerData>;
  tabChangeEvents?: TabChangeEvent[];
  tabChangeCount?: number;
}

export default function Results() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  // Helper: safely parse a value to number or undefined
  const toNumberOrUndefined = (v: unknown): number | undefined => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchResults = async () => {
      try {
        console.log('Fetching results for user:', user.id);

        const resultsRef = ref(database, `examResults/${user.id}`);
        const snapshot = await get(resultsRef);

        const fetchedResults: ExamResult[] = [];

        if (snapshot.exists()) {
          const data = snapshot.val() as Record<string, unknown>;

          Object.entries(data).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
              const valObj = value as Record<string, unknown>;

              const entry: ExamResult = {
                id: key,
                timestamp: String(valObj.timestamp ?? ''),
                timeSpent: toNumberOrUndefined(valObj.timeSpent) ?? 0,
                totalQuestions: toNumberOrUndefined(valObj.totalQuestions) ?? 0,
                answeredCount: toNumberOrUndefined(valObj.answeredCount) ?? 0,
                score: toNumberOrUndefined(valObj.score),
                correctAnswers: toNumberOrUndefined(valObj.correctAnswers),
                analysis: (valObj.analysis && typeof valObj.analysis === 'object') ? (valObj.analysis as Record<string, { correct: boolean; userAnswer: string; expectedAnswers: string[] }>) : undefined,
                answers: (valObj.answers && typeof valObj.answers === 'object') ? (valObj.answers as Record<string, AnswerData>) : {},
                tabChangeEvents: Array.isArray(valObj.tabChangeEvents) ? (valObj.tabChangeEvents as TabChangeEvent[]) : undefined,
                tabChangeCount: toNumberOrUndefined(valObj.tabChangeCount),
              };

              fetchedResults.push(entry);
            }
          });

          // Sort by timestamp descending
          fetchedResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }

        console.log(`Fetched ${fetchedResults.length} results`);

        setResults(fetchedResults);
        if (fetchedResults.length > 0) {
          setSelectedResult(fetchedResults[0]);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error fetching results:', message);
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

  const formatTimeMs = (ms: number) => {
    if (!ms || ms < 0 || !Number.isFinite(ms)) return '0ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
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
    ? Object.entries(selectedResult.answers ?? {}).filter(([_, ans]) => ans.text)
    : [];
  const audioAnswers = selectedResult
    ? Object.entries(selectedResult.answers ?? {}).filter(([_, ans]) => ans.audioUrl)
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
                    <div className="grid gap-4 md:grid-cols-3">
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

                      {typeof selectedResult.tabChangeCount === 'number' && (
                        <div className="flex items-center gap-3">
                          <Eye className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">
                              {selectedResult.tabChangeCount}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tab Switches
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Analysis */}
                {selectedResult.analysis && Object.keys(selectedResult.analysis ?? {}).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Your Answers ({Object.keys(selectedResult.analysis ?? {}).length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(selectedResult.analysis ?? {}).map(([key, result]) => {
                        const answerData = selectedResult.answers[key];
                        return (
                          <div key={key} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-muted-foreground">
                                {key}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Your answer:</span> {result.userAnswer}
                              </p>
                              {answerData?.timeToAnswerMs && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Time to answer:</span> {formatTimeMs(answerData.timeToAnswerMs)}
                                </p>
                              )}
                              {answerData?.audioQuestionDurationMs && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Audio question duration:</span> {formatTimeMs(answerData.audioQuestionDurationMs)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                          {answer.timeToAnswerMs && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Time to answer: {formatTimeMs(answer.timeToAnswerMs)}
                            </p>
                          )}
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
                          <div className="flex gap-4 mt-1">
                            {answer.timeToAnswerMs && (
                              <p className="text-xs text-muted-foreground">
                                Time to answer: {formatTimeMs(answer.timeToAnswerMs)}
                              </p>
                            )}
                            {answer.audioQuestionDurationMs && (
                              <p className="text-xs text-muted-foreground">
                                Audio question: {formatTimeMs(answer.audioQuestionDurationMs)}
                              </p>
                            )}
                          </div>
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
