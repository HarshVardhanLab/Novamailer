"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    content: z.string().min(1, "Content is required"),
})

export default function EditTemplatePage() {
    const router = useRouter()
    const params = useParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            content: "",
        },
    })

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const res = await api.get(`/templates/${params.id}`)
                form.reset({
                    name: res.data.name,
                    content: res.data.content,
                })
            } catch (error) {
                toast.error("Failed to load template")
                router.push("/templates")
            } finally {
                setIsFetching(false)
            }
        }
        fetchTemplate()
    }, [params.id, form, router])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            await api.put(`/templates/${params.id}`, values)
            toast.success("Template updated")
            router.push("/templates")
        } catch (error: any) {
            toast.error("Failed to update template")
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return <div className="space-y-6 max-w-2xl mx-auto">Loading...</div>
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Edit Template</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Template Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Newsletter Template" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>HTML Content</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="<html>...</html>" className="min-h-[300px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Template"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
