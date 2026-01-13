import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

// Win reasons
const WIN_REASONS = [
  "Better Features",
  "Better Price",
  "Existing Relationship",
  "Superior Support",
  "Faster Implementation",
  "Strategic Fit",
  "Product Quality",
  "Brand Reputation",
];

// Loss reasons
const LOSS_REASONS = [
  "Price Too High",
  "Missing Features",
  "Lost to Competitor",
  "Budget Constraints",
  "Timing Issues",
  "No Decision",
  "Went with Incumbent",
  "Poor Fit",
  "Technical Limitations",
];

interface WinLossAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: number;
  outcome: "Won" | "Lost";
  onSuccess: () => void;
}

export function WinLossAnalysisDialog({
  open,
  onOpenChange,
  opportunityId,
  outcome,
  onSuccess,
}: WinLossAnalysisDialogProps) {
  const [primaryReason, setPrimaryReason] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [dealSize, setDealSize] = useState("");
  const [customerFeedback, setCustomerFeedback] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  const createAnalysis = trpc.winLossAnalysis.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      // Reset form
      setPrimaryReason("");
      setCompetitorName("");
      setDealSize("");
      setCustomerFeedback("");
      setLessonsLearned("");
    },
  });

  const handleSubmit = () => {
    if (!primaryReason) {
      alert("Please select a primary reason");
      return;
    }

    createAnalysis.mutate({
      opportunityId,
      outcome,
      primaryReason,
      competitorName: competitorName || undefined,
      dealSize: dealSize || undefined,
      customerFeedback: customerFeedback || undefined,
      lessonsLearned: lessonsLearned || undefined,
    });
  };

  const reasons = outcome === "Won" ? WIN_REASONS : LOSS_REASONS;
  const showCompetitorField = outcome === "Lost" && primaryReason === "Lost to Competitor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={open ? 'open' : 'closed'}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {outcome === "Won" ? "🎉 Win Analysis" : "📊 Loss Analysis"}
          </DialogTitle>
          <DialogDescription>
            Capture insights from this {outcome === "Won" ? "successful" : "unsuccessful"} deal to improve future outcomes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Primary Reason */}
          <div className="space-y-2">
            <Label htmlFor="primaryReason">
              Primary Reason <span className="text-red-500">*</span>
            </Label>
            <Select value={primaryReason} onValueChange={setPrimaryReason}>
              <SelectTrigger id="primaryReason">
                <SelectValue placeholder={`Select ${outcome === "Won" ? "win" : "loss"} reason`} />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Competitor Name (conditional) */}
          {showCompetitorField && (
            <div className="space-y-2">
              <Label htmlFor="competitorName">Competitor Name</Label>
              <Input
                id="competitorName"
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                placeholder="Which competitor won the deal?"
              />
            </div>
          )}

          {/* Deal Size */}
          <div className="space-y-2">
            <Label htmlFor="dealSize">
              {outcome === "Won" ? "Final Deal Size" : "Estimated Deal Size"}
            </Label>
            <Input
              id="dealSize"
              type="number"
              value={dealSize}
              onChange={(e) => setDealSize(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {/* Customer Feedback */}
          <div className="space-y-2">
            <Label htmlFor="customerFeedback">Customer Feedback</Label>
            <Textarea
              id="customerFeedback"
              value={customerFeedback}
              onChange={(e) => setCustomerFeedback(e.target.value)}
              placeholder="What did the customer say about our product, pricing, or process?"
              rows={3}
            />
          </div>

          {/* Lessons Learned */}
          <div className="space-y-2">
            <Label htmlFor="lessonsLearned">Lessons Learned</Label>
            <Textarea
              id="lessonsLearned"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What would you do differently next time? What worked well?"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createAnalysis.isPending}>
            {createAnalysis.isPending ? "Saving..." : "Save Analysis"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
