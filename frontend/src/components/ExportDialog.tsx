import { useState } from "react"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { getExportCsvUrl, getExportEmailsUrl } from "@/lib/api"
import { Download } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
}

export function ExportDialog({ open, onClose }: Props) {
  const [minScore, setMinScore] = useState<string>("")
  const [hasEmail, setHasEmail] = useState(false)
  const [subgenre, setSubgenre] = useState("")

  const handleExportCsv = () => {
    const url = getExportCsvUrl({
      min_score: minScore ? parseInt(minScore) : undefined,
      has_email: hasEmail || undefined,
      subgenre: subgenre || undefined,
    })
    window.open(url, "_blank")
  }

  const handleExportEmails = () => {
    window.open(getExportEmailsUrl(), "_blank")
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Export Data</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Min Score</label>
          <Input
            type="number"
            placeholder="e.g. 40"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={hasEmail} onCheckedChange={(v) => setHasEmail(!!v)} />
          <span className="text-sm">Only channels with email</span>
        </label>
        <div>
          <label className="text-sm font-medium">Subgenre filter</label>
          <Input
            placeholder="e.g. Deep House"
            value={subgenre}
            onChange={(e) => setSubgenre(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportEmails}>
            <Download className="h-4 w-4 mr-1" />
            Emails Only
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
