import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

type OpportunityStage = "Discovery" | "Solution Fit" | "PoC/Trial" | "Security Review" | "Procurement" | "Verbal Commit" | "Closed Won" | "Closed Lost";

export default function OpportunityDetail() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const oppId = parseInt(params.id || "0");
  
  const { data: opportunity, isLoading } = trpc.opportunities.get.useQuery(
    { id: oppId },
    { enabled: isAuthenticated && oppId > 0 }
  );

  const updateMutation = trpc.opportunities.update.useMutation({
    onSuccess: () => {
      toast.success("Opportunity updated successfully");
      trpc.useUtils().opportunities.get.invalidate({ id: oppId });
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const [formData, setFormData] = useState<{
    stage: OpportunityStage;
    probability: number;
    metrics: string;
    decisionCriteria: string;
    decisionProcess: string;
    identifiedPain: string;
    nextSteps: string;
  }>({
    stage: "Discovery",
    probability: 0,
    metrics: "",
    decisionCriteria: "",
    decisionProcess: "",
    identifiedPain: "",
    nextSteps: "",
  });

  useEffect(() => {
    if (opportunity) {
      setFormData({
        stage: opportunity.stage as OpportunityStage,
        probability: opportunity.probability || 0,
        metrics: opportunity.metrics || "",
        decisionCriteria: opportunity.decisionCriteria || "",
        decisionProcess: opportunity.decisionProcess || "",
        identifiedPain: opportunity.identifiedPain || "",
        nextSteps: opportunity.nextSteps || "",
      });
    }
  }, [opportunity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: oppId,
      data: formData,
    });
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

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Opportunity not found</h2>
          <Link href="/opportunities">
            <Button>Back to Opportunities</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/opportunities">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary">{opportunity.opportunityName}</h1>
                <p className="text-sm text-muted-foreground">
                  ${parseFloat(opportunity.amount).toLocaleString()} • {opportunity.probability}% probability
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge>{opportunity.stage}</Badge>
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Opportunity Details</CardTitle>
                  <CardDescription>Manage sales stage and probability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stage">Sales Stage</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => setFormData({ ...formData, stage: value as OpportunityStage })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Discovery">Discovery</SelectItem>
                          <SelectItem value="Solution Fit">Solution Fit</SelectItem>
                          <SelectItem value="PoC/Trial">PoC/Trial</SelectItem>
                          <SelectItem value="Security Review">Security Review</SelectItem>
                          <SelectItem value="Procurement">Procurement</SelectItem>
                          <SelectItem value="Verbal Commit">Verbal Commit</SelectItem>
                          <SelectItem value="Closed Won">Closed Won</SelectItem>
                          <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="probability">Probability (%)</Label>
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.probability}
                        onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>MEDDIC Qualification</CardTitle>
                  <CardDescription>Comprehensive opportunity qualification framework</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="metrics">Metrics</Label>
                    <Textarea
                      id="metrics"
                      placeholder="What are the quantifiable business outcomes? (e.g., reduce costs by 30%, improve efficiency by 50%)"
                      value={formData.metrics}
                      onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="decision_criteria">Decision Criteria</Label>
                    <Textarea
                      id="decision_criteria"
                      placeholder="What are the formal and informal criteria they'll use to evaluate solutions?"
                      value={formData.decisionCriteria}
                      onChange={(e) => setFormData({ ...formData, decisionCriteria: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="decision_process">Decision Process</Label>
                    <Textarea
                      id="decision_process"
                      placeholder="What is the formal approval process? Who needs to sign off at each stage?"
                      value={formData.decisionProcess}
                      onChange={(e) => setFormData({ ...formData, decisionProcess: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="identify_pain">Identify Pain</Label>
                    <Textarea
                      id="identify_pain"
                      placeholder="What is the critical business pain? What happens if they don't solve it?"
                      value={formData.identifiedPain}
                      onChange={(e) => setFormData({ ...formData, identifiedPain: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                  <CardDescription>Action items and follow-ups</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="What are the next actions required to move this deal forward?"
                    value={formData.nextSteps}
                    onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="text-2xl font-bold text-primary">
                      ${parseFloat(opportunity.amount).toLocaleString()}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Close Date</div>
                    <div className="font-semibold">
                      {new Date(opportunity.closeDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-semibold">{opportunity.type || "Not specified"}</div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
