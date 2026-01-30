import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, GraduationCap, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Faculty {
  id: string;
  name: string;
  department: string;
  course: string;
  hasSubmitted?: boolean;
}

interface Submission {
  id: string;
  faculty_id: string;
  feedback_text: string;
  created_at: string;
  faculty?: {
    name: string;
    department: string;
    course: string;
  };
}

interface DashboardStats {
  totalFaculty: number;
  submittedCount: number;
  pendingCount: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalFaculty: 0,
    submittedCount: 0,
    pendingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch all faculty
        const { data: facultyData } = await supabase
          .from("faculty")
          .select("id, name, department, course")
          .order("name");

        // Fetch student's submissions
        const { data: submissionData } = await supabase
          .from("feedback")
          .select(`
            id,
            faculty_id,
            feedback_text,
            created_at,
            faculty (
              name,
              department,
              course
            )
          `)
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        const submittedFacultyIds = new Set(
          submissionData?.map((s) => s.faculty_id) || []
        );

        const facultyWithStatus =
          facultyData?.map((f) => ({
            ...f,
            hasSubmitted: submittedFacultyIds.has(f.id),
          })) || [];

        setFacultyList(facultyWithStatus);
        setSubmissions((submissionData as Submission[]) || []);

        const total = facultyData?.length || 0;
        const submitted = submittedFacultyIds.size;

        setStats({
          totalFaculty: total,
          submittedCount: submitted,
          pendingCount: total - submitted,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const pendingFaculty = facultyList.filter((f) => !f.hasSubmitted);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Submit feedback for your courses and faculty
            </p>
          </div>
          <Button asChild>
            <Link to="/student/faculty">
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit Feedback
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Faculty Members"
            value={stats.totalFaculty}
            description="Available for feedback"
            icon={GraduationCap}
            variant="default"
          />
          <StatCard
            title="Submitted"
            value={stats.submittedCount}
            description="Feedback completed"
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Pending"
            value={stats.pendingCount}
            description="Awaiting your feedback"
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Content Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Feedback</CardTitle>
              <CardDescription>
                Faculty members awaiting your feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingFaculty.length > 0 ? (
                <div className="space-y-3">
                  {pendingFaculty.slice(0, 5).map((faculty) => (
                    <div
                      key={faculty.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{faculty.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {faculty.department} • {faculty.course}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link to={`/student/feedback/new?faculty=${faculty.id}`}>
                          Submit
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {pendingFaculty.length > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/student/faculty">
                        View all ({pendingFaculty.length - 5} more)
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center text-center">
                  <CheckCircle className="mb-2 h-10 w-10 text-success" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    You've submitted feedback for all faculty members
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Your Submissions</CardTitle>
              <CardDescription>Recently submitted feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-medium">{submission.faculty?.name}</p>
                        <Badge variant="secondary">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {submission.faculty?.department} • {submission.faculty?.course}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm">
                        {submission.feedback_text}
                      </p>
                    </div>
                  ))}
                  {submissions.length > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/student/submissions">
                        View all submissions
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center text-center">
                  <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No submissions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start by submitting feedback for your faculty
                  </p>
                  <Button className="mt-4" asChild>
                    <Link to="/student/faculty">Get Started</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
