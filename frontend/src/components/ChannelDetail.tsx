import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"
import type { Channel } from "@/lib/types"
import { updateChannel } from "@/lib/api"
import { formatNumber } from "@/lib/utils"
import { Copy, ExternalLink, Mail, Music, Save, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
    {children}
  </h3>
)

const AUTHENTICITY_LABELS: Record<string, string> = {
  age_growth: "Ancienneté & croissance",
  organic_growth: "Croissance organique",
  description: "Description",
  video_count: "Nombre de vidéos",
  views_per_sub: "Vues / abonnés",
  sub_video_ratio: "Ratio abonnés / vidéos",
  very_active: "Activité récente",
  detailed: "Profil détaillé",
  organic_ratio: "Ratio organique",
  views_per_video: "Vues par vidéo",
}

function formatVerdict(verdict?: string): string {
  if (!verdict) return "—"
  const v = verdict.toLowerCase()
  if (v.includes("fake") || v.includes("inconsistent")) return "Risque"
  if (v.includes("suspicious") || v.includes("low")) return "À surveiller"
  if (v.includes("good") || v.includes("organic") || v.includes("excellent") || v.includes("clean") || v.includes("consistent") || v.includes("active") || v.includes("detailed") || v.includes("viral")) return "Bon"
  return verdict
}

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
      toast.success("Notes enregistrées")
    } catch {
      toast.error("Erreur lors de l’enregistrement")
    } finally {
      setSavingNotes(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    toast.success("Copié dans le presse-papier")
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Sheet open={!!channel} onClose={onClose}>
      <div className="space-y-8 text-base">
        <div className="flex items-center gap-5">
          {channel.thumbnail_url && (
            <img src={channel.thumbnail_url} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-border" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight leading-tight">{channel.title}</h2>
            {channel.custom_url && (
              <a
                href={`https://youtube.com/${channel.custom_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1.5 mt-1"
              >
                {channel.custom_url}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-xl bg-muted/40 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">{formatNumber(channel.subscriber_count)}</div>
            <div className="text-sm text-muted-foreground mt-0.5">Abonnés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">{formatNumber(channel.video_count)}</div>
            <div className="text-sm text-muted-foreground mt-0.5">Vidéos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">{formatNumber(channel.view_count)}</div>
            <div className="text-sm text-muted-foreground mt-0.5">Vues</div>
          </div>
        </div>

        <div>
          <SectionTitle>Score</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={
              channel.tier === "S" ? "bg-green-600 text-white text-sm px-2.5 py-1" :
              channel.tier === "A" ? "bg-blue-600 text-white text-sm px-2.5 py-1" :
              channel.tier === "B" ? "bg-yellow-500 text-black text-sm px-2.5 py-1" :
              "bg-muted text-muted-foreground text-sm px-2.5 py-1"
            }>
              {channel.score} — Tier {channel.tier}
            </Badge>
            {channel.is_buyable && (
              <Badge className="bg-red-600 text-white text-sm px-2.5 py-1">
                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                A racheter
              </Badge>
            )}
          </div>
          {channel.last_upload_at && (
            <p className="text-sm text-muted-foreground mt-2">
              Dernière vidéo : {new Date(channel.last_upload_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>

        <div>
          <SectionTitle>Authenticité</SectionTitle>
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={
                channel.authenticity_label === "clean" ? "bg-emerald-600 text-white text-sm px-2.5 py-1" :
                channel.authenticity_label === "suspect" ? "bg-amber-500 text-black text-sm px-2.5 py-1" :
                channel.authenticity_label === "fake" ? "bg-red-600 text-white text-sm px-2.5 py-1" :
                "bg-muted text-muted-foreground text-sm px-2.5 py-1"
              }>
                {channel.authenticity_label === "clean" ? "Chaîne fiable" :
                 channel.authenticity_label === "suspect" ? "À vérifier" :
                 channel.authenticity_label === "fake" ? "Risque" : "Non évalué"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Score : <span className="font-semibold text-foreground">{channel.authenticity_score}/100</span>
              </span>
            </div>
            {channel.authenticity_signals && Object.keys(channel.authenticity_signals).filter(k => !k.startsWith("_")).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Critères analysés</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(channel.authenticity_signals)
                    .filter(([key]) => !key.startsWith("_"))
                    .map(([key, val]) => {
                      const signal = val as { verdict?: string; ratio?: number; avg?: number; count?: number; length?: number }
                      const label = AUTHENTICITY_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                      const verdictText = formatVerdict(signal.verdict)
                      const verdictColor =
                        signal.verdict?.toLowerCase().includes("fake") || signal.verdict?.toLowerCase().includes("inconsistent") ? "text-red-600 font-medium" :
                        signal.verdict?.toLowerCase().includes("suspicious") || signal.verdict?.toLowerCase().includes("low") ? "text-amber-600 font-medium" :
                        signal.verdict?.toLowerCase().includes("good") || signal.verdict?.toLowerCase().includes("organic") || signal.verdict?.toLowerCase().includes("excellent") || signal.verdict?.toLowerCase().includes("clean") || signal.verdict?.toLowerCase().includes("consistent") || signal.verdict?.toLowerCase().includes("active") || signal.verdict?.toLowerCase().includes("detailed") || signal.verdict?.toLowerCase().includes("viral") ? "text-emerald-600 font-medium" :
                        "text-muted-foreground"
                      return (
                        <div key={key} className="flex items-start justify-between gap-2 rounded-lg border bg-background px-3 py-2.5">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <div className="text-right shrink-0">
                            <span className={`text-sm ${verdictColor}`}>{verdictText}</span>
                            {(signal.ratio !== undefined || signal.avg !== undefined) && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {signal.ratio !== undefined && `ratio ${signal.ratio}`}
                                {signal.ratio !== undefined && signal.avg !== undefined && " · "}
                                {signal.avg !== undefined && `moy. ${signal.avg.toLocaleString()}`}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {spotifyUrl && (
          <div>
            <SectionTitle>Spotify</SectionTitle>
            <a
              href={spotifyUrl.startsWith("http") ? spotifyUrl : `https://${spotifyUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm font-medium transition-colors"
            >
              <Music className="h-4 w-4" />
              Ouvrir sur Spotify
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        <div>
          <SectionTitle>Notes</SectionTitle>
          <textarea
            className="w-full rounded-lg border bg-background px-4 py-3 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ajouter des notes sur cette chaîne..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            size="sm"
            className="mt-2"
            disabled={savingNotes || notes === (channel.notes || "")}
            onClick={saveNotes}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {savingNotes ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>

        {allEmails.length > 0 && (
          <div>
            <SectionTitle>Emails</SectionTitle>
            <div className="space-y-2">
              {channel.emails_pro?.map((email) => (
                <div key={email} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5">
                  <div className="min-w-0">
                    <span className="text-sm break-all">{email}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">pro</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(email)} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {channel.emails_personal?.map((email) => (
                <div key={email} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5">
                  <div className="min-w-0">
                    <span className="text-sm break-all">{email}</span>
                    <Badge variant="outline" className="ml-2 text-xs">perso</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(email)} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {copied && (
              <p className="text-sm text-emerald-600 mt-2 font-medium">Copié !</p>
            )}
          </div>
        )}

        {Object.keys(channel.social_links || {}).length > 0 && (
          <div>
            <SectionTitle>Liens sociaux</SectionTitle>
            <div className="space-y-2">
              {Object.entries(channel.social_links).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-1"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="capitalize">{platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {(channel.subgenres || []).length > 0 && (
          <div>
            <SectionTitle>Subgenres</SectionTitle>
            <div className="flex gap-2 flex-wrap">
              {channel.subgenres.map((s) => (
                <Badge key={s} variant="outline" className="text-sm py-1">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {channel.has_submit_form && (
          <div>
            <SectionTitle>Liens submit / démo</SectionTitle>
            <div className="space-y-2">
              {(channel.submit_urls || []).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline py-1 break-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {url.length > 60 ? url.slice(0, 60) + "…" : url}
                </a>
              ))}
            </div>
          </div>
        )}

        {channel.description && (
          <div>
            <SectionTitle>Description</SectionTitle>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed rounded-lg border bg-muted/20 p-3">
              {channel.description}
            </p>
          </div>
        )}
      </div>
    </Sheet>
  )
}
