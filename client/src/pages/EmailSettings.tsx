import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Mail, Calendar, Trash2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function EmailSettings() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: connections, isLoading } = trpc.email.connections.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const syncEmailsMutation = trpc.email.syncEmails.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} emails, created ${data.created} activities`);
      utils.email.connections.invalidate();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const syncCalendarMutation = trpc.email.syncCalendar.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} events, created ${data.created} activities`);
      utils.email.connections.invalidate();
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const deleteConnectionMutation = trpc.email.deleteConnection.useMutation({
    onSuccess: () => {
      toast.success("Email connection removed");
      utils.email.connections.invalidate();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  const handleSyncEmails = (connectionId: number) => {
    syncEmailsMutation.mutate({ connectionId });
  };

  const handleSyncCalendar = (connectionId: number) => {
    syncCalendarMutation.mutate({ connectionId });
  };

  const handleDeleteConnection = (connectionId: number) => {
    if (confirm("Are you sure you want to remove this email connection?")) {
      deleteConnectionMutation.mutate({ connectionId });
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
            <h1 className="text-2xl font-bold text-primary">Email Integration</h1>
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
            <Button variant="default" size="sm" asChild><Link href="/email-settings">Email Settings</Link></Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Email & Calendar Integration</h2>
          <p className="text-muted-foreground">Connect your email accounts to automatically log communications and sync calendar events</p>
        </div>

        {/* Connected Accounts */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
          
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading connections...
              </CardContent>
            </Card>
          ) : connections && connections.length > 0 ? (
            <div className="grid gap-4">
              {connections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${connection.provider === 'Gmail' ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <Mail className={`h-5 w-5 ${connection.provider === 'Gmail' ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{connection.provider}</CardTitle>
                          <CardDescription>{connection.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {connection.isActive ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {connection.lastSyncAt ? (
                          <span>Last synced: {new Date(connection.lastSyncAt).toLocaleString()}</span>
                        ) : (
                          <span>Never synced</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncEmails(connection.id)}
                          disabled={syncEmailsMutation.isPending}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Sync Emails
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncCalendar(connection.id)}
                          disabled={syncCalendarMutation.isPending}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Sync Calendar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteConnection(connection.id)}
                          disabled={deleteConnectionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No email accounts connected yet
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add New Connection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Add New Connection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-red-100">
                    <Mail className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>Gmail</CardTitle>
                    <CardDescription>Connect your Google account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail (OAuth Setup Required)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Requires GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Outlook</CardTitle>
                    <CardDescription>Connect your Microsoft account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Outlook (OAuth Setup Required)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Requires OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET environment variables
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Setup Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>How to configure OAuth for email integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Gmail Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Google Cloud Console and create a new project</li>
                <li>Enable Gmail API and Google Calendar API</li>
                <li>Create OAuth 2.0 credentials (Web application)</li>
                <li>Add authorized redirect URI: {window.location.origin}/api/oauth/gmail/callback</li>
                <li>Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI environment variables</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Outlook Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Azure Portal and register a new application</li>
                <li>Add Microsoft Graph API permissions (Mail.Read, Calendars.Read)</li>
                <li>Create a client secret</li>
                <li>Add redirect URI: {window.location.origin}/api/oauth/outlook/callback</li>
                <li>Set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET environment variables</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
