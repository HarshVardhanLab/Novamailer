"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
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

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([])
    const [allTemplates, setAllTemplates] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(0)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await api.get("/templates", { params: { limit: 200 } })
            setAllTemplates(res.data)
        } catch (e) {
            console.error(e)
        }
    }, [])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    // Client-side filter + paginate
    useEffect(() => {
        const filtered = allTemplates.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase())
        )
        setTemplates(filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE))
    }, [allTemplates, search, page])

    useEffect(() => { setPage(0) }, [search])

    const filtered = allTemplates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

    const handleDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        try {
            await api.delete(`/templates/${deleteId}`)
            toast.success("Template deleted")
            setDeleteId(null)
            fetchTemplates()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to delete template")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
                <Link href="/templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Template
                    </Button>
                </Link>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search templates..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {templates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                    No templates found
                                </TableCell>
                            </TableRow>
                        ) : templates.map((template: any) => (
                            <TableRow key={template.id}>
                                <TableCell className="font-medium">{template.name}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Link href={`/templates/${template.id}`}>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteId(template.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
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
                        <AlertDialogTitle>Delete template?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the template.</AlertDialogDescription>
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
