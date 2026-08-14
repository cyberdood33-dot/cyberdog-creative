import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrefetchGate } from "@/components/PrefetchGate";
import Account from "@/pages/Account";
import Analytics from "@/pages/Analytics";
import Admin from "@/pages/Admin";
import About from "@/pages/About";
import Assist from "@/pages/Assist";
import Community from "@/pages/Community";
import Contact from "@/pages/Contact";
import Docs from "@/pages/Docs";
import Feed from "@/pages/Feed";
import Home from "@/pages/Home";
import Journal from "@/pages/Journal";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";
import SearchPage from "@/pages/SearchPage";
import Profile from "@/pages/Profile";
import Support from "@/pages/Support";
import Work from "@/pages/Work";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/about" component={About} />
    <Route path="/work" component={Work} />
    <Route path="/journal/:slug" component={Journal} />
    <Route path="/journal" component={Journal} />
    <Route path="/feed" component={Feed} />
    <Route path="/community" component={Community} />
    <Route path="/docs/:slug" component={Docs} />
    <Route path="/docs" component={Docs} />
    <Route path="/contact" component={Contact} />
    <Route path="/support" component={Support} />
    <Route path="/account" component={Account} />
    <Route path="/analytics" component={Analytics} />
    <Route path="/admin" component={Admin} />
    <Route path="/messages" component={Messages} />
    <Route path="/assist" component={Assist} />
    <Route path="/search" component={SearchPage} />
    <Route path="/profile/:memberId" component={Profile} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><PrefetchGate><Router /></PrefetchGate><Toaster richColors position="bottom-right" /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
