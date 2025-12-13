"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OTPInput } from "@/components/otp-input"
import { toast } from "sonner"
import { Mail, ArrowLeft, RefreshCw } from "lucide-react"

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [otpCode, setOtpCode] = useState("")
    const [isOtpComplete, setIsOtpComplete] = useState(false)

    useEffect(() => {
        if (!userId || !email) {
            router.push('/register')
        }
    }, [userId, email, router])

    const handleOtpChange = (code: string, isComplete: boolean) => {
        setOtpCode(code)
        setIsOtpComplete(isComplete)
    }

    const handleVerify = async (code?: string) => {
        if (!userId) return
        const codeToVerify = code || otpCode
        if (!codeToVerify || codeToVerify.length !== 6) {
            toast.error("Please enter a valid 6-digit code")
            return
        }
        
        setVerifying(true)
        try {
            await api.post("/auth/verify-email", {
                user_id: parseInt(userId),
                code: codeToVerify
            })
            toast.success("Email verified successfully! You can now login.")
            router.push("/login")
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Invalid or expired OTP")
        } finally {
            setVerifying(false)
        }
    }

    const handleResendOTP = async () => {
        if (!email) return
        
        setResending(true)
        try {
            // Re-register to get new OTP
            await api.post("/auth/register", {
                email,
                password: "temp", // This won't be used since user exists
                full_name: ""
            })
            toast.success("New verification code sent!")
        } catch (e: any) {
            if (e.response?.status === 400 && e.response?.data?.detail?.includes("already exists")) {
                toast.success("New verification code sent!")
            } else {
                toast.error("Failed to resend code")
            }
        } finally {
            setResending(false)
        }
    }

    if (!userId || !email) {
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                            <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="mt-4">Verify Your Email</CardTitle>
                        <CardDescription>
                            We sent a 6-digit verification code to
                            <br />
                            <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <OTPInput 
                                onComplete={handleVerify}
                                onChange={handleOtpChange}
                                disabled={verifying}
                                autoSubmit={false}
                            />
                            
                            <Button
                                onClick={() => handleVerify()}
                                disabled={!isOtpComplete || verifying}
                                className="w-full"
                            >
                                {verifying ? "Verifying..." : "Verify Email"}
                            </Button>
                            
                            {verifying && (
                                <p className="text-center text-sm text-muted-foreground">
                                    Verifying code...
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive the code?
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResendOTP}
                                    disabled={resending}
                                    className="mt-2"
                                >
                                    {resending ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Resend Code"
                                    )}
                                </Button>
                            </div>

                            <div className="text-center">
                                <Link href="/register">
                                    <Button variant="ghost" size="sm">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Register
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs text-blue-800">
                                <strong>Tips:</strong>
                                <br />• Check your spam folder
                                <br />• Code expires in 10 minutes
                                <br />• You can paste the code from your email
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
