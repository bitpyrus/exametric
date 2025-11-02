import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, Users, ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 md:mb-12 text-center">
            <div className="inline-block w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
              <GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-4">About Examertric</h1>
            <p className="text-muted-foreground text-lg md:text-xl px-4">Understanding Assessment Methods Through Data</p>
          </div>

          <Card className="mb-6 md:mb-10 shadow-elevated border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                Project Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <p className="leading-relaxed text-base md:text-lg">
                Examertric is an educational research platform designed to help students, teachers, and researchers 
                explore how students perform and feel about different assessment methods—specifically comparing 
                <strong className="text-primary font-semibold"> oral assessments</strong> versus <strong className="text-accent font-semibold"> written assessments</strong>.
              </p>
              <p className="leading-relaxed text-base md:text-lg">
                By collecting real performance data and student opinions, we can better understand the strengths 
                and preferences associated with each assessment type, ultimately informing more effective 
                evaluation strategies in education.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 mb-6 md:mb-10">
            <Card className="shadow-card hover:shadow-elevated transition-shadow border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  For Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-sm md:text-base text-muted-foreground">
                  Share your experiences and preferences. Your input helps educators understand how different 
                  assessment methods affect learning and performance.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow border-t-4 border-t-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                  </div>
                  For Educators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-sm md:text-base text-muted-foreground">
                  Gather data-driven insights about assessment effectiveness. Use the findings to make informed 
                  decisions about evaluation methods in your curriculum.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card hover:shadow-elevated transition-shadow mb-6 md:mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                Research Inspiration
              </CardTitle>
              <CardDescription className="text-sm md:text-base">Based on peer-reviewed educational research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <p className="leading-relaxed text-base md:text-lg">
                This platform is inspired by the seminal study <em>"Oral vs Written Assessments: A Test of 
                Students' Performance and Attitudes"</em> which investigates the comparative effectiveness 
                of different assessment modalities in educational settings.
              </p>
              <Button variant="outline" size="lg" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors w-full md:w-auto" asChild>
                <a 
                  href="https://www.tandfonline.com/doi/full/10.1080/02602938.2010.515012" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Read the Research Paper
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 md:space-y-4">
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm md:text-base leading-relaxed"><strong className="font-semibold">Performance Tracking:</strong> Record and analyze student scores across both assessment types</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm md:text-base leading-relaxed"><strong className="font-semibold">Opinion Collection:</strong> Gather student preferences and reasoning</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm md:text-base leading-relaxed"><strong className="font-semibold">Data Visualization:</strong> Interactive charts for easy interpretation</span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm md:text-base leading-relaxed"><strong className="font-semibold">Insights Dashboard:</strong> Automated analysis and key findings</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
