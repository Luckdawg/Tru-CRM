import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Search, TrendingUp, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function Opportunities() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [oppName, setOppName] = useState("");
  const [oppAmount, setOppAmount] = useState("");
  const [oppStage, setOppStage] = useState("Discovery");
  const [oppType, setOppType] = useState("New Business");
  const [oppProbability, setOppProbability] = useState("10");
  const [oppCloseDate, setOppCloseDate] = useState("");

  
  const utils = trpc.useUtils();
  const createOpportunity = trpc.opportunities.create.useMutation({
    onSuccess: () => {
      toast.success("Opportunity created successfully");
      utils.opportunities.list.invalidate();
      setIsCreateDialogOpen(false);
      // Reset form
      setOppName("");
      setOppAmount("");
      setOppStage("Discovery");
      setOppType("New Business");
      setOppProbability("10");
      setOppCloseDate("");
    },
    onError: (error) => {
      toast.error(`Failed to create opportunity: ${error.message}`);
    },
  });
  
  const handleCreateOpportunity = () => {
    console.log("=== handleCreateOpportunity called ===");
    console.log("oppName:", oppName);
    console.log("oppAmount:", oppAmount);
    console.log("oppCloseDate:", oppCloseDate);
    if (!oppName || !oppAmount || !oppCloseDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    createOpportunity.mutate({
      opportunityName: oppName,
      amount: parseFloat(oppAmount) || 0,
      stage: oppStage,
      type: oppType,
      probability: parseInt(oppProbability) || 0,
      closeDate: new Date(oppCloseDate),
      accountId: accounts && accounts.length > 0 ? accounts[0].id : undefined,
      ownerId: user!.id,
    });
  };
  
  // Check for filter parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam === 'open') {
      setStageFilter('all');
    }
  }, [location]);
  
  const { data: opportunities, isLoading } = trpc.opportunities.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const filteredOpps = opportunities?.filter(opp => {
    const matchesSearch = 
      opp.opportunityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === "all" || opp.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      "Discovery": "bg-blue-100 text-blue-800",
      "Solution Fit": "bg-yellow-100 text-yellow-800",
      "Proof of Concept": "bg-orange-100 text-orange-800",
      "Proposal": "bg-purple-100 text-purple-800",
      "Negotiation": "bg-pink-100 text-pink-800",
      "Closed Won": "bg-green-100 text-green-800",
      "Closed Lost": "bg-gray-100 text-gray-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
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
            <h1 className="text-2xl font-bold text-primary">Opportunities</h1>
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
            <Button variant="default" size="sm" asChild><Link href="/opportunities">Opportunities</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/projects">Projects</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/cases">Support</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sales Pipeline</h2>
            <p className="text-muted-foreground">Track and manage your sales opportunities</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Opportunity</DialogTitle>
                <DialogDescription>Add a new sales opportunity to your pipeline</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="opp-name">Opportunity Name *</Label>
                  <Input id="opp-name" value={oppName} onChange={(e) => setOppName(e.target.value)} placeholder="Enterprise Deal Q1" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opp-amount">Amount *</Label>
                  <Input id="opp-amount" type="number" value={oppAmount} onChange={(e) => setOppAmount(e.target.value)} placeholder="50000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opp-stage">Stage</Label>
                  <Select value={oppStage} onValueChange={setOppStage}>
                    <SelectTrigger id="opp-stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Discovery">Discovery</SelectItem>
                      <SelectItem value="Solution Fit">Solution Fit</SelectItem>
                      <SelectItem value="Proof of Concept">Proof of Concept</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Closed Won">Closed Won</SelectItem>
                      <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opp-type">Type</Label>
                  <Select value={oppType} onValueChange={setOppType}>
                    <SelectTrigger id="opp-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Business">New Business</SelectItem>
                      <SelectItem value="Upsell">Upsell</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opp-probability">Probability (%)</Label>
                  <Input id="opp-probability" type="number" value={oppProbability} onChange={(e) => setOppProbability(e.target.value)} placeholder="10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="opp-closedate">Expected Close Date *</Label>
                  <Input id="opp-closedate" type="date" value={oppCloseDate} onChange={(e) => setOppCloseDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleCreateOpportunity} disabled={createOpportunity.isPending}>
                  {createOpportunity.isPending ? "Creating..." : "Create Opportunity"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading opportunities...</p>
          </div>
        ) : filteredOpps && filteredOpps.length > 0 ? (
          <div className="grid gap-4">
            {filteredOpps.map((opp) => (
              <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-10 w-10 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{opp.opportunityName}</CardTitle>
                            <Badge className={getStageColor(opp.stage)}>
                              {opp.stage}
                            </Badge>
                          </div>
                          <CardDescription>
                            {opp.type && <span>{opp.type}</span>}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-primary">
                          <DollarSign className="h-5 w-5" />
                          {parseFloat(opp.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {opp.probability}% probability
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div>Close Date: {new Date(opp.closeDate).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first opportunity</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Opportunity
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
