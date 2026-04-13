import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StudentProvider } from "@/context/StudentContext";

import TeacherLayout from "@/components/layout/TeacherLayout";
import StudentLayout from "@/components/layout/StudentLayout";

import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth/signup";
import Dashboard from "@/pages/teacher/dashboard";
import Classes from "@/pages/teacher/classes";
import ClassDetail from "@/pages/teacher/classes/detail";
import Students from "@/pages/teacher/students";
import Tests from "@/pages/teacher/tests";
import CreateTest from "@/pages/teacher/tests/create";
import TestDetail from "@/pages/teacher/tests/detail";
import Uploads from "@/pages/teacher/uploads";
import AnalysisDashboard from "@/pages/teacher/analysis";
import StudentLogin from "@/pages/student/login";
import StudentTests from "@/pages/student/tests";
import TakeTest from "@/pages/student/tests/take";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function TeacherGuard({ children }: { children: React.ReactNode }) {
  const { isTeacher } = useAuth();
  if (!isTeacher) return <Redirect to="/auth" />;
  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();

  if (location === "/") return <Landing />;
  if (location === "/auth" || location.startsWith("/auth")) return <AuthPage />;

  if (location.startsWith("/student")) {
    return (
      <StudentProvider>
        <StudentLayout>
          <Switch>
            <Route path="/student" component={StudentLogin} />
            <Route path="/student/tests" component={StudentTests} />
            <Route path="/student/tests/:id" component={TakeTest} />
            <Route component={NotFound} />
          </Switch>
        </StudentLayout>
      </StudentProvider>
    );
  }

  return (
    <TeacherGuard>
      <TeacherLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/classes" component={Classes} />
          <Route path="/classes/:id" component={ClassDetail} />
          <Route path="/students" component={Students} />
          <Route path="/tests" component={Tests} />
          <Route path="/tests/create" component={CreateTest} />
          <Route path="/tests/:id" component={TestDetail} />
          <Route path="/uploads" component={Uploads} />
          <Route path="/analysis/:classId" component={AnalysisDashboard} />
          <Route component={NotFound} />
        </Switch>
      </TeacherLayout>
    </TeacherGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
