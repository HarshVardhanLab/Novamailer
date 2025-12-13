"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { OTPInput } from "@/components/otp-input"
import { toast } from "sonner"
import { Mail, ArrowLeft } from "lucide-react"

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
})

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showOTP, setShowOTP] = useState(false)
    const [userId, setUserId] = useState<number | null>(null)
    const [userEmail, setUserEmail] = useState<string>('')
    const [verifyingOTP, setVerifyingOTP] = useState(false)
    const [otpCode, setOtpCode] = useState("")
    const [isOtpComplete, setIsOtpComplete] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("username", values.email)
            formData.append("password", values.password)

            const response = await api.post("/auth/login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            })

            // Check if OTP is required
            if (response.data.requires_otp) {
                setUserId(response.data.user_id)
                setUserEmail(values.email)
                setShowOTP(true)
                toast.success("OTP sent to your email")
            } else {
                // Direct login
                localStorage.setItem("token", response.data.access_token)
                toast.success("Logged in successfully")
                router.push("/dashboard")
            }
        } catch (error: any) {
            if (error.response?.data?.detail?.includes("Email not verified")) {
                toast.error("Please verify your email first")
            } else {
                toast.error(error.response?.data?.detail || "Failed to login")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpChange = (code: string, isComplete: boolean) => {
        setOtpCode(code)
        setIsOtpComplete(isComplete)
    }

    const handleOTPVerify = async (code?: string) => {
        if (!userId) return
        const codeToVerify = code || otpCode
        if (!codeToVerify || codeToVerify.length !== 6) {
            toast.error("Please enter a valid 6-digit code")
            return
        }
        
        setVerifyingOTP(true)
        try {
            const response = await api.post("/auth/verify-login", {
                user_id: userId,
                code: codeToVerify
            })
            
            localStorage.setItem("token", response.data.access_token)
            toast.success("Login successful")
            router.push("/dashboard")
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Invalid OTP")
        } finally {
            setVerifyingOTP(false)
        }
    }

    const handleBackToLogin = () => {
        setShowOTP(false)
        setUserId(null)
        setUserEmail('')
    }

    if (showOTP) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                            <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="mt-4">Two-Factor Authentication</CardTitle>
                        <CardDescription>
                            We sent a 6-digit code to
                            <br />
                            <strong>{userEmail}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <OTPInput 
                                onComplete={handleOTPVerify}
                                onChange={handleOtpChange}
                                disabled={verifyingOTP}
                                autoSubmit={false}
                            />
                            
                            <Button
                                onClick={() => handleOTPVerify()}
                                disabled={!isOtpComplete || verifyingOTP}
                                className="w-full"
                            >
                                {verifyingOTP ? "Verifying..." : "Verify & Login"}
                            </Button>
                            
                            {verifyingOTP && (
                                <p className="text-center text-sm text-muted-foreground">
                                    Verifying code...
                                </p>
                            )}
                        </div>

                        <div className="text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToLogin}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs text-blue-800">
                                <strong>Security Notice:</strong>
                                <br />• Code expires in 10 minutes
                                <br />• Check your spam folder if not received
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="email@example.com" {...field} />
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
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex-col space-y-2">
                    <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                        Forgot your password?
                    </Link>
                    <p className="text-sm text-gray-500">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-500 hover:underline">
                            Register
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
