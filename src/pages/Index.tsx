import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { GraduationCap, BarChart3, Users, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

export default function Index() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile && !isLoading) {
      navigate(getDashboardPath(profile.role), { replace: true });
    }
  }, [user, profile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">FeedbackIQ</span>
          </div>
          <Button asChild>
            <Link to="/auth">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl animate-slide-up">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Academic Feedback
            <span className="text-gradient-primary block">Intelligence Platform</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Transform student feedback into actionable insights with AI-powered sentiment analysis, 
            topic modeling, and comprehensive analytics for academic excellence.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Platform Features</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="dashboard-card text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Feedback Collection</h3>
              <p className="text-muted-foreground">
                Streamlined feedback submission for students with guided forms and real-time validation.
              </p>
            </div>
            <div className="dashboard-card text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">NLP Analytics</h3>
              <p className="text-muted-foreground">
                AI-powered sentiment analysis, topic modeling, and aspect-based insights.
              </p>
            </div>
            <div className="dashboard-card text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Users className="h-6 w-6 text-success" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Secure dashboards for admins, faculty, and students with appropriate access controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 FeedbackIQ. Academic Feedback Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
}
