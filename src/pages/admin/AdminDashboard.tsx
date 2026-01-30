import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, BarChart3, TrendingUp, Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface DashboardStats {
  totalFaculty: number;
  totalFeedback: number;
  totalStudents: number;
  analyzedFeedback: number;
}

interface SentimentData {
  name: string;
  value: number;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFaculty: 0,
    totalFeedback: 0,
    totalStudents: 0,
    analyzedFeedback: 0,
  });
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch faculty count
        const { count: facultyCount } = await supabase
          .from("faculty")
          .select("*", { count: "exact", head: true });

        // Fetch feedback count
        const { count: feedbackCount } = await supabase
          .from("feedback")
          .select("*", { count: "exact", head: true });

        // Fetch student count
        const { count: studentCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student");

        // Fetch analyzed feedback count
        const { count: analyzedCount } = await supabase
          .from("analysis_results")
          .select("*", { count: "exact", head: true });

        setStats({
          totalFaculty: facultyCount || 0,
          totalFeedback: feedbackCount || 0,
          totalStudents: studentCount || 0,
          analyzedFeedback: analyzedCount || 0,
        });

        // Fetch sentiment distribution
        const { data: sentimentResults } = await supabase
          .from("analysis_results")
          .select("sentiment");

        if (sentimentResults && sentimentResults.length > 0) {
          const sentimentCounts = sentimentResults.reduce(
            (acc: Record<string, number>, item) => {
              acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
              return acc;
            },
            {}
          );

          setSentimentData([
            { name: "Positive", value: sentimentCounts.positive || 0, color: "hsl(142, 71%, 45%)" },
            { name: "Neutral", value: sentimentCounts.neutral || 0, color: "hsl(38, 92%, 50%)" },
            { name: "Negative", value: sentimentCounts.negative || 0, color: "hsl(0, 84%, 60%)" },
          ]);
        }

        // Fetch department distribution
        const { data: facultyData } = await supabase
          .from("faculty")
          .select("department");

        if (facultyData && facultyData.length > 0) {
          const deptCounts = facultyData.reduce(
            (acc: Record<string, number>, item) => {
              acc[item.department] = (acc[item.department] || 0) + 1;
              return acc;
            },
            {}
          );

          setDepartmentData(
            Object.entries(deptCounts).map(([name, value]) => ({
              name,
              faculty: value,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of academic feedback intelligence
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/admin/faculty">
                <Plus className="mr-2 h-4 w-4" />
                Add Faculty
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/reports">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Faculty"
            value={stats.totalFaculty}
            description="Registered faculty members"
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Total Feedback"
            value={stats.totalFeedback}
            description="Submissions received"
            icon={MessageSquare}
            variant="accent"
          />
          <StatCard
            title="Active Students"
            value={stats.totalStudents}
            description="Registered students"
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Analyzed"
            value={stats.analyzedFeedback}
            description="NLP processed feedback"
            icon={BarChart3}
            variant="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
              <CardDescription>
                Overall sentiment analysis of all feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentimentData.length > 0 ? (
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
                  No sentiment data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Faculty by Department</CardTitle>
              <CardDescription>
                Distribution of faculty across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {departmentData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="faculty"
                        fill="hsl(234, 89%, 45%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No faculty data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/admin/faculty">
                  <Users className="h-6 w-6 text-primary" />
                  <span>Manage Faculty</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/admin/feedback">
                  <MessageSquare className="h-6 w-6 text-accent" />
                  <span>View All Feedback</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/admin/analytics">
                  <BarChart3 className="h-6 w-6 text-warning" />
                  <span>Analytics</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/admin/reports">
                  <FileText className="h-6 w-6 text-success" />
                  <span>Generate Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
