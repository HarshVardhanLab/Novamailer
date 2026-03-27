"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useMailSession, IMAPCreds } from "@/hooks/useMailSession"
import { MailConnect } from "@/components/mail/MailConnect"
import { MailFolderSidebar } from "@/components/mail/MailFolderSidebar"
import { MailList } from "@/components/mail/MailList"
import { MailDetail } from "@/components/mail/MailDetail"
import { MailCompose } from "@/components/mail/MailCompose"
import api from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PenSquare, LogOut } from "lucide-react"

export default function MailPage() {
    const { creds, saveCreds, clearCreds, loaded } = useMailSession()
    const [folders, setFolders] = useState<any[]>([])
    const [selectedFolder, setSelectedFolder] = useState("INBOX")
    const [messages, setMessages] = useState<any[]>([])
    const [totalMessages, setTotalMessages] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [selectedMsg, setSelectedMsg] = useState<any>(null)
    const [msgDetail, setMsgDetail] = useState<any>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [composeOpen, setComposeOpen] = useState(false)
    const [composeMode, setComposeMode] = useState<"new" | "reply" | "replyAll" | "forward">("new")
    const [composeDefaults, setComposeDefaults] = useState<any>({})
    // Mobile panel: "folders" | "list" | "detail"
    const [mobilePanel, setMobilePanel] = useState<"folders" | "list" | "detail">("list")
    const searchTimer = useRef<any>(null)

    const fetchFolders = useCallback(async (c: IMAPCreds) => {
        try {
            const res = await api.post("/mail/folders", c)
            setFolders(res.data.folders)
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to load folders")
        }
    }, [])

    const fetchMessages = useCallback(async (c: IMAPCreds, folder: string, pg: number, q: string, append = false) => {
        setLoadingMessages(true)
        try {
            const res = await api.post("/mail/messages", { ...c, folder, page: pg, per_page: 25, search: q })
            setTotalMessages(res.data.total)
            setMessages(prev => append ? [...prev, ...res.data.messages] : res.data.messages)
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to load messages")
        } finally {
            setLoadingMessages(false)
        }
    }, [])

    useEffect(() => {
        if (creds) {
            fetchFolders(creds)
            fetchMessages(creds, selectedFolder, 1, "")
        }
    }, [creds])

    const handleFolderSelect = (folder: string) => {
        setSelectedFolder(folder)
        setPage(1)
        setSearch("")
        setSelectedMsg(null)
        setMsgDetail(null)
        setMobilePanel("list")
        if (creds) fetchMessages(creds, folder, 1, "")
    }

    const handleSearch = (q: string) => {
        setSearch(q)
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setPage(1)
            if (creds) fetchMessages(creds, selectedFolder, 1, q)
        }, 400)
    }

    const handleLoadMore = () => {
        const next = page + 1
        setPage(next)
        if (creds) fetchMessages(creds, selectedFolder, next, search, true)
    }

    const handleSelectMessage = async (msg: any) => {
        setSelectedMsg(msg)
        setMobilePanel("detail")
        setLoadingDetail(true)
        try {
            const res = await api.post("/mail/message", { ...creds, folder: selectedFolder, uid: msg.uid })
            setMsgDetail(res.data)
            // Mark as read in list
            setMessages(prev => prev.map(m => m.uid === msg.uid ? { ...m, is_read: true } : m))
            // Update unread count
            setFolders(prev => prev.map(f => f.name === selectedFolder && !msg.is_read
                ? { ...f, unread: Math.max(0, f.unread - 1) } : f))
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to load email")
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleFlag = async (uid: string, currentlyFlagged: boolean) => {
        if (!creds) return
        try {
            await api.post("/mail/flags", {
                ...creds, folder: selectedFolder, uid,
                add_flags: currentlyFlagged ? [] : ["\\Flagged"],
                remove_flags: currentlyFlagged ? ["\\Flagged"] : [],
            })
            setMessages(prev => prev.map(m => m.uid === uid ? { ...m, is_flagged: !currentlyFlagged } : m))
            if (msgDetail?.uid === uid) setMsgDetail((d: any) => ({ ...d, is_flagged: !currentlyFlagged }))
        } catch { toast.error("Failed to update flag") }
    }

    const handleMarkUnread = async (uid: string) => {
        if (!creds) return
        try {
            await api.post("/mail/flags", { ...creds, folder: selectedFolder, uid, add_flags: [], remove_flags: ["\\Seen"] })
            setMessages(prev => prev.map(m => m.uid === uid ? { ...m, is_read: false } : m))
            setFolders(prev => prev.map(f => f.name === selectedFolder ? { ...f, unread: f.unread + 1 } : f))
        } catch { toast.error("Failed to mark as unread") }
    }

    const handleMove = async (uid: string, destination: string) => {
        if (!creds) return
        try {
            await api.post("/mail/move", { ...creds, folder: selectedFolder, uid, destination })
            setMessages(prev => prev.filter(m => m.uid !== uid))
            setSelectedMsg(null); setMsgDetail(null)
            toast.success(`Moved to ${destination}`)
            fetchFolders(creds)
        } catch { toast.error("Failed to move email") }
    }

    const handleDelete = async (uid: string) => {
        if (!creds) return
        const trashFolder = folders.find(f => f.name.toLowerCase().includes("trash") || f.name.toLowerCase().includes("bin"))?.name || "Trash"
        try {
            await api.post("/mail/delete", { ...creds, folder: selectedFolder, uid, trash_folder: trashFolder })
            setMessages(prev => prev.filter(m => m.uid !== uid))
            setSelectedMsg(null); setMsgDetail(null)
            toast.success("Email deleted")
        } catch { toast.error("Failed to delete email") }
    }

    const openCompose = (mode: typeof composeMode, defaults: any = {}) => {
        setComposeMode(mode)
        setComposeDefaults(defaults)
        setComposeOpen(true)
    }

    const handleReply = () => {
        if (!msgDetail) return
        openCompose("reply", {
            to: msgDetail.from,
            subject: msgDetail.subject.startsWith("Re:") ? msgDetail.subject : `Re: ${msgDetail.subject}`,
            inReplyTo: msgDetail.message_id,
            quotedBody: msgDetail.html_body || msgDetail.plain_body,
        })
    }

    const handleReplyAll = () => {
        if (!msgDetail) return
        const allTo = [msgDetail.from, msgDetail.cc].filter(Boolean).join(", ")
        openCompose("replyAll", {
            to: allTo,
            subject: msgDetail.subject.startsWith("Re:") ? msgDetail.subject : `Re: ${msgDetail.subject}`,
            inReplyTo: msgDetail.message_id,
            quotedBody: msgDetail.html_body || msgDetail.plain_body,
        })
    }

    const handleForward = () => {
        if (!msgDetail) return
        openCompose("forward", {
            subject: msgDetail.subject.startsWith("Fwd:") ? msgDetail.subject : `Fwd: ${msgDetail.subject}`,
            quotedBody: msgDetail.html_body || msgDetail.plain_body,
        })
    }

    if (!loaded) return null

    if (!creds) {
        return <MailConnect onConnect={(c) => { saveCreds(c); fetchFolders(c); fetchMessages(c, "INBOX", 1, "") }} />
    }

    return (
        <div className="flex h-full -m-8 overflow-hidden">
            {/* Folder sidebar */}
            <div className={`w-56 border-r flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-900 ${mobilePanel !== "folders" ? "hidden md:flex" : "flex"}`}>
                <div className="p-3 border-b flex items-center justify-between">
                    <span className="font-semibold text-sm">Mail</span>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCompose("new")} title="Compose">
                            <PenSquare className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={clearCreds} title="Disconnect">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <MailFolderSidebar
                    folders={folders}
                    selected={selectedFolder}
                    onSelect={handleFolderSelect}
                    onRefresh={() => creds && fetchFolders(creds)}
                />
            </div>

            {/* Email list */}
            <div className={`w-80 border-r flex-shrink-0 flex flex-col ${mobilePanel !== "list" ? "hidden md:flex" : "flex"}`}>
                <MailList
                    messages={messages}
                    total={totalMessages}
                    loading={loadingMessages}
                    search={search}
                    folder={selectedFolder}
                    selectedUid={selectedMsg?.uid}
                    onSearch={handleSearch}
                    onSelect={handleSelectMessage}
                    onLoadMore={handleLoadMore}
                    onFlag={handleFlag}
                    onMobileBack={() => setMobilePanel("folders")}
                />
            </div>

            {/* Email detail */}
            <div className={`flex-1 flex flex-col min-w-0 ${mobilePanel !== "detail" ? "hidden md:flex" : "flex"}`}>
                <MailDetail
                    detail={msgDetail}
                    loading={loadingDetail}
                    folders={folders}
                    onReply={handleReply}
                    onReplyAll={handleReplyAll}
                    onForward={handleForward}
                    onFlag={() => msgDetail && handleFlag(msgDetail.uid, msgDetail.is_flagged)}
                    onMarkUnread={() => msgDetail && handleMarkUnread(msgDetail.uid)}
                    onMove={(dest) => msgDetail && handleMove(msgDetail.uid, dest)}
                    onDelete={() => msgDetail && handleDelete(msgDetail.uid)}
                    onMobileBack={() => setMobilePanel("list")}
                    creds={creds}
                    folder={selectedFolder}
                />
            </div>

            {/* Compose window */}
            {composeOpen && (
                <MailCompose
                    mode={composeMode}
                    defaults={composeDefaults}
                    onClose={() => setComposeOpen(false)}
                    onSent={() => {
                        setComposeOpen(false)
                        toast.success("Email sent!")
                        if (creds) fetchFolders(creds)
                    }}
                />
            )}
        </div>
    )
}
