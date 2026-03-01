import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, LogOut, Shield, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  {
    to: "/dashboard/chapters",
    icon: BookOpen,
    label: "Manage Chapters",
  },
  {
    to: "/dashboard/users",
    icon: Users,
    label: "Manage Users",
  },
];

export default function DashboardLayout() {
  const { user, signout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar background gradient & glass finish */}
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] flex flex-col flex-shrink-0 z-10 transition-all duration-300 relative">
        {/* Branding */}
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 rounded-xl p-2">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">
                MemoHack
              </p>
              <p className="text-xs text-slate-500">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer group ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:translate-x-1"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={signout}
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 px-4 cursor-pointer transition-all duration-300 hover:shadow-sm"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content with subtle noise or clean background */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-slate-100/50">
        <Outlet />
      </main>
    </div>
  );
}
