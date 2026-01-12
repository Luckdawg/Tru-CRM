import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { toast } from "sonner";

type OpportunityStage = "Discovery" | "Solution Fit" | "PoC/Trial" | "Security Review" | "Procurement" | "Verbal Commit" | "Closed Won" | "Closed Lost";

const STAGES: OpportunityStage[] = [
  "Discovery",
  "Solution Fit",
  "PoC/Trial",
  "Security Review",
  "Procurement",
  "Verbal Commit",
  "Closed Won",
  "Closed Lost",
];

interface Opportunity {
  id: number;
  opportunityName: string;
  accountId: number | null;
  stage: OpportunityStage;
  amount: string;
  probability: number | null;
  closeDate: Date;
  type: string | null;
}

function SortableOpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/opportunities/${opportunity.id}`}>
        <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold">{opportunity.opportunityName}</CardTitle>
            <CardDescription className="text-xs">
              {opportunity.type || "Standard Deal"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 font-bold text-primary">
                <DollarSign className="h-4 w-4" />
                {parseFloat(opportunity.amount).toLocaleString()}
              </div>
              <Badge variant="outline" className="text-xs">
                {opportunity.probability || 0}%
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Close: {new Date(opportunity.closeDate).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default function Pipeline() {
  const { user, isAuthenticated } = useAuth();
  const [activeId, setActiveId] = useState<number | null>(null);
  
  const { data: opportunities, isLoading } = trpc.opportunities.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateMutation = trpc.opportunities.update.useMutation({
    onSuccess: () => {
      toast.success("Opportunity moved successfully");
      trpc.useUtils().opportunities.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to move opportunity: " + error.message);
    },
  });

  const opportunitiesByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = opportunities?.filter(opp => opp.stage === stage) || [];
    return acc;
  }, {} as Record<OpportunityStage, Opportunity[]>);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const oppId = active.id as number;
    const newStage = over.id as OpportunityStage;
    
    const opportunity = opportunities?.find(opp => opp.id === oppId);
    if (opportunity && opportunity.stage !== newStage) {
      updateMutation.mutate({
        id: oppId,
        data: { stage: newStage },
      });
    }
    
    setActiveId(null);
  };

  const activeOpportunity = opportunities?.find(opp => opp.id === activeId);

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
            <h1 className="text-2xl font-bold text-primary">Sales Pipeline</h1>
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
            <Button variant="default" size="sm" asChild><Link href="/pipeline">Pipeline</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/projects">Projects</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/cases">Support</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Kanban Pipeline View</h2>
          <p className="text-muted-foreground">Drag and drop opportunities to update their stage</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading pipeline...</p>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STAGES.map((stage) => {
                const stageOpps = opportunitiesByStage[stage];
                const stageValue = stageOpps.reduce((sum, opp) => sum + parseFloat(opp.amount), 0);
                
                return (
                  <SortableContext
                    key={stage}
                    id={stage}
                    items={stageOpps.map(opp => opp.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="bg-muted/50 rounded-lg p-4 min-h-[500px]">
                      <div className="mb-4">
                        <h3 className="font-semibold text-sm mb-1">{stage}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{stageOpps.length} deals</span>
                          <span>${stageValue.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div>
                        {stageOpps.map((opp) => (
                          <SortableOpportunityCard key={opp.id} opportunity={opp} />
                        ))}
                      </div>
                    </div>
                  </SortableContext>
                );
              })}
            </div>

            <DragOverlay>
              {activeOpportunity && (
                <Card className="w-64 cursor-grabbing shadow-lg">
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold">{activeOpportunity.opportunityName}</CardTitle>
                    <CardDescription className="text-xs">
                      {activeOpportunity.type || "Standard Deal"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 font-bold text-primary">
                        <DollarSign className="h-4 w-4" />
                        {parseFloat(activeOpportunity.amount).toLocaleString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activeOpportunity.probability || 0}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}
