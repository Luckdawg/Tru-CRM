import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, TrendingUp } from "lucide-react";

export default function LeadDetail() {
  const [, params] = useRoute("/leads/:id");
  const [, setLocation] = useLocation();
  const leadId = params?.id ? parseInt(params.id) : null;

  const { data: lead, isLoading, refetch } = trpc.leads.list.useQuery(
    {},
    {
      enabled: !!leadId,
    }
  );

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });

  const convertLead = trpc.leads.convertToOpportunity.useMutation({
    onSuccess: (data) => {
      toast.success("Lead converted successfully");
      setLocation(`/opportunities/${data.opportunityId}`);
    },
    onError: (error) => {
      toast.error(`Failed to convert lead: ${error.message}`);
    },
  });

  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      setLocation("/leads");
    },
    onError: (error) => {
      toast.error(`Failed to delete lead: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    leadSource: "Website" as const,
    status: "New" as "New" | "Working" | "Qualified" | "Disqualified" | "Converted",
    segment: "SMB" as const,
    score: 0,
    notes: "",
  });

  const currentLead = lead?.find((l: any) => l.id === leadId);

  useEffect(() => {
    if (currentLead) {
      setFormData({
        firstName: currentLead.firstName || "",
        lastName: currentLead.lastName || "",
        email: currentLead.email || "",
        phone: currentLead.phone || "",
        company: currentLead.company || "",
        title: currentLead.title || "",
        leadSource: (currentLead.leadSource as any) || "Website",
        status: (currentLead.status as any) || "New",
        segment: (currentLead.segment as any) || "SMB",
        score: currentLead.score || 0,
        notes: currentLead.notes || "",
      });
    }
  }, [currentLead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    updateLead.mutate({
      id: leadId,
      data: formData,
    });
  };

  const handleDelete = () => {
    if (!leadId) return;
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLead.mutate({ id: leadId });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (!currentLead) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button onClick={() => setLocation("/leads")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/leads")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
            <CardDescription>
              View and edit lead information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadSource">Lead Source</Label>
                  <Select
                    value={formData.leadSource}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, leadSource: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Trade Show">Trade Show</SelectItem>
                      <SelectItem value="Partner Referral">Partner Referral</SelectItem>
                      <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                      <SelectItem value="Content Download">Content Download</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Disqualified">Disqualified</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment">Segment</Label>
                  <Select
                    value={formData.segment}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, segment: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMB">SMB</SelectItem>
                      <SelectItem value="Mid-Market">Mid-Market</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score">Lead Score</Label>
                  <Input
                    id="score"
                    type="number"
                    value={formData.score}
                    onChange={(e) =>
                      setFormData({ ...formData, score: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteLead.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Lead
                  </Button>

                  {formData.status !== "Converted" && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (confirm("Convert this lead to an opportunity? This will create an account, contact, and opportunity.")) {
                          convertLead.mutate({ leadId: leadId! });
                        }
                      }}
                      disabled={convertLead.isPending}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {convertLead.isPending ? "Converting..." : "Convert to Opportunity"}
                    </Button>
                  )}
                </div>

                <Button type="submit" disabled={updateLead.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateLead.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="text-sm">
                  {currentLead.createdAt
                    ? new Date(currentLead.createdAt).toLocaleDateString()
                    : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="text-sm">
                  {currentLead.updatedAt
                    ? new Date(currentLead.updatedAt).toLocaleDateString()
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
