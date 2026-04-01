import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Toaster } from "sonner"
import { Disc3, LayoutDashboard, Megaphone, Radio, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import DashboardPage from "@/pages/DashboardPage"
import ChannelsPage from "@/pages/ChannelsPage"
import DjPage from "@/pages/DjPage"
import PromoPage from "@/pages/PromoPage"
import ScrapingPage from "@/pages/ScrapingPage"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/channels", label: "Channels", icon: Radio },
  { to: "/promo", label: "Promo", icon: Megaphone },
  { to: "/dj", label: "DJ", icon: Disc3 },
  { to: "/scraping", label: "Scraping", icon: Search },
]

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2 },
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Promo Pulse
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">YouTube House Curator</p>
          <span className="inline-block mt-2 text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            Beta
          </span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "border-l-2 border-transparent -ml-px pl-[14px]",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-accent"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        {children}
      </main>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route
          path="/"
          element={
            <motion.div key={location.pathname} {...pageTransition} className="h-full">
              <DashboardPage />
            </motion.div>
          }
        />
        <Route
          path="/channels"
          element={
            <motion.div key={location.pathname} {...pageTransition} className="h-full">
              <ChannelsPage />
            </motion.div>
          }
        />
        <Route
          path="/promo"
          element={
            <motion.div key={location.pathname} {...pageTransition} className="h-full">
              <PromoPage />
            </motion.div>
          }
        />
        <Route
          path="/dj"
          element={
            <motion.div key={location.pathname} {...pageTransition} className="h-full">
              <DjPage />
            </motion.div>
          }
        />
        <Route
          path="/scraping"
          element={
            <motion.div key={location.pathname} {...pageTransition} className="h-full">
              <ScrapingPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
