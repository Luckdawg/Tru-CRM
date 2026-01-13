import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Activity, TrendingUp, TrendingDown, Minus, Calendar, Mail, Phone, Users } from "lucide-react";
import { Link } from "wouter";

export default function Engagement() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: engagementScores, isLoading } = trpc.engagement.allAccountEngagementScores.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  const highEngagement = engagementScores?.filter(a => a.engagementLevel === 'High') || [];
  const mediumEngagement = engagementScores?.filter(a => a.engagementLevel === 'Medium') || [];
  const lowEngagement = engagementScores?.filter(a => a.engagementLevel === 'Low') || [];

  const getEngagementIcon = (level: string) => {
    switch (level) {
      case 'High':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'Medium':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'Low':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <img src="/visium-v-logo.png" alt="Visium" className="h-10 cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold text-primary">Account Engagement</h1>
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
            <Button variant="ghost" size="sm" asChild><Link href="/projects">Projects</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/cases">Support</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/analytics">Analytics</Link></Button>
            <Button variant="default" size="sm" asChild><Link href="/engagement">Engagement</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Customer Engagement Tracking</h2>
          <p className="text-muted-foreground">Monitor account activity and identify at-risk relationships</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading engagement data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Engagement Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{highEngagement.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Score ≥ 70</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Medium Engagement</CardTitle>
                  <Minus className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{mediumEngagement.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Score 40-69</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Low Engagement</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{lowEngagement.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Score &lt; 40</p>
                </CardContent>
              </Card>
            </div>

            {/* Low Engagement Accounts - Priority */}
            {lowEngagement.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Accounts Requiring Attention</CardTitle>
                  <CardDescription>
                    Low engagement accounts that need immediate follow-up
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowEngagement.map((account) => (
                      <Link key={account.id} href={`/accounts/${account.id}`}>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{account.accountName}</span>
                              <Badge className={getEngagementColor(account.engagementLevel || 'Low')}>
                                {account.engagementLevel}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Score: {account.engagementScore}/100 • 
                              {account.activityCount} activities • 
                              {account.lastActivityDate 
                                ? `Last: ${new Date(account.lastActivityDate).toLocaleDateString()}`
                                : 'No recent activity'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {account.factors?.slice(0, 3).join(' • ')}
                            </div>
                          </div>
                          {getEngagementIcon(account.engagementLevel || 'Low')}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Accounts by Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>All Accounts by Engagement Level</CardTitle>
                <CardDescription>
                  Complete view of customer engagement across your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engagementScores?.map((account) => (
                    <Link key={account.id} href={`/accounts/${account.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{account.accountName}</span>
                            <Badge className={getEngagementColor(account.engagementLevel || 'Low')}>
                              {account.engagementLevel}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {account.engagementScore}/100
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {account.activityCount} activities in last 90 days • 
                            {account.activityTypes?.length || 0} activity types
                            {account.lastActivityDate && 
                              ` • Last: ${new Date(account.lastActivityDate).toLocaleDateString()}`
                            }
                          </div>
                        </div>
                        {getEngagementIcon(account.engagementLevel || 'Low')}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
