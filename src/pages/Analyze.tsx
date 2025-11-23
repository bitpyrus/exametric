import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { Award, TrendingUp, Users, Target, FileText, Mic } from "lucide-react";

interface ExamResult {
  id: string;
  score?: number;
  correctAnswers?: number;
  answeredCount: number;
  totalQuestions: number;
  timeSpent: number;
  answers: Record<string, { text?: string; audioUrl?: string }>;
}

const Analyze = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userScores, setUserScores] = useState<Array<{ uid: string; email?: string | null; totalCorrect: number; totalQuestions: number; percent: number }>>([]);

  const ADMIN_EMAIL = 'admin@exametric.com';
  const isAdminUser = Boolean(user && (user.role === 'admin' || user.email === ADMIN_EMAIL));

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // helpers
    const toNumberOrZero = (v: unknown) => {
      if (v === undefined || v === null) return 0;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    const fetchResults = async () => {
      try {
        console.log('Fetching analytics, user:', user.id, 'isAdmin:', isAdminUser);

        const fetchedResults: ExamResult[] = [];

        if (isAdminUser) {
          // Admin: aggregate across all users under examResults and compute per-user totals
          const rootRef = ref(database, `examResults`);
          const snap = await get(rootRef);
          const perUserTotals: Record<string, { totalCorrect: number; totalQuestions: number; email?: string | null }> = {};

          if (snap.exists()) {
            const rootData = snap.val() as Record<string, Record<string, unknown>> | null;
            if (rootData) {
              // iterate users
              for (const userId of Object.keys(rootData)) {
                const userResults = rootData[userId] as Record<string, unknown> | undefined;
                if (!userResults || typeof userResults !== 'object') continue;

                let totalCorrect = 0;
                let totalQuestions = 0;

                for (const [resultId, value] of Object.entries(userResults)) {
                  if (!value || typeof value !== 'object') continue;
                  const valObj = value as Record<string, unknown>;

                  const correctFromField = toNumberOrZero(valObj.correctAnswers);
                  const tq = toNumberOrZero(valObj.totalQuestions);

                  // If correctAnswers field present, use it. Otherwise, try to count analysis entries with correct===true
                  let correctCount = correctFromField;
                  if (!correctFromField && valObj.analysis && typeof valObj.analysis === 'object') {
                    const analysis = valObj.analysis as Record<string, unknown>;
                    // count entries where analysis.correct === true OR analysis.mark > 0
                    let cc = 0;
                    Object.values(analysis).forEach((v) => {
                      if (!v || typeof v !== 'object') return;
                      const a = v as Record<string, unknown>;
                      if (a.correct === true) cc += 1;
                      else if (typeof a.mark === 'number' && a.mark > 0) cc += 1;
                    });
                    correctCount = cc;
                  }

                  totalCorrect += correctCount;
                  totalQuestions += tq;

                  // also push into flat results array for possible later use
                  const entry: ExamResult = {
                    id: String(resultId),
                    score: toNumberOrZero(valObj.score) || undefined,
                    correctAnswers: correctCount || undefined,
                    answeredCount: toNumberOrZero(valObj.answeredCount),
                    totalQuestions: tq,
                    timeSpent: toNumberOrZero(valObj.timeSpent),
                    answers: (valObj.answers && typeof valObj.answers === 'object') ? (valObj.answers as Record<string, { text?: string; audioUrl?: string }>) : {},
                  };
                  fetchedResults.push(entry);
                }

                // attempt to read user profile for email
                let email: string | null = null;
                try {
                  const userSnap = await get(ref(database, `users/${userId}`));
                  if (userSnap.exists()) {
                    const u = userSnap.val() as Record<string, unknown>;
                    email = typeof u.email === 'string' ? u.email : null;
                  }
                } catch (e) {
                  // ignore
                }

                perUserTotals[userId] = { totalCorrect, totalQuestions, email };
              }
            }
          }

          // Build userScores state from perUserTotals
          const scores = Object.entries(perUserTotals).map(([uid, totals]) => ({
            uid,
            email: totals.email ?? null,
            totalCorrect: totals.totalCorrect,
            totalQuestions: totals.totalQuestions || 0,
            percent: totals.totalQuestions ? Math.round((totals.totalCorrect / totals.totalQuestions) * 100) : 0,
          }));

          setUserScores(scores);
        } else {
          // Regular user: only their results
          const resultsRef = ref(database, `examResults/${user.id}`);
          const snapshot = await get(resultsRef);
          if (snapshot.exists()) {
            const data = snapshot.val() as Record<string, unknown> | null;
            if (data) {
              Object.entries(data).forEach(([key, value]) => {
                if (value && typeof value === 'object') {
                  const valObj = value as Record<string, unknown>;
                  const entry: ExamResult = {
                    id: key,
                    score: toNumberOrZero(valObj.score) || undefined,
                    correctAnswers: toNumberOrZero(valObj.correctAnswers) || undefined,
                    answeredCount: toNumberOrZero(valObj.answeredCount),
                    totalQuestions: toNumberOrZero(valObj.totalQuestions),
                    timeSpent: toNumberOrZero(valObj.timeSpent),
                    answers: (valObj.answers && typeof valObj.answers === 'object') ? (valObj.answers as Record<string, { text?: string; audioUrl?: string }>) : {},
                  };
                  fetchedResults.push(entry);
                }
              });
            }
          }
        }

        console.log(`Fetched ${fetchedResults.length} results for analytics`);
        setResults(fetchedResults);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error fetching results:', message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [user, navigate, isAdminUser]);

  const calculateStats = () => {
    if (results.length === 0) return null;

    const totalExams = results.length;
    const avgScore = results.reduce((acc, r) => acc + (r.score || 0), 0) / totalExams;
    const avgTime = results.reduce((acc, r) => acc + r.timeSpent, 0) / totalExams;
    const avgCompletion = results.reduce((acc, r) => 
      acc + ((r.answeredCount / r.totalQuestions) * 100), 0
    ) / totalExams;

    // Count answer types across all results
    let textAnswers = 0;
    let audioAnswers = 0;
    
    results.forEach(result => {
      Object.values(result.answers).forEach(answer => {
        if (answer.text) textAnswers++;
        if (answer.audioUrl) audioAnswers++;
      });
    });

    return {
      totalExams,
      avgScore: avgScore.toFixed(1),
      avgTime: Math.round(avgTime),
      avgCompletion: avgCompletion.toFixed(1),
      textAnswers,
      audioAnswers,
    };
  };

  const getScoreDistribution = () => {
    const ranges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    results.forEach(result => {
      const score = result.score || 0;
      if (score <= 20) ranges['0-20']++;
      else if (score <= 40) ranges['21-40']++;
      else if (score <= 60) ranges['41-60']++;
      else if (score <= 80) ranges['61-80']++;
      else ranges['81-100']++;
    });

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
    }));
  };

  const getAnswerTypeData = () => {
    const stats = calculateStats();
    if (!stats) return [];

    return [
      { name: 'Written', value: stats.textAnswers, color: 'hsl(var(--primary))' },
      { name: 'Audio', value: stats.audioAnswers, color: 'hsl(var(--accent))' },
    ];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const stats = calculateStats();
  const scoreDistribution = getScoreDistribution();
  const answerTypeData = getAnswerTypeData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container py-12 flex items-center justify-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!stats || results.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>No Data Available</CardTitle>
                <CardDescription>
                  Complete some exams to see analytics and insights.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render admin user scores table when admin
  if (!isLoading && isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container py-12">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">User Scores</h1>
            <p className="text-muted-foreground">Score per user across all questions (total correct / total questions)</p>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2">User</th>
                      <th className="py-2">Total Correct</th>
                      <th className="py-2">Total Questions</th>
                      <th className="py-2">Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userScores.map((u) => (
                      <tr key={u.uid} className="border-b hover:bg-muted">
                        <td className="py-2">
                          <Link to={`/admin/review?uid=${encodeURIComponent(u.uid)}`} className="underline">
                            {u.email ?? u.uid}
                          </Link>
                        </td>
                        <td className="py-2">{u.totalCorrect}</td>
                        <td className="py-2">{u.totalQuestions}</td>
                        <td className="py-2">{u.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container py-12">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Performance Analytics</h1>
          <p className="text-muted-foreground text-lg">Comprehensive analysis of exam results and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed assessments
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all exams
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgCompletion}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Questions answered
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatTime(stats.avgTime)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per exam
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">Score Distribution</CardTitle>
              <CardDescription>Number of exams per score range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Number of Exams" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">Answer Type Distribution</CardTitle>
              <CardDescription>Written vs Audio responses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={answerTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {answerTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Answer Type Breakdown</CardTitle>
            <CardDescription>Total answers by type across all exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.textAnswers}</p>
                  <p className="text-sm text-muted-foreground">Written Answers</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.audioAnswers}</p>
                  <p className="text-sm text-muted-foreground">Audio Answers</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Analyze;
