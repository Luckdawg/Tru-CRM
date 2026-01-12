import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Opportunities from "@/pages/Opportunities";
import Pipeline from "@/pages/Pipeline";
import Analytics from "./pages/Analytics";
import EmailSettings from "./pages/EmailSettings";
import OpportunityDetail from "./pages/OpportunityDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Dashboard from "./pages/Dashboard";
// import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/accounts"} component={Accounts} />
      <Route path={"/accounts/:id"} component={AccountDetail} />
      <Route path={"/contacts"} component={Contacts} />
      <Route path={"/contacts/:id"} component={ContactDetail} />
      <Route path={"/leads"} component={Leads} />
      <Route path={"/leads/:id"} component={LeadDetail} />
      <Route path={"/opportunities"} component={Opportunities} />
      <Route path="/opportunities/:id" component={OpportunityDetail} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/email-settings" component={EmailSettings} />
      <Route path={"/projects"} component={Projects} />
      <Route path={"/projects/:id"} component={ProjectDetail} />
      <Route path={"/cases"} component={Cases} />
      <Route path={"/cases/:id"} component={CaseDetail} />
          {/* <Route path="/reports" component={Reports} /> */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
