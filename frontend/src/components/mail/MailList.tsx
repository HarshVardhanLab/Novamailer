"use client"
import { Star, Search, ChevronLeft, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function formatDate(dateStr: string) {
    if (!dateStr) return ""
    try {
        const d = new Date(dateStr)
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const isThisYear = d.getFullYear() === now.getFullYear()
        if (isThisYear) return d.toLocaleDateString([], { month: "short", day: "numeric" })
        return d.toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" })
    } catch { return dateStr }
}

function getSenderName(from: string) {
    const m = from.match(/^"?([^"<]+)"?\s*</)
    return m ? m[1].trim() : from.split("@")[0]
}

interface Props {
    messages: any[]
    total: number
    loading: boolean
    search: string
    folder: string
    selectedUid?: string
    onSearch: (q: string) => void
    onSelect: (msg: any) => void
    onLoadMore: () => void
    onFlag: (uid: string, flagged: boolean) => void
    onMobileBack: () => void
}

export function MailList({ messages, total, loading, search, folder, selectedUid, onSearch, onSelect, onLoadMore, onFlag, onMobileBack }: Props) {
    const hasMore = messages.length < total

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b space-y-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onMobileBack}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm flex-1 truncate">{folder.replace(/^\[.*?\]\//, "")}</span>
                    <span className="text-xs text-muted-foreground">{total}</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-8 h-8 text-sm"
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading && messages.length === 0 ? (
                    <div className="space-y-0">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="p-3 border-b animate-pulse">
                                <div className="flex gap-2 mb-1">
                                    <div className="h-3 bg-gray-200 rounded w-24" />
                                    <div className="h-3 bg-gray-200 rounded w-12 ml-auto" />
                                </div>
                                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                                <div className="h-3 bg-gray-100 rounded w-full" />
                            </div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-12">
                        {search ? `No results for "${search}"` : "No emails in this folder"}
                    </div>
                ) : (
                    <>
                        {messages.map(msg => (
                            <button
                                key={msg.uid}
                                onClick={() => onSelect(msg)}
                                className={cn(
                                    "w-full text-left p-3 border-b hover:bg-accent/50 transition-colors relative",
                                    selectedUid === msg.uid && "bg-accent",
                                    !msg.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <span className={cn("text-sm truncate", !msg.is_read && "font-semibold")}>
                                                {getSenderName(msg.from)}
                                            </span>
                                            <span className="text-xs text-muted-foreground shrink-0">{formatDate(msg.date)}</span>
                                        </div>
                                        <p className={cn("text-sm truncate", !msg.is_read && "font-medium")}>{msg.subject}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.preview}</p>
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); onFlag(msg.uid, msg.is_flagged) }}
                                        className="shrink-0 mt-0.5"
                                    >
                                        <Star className={cn("h-3.5 w-3.5", msg.is_flagged ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400")} />
                                    </button>
                                </div>
                                {!msg.is_read && (
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                )}
                            </button>
                        ))}
                        {hasMore && (
                            <div className="p-3 text-center">
                                <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More"}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
