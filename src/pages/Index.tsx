import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Lightbulb, ArrowRight, TrendingUp, Sparkles, FileText } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-50" />
          <div className="container relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="h-4 w-4" />
                Educational Research Platform
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Exametric
                </span>
              </h1>
              
              <p className="text-2xl md:text-3xl font-semibold text-foreground">
                Oral vs Written Assessments
              </p>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                A comprehensive platform to explore how students perform and feel about different assessment methods. 
                Collect data, analyze performance, and discover insights about oral and written evaluations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button asChild size="lg" className="gap-2 shadow-elevated text-base hover:scale-105 transition-transform">
                  <Link to="/exam">
                    <BarChart3 className="h-5 w-5" />
                    Take Exam
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 text-base hover:scale-105 transition-transform">
                  <Link to="/results">
                    <Lightbulb className="h-5 w-5" />
                    View Results
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              <Card className="shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-primary">
                <CardHeader className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Take Exam</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Complete computer knowledge assessment with written and audio questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="p-0 h-auto gap-1 text-primary font-semibold">
                    <Link to="/exam">
                      Start exam
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-accent">
                <CardHeader className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl">View Results</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Review your exam scores, answers, and detailed performance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="p-0 h-auto gap-1 text-accent font-semibold">
                    <Link to="/results">
                      Check results
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-primary">
                <CardHeader className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Research Insights</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    View comprehensive analytics and discover patterns in assessment performance and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="p-0 h-auto gap-1 text-primary font-semibold">
                    <Link to="/insights">
                      View insights
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 container">
          <Card className="max-w-4xl mx-auto shadow-elevated border-primary/10">
            <CardHeader className="text-center space-y-2">
              <div className="inline-block mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">About This Research</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground leading-relaxed text-lg max-w-2xl mx-auto">
                Exametric is a comprehensive platform for computer knowledge assessment. 
                Take exams with both written and audio questions, receive instant feedback with scores,
                and track your performance over time. Perfect for students preparing for technical interviews
                and educators assessing student knowledge.
              </p>
              <Button asChild variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                <Link to="/about">Learn More About Exametric</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
