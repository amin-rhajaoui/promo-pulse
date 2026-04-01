import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchChannels, deleteChannel, recalculatePromo } from "@/lib/api"
import { ChannelsTable } from "@/components/ChannelsTable"
import { ChannelDetail } from "@/components/ChannelDetail"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Channel } from "@/lib/types"
import { RefreshCw, Search } from "lucide-react"

export default function PromoPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["channels", "promo", page, search],
    queryFn: () =>
      fetchChannels({
        page,
        page_size: 20,
        search: search || undefined,
        is_promo: true,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  const recalcMutation = useMutation({
    mutationFn: recalculatePromo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chaînes Promo</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Chaînes avec « promo » ou « promotion » dans le titre ou la description
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => recalcMutation.mutate()}
          disabled={recalcMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${recalcMutation.isPending ? "animate-spin" : ""}`} />
          {recalcMutation.isPending ? "Recalculating..." : "Recalculate"}
        </Button>
      </div>

      <div className="flex-1 min-w-[200px] max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search promo channels..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <ChannelsTable
        channels={data?.items || []}
        total={data?.total || 0}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        onSelect={setSelectedChannel}
        onDelete={(id) => deleteMutation.mutate(id)}
        isLoading={isLoading}
      />

      <ChannelDetail
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
        onUpdate={(updated) => {
          setSelectedChannel(updated)
          queryClient.invalidateQueries({ queryKey: ["channels"] })
        }}
      />
    </div>
  )
}
