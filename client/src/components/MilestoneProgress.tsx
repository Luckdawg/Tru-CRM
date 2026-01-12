import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface MilestoneProgressProps {
  projectId: number;
}

export default function MilestoneProgress({ projectId }: MilestoneProgressProps) {
  const { data: milestones } = trpc.milestones.list.useQuery({ projectId });

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const completedCount = milestones.filter((m) => m.status === "Completed").length;
  const totalCount = milestones.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="font-medium">
          {completedCount}/{totalCount}
        </span>
        <span className="text-muted-foreground">completed</span>
      </div>
      <div className="w-24">
        <Progress value={percentage} className="h-2" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">{percentage}%</span>
    </div>
  );
}
