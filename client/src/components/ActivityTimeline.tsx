import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type Activity = {
  id: number;
  subject: string;
  type: "Call" | "Email" | "Meeting" | "Demo" | "PoC Milestone" | "Task" | "Note";
  activityDate: Date;
  duration?: number | null;
  notes?: string | null;
  outcome?: string | null;
  emailFrom?: string | null;
  emailTo?: string | null;
  emailBody?: string | null;
  emailProvider?: "Gmail" | "Outlook" | null;
  isInbound?: number | null;
};

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading?: boolean;
}

const activityIcons = {
  Call: Phone,
  Email: Mail,
  Meeting: Calendar,
  Demo: FileText,
  "PoC Milestone": CheckCircle,
  Task: AlertCircle,
  Note: FileText,
};

const activityColors = {
  Call: "bg-blue-100 text-blue-700",
  Email: "bg-purple-100 text-purple-700",
  Meeting: "bg-green-100 text-green-700",
  Demo: "bg-orange-100 text-orange-700",
  "PoC Milestone": "bg-pink-100 text-pink-700",
  Task: "bg-yellow-100 text-yellow-700",
  Note: "bg-gray-100 text-gray-700",
};

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading activities...
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activities found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type];
        const colorClass = activityColors[activity.type];

        return (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{activity.subject}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                      {activity.emailProvider && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.emailProvider}
                        </Badge>
                      )}
                      {activity.isInbound !== null && activity.type === "Email" && (
                        <Badge variant={activity.isInbound ? "default" : "outline"} className="text-xs">
                          {activity.isInbound ? "Inbound" : "Outbound"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(activity.activityDate), "PPp")}</span>
                      {activity.duration && (
                        <span>{activity.duration} minutes</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Email Details */}
              {activity.type === "Email" && (activity.emailFrom || activity.emailTo) && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  {activity.emailFrom && (
                    <div>
                      <span className="font-medium">From:</span> {activity.emailFrom}
                    </div>
                  )}
                  {activity.emailTo && (
                    <div>
                      <span className="font-medium">To:</span> {activity.emailTo}
                    </div>
                  )}
                </div>
              )}

              {/* Email Body Preview */}
              {activity.emailBody && (
                <div className="mb-3">
                  <p className="text-sm text-foreground line-clamp-3">
                    {activity.emailBody}
                  </p>
                  {activity.emailBody.length > 200 && (
                    <Button variant="link" size="sm" className="px-0 h-auto mt-1">
                      Read more
                    </Button>
                  )}
                </div>
              )}

              {/* Notes */}
              {activity.notes && !activity.emailBody && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">{activity.notes}</p>
                </div>
              )}

              {/* Outcome */}
              {activity.outcome && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <span className="font-medium text-green-900">Outcome:</span>{" "}
                  <span className="text-green-700">{activity.outcome}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
