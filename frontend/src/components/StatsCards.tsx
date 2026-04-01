import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCountUp } from "@/hooks/useCountUp"
import type { Stats } from "@/lib/types"
import { cn, formatNumber } from "@/lib/utils"
import { Users, Mail, Star, Play } from "lucide-react"

const cards = [
  {
    key: "total_channels" as const,
    label: "Total Channels",
    icon: Users,
    format: formatNumber,
    iconBg: "bg-primary/10 text-primary",
  },
  {
    key: "channels_with_email" as const,
    label: "With Email",
    icon: Mail,
    format: formatNumber,
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    key: "avg_score" as const,
    label: "Avg Score",
    icon: Star,
    format: (v: number) => v.toFixed(1),
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    key: "total_runs" as const,
    label: "Scrape Runs",
    icon: Play,
    format: (v: number) => String(v),
    iconBg: "bg-violet-500/10 text-violet-600",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export function StatsCards({ stats, isLoading }: { stats?: Stats; isLoading: boolean }) {
  if (isLoading) {
    return (
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {cards.map((c, i) => (
          <motion.div key={c.key} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map(({ key, label, icon: Icon, format, iconBg }) => (
        <motion.div key={key} variants={item}>
          <StatCard
            label={label}
            value={stats ? stats[key] : 0}
            format={format}
            Icon={Icon}
            iconBg={iconBg}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

function StatCard({
  label,
  value,
  format,
  Icon,
  iconBg,
}: {
  label: string
  value: number
  format: (v: number) => string
  Icon: React.ComponentType<{ className?: string }>
  iconBg: string
}) {
  const display = useCountUp(value, true)
  const formatted = format(display)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{formatted}</div>
      </CardContent>
    </Card>
  )
}

