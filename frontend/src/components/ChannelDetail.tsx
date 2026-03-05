import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"
import type { Channel } from "@/lib/types"
import { updateChannel } from "@/lib/api"
import { formatNumber } from "@/lib/utils"
import { Copy, ExternalLink, Mail, Music, Save, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

interface Props {
  channel: Channel | null
  onClose: () => void
  onUpdate?: (channel: Channel) => void
}

export function ChannelDetail({ channel, onClose, onUpdate }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    setNotes(channel?.notes || "")
  }, [channel?.id, channel?.notes])

  if (!channel) return null

  const allEmails = [...(channel.emails_pro || []), ...(channel.emails_personal || [])]
  const spotifyUrl = channel.social_links?.spotify

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const updated = await updateChannel(channel.id, { notes: notes || null })
      onUpdate?.(updated)
    } finally {
      setSavingNotes(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Sheet open={!!channel} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {channel.thumbnail_url && (
            <img src={channel.thumbnail_url} alt="" className="h-16 w-16 rounded-full" />
          )}
          <div>
            <h2 className="text-xl font-bold">{channel.title}</h2>
            {channel.custom_url && (
              <a
                href={`https://youtube.com/${channel.custom_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
              >
                {channel.custom_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{formatNumber(channel.subscriber_count)}</div>
            <div className="text-xs text-muted-foreground">Subscribers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatNumber(channel.video_count)}</div>
            <div className="text-xs text-muted-foreground">Videos</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatNumber(channel.view_count)}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            Score
            <Badge className={
              channel.tier === "S" ? "bg-green-600 text-white" :
              channel.tier === "A" ? "bg-blue-600 text-white" :
              channel.tier === "B" ? "bg-yellow-500 text-black" :
              "bg-gray-400 text-black"
            }>
              {channel.score} — Tier {channel.tier}
            </Badge>
            {channel.is_buyable && (
              <Badge className="bg-red-600 text-white">
                <ShoppingCart className="h-3 w-3 mr-1" />
                A racheter
              </Badge>
            )}
          </h3>
          {channel.last_upload_at && (
            <p className="text-sm text-muted-foreground mt-1">
              Last upload: {new Date(channel.last_upload_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {spotifyUrl && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Music className="h-4 w-4 text-green-500" /> Spotify
            </h3>
            <a
              href={spotifyUrl.startsWith("http") ? spotifyUrl : `https://${spotifyUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm font-medium"
            >
              <Music className="h-4 w-4" />
              Open on Spotify
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Notes</h3>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            placeholder="Add notes about this channel..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            size="sm"
            className="mt-1"
            disabled={savingNotes || notes === (channel.notes || "")}
            onClick={saveNotes}
          >
            <Save className="h-3 w-3 mr-1" />
            {savingNotes ? "Saving..." : "Save notes"}
          </Button>
        </div>

        {allEmails.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Emails
            </h3>
            <div className="space-y-2">
              {channel.emails_pro?.map((email) => (
                <div key={email} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <span className="text-sm">{email}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">pro</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(email)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {channel.emails_personal?.map((email) => (
                <div key={email} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <span className="text-sm">{email}</span>
                    <Badge variant="outline" className="ml-2 text-xs">personal</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(email)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Copied!</p>
            )}
          </div>
        )}

        {Object.keys(channel.social_links || {}).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Social Links</h3>
            <div className="space-y-1">
              {Object.entries(channel.social_links).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="capitalize">{platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {(channel.subgenres || []).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Subgenres</h3>
            <div className="flex gap-1 flex-wrap">
              {channel.subgenres.map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {channel.has_submit_form && (
          <div>
            <h3 className="font-semibold mb-2">Submit / Demo Links</h3>
            <div className="space-y-1">
              {(channel.submit_urls || []).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {url.length > 60 ? url.slice(0, 60) + "..." : url}
                </a>
              ))}
            </div>
          </div>
        )}

        {channel.description && (
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-80 overflow-y-auto">
              {channel.description}
            </p>
          </div>
        )}
      </div>
    </Sheet>
  )
}
