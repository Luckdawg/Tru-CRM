import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Edit2, Save, X, FolderKanban, Calendar, TrendingUp, Users, Heart } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    projectName: string;
    status: "Planning" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
    goLiveDate: string;
    healthStatus: "Healthy" | "At Risk" | "Critical";
    adoptionLevel: "Low" | "Medium" | "High";
    activeUsers: string;
    customerSentiment: "Positive" | "Neutral" | "Negative";
    notes: string;
  }>({
    projectName: "",
    status: "Planning",
    goLiveDate: "",
    healthStatus: "Healthy",
    adoptionLevel: "Medium",
    activeUsers: "",
    customerSentiment: "Neutral",
    notes: "",
  });

  const { data: project, isLoading } = trpc.projects.get.useQuery(
    { id: parseInt(id || "0") },
    { enabled: isAuthenticated && !!id }
  );

  const { data: account } = trpc.accounts.get.useQuery(
    { id: project?.accountId || 0 },
    { enabled: !!project?.accountId }
  );

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully");
      setIsEditing(false);
      trpc.useUtils().projects.get.invalidate({ id: parseInt(id || "0") });
    },
    onError: (error: any) => {
      toast.error("Failed to update project: " + error.message);
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      setLocation("/projects");
    },
    onError: (error: any) => {
      toast.error("Failed to delete project: " + error.message);
    },
  });

  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName || "",
        status: project.status || "Planning",
        goLiveDate: project.goLiveDate ? new Date(project.goLiveDate).toISOString().split("T")[0] : "",
        healthStatus: project.healthStatus || "Healthy",
        adoptionLevel: project.adoptionLevel || "Medium",
        activeUsers: project.activeUsers?.toString() || "",
        customerSentiment: project.customerSentiment || "Neutral",
        notes: project.notes || "",
      });
    }
  }, [project]);

  const handleSave = () => {
    console.log("=== handleSave called ===");
    console.log("formData:", formData);
    
    if (!formData.projectName) {
      toast.error("Project name is required");
      return;
    }

    updateMutation.mutate({
      id: parseInt(id || "0"),
      data: {
        projectName: formData.projectName,
        status: formData.status,
        goLiveDate: formData.goLiveDate ? new Date(formData.goLiveDate) : undefined,
        healthStatus: formData.healthStatus,
        adoptionLevel: formData.adoptionLevel,
        activeUsers: formData.activeUsers ? parseInt(formData.activeUsers) : undefined,
        customerSentiment: formData.customerSentiment,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteMutation.mutate({ id: parseInt(id || "0") });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Planning": "bg-blue-100 text-blue-800",
      "In Progress": "bg-yellow-100 text-yellow-800",
      "On Hold": "bg-orange-100 text-orange-800",
      "Completed": "bg-green-100 text-green-800",
      "Cancelled": "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      "Healthy": "bg-green-100 text-green-800",
      "At Risk": "bg-yellow-100 text-yellow-800",
      "Critical": "bg-red-100 text-red-800",
    };
    return colors[health] || "bg-gray-100 text-gray-800";
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      "Positive": "bg-green-100 text-green-800",
      "Neutral": "bg-gray-100 text-gray-800",
      "Negative": "bg-red-100 text-red-800",
    };
    return colors[sentiment] || "bg-gray-100 text-gray-800";
  };

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <Button asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <img src="/visium-v-logo.png" alt="Visium" className="h-10 cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">Project Detail</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <nav className="border-b bg-card">
        <div className="container">
          <div className="flex gap-1 py-2">
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard">Dashboard</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/leads">Leads</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/accounts">Accounts</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/contacts">Contacts</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/opportunities">Opportunities</Link></Button>
            <Button variant="default" size="sm" asChild><Link href="/projects">Projects</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/cases">Support</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <FolderKanban className="h-12 w-12 text-primary" />
              <div>
                <h2 className="text-3xl font-bold text-foreground">{project.projectName}</h2>
                <p className="text-muted-foreground">Implementation Project</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Project Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic project details and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goLiveDate">Target Go-Live Date</Label>
                    <Input
                      id="goLiveDate"
                      type="date"
                      value={formData.goLiveDate}
                      onChange={(e) => setFormData({ ...formData, goLiveDate: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground">Project Name</Label>
                    <p className="text-lg font-medium">{project.projectName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Account</Label>
                    <p className="text-lg font-medium">
                      {account ? (
                        <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                          {account.accountName}
                        </Link>
                      ) : (
                        "Loading..."
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  {project.goLiveDate && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Target Go-Live Date
                      </Label>
                      <p className="text-lg font-medium">
                        {new Date(project.goLiveDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Health & Adoption Card */}
          <Card>
            <CardHeader>
              <CardTitle>Health & Adoption</CardTitle>
              <CardDescription>Project health metrics and customer engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="healthStatus">Health Status</Label>
                    <Select
                      value={formData.healthStatus}
                      onValueChange={(value: any) => setFormData({ ...formData, healthStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Healthy">Healthy</SelectItem>
                        <SelectItem value="At Risk">At Risk</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adoptionLevel">Adoption Level</Label>
                    <Select
                      value={formData.adoptionLevel}
                      onValueChange={(value: any) => setFormData({ ...formData, adoptionLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activeUsers">Active Users</Label>
                    <Input
                      id="activeUsers"
                      type="number"
                      value={formData.activeUsers}
                      onChange={(e) => setFormData({ ...formData, activeUsers: e.target.value })}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerSentiment">Customer Sentiment</Label>
                    <Select
                      value={formData.customerSentiment}
                      onValueChange={(value: any) => setFormData({ ...formData, customerSentiment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Health Status
                    </Label>
                    <div className="mt-1">
                      <Badge className={getHealthColor(project.healthStatus || "Healthy")}>
                        {project.healthStatus || "Healthy"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Adoption Level</Label>
                    <p className="text-lg font-medium">{project.adoptionLevel || "Medium"}</p>
                  </div>
                  {project.activeUsers !== null && project.activeUsers !== undefined && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Active Users
                      </Label>
                      <p className="text-lg font-medium">{project.activeUsers}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Customer Sentiment
                    </Label>
                    <div className="mt-1">
                      <Badge className={getSentimentColor(project.customerSentiment || "Neutral")}>
                        {project.customerSentiment || "Neutral"}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes Card - Full Width */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Project Notes</CardTitle>
              <CardDescription>Internal notes and updates about the project</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add project notes, milestones, or important updates..."
                    rows={6}
                  />
                </div>
              ) : (
                <div className="prose max-w-none">
                  {project.notes ? (
                    <p className="whitespace-pre-wrap">{project.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No notes added yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
