import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LayoutDashboard, Radio, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import DashboardPage from "@/pages/DashboardPage"
import ChannelsPage from "@/pages/ChannelsPage"
import ScrapingPage from "@/pages/ScrapingPage"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/channels", label: "Channels", icon: Radio },
  { to: "/scraping", label: "Scraping", icon: Search },
]

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">Promo Pulse</h1>
          <p className="text-xs text-muted-foreground">YouTube House Curator Scraper</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/scraping" element={<ScrapingPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
