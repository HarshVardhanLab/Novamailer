"use client"
import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Reply, Forward, Star, Trash2, Archive, AlertTriangle,
    MailOpen, ChevronLeft, Loader2, Paperclip, Download, MoreHorizontal
} from "lucide-react"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"
import { IMAPCreds } from "@/hooks/useMailSession"

interface Props {
    detail: any
    loading: boolean
    folders: any[]
    creds: IMAPCreds
    folder: string
    onReply: () => void
    onReplyAll: () => void
    onForward: () => void
    onFlag: () => void
    onMarkUnread: () => void
    onMove: (dest: string) => void
    onDelete: () => void
    onMobileBack: () => void
}

export function MailDetail({ detail, loading, folders, creds, folder, onReply, onReplyAll, onForward, onFlag, onMarkUnread, onMove, onDelete, onMobileBack }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        if (!iframeRef.current || !detail?.html_body) return
        const doc = iframeRef.current.contentDocument
        if (!doc) return
        doc.open()
        doc.write(`<!DOCTYPE html><html><head><base target="_blank"><style>body{font-family:sans-serif;font-size:14px;margin:16px;word-break:break-word;}img{max-width:100%}</style></head><body>${detail.html_body}</body></html>`)
        doc.close()
        // Auto-resize
        const resize = () => {
            if (iframeRef.current && doc.body) {
                iframeRef.current.style.height = doc.body.scrollHeight + 32 + "px"
            }
        }
        setTimeout(resize, 100)
    }, [detail?.html_body])

    const handleDownloadAttachment = async (att: any) => {
        try {
            const res = await api.post("/mail/attachment", { ...creds, folder, uid: detail.uid, part_id: att.part_id }, { responseType: "blob" })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement("a")
            a.href = url
            a.download = att.filename
            a.click()
            window.URL.revokeObjectURL(url)
        } catch { toast.error("Failed to download attachment") }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )

    if (!detail) return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MailOpen className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-sm">Select an email to read</p>
        </div>
    )

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b flex-wrap">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onMobileBack}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onReply} className="gap-1">
                    <Reply className="h-4 w-4" /> Reply
                </Button>
                <Button variant="ghost" size="sm" onClick={onReplyAll} className="gap-1 hidden sm:flex">
                    <Reply className="h-4 w-4" /> Reply All
                </Button>
                <Button variant="ghost" size="sm" onClick={onForward} className="gap-1">
                    <Forward className="h-4 w-4" /> Forward
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFlag} title={detail.is_flagged ? "Unflag" : "Flag"}>
                    <Star className={cn("h-4 w-4", detail.is_flagged ? "fill-yellow-400 text-yellow-400" : "")} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove("Archive")} title="Archive">
                    <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMove("Junk")} title="Mark as Junk">
                    <AlertTriangle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={onDelete} title="Delete">
                    <Trash2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onMarkUnread}>Mark as Unread</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-medium text-xs text-muted-foreground" disabled>Move to folder</DropdownMenuItem>
                        {folders.map(f => (
                            <DropdownMenuItem key={f.name} onClick={() => onMove(f.name)}>
                                {f.name.replace(/^\[.*?\]\//, "")}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Email content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold mb-3">{detail.subject}</h2>
                    <div className="space-y-1 text-sm">
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-8">From</span>
                            <span className="font-medium">{detail.from}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-8">To</span>
                            <span>{detail.to}</span>
                        </div>
                        {detail.cc && (
                            <div className="flex gap-2">
                                <span className="text-muted-foreground w-8">CC</span>
                                <span>{detail.cc}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <span className="text-muted-foreground w-8">Date</span>
                            <span>{detail.date}</span>
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                {detail.attachments?.length > 0 && (
                    <div className="px-4 py-2 border-b flex flex-wrap gap-2">
                        {detail.attachments.map((att: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => handleDownloadAttachment(att)}
                                className="flex items-center gap-1.5 text-xs bg-muted hover:bg-accent px-2 py-1.5 rounded border transition-colors"
                            >
                                <Paperclip className="h-3 w-3" />
                                <span className="max-w-[120px] truncate">{att.filename}</span>
                                <span className="text-muted-foreground">({(att.size / 1024).toFixed(0)}KB)</span>
                                <Download className="h-3 w-3 ml-1" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div className="p-4">
                    {detail.html_body ? (
                        <iframe
                            ref={iframeRef}
                            sandbox="allow-same-origin allow-popups"
                            className="w-full border-0 min-h-[200px]"
                            title="Email content"
                        />
                    ) : (
                        <pre className="text-sm whitespace-pre-wrap font-sans">{detail.plain_body}</pre>
                    )}
                </div>
            </div>
        </div>
    )
}
