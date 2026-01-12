import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Edit2, 
  Trash2,
  Calendar as CalendarIcon
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MilestoneTimelineProps {
  projectId: number;
}

type MilestoneStatus = "Not Started" | "In Progress" | "Completed" | "Blocked";

interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completedDate: Date | null;
  status: MilestoneStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function MilestoneTimeline({ projectId }: MilestoneTimelineProps) {
  const utils = trpc.useUtils();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "Not Started" as MilestoneStatus,
  });

  const { data: milestones, isLoading } = trpc.milestones.list.useQuery({ projectId });

  const createMutation = trpc.milestones.create.useMutation({
    onSuccess: () => {
      utils.milestones.list.invalidate({ projectId });
      toast.success("Milestone created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create milestone: ${error.message}`);
    },
  });

  const updateMutation = trpc.milestones.update.useMutation({
    onSuccess: () => {
      utils.milestones.list.invalidate({ projectId });
      toast.success("Milestone updated successfully");
      setEditingMilestone(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });

  const deleteMutation = trpc.milestones.delete.useMutation({
    onSuccess: () => {
      utils.milestones.list.invalidate({ projectId });
      toast.success("Milestone deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete milestone: ${error.message}`);
    },
  });

  const toggleCompleteMutation = trpc.milestones.toggleComplete.useMutation({
    onSuccess: () => {
      utils.milestones.list.invalidate({ projectId });
    },
    onError: (error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      status: "Not Started",
    });
  };

  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    createMutation.mutate({
      projectId,
      title: formData.title,
      description: formData.description || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      status: formData.status,
      displayOrder: (milestones?.length || 0) + 1,
    });
  };

  const handleUpdate = () => {
    if (!editingMilestone) return;
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    updateMutation.mutate({
      id: editingMilestone.id,
      data: {
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        status: formData.status,
      },
    });
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      dueDate: milestone.dueDate ? format(new Date(milestone.dueDate), "yyyy-MM-dd") : "",
      status: milestone.status,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleComplete = (id: number) => {
    toggleCompleteMutation.mutate({ id });
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "In Progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "Blocked":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MilestoneStatus) => {
    const variants: Record<MilestoneStatus, string> = {
      "Completed": "bg-green-100 text-green-800 border-green-200",
      "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
      "Blocked": "bg-red-100 text-red-800 border-red-200",
      "Not Started": "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status}
      </Badge>
    );
  };

  const isOverdue = (milestone: Milestone) => {
    if (!milestone.dueDate || milestone.status === "Completed") return false;
    return new Date(milestone.dueDate) < new Date();
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading milestones...</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add Milestone
      </Button>

      {milestones && milestones.length > 0 ? (
        <div className="relative space-y-6">
          {/* Vertical timeline line */}
          <div className="absolute left-[11px] top-8 bottom-8 w-0.5 bg-border" />

          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 flex items-center justify-center">
                {getStatusIcon(milestone.status)}
              </div>

              {/* Milestone card */}
              <div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-lg">{milestone.title}</h4>
                      {getStatusBadge(milestone.status)}
                      {isOverdue(milestone) && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                          Overdue
                        </Badge>
                      )}
                    </div>

                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {milestone.dueDate && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due: {format(new Date(milestone.dueDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {milestone.completedDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Completed: {format(new Date(milestone.completedDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleComplete(milestone.id)}
                      disabled={toggleCompleteMutation.isPending}
                    >
                      {milestone.status === "Completed" ? "Reopen" : "Complete"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(milestone)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(milestone.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
          <p className="mb-4">No milestones yet</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add First Milestone
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || editingMilestone !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingMilestone(null);
            resetForm();
          }
        }}
        key={isCreateDialogOpen || editingMilestone !== null ? "open" : "closed"}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add New Milestone"}</DialogTitle>
            <DialogDescription>
              {editingMilestone ? "Update milestone details" : "Create a new project milestone"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Kickoff Meeting, Go-Live, Training Complete"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details about this milestone..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: MilestoneStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingMilestone(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingMilestone ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingMilestone ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
