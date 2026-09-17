import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "./Components/auth/ProtectedRoute";
import Layout from "./Layout";
import PageTransition from "./Components/ui/PageTransition";
import PageLoader from "./Components/ui/PageLoader";

// Route-level code splitting: each page (and its own dependencies, e.g.
// react-leaflet or recharts) only downloads when a user actually navigates
// there, instead of everyone paying for the full app in one bundle.
const HomePage = lazy(() => import("./Pages/Welcome"));
const RoleSelection = lazy(() => import("./Pages/RoleSelection"));
const CitizenAuth = lazy(() => import("./Pages/CitizenAuth"));
const CitizenMap = lazy(() => import("./Pages/CitizenMap"));
const GovernmentLogin = lazy(() => import("./Pages/GovernmentLogin"));
const AdminLogin = lazy(() => import("./Pages/AdminLogin"));
const GovernmentRegister = lazy(() => import("./Pages/GovernmentRegister"));
const GovernmentDashboard = lazy(() => import("./Pages/GovernmentDashboard"));
const ManageIssues = lazy(() => import("./Pages/ManageIssues"));
const GovernmentReports = lazy(() => import("./Pages/GovernmentReports"));
const AdminApprovals = lazy(() => import("./Pages/AdminApprovals"));
const NotFound = lazy(() => import("./Pages/NotFound"));

const OFFICIAL_ROLES = ["government_official", "admin"];

const PAGE_NAMES_BY_PATH = {
  "/": "Welcome",
  "/RoleSelection": "RoleSelection",
  "/CitizenAuth": "CitizenAuth",
  "/CitizenMap": "CitizenMap",
  "/GovernmentLogin": "GovernmentLogin",
  "/AdminLogin": "AdminLogin",
  "/GovernmentRegister": "GovernmentRegister",
  "/GovernmentDashboard": "GovernmentDashboard",
  "/ManageIssues": "ManageIssues",
  "/GovernmentReports": "GovernmentReports",
  "/AdminApprovals": "AdminApprovals",
};

function App() {
  const location = useLocation();
  const currentPageName = PAGE_NAMES_BY_PATH[location.pathname] || "NotFound";

  return (
    <Layout currentPageName={currentPageName}>
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/RoleSelection" element={<RoleSelection />} />
            <Route path="/CitizenAuth" element={<CitizenAuth />} />
            <Route path="/CitizenMap" element={<CitizenMap />} />
            <Route path="/GovernmentLogin" element={<GovernmentLogin />} />
            <Route path="/AdminLogin" element={<AdminLogin />} />
            <Route path="/GovernmentRegister" element={<GovernmentRegister />} />

            <Route
              path="/GovernmentDashboard"
              element={
                <ProtectedRoute roles={OFFICIAL_ROLES}>
                  <GovernmentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ManageIssues"
              element={
                <ProtectedRoute roles={OFFICIAL_ROLES}>
                  <ManageIssues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/GovernmentReports"
              element={
                <ProtectedRoute roles={OFFICIAL_ROLES}>
                  <GovernmentReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AdminApprovals"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminApprovals />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
