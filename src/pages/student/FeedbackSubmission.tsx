import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { z } from "zod";

const feedbackSchema = z.object({
  facultyId: z.string().uuid("Please select a faculty member"),
  feedbackText: z
    .string()
    .min(20, "Feedback must be at least 20 characters")
    .max(2000, "Feedback must be less than 2000 characters"),
  semester: z.string().min(1, "Please select a semester"),
});

interface Faculty {
  id: string;
  name: string;
  department: string;
  course: string;
}

export default function FeedbackSubmission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>(
    searchParams.get("faculty") || ""
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [semester, setSemester] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [existingSubmissions, setExistingSubmissions] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch all faculty
        const { data: facultyData } = await supabase
          .from("faculty")
          .select("id, name, department, course")
          .order("name");

        setFacultyList(facultyData || []);

        // Fetch existing submissions for this semester
        const { data: submissions } = await supabase
          .from("feedback")
          .select("faculty_id")
          .eq("student_id", user.id)
          .eq("academic_year", academicYear);

        const submittedIds = new Set(submissions?.map((s) => s.faculty_id) || []);
        setExistingSubmissions(submittedIds);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load faculty list");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user, academicYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      feedbackSchema.parse({
        facultyId: selectedFaculty,
        feedbackText,
        semester,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (!user) {
      toast.error("You must be logged in to submit feedback");
      return;
    }

    // Check if already submitted for this faculty + semester
    const submissionKey = `${selectedFaculty}-${semester}`;
    if (existingSubmissions.has(selectedFaculty)) {
      toast.error("You have already submitted feedback for this faculty member");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("feedback").insert({
        student_id: user.id,
        faculty_id: selectedFaculty,
        feedback_text: feedbackText,
        semester,
        academic_year: academicYear,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already submitted feedback for this faculty and semester");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Feedback submitted successfully!");
      navigate("/student/submissions");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const availableFaculty = facultyList.filter(
    (f) => !existingSubmissions.has(f.id)
  );

  const selectedFacultyData = facultyList.find((f) => f.id === selectedFaculty);

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Submit Feedback</h1>
            <p className="text-muted-foreground">
              Share your experience with your faculty
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Form</CardTitle>
            <CardDescription>
              Your feedback is anonymous and helps improve the learning experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Faculty Selection */}
              <div className="space-y-2">
                <Label htmlFor="faculty">Select Faculty Member</Label>
                <Select
                  value={selectedFaculty}
                  onValueChange={setSelectedFaculty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a faculty member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFaculty.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name} - {faculty.course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFacultyData && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFacultyData.department} • {selectedFacultyData.course}
                  </p>
                )}
              </div>

              {/* Semester Selection */}
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall">Fall {currentYear}</SelectItem>
                    <SelectItem value="Spring">Spring {currentYear + 1}</SelectItem>
                    <SelectItem value="Summer">Summer {currentYear + 1}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback Text */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Share your thoughts on the teaching quality, course content, communication, assessments, and any suggestions for improvement..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Minimum 20 characters</span>
                  <span
                    className={
                      feedbackText.length > 2000 ? "text-destructive" : ""
                    }
                  >
                    {feedbackText.length}/2000
                  </span>
                </div>
              </div>

              {/* Guidelines */}
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-medium">Feedback Guidelines</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Be specific and constructive in your feedback</li>
                  <li>• Focus on teaching methods, course content, and communication</li>
                  <li>• Include both positive aspects and areas for improvement</li>
                  <li>• Avoid personal attacks or inappropriate language</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !selectedFaculty || !semester}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
