"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const formSchema = z.object({
    host: z.string().min(1, "Host is required"),
    port: z.number().min(1, "Port is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    from_email: z.string().email("Invalid email"),
})

const updateSchema = z.object({
    host: z.string().min(1, "Host is required"),
    port: z.number().min(1, "Port is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(),
    from_email: z.string().email("Invalid email"),
})

type FormValues = z.infer<typeof formSchema>

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [hasExistingConfig, setHasExistingConfig] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            host: "",
            port: 587,
            username: "",
            password: "",
            from_email: "",
        },
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/smtp")
                setHasExistingConfig(true)
                form.reset({
                    ...res.data,
                    password: "", // Don't show password
                })
            } catch (e) {
                // Ignore 404 - no existing config
                setHasExistingConfig(false)
            }
        }
        fetchSettings()
    }, [form])

    async function onSubmit(values: FormValues) {
        setIsLoading(true)
        try {
            // If updating and password is empty, don't send it
            const submitData = { ...values }
            if (hasExistingConfig && !values.password) {
                delete submitData.password
            }
            
            await api.post("/smtp", submitData)
            toast.success("Settings saved successfully!")
            setHasExistingConfig(true)
        } catch (error: any) {
            console.error("Settings save error:", error)
            const errorMessage = error.response?.data?.detail || "Failed to save settings"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>Configure your email server settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="host"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SMTP Host</FormLabel>
                                            <FormControl>
                                                <Input placeholder="smtp.gmail.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="port"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Port</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="587"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="user@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password (App Password)</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="from_email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="no-reply@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Settings"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
