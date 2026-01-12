import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, FolderKanban, AlertTriangle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Projects() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    accountId: "",
    status: "Planning" as const,
    goLiveDate: "",
  });
  
  const { data: projects, isLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: accounts } = trpc.accounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Project created successfully");
      setOpen(false);
      setFormData({
        projectName: "",
        accountId: "",
        status: "Planning",
        goLiveDate: "",
      });
      trpc.useUtils().projects.list.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to create project: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.accountId) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      projectName: formData.projectName,
      accountId: parseInt(formData.accountId),
      status: formData.status,
      goLiveDate: formData.goLiveDate ? new Date(formData.goLiveDate) : undefined,
      ownerId: user!.id,
    });
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

  const getHealthIcon = (health: string) => {
    if (health === "Critical") return <AlertCircle className="h-4 w-4" />;
    if (health === "At Risk") return <AlertTriangle className="h-4 w-4" />;
    return null;
  };

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <img src="/visium-v-logo.png" alt="Visium" className="h-10 cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">Projects</h1>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Projects & Implementations</h2>
            <p className="text-muted-foreground">Track onboarding and implementation projects</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new implementation project for customer onboarding
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input
                      id="projectName"
                      placeholder="e.g., Acme Corp Implementation"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountId">Account *</Label>
                    <Select
                      value={formData.accountId}
                      onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading projects...</p>
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4">
            {projects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FolderKanban className="h-10 w-10 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{project.projectName}</CardTitle>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                            {project.healthStatus && project.healthStatus !== "Healthy" && (
                              <Badge className={getHealthColor(project.healthStatus)} variant="outline">
                                <span className="flex items-center gap-1">
                                  {getHealthIcon(project.healthStatus)}
                                  {project.healthStatus}
                                </span>
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            Implementation Project
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {project.goLiveDate && (
                          <div>Go-Live: {new Date(project.goLiveDate).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground">Projects will appear here once opportunities are won</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
