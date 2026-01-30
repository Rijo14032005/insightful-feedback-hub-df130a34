import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Search, GraduationCap } from "lucide-react";

interface Faculty {
  id: string;
  name: string;
  email: string | null;
  department: string;
  course: string;
  created_at: string;
}

export default function FacultyManagement() {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    course: "",
  });

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .order("name");

      if (error) throw error;
      setFacultyList(data || []);
    } catch (error) {
      console.error("Error fetching faculty:", error);
      toast.error("Failed to load faculty list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", email: "", department: "", course: "" });
    setEditingFaculty(null);
  };

  const handleOpenDialog = (faculty?: Faculty) => {
    if (faculty) {
      setEditingFaculty(faculty);
      setFormData({
        name: faculty.name,
        email: faculty.email || "",
        department: faculty.department,
        course: faculty.course,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.department.trim() || !formData.course.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingFaculty) {
        // Update existing faculty
        const { error } = await supabase
          .from("faculty")
          .update({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            department: formData.department.trim(),
            course: formData.course.trim(),
          })
          .eq("id", editingFaculty.id);

        if (error) throw error;
        toast.success("Faculty updated successfully");
      } else {
        // Create new faculty
        const { error } = await supabase.from("faculty").insert({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          department: formData.department.trim(),
          course: formData.course.trim(),
          created_by: user?.id,
        });

        if (error) throw error;
        toast.success("Faculty added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchFaculty();
    } catch (error) {
      console.error("Error saving faculty:", error);
      toast.error("Failed to save faculty. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (faculty: Faculty) => {
    if (!confirm(`Are you sure you want to delete ${faculty.name}? This will also delete all associated feedback.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("faculty")
        .delete()
        .eq("id", faculty.id);

      if (error) throw error;
      toast.success("Faculty deleted successfully");
      fetchFaculty();
    } catch (error) {
      console.error("Error deleting faculty:", error);
      toast.error("Failed to delete faculty");
    }
  };

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faculty Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage faculty members
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingFaculty ? "Edit Faculty" : "Add New Faculty"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingFaculty
                      ? "Update faculty member details"
                      : "Add a new faculty member to the system"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Dr. John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john.smith@university.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      placeholder="Computer Science"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Input
                      id="course"
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                      placeholder="CS101 - Introduction to Programming"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingFaculty ? (
                      "Update"
                    ) : (
                      "Add Faculty"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search faculty by name, department, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Faculty Table */}
        <Card>
          <CardHeader>
            <CardTitle>Faculty List</CardTitle>
            <CardDescription>
              {filteredFaculty.length} faculty member
              {filteredFaculty.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFaculty.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaculty.map((faculty) => (
                      <TableRow key={faculty.id}>
                        <TableCell className="font-medium">
                          {faculty.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {faculty.email || "—"}
                        </TableCell>
                        <TableCell>{faculty.department}</TableCell>
                        <TableCell>{faculty.course}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(faculty)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(faculty)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-center">
                <GraduationCap className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No faculty found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Add your first faculty member to get started"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
