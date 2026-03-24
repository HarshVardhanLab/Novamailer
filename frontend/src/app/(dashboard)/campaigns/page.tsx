"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
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

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([])
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchCampaigns = async () => {
        try {
            const res = await api.get("/campaigns")
            setCampaigns(res.data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const handleDelete = async () => {
        if (!deleteId) return
        
        setIsDeleting(true)
        try {
            await api.delete(`/campaigns/${deleteId}`)
            toast.success("Campaign deleted successfully")
            setDeleteId(null)
            fetchCampaigns()
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to delete campaign")
        } finally {
            setIsDeleting(false)
        }
    }

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
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.map((campaign: any) => (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>{campaign.subject}</TableCell>
                                <TableCell>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                        campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                                        campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {campaign.status}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Link href={`/campaigns/${campaign.id}`}>
                                        <Button variant="ghost" size="sm">View Details</Button>
                                    </Link>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setDeleteId(campaign.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the campaign and all its recipients.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
