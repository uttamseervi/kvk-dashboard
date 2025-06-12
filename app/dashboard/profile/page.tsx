"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { toast } from "sonner"
import { LogOut, User } from "lucide-react"

interface UserProfile {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
}

export default function ProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get('/api/profile')
            setProfile(data.user)
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Failed to fetch profile')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await signOut({ redirect: false })
            router.push('/')
            toast.success('Logged out successfully')
        } catch (error) {
            console.error('Error logging out:', error)
            toast.error('Failed to log out')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                    <p className="text-gray-600">Manage your account settings</p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your personal account details</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-4 w-[150px]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                        <User className="h-6 w-6" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-medium">{profile.name}</h3>
                                    <p className="text-sm text-gray-500">{profile.email}</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-500">Role</h4>
                                    <p className="text-sm">{profile.role}</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-500">Member Since</h4>
                                    <p className="text-sm">
                                        {new Date(profile.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            Failed to load profile information
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 