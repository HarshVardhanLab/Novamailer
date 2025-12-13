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
import { Plus } from "lucide-react"

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([])

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get("/campaigns")
                setCampaigns(res.data)
            } catch (e) {
                console.error(e)
            }
        }
        fetchCampaigns()
    }, [])

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
                                <TableCell className="text-right">
                                    <Link href={`/campaigns/${campaign.id}`}>
                                        <Button variant="ghost" size="sm">View Details</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
