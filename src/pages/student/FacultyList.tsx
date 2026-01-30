import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, GraduationCap, CheckCircle, MessageSquare } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Faculty {
  id: string;
  name: string;
  department: string;
  course: string;
  hasSubmitted?: boolean;
}

export default function StudentFacultyList() {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch all faculty
        const { data: facultyData } = await supabase
          .from("faculty")
          .select("id, name, department, course")
          .order("department, name");

        // Fetch student's submissions
        const { data: submissionData } = await supabase
          .from("feedback")
          .select("faculty_id")
          .eq("student_id", user.id);

        const submittedFacultyIds = new Set(
          submissionData?.map((s) => s.faculty_id) || []
        );

        const facultyWithStatus =
          facultyData?.map((f) => ({
            ...f,
            hasSubmitted: submittedFacultyIds.has(f.id),
          })) || [];

        setFacultyList(facultyWithStatus);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by department
  const groupedFaculty = filteredFaculty.reduce(
    (acc, faculty) => {
      if (!acc[faculty.department]) {
        acc[faculty.department] = [];
      }
      acc[faculty.department].push(faculty);
      return acc;
    },
    {} as Record<string, Faculty[]>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty List</h1>
          <p className="text-muted-foreground">
            View all faculty members and submit feedback
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, department, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Faculty List */}
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(groupedFaculty).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedFaculty).map(([department, faculty]) => (
              <Card key={department}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    {department}
                  </CardTitle>
                  <CardDescription>
                    {faculty.length} faculty member{faculty.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {faculty.map((f) => (
                      <div
                        key={f.id}
                        className="flex flex-col justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-medium">{f.name}</h3>
                            {f.hasSubmitted && (
                              <Badge variant="secondary" className="bg-success/10 text-success">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Submitted
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{f.course}</p>
                        </div>
                        <div className="mt-4">
                          {f.hasSubmitted ? (
                            <Button variant="outline" size="sm" className="w-full" disabled>
                              Feedback Submitted
                            </Button>
                          ) : (
                            <Button size="sm" className="w-full" asChild>
                              <Link to={`/student/feedback/new?faculty=${f.id}`}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Submit Feedback
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex h-[300px] flex-col items-center justify-center text-center">
              <GraduationCap className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No faculty found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Faculty members will appear here once added by administrators"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
