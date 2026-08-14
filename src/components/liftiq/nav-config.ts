import {
  Activity,
  BarChart3,
  Brain,
  CalendarRange,
  Dumbbell,
  Flag,
  History,
  LayoutDashboard,
  Library,
  Salad,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Video,
} from "lucide-react";

/** All Lift IQ redesign routes live under this prefix. */
export const LIQ_BASE = "/v2";

export const href = (path = "") => `${LIQ_BASE}${path}`;

export const PRIMARY_NAV = [
  { label: "Dashboard", path: "", icon: LayoutDashboard },
  { label: "Train", path: "/train", icon: Dumbbell },
  { label: "Programs", path: "/programs", icon: CalendarRange },
  { label: "Progress", path: "/progress", icon: TrendingUp },
  { label: "Exercises", path: "/exercises", icon: Library },
  { label: "AI Coach", path: "/coach", icon: Sparkles },
] as const;

export const SECONDARY_NAV = [
  { label: "Diet", path: "/diet", icon: Salad },
  { label: "Mind", path: "/mind", icon: Brain },
  { label: "Library", path: "/library", icon: Video },
  { label: "Recovery", path: "/recovery", icon: Activity },
  { label: "Goals", path: "/goals", icon: Flag },
] as const;

export const FOOTER_NAV = [
  { label: "History", path: "/history", icon: History },
  { label: "Stats", path: "/stats", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
] as const;

export const MORE_NAV = [
  { label: "Diet", path: "/diet", icon: Salad },
  { label: "Mind", path: "/mind", icon: Brain },
  { label: "Library", path: "/library", icon: Video },
  { label: "History", path: "/history", icon: History },
  { label: "Stats", path: "/stats", icon: BarChart3 },
  { label: "Programs", path: "/programs", icon: CalendarRange },
  { label: "Exercises", path: "/exercises", icon: Library },
  { label: "Recovery", path: "/recovery", icon: Activity },
  { label: "Goals", path: "/goals", icon: Flag },
  { label: "Settings", path: "/settings", icon: Settings },
] as const;

export const MOBILE_NAV = [
  { label: "Home", path: "", icon: LayoutDashboard },
  { label: "Train", path: "/train", icon: Dumbbell },
  { label: "Progress", path: "/progress", icon: TrendingUp },
  { label: "Coach", path: "/coach", icon: Sparkles },
  { label: "Profile", path: "/settings", icon: User },
] as const;
