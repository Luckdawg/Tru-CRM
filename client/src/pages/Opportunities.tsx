import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Search, TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Opportunities() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  
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
          <Link href="/opportunities/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Opportunity
            </Button>
          </Link>
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
              <Link href="/opportunities/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Opportunity
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
