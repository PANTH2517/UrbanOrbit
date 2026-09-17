import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Satellite, Map, BarChart3, FileText, LogOut, ShieldAlert, Menu } from "lucide-react";
import { Button } from "./Components/ui/button";
import { Badge } from "./Components/ui/badge";
import { User } from "./entities/User";
import StarfieldBackground from "./Components/ui/StarfieldBackground";

const BARE_PAGES = ["Welcome", "RoleSelection", "GovernmentLogin", "AdminLogin", "CitizenAuth", "GovernmentRegister", "NotFound"];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = User.onChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await User.logout();
    } finally {
      // The Welcome page's route is "/", not "/Welcome" - createPageUrl()
      // just concatenates "/" + name, which only works for pages whose
      // route literally matches their name (see app.jsx's <Route> list).
      window.location.href = "/";
    }
  };

  if (BARE_PAGES.includes(currentPageName)) {
    return children;
  }

  const isAdminPage = currentPageName === "AdminApprovals";
  const isGovernmentPage =
    ["GovernmentDashboard", "ManageIssues", "GovernmentReports"].includes(currentPageName) || isAdminPage;

  const citizenNavItems = [{ title: "Citizen Map", url: createPageUrl("CitizenMap"), icon: Map }];

  const governmentNavItems = [
    { title: "Government Dashboard", url: createPageUrl("GovernmentDashboard"), icon: Map },
    { title: "Manage Issues", url: createPageUrl("ManageIssues"), icon: FileText },
    { title: "Reports & Export", url: createPageUrl("GovernmentReports"), icon: BarChart3 },
    ...(user?.role === "admin"
      ? [{ title: "Admin Approvals", url: createPageUrl("AdminApprovals"), icon: ShieldAlert }]
      : []),
  ];

  const navigationItems = isGovernmentPage ? governmentNavItems : citizenNavItems;

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <StarfieldBackground />
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const displayName = user?.full_name || (isGovernmentPage ? "Government Official" : "Citizen");
  const roleLabel =
    user?.role === "admin" ? "Admin" : user?.role === "government_official" ? "Verified Official" : "Citizen";

  return (
    <div className="min-h-screen flex w-full relative text-white">
      <StarfieldBackground density={70} />
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-white/10 bg-[#070a16]/70 backdrop-blur-xl relative z-10">
        <SidebarInner
          navigationItems={navigationItems}
          location={location}
          isGovernmentPage={isGovernmentPage}
          displayName={displayName}
          roleLabel={roleLabel}
          onLogout={handleLogout}
        />
      </aside>

      {/* Sidebar (mobile drawer) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 h-full bg-[#070a16] border-r border-white/10 shadow-2xl">
            <SidebarInner
              navigationItems={navigationItems}
              location={location}
              isGovernmentPage={isGovernmentPage}
              displayName={displayName}
              roleLabel={roleLabel}
              onLogout={handleLogout}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="bg-[#070a16]/70 backdrop-blur-xl border-b border-white/10 px-6 py-4 md:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Satellite className="w-6 h-6 text-cyan-400" />
              <h1 className="text-lg font-bold text-white">UrbanOrbit</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}

function SidebarInner({ navigationItems, location, isGovernmentPage, displayName, roleLabel, onLogout, onNavigate }) {
  return (
    <>
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(56,242,255,0.35)]">
            <Satellite className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">
              Urban<span className="uo-gradient-text">Orbit</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isGovernmentPage ? "Government Portal" : "Citizen Portal"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Navigation</p>
        {navigationItems.map((item) => {
          const active = location.pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white shadow-[inset_0_0_0_1px_rgba(56,242,255,0.3)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "text-cyan-400" : ""}`} />
              <span className="text-sm">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${
                isGovernmentPage
                  ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-[0_0_12px_rgba(162,89,255,0.4)]"
                  : "bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_12px_rgba(56,242,255,0.4)]"
              }`}
            >
              <span>{displayName?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{displayName}</p>
              <Badge variant={isGovernmentPage ? "default" : "secondary"} className="text-[10px] mt-0.5">
                {roleLabel}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
