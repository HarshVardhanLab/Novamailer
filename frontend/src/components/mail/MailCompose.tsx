"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Send, Loader2, Minus, Maximize2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Props {
    mode: "new" | "reply" | "replyAll" | "forward"
    defaults: {
        to?: string
        subject?: string
        inReplyTo?: string
        quotedBody?: string
    }
    onClose: () => void
    onSent: () => void
}

function quoteHtml(html: string) {
    return `<br/><br/><blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;margin:0">${html}</blockquote>`
}

export function MailCompose({ mode, defaults, onClose, onSent }: Props) {
    const [to, setTo] = useState(defaults.to || "")
    const [cc, setCc] = useState("")
    const [bcc, setBcc] = useState("")
    const [subject, setSubject] = useState(defaults.subject || "")
    const [body, setBody] = useState("")
    const [showCcBcc, setShowCcBcc] = useState(false)
    const [sending, setSending] = useState(false)
    const [minimized, setMinimized] = useState(false)

    const handleSend = async () => {
        if (!to.trim()) { toast.error("To field is required"); return }
        setSending(true)
        try {
            const fullBody = defaults.quotedBody
                ? body + quoteHtml(defaults.quotedBody)
                : body
            await api.post("/mail/send", {
                to, cc, bcc, subject,
                body: fullBody,
                in_reply_to: defaults.inReplyTo || "",
                references: defaults.inReplyTo || "",
            })
            onSent()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to send email")
        } finally {
            setSending(false)
        }
    }

    const handleClose = () => {
        if ((to || subject || body) && !confirm("Discard this draft?")) return
        onClose()
    }

    return (
        <div className={cn(
            "fixed bottom-0 right-6 z-50 bg-background border rounded-t-lg shadow-2xl transition-all",
            minimized ? "w-72 h-10" : "w-[520px] max-w-[95vw]"
        )}>
            {/* Title bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-white rounded-t-lg cursor-pointer"
                onClick={() => setMinimized(m => !m)}>
                <span className="text-sm font-medium truncate">
                    {mode === "new" ? "New Message" : mode === "reply" ? "Reply" : mode === "replyAll" ? "Reply All" : "Forward"}
                </span>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMinimized(m => !m)} className="hover:bg-white/20 rounded p-0.5">
                        <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={handleClose} className="hover:bg-white/20 rounded p-0.5">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {!minimized && (
                <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
                    <div className="border-b px-3 py-1.5 space-y-1">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs w-6 text-muted-foreground">To</Label>
                            <Input className="h-7 text-sm border-0 focus-visible:ring-0 px-0" value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com" />
                            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowCcBcc(s => !s)}>Cc/Bcc</button>
                        </div>
                        {showCcBcc && (
                            <>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs w-6 text-muted-foreground">Cc</Label>
                                    <Input className="h-7 text-sm border-0 focus-visible:ring-0 px-0" value={cc} onChange={e => setCc(e.target.value)} placeholder="cc@example.com" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs w-6 text-muted-foreground">Bcc</Label>
                                    <Input className="h-7 text-sm border-0 focus-visible:ring-0 px-0" value={bcc} onChange={e => setBcc(e.target.value)} placeholder="bcc@example.com" />
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-2">
                            <Label className="text-xs w-6 text-muted-foreground">Sub</Label>
                            <Input className="h-7 text-sm border-0 focus-visible:ring-0 px-0" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
                        </div>
                    </div>
                    <Textarea
                        className="flex-1 border-0 rounded-none focus-visible:ring-0 resize-none text-sm p-3 min-h-[200px]"
                        placeholder="Write your message..."
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />
                    {defaults.quotedBody && (
                        <div className="px-3 pb-2">
                            <div className="text-xs text-muted-foreground border-l-2 pl-2 max-h-20 overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: defaults.quotedBody }} />
                        </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2 border-t">
                        <Button size="sm" onClick={handleSend} disabled={sending}>
                            {sending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Sending...</> : <><Send className="mr-2 h-3.5 w-3.5" />Send</>}
                        </Button>
                        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
