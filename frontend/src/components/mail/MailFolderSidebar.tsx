"use client"
import { RefreshCw, Inbox, Send, FileText, Flag, AlertTriangle, Trash2, Archive, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SYSTEM_FOLDERS = [
    { match: ["inbox"], label: "Inbox", icon: Inbox },
    { match: ["sent"], label: "Sent", icon: Send },
    { match: ["draft"], label: "Drafts", icon: FileText },
    { match: ["flagged", "starred"], label: "Flagged", icon: Flag },
    { match: ["junk", "spam"], label: "Junk", icon: AlertTriangle },
    { match: ["trash", "bin", "deleted"], label: "Trash", icon: Trash2 },
    { match: ["archive"], label: "Archive", icon: Archive },
]

function getFolderIcon(name: string) {
    const lower = name.toLowerCase()
    for (const sf of SYSTEM_FOLDERS) {
        if (sf.match.some(m => lower.includes(m))) return sf.icon
    }
    return Folder
}

function getFolderLabel(name: string) {
    const lower = name.toLowerCase()
    for (const sf of SYSTEM_FOLDERS) {
        if (sf.match.some(m => lower.includes(m))) return sf.label
    }
    // Strip Gmail-style prefix like [Gmail]/
    return name.replace(/^\[.*?\]\//, "")
}

interface Props {
    folders: any[]
    selected: string
    onSelect: (folder: string) => void
    onRefresh: () => void
}

export function MailFolderSidebar({ folders, selected, onSelect, onRefresh }: Props) {
    // Sort: system folders first, then custom
    const systemOrder = ["inbox", "sent", "draft", "flagged", "starred", "junk", "spam", "trash", "bin", "deleted", "archive"]
    const sorted = [...folders].sort((a, b) => {
        const ai = systemOrder.findIndex(s => a.name.toLowerCase().includes(s))
        const bi = systemOrder.findIndex(s => b.name.toLowerCase().includes(s))
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
    })

    return (
        <div className="flex-1 overflow-y-auto py-2">
            <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Folders</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefresh} title="Refresh">
                    <RefreshCw className="h-3 w-3" />
                </Button>
            </div>
            {sorted.map(folder => {
                const Icon = getFolderIcon(folder.name)
                const label = getFolderLabel(folder.name)
                const isSelected = folder.name === selected
                return (
                    <button
                        key={folder.name}
                        onClick={() => onSelect(folder.name)}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-md mx-1 transition-colors",
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                        )}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{label}</span>
                        </div>
                        {folder.unread > 0 && (
                            <span className={cn(
                                "text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                                isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                            )}>
                                {folder.unread > 999 ? "999+" : folder.unread}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
