import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchChannels, deleteChannel } from "@/lib/api"
import { ChannelsTable } from "@/components/ChannelsTable"
import { ChannelDetail } from "@/components/ChannelDetail"
import { ExportDialog } from "@/components/ExportDialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Channel } from "@/lib/types"
import { Download, Search } from "lucide-react"

export default function ChannelsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [minScore, setMinScore] = useState<string>("")
  const [hasEmail, setHasEmail] = useState(false)
  const [isBuyable, setIsBuyable] = useState(false)
  const [subgenre, setSubgenre] = useState("")
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["channels", page, search, minScore, hasEmail, isBuyable, subgenre],
    queryFn: () =>
      fetchChannels({
        page,
        page_size: 20,
        search: search || undefined,
        min_score: minScore ? parseInt(minScore) : undefined,
        has_email: hasEmail || undefined,
        is_buyable: isBuyable || undefined,
        subgenre: subgenre || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Channels</h1>
        <Button variant="outline" onClick={() => setExportOpen(true)}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
        <div className="w-32">
          <Input
            type="number"
            placeholder="Min score"
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer h-9">
          <Checkbox
            checked={hasEmail}
            onCheckedChange={(v) => {
              setHasEmail(!!v)
              setPage(1)
            }}
          />
          <span className="text-sm">Has email</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer h-9">
          <Checkbox
            checked={isBuyable}
            onCheckedChange={(v) => {
              setIsBuyable(!!v)
              setPage(1)
            }}
          />
          <span className="text-sm">A racheter</span>
        </label>
        <div className="w-44">
          <Select
            value={subgenre}
            onChange={(e) => {
              setSubgenre(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All subgenres</option>
            <option value="Deep House">Deep House</option>
            <option value="Tech House">Tech House</option>
            <option value="Afro House">Afro House</option>
            <option value="Melodic House">Melodic House</option>
            <option value="Progressive House">Progressive House</option>
            <option value="Minimal">Minimal</option>
            <option value="Organic House">Organic House</option>
            <option value="House Classics">House Classics</option>
            <option value="Latin House">Latin House</option>
            <option value="Soulful House">Soulful House</option>
            <option value="Jackin House">Jackin House</option>
            <option value="Jazzy House">Jazzy House</option>
            <option value="House">House</option>
          </Select>
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
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
