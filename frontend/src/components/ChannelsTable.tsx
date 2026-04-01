import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"
import type { Channel } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Disc3, Megaphone, MessageSquare, Music, Radio, ShoppingCart, Trash2 } from "lucide-react"

const tierColors: Record<string, string> = {
  S: "bg-green-600 text-white",
  A: "bg-blue-600 text-white",
  B: "bg-yellow-500 text-black",
  C: "bg-gray-400 text-black",
}

interface Props {
  channels: Channel[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSelect: (channel: Channel) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

const rowVariants = {
  hidden: { opacity: 0, y: 4 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.02 },
  }),
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3 flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChannelsTable({
  channels, total, page, pageSize, onPageChange, onSelect, onDelete, isLoading,
}: Props) {
  const totalPages = Math.ceil(total / pageSize)

  if (isLoading) {
    return <TableSkeleton />
  }

  if (channels.length === 0) {
    return (
      <EmptyState
        icon={Radio}
        title="Aucune chaîne trouvée"
        description="Ajustez les filtres ou lancez un scraping pour découvrir des chaînes."
        actionLabel="Lancer un scraping"
        actionTo="/scraping"
      />
    )
  }

  return (
    <div>
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-16rem)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/80 border-b">
              <tr>
                <th className="h-11 px-4 text-left font-semibold text-muted-foreground">Channel</th>
                <th className="h-11 px-4 text-left font-semibold text-muted-foreground">Subs</th>
                <th className="h-11 px-4 text-left font-semibold text-muted-foreground">Score</th>
                <th className="h-11 px-4 text-left font-semibold text-muted-foreground">Emails</th>
                <th className="h-11 px-4 text-left font-semibold text-muted-foreground">Authenticity</th>
                <th className="h-11 px-4 text-left font-semibold text-muted-foreground">Subgenres</th>
                <th className="h-11 px-4 text-left font-semibold text-muted-foreground w-14">Actions</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => {
                const emailCount = (ch.emails_pro?.length || 0) + (ch.emails_personal?.length || 0)
                return (
                  <motion.tr
                    key={ch.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    className="border-b transition-colors hover:bg-accent/50 cursor-pointer group"
                    onClick={() => onSelect(ch)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {ch.thumbnail_url ? (
                          <img
                            src={ch.thumbnail_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-shadow"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium flex items-center gap-1.5 truncate">
                            {ch.title}
                            {ch.social_links?.spotify && (
                              <span title="Has Spotify">
                                <Music className="h-3.5 w-3.5 text-green-500 shrink-0" />
                              </span>
                            )}
                            {ch.notes && (
                              <span title="Has notes">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {ch.custom_url && (
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">{ch.custom_url}</span>
                            )}
                            {ch.is_promo && (
                              <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0">
                                <Megaphone className="h-2.5 w-2.5 mr-0.5" />
                                Promo
                              </Badge>
                            )}
                            {ch.is_dj && (
                              <Badge className="bg-sky-600 text-white text-[10px] px-1.5 py-0">
                                <Disc3 className="h-2.5 w-2.5 mr-0.5" />
                                DJ
                              </Badge>
                            )}
                            {ch.is_buyable && (
                              <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0">
                                <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
                                A racheter
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{formatNumber(ch.subscriber_count)}</td>
                    <td className="p-4">
                      <Badge className={tierColors[ch.tier || "C"]}>
                        {ch.score} ({ch.tier})
                      </Badge>
                    </td>
                    <td className="p-4">
                      {emailCount > 0 ? (
                        <Badge variant="secondary">{emailCount} email{emailCount > 1 ? "s" : ""}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={
                        ch.authenticity_label === "clean" ? "bg-emerald-600 text-white" :
                        ch.authenticity_label === "suspect" ? "bg-amber-500 text-black" :
                        ch.authenticity_label === "fake" ? "bg-red-600 text-white" :
                        "bg-gray-400 text-black"
                      }>
                        {ch.authenticity_label === "clean" ? "🟢" :
                         ch.authenticity_label === "suspect" ? "🟡" :
                         ch.authenticity_label === "fake" ? "🔴" : "⚪"}
                        {" "}{ch.authenticity_score}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {(ch.subgenres || []).slice(0, 2).map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {(ch.subgenres || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{ch.subgenres.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-70 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(ch.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {total} chaîne{total !== 1 ? "s" : ""} au total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium tabular-nums">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
