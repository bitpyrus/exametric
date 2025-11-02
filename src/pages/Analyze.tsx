import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchResults = async () => {
      try {
        console.log('Fetching analytics for user:', user.id);
        
        const resultsRef = ref(database, `examResults/${user.id}`);
        const snapshot = await get(resultsRef);
        
        const fetchedResults: ExamResult[] = [];
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([key, value]: [string, any]) => {
            console.log('Found result:', key, value);
            fetchedResults.push({
              id: key,
              ...value,
            } as ExamResult);
          });
        }
        
        console.log(`Fetched ${fetchedResults.length} results for analytics`);
        
        setResults(fetchedResults);
      } catch (error: any) {
        console.error('Error fetching results:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [user, navigate]);

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
