"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Copy, Search, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PAGE_SIZE = 10

const STATUS_COLORS: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    sending: "bg-blue-100 text-blue-800",
    scheduled: "bg-purple-100 text-purple-800",
    failed: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [duplicating, setDuplicating] = useState<number | null>(null)

    const fetchCampaigns = useCallback(async () => {
        try {
            const params: any = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
            if (search) params.search = search
            if (statusFilter !== "all") params.status = statusFilter

            const [listRes, countRes] = await Promise.all([
                api.get("/campaigns", { params }),
                api.get("/campaigns/count", { params: { search: params.search, status: params.status } }),
            ])
            setCampaigns(listRes.data)
            setTotal(countRes.data.count)
        } catch (e) {
            console.error(e)
        }
    }, [page, search, statusFilter])

    useEffect(() => {
        fetchCampaigns()
    }, [fetchCampaigns])

    // Reset to page 0 when filters change
    useEffect(() => {
        setPage(0)
    }, [search, statusFilter])

    const handleDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            await api.delete(`/campaigns/${deleteId}`)
            toast.success("Campaign deleted")
            setDeleteId(null)
            fetchCampaigns()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to delete campaign")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDuplicate = async (id: number) => {
        setDuplicating(id)
        try {
            const res = await api.post(`/campaigns/${id}/duplicate`)
            toast.success(`Campaign duplicated as "${res.data.name}"`)
            fetchCampaigns()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to duplicate campaign")
        } finally {
            setDuplicating(null)
        }
    }

    const handleExport = async (id: number, name: string) => {
        try {
            const res = await api.get(`/campaigns/${id}/export`, { responseType: "blob" })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const a = document.createElement("a")
            a.href = url
            a.download = `campaign_${id}_${name.replace(/\s+/g, "_")}.csv`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error("Failed to export report")
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
                <Link href="/campaigns/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Campaign
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="sending">Sending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Scheduled</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No campaigns found
                                </TableCell>
                            </TableRow>
                        ) : campaigns.map((campaign: any) => (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{campaign.subject}</TableCell>
                                <TableCell>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[campaign.status] || STATUS_COLORS.draft}`}>
                                        {campaign.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {campaign.scheduled_at
                                        ? new Date(campaign.scheduled_at).toLocaleString()
                                        : "—"}
                                </TableCell>
                                <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link href={`/campaigns/${campaign.id}`}>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDuplicate(campaign.id)}
                                            disabled={duplicating === campaign.id}
                                            title="Duplicate"
                                        >
                                            <Copy className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        {campaign.status === "completed" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleExport(campaign.id, campaign.name)}
                                                title="Export report"
                                            >
                                                <Download className="h-4 w-4 text-green-600" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteId(campaign.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the campaign and all its recipients.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
