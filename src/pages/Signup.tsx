import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, Mail, Lock, User, RefreshCcw } from 'lucide-react';

// -----------------------------
// GDPR-SAFE RANDOM USER HELPER
// -----------------------------
const generateRandomUser = () => {
  const id = Math.floor(100000 + Math.random() * 900000);
  return {
    name: `User${id}`,
    email: `user${id}@exam.org`,
  };
};

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { user, signup, isLoading } = useAuth();
  const { toast } = useToast();

  // --------------------------------------
  // AUTO-GENERATE ANONYMOUS ID ON MOUNT
  // --------------------------------------
  useEffect(() => {
    const { name, email } = generateRandomUser();
    setName(name);
    setEmail(email);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to data collection and terms to create an account.",
        variant: "destructive",
      });
      return;
    }

    // Enforce @exam.org domain
    if (!email.toLowerCase().endsWith("@exam.org")) {
      toast({
        title: "Invalid Email",
        description: "Only email addresses ending with @exam.org are allowed.",
        variant: "destructive",
      });
      return;
    }

    await signup(email, password, name);
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <GraduationCap className="w-10 h-10 text-primary" />
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Examertric
            </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join Examertric to analyze assessment data</p>
          </div>

          <div className="bg-card rounded-lg shadow-lg border border-border p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Randomized Name (GDPR Safe)
                </Label>

                <div className="flex gap-2">
                  <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                  />

                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const u = generateRandomUser();
                        setName(u.name);
                        setEmail(u.email);
                      }}
                      className="flex items-center gap-1"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Randomized Email (@exam.org)
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>

              <div>
                <a
                    href="https://drive.google.com/file/d/11ydE-tc8Wva-2b27CVLbXgRAeQGHxEqf/view?usp=sharing"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Terms and Conditions
                </a>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2">
                <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-none"
                >
                  I confirm that I am over 18, I have read and understood the Terms and Conditions, and I consent to the processing of my data in accordance with GDPR for research purposes.
                </label>
              </div>

              <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!agreedToTerms}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
  );
};

export default Signup;
