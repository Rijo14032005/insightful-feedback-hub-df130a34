import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { SentimentBadge } from "@/components/ui/sentiment-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, TrendingUp, AlertTriangle, ThumbsUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface FacultyFeedback {
  id: string;
  feedback_text: string;
  created_at: string;
  analysis_results: {
    sentiment: string;
    sentiment_score: number;
    topics: unknown;
    aspects: unknown;
  } | null;
}

interface DashboardStats {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  averageScore: number;
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<FacultyFeedback[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    averageScore: 0,
  });
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyData = async () => {
      if (!user) return;

      try {
        // Get faculty record for current user
        const { data: facultyRecord } = await supabase
          .from("faculty")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!facultyRecord) {
          setIsLoading(false);
          return;
        }

        // Fetch feedback with analysis results
        const { data: feedbackData } = await supabase
          .from("feedback")
          .select(`
            id,
            feedback_text,
            created_at,
            analysis_results (
              sentiment,
              sentiment_score,
              topics,
              aspects
            )
          `)
          .eq("faculty_id", facultyRecord.id)
          .eq("is_analyzed", true)
          .order("created_at", { ascending: false });

        if (feedbackData) {
          const mapped = feedbackData.map((f) => ({
            ...f,
            analysis_results: f.analysis_results?.[0] || null,
          })) as FacultyFeedback[];
          setFeedbackList(mapped);

          // Calculate stats
          const total = mapped.length;
          const positive = mapped.filter(
            (f) => f.analysis_results?.sentiment === "positive"
          ).length;
          const negative = mapped.filter(
            (f) => f.analysis_results?.sentiment === "negative"
          ).length;
          const neutral = total - positive - negative;

          const avgScore =
            mapped.reduce(
              (sum, f) => sum + (f.analysis_results?.sentiment_score || 0),
              0
            ) / (total || 1);

          setStats({
            totalFeedback: total,
            positiveFeedback: positive,
            negativeFeedback: negative,
            averageScore: avgScore,
          });

          setSentimentData([
            { name: "Positive", value: positive, color: "hsl(142, 71%, 45%)" },
            { name: "Neutral", value: neutral, color: "hsl(38, 92%, 50%)" },
            { name: "Negative", value: negative, color: "hsl(0, 84%, 60%)" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching faculty data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacultyData();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty Dashboard</h1>
          <p className="text-muted-foreground">
            View and analyze student feedback for your courses
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Feedback"
            value={stats.totalFeedback}
            description="Responses received"
            icon={MessageSquare}
            variant="default"
          />
          <StatCard
            title="Positive Feedback"
            value={stats.positiveFeedback}
            description={`${stats.totalFeedback > 0 ? ((stats.positiveFeedback / stats.totalFeedback) * 100).toFixed(0) : 0}% of total`}
            icon={ThumbsUp}
            variant="success"
          />
          <StatCard
            title="Needs Attention"
            value={stats.negativeFeedback}
            description="Negative responses"
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatCard
            title="Average Score"
            value={`${(stats.averageScore * 100).toFixed(0)}%`}
            description="Sentiment score"
            icon={TrendingUp}
            variant="accent"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Overview</CardTitle>
              <CardDescription>Distribution of feedback sentiments</CardDescription>
            </CardHeader>
            <CardContent>
              {sentimentData.length > 0 && sentimentData.some((d) => d.value > 0) ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No feedback data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest student responses</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackList.length > 0 ? (
                <div className="space-y-4">
                  {feedbackList.slice(0, 5).map((feedback) => (
                    <div
                      key={feedback.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        {feedback.analysis_results && (
                          <SentimentBadge
                            sentiment={feedback.analysis_results.sentiment as "positive" | "neutral" | "negative"}
                            score={feedback.analysis_results.sentiment_score}
                            size="sm"
                          />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {feedback.feedback_text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No feedback received yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
