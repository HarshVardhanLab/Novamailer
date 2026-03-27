"use client"
import { useState, useEffect } from "react"
import api from "@/lib/api"

export interface IMAPCreds {
    host: string
    port: number
    username: string
    password: string
}

const SESSION_KEY = "novamailer_imap_creds"

export function useMailSession() {
    const [creds, setCreds] = useState<IMAPCreds | null>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const load = async () => {
            // 1. Check sessionStorage first (fastest, already validated this session)
            try {
                const raw = sessionStorage.getItem(SESSION_KEY)
                if (raw) {
                    setCreds(JSON.parse(raw))
                    setLoaded(true)
                    return
                }
            } catch {}

            // 2. Try loading saved IMAP config from DB
            try {
                const res = await api.get("/smtp/imap/creds")
                const c: IMAPCreds = res.data
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(c))
                setCreds(c)
            } catch {
                // No saved config — user needs to enter credentials
            } finally {
                setLoaded(true)
            }
        }
        load()
    }, [])

    const saveCreds = (c: IMAPCreds) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(c))
        setCreds(c)
    }

    const clearCreds = () => {
        sessionStorage.removeItem(SESSION_KEY)
        setCreds(null)
    }

    return { creds, saveCreds, clearCreds, loaded }
}
