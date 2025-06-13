"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, MessageSquare, Activity, Clock } from "lucide-react"
import { useSession } from "next-auth/react"
import axios from "axios"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface DashboardStats {
  totalContacts: number
  activeEvents: number
  totalAdmins: number
  totalModerators: number
  totalActivities: number
}

interface RecentActivity {
  type: 'contact' | 'event'
  id: number
  title: string
  createdAt: string
  email?: string
  resolved?: boolean
  status?: string
}

interface DashboardData {
  stats: DashboardStats
  recentActivities: RecentActivity[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get('/api/dashboard')
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    {
      title: "Total Contacts",
      value: dashboardData?.stats?.totalContacts?.toLocaleString() ?? "0",
      description: "Contact form submissions",
      icon: MessageSquare,
      color: "text-blue-600",
    },
    {
      title: "Active Events",
      value: dashboardData?.stats?.activeEvents?.toLocaleString() ?? "0",
      description: "Currently running events",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Admin Users",
      value: dashboardData?.stats?.totalAdmins?.toLocaleString() ?? "0",
      description: "Administrator accounts",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Moderator Users",
      value: dashboardData?.stats?.totalModerators?.toLocaleString() ?? "0",
      description: "Moderator accounts",
      icon: Users,
      color: "text-orange-600",
    },
  ]

  const getActivityIcon = (type: 'contact' | 'event') => {
    return type === 'contact' ? MessageSquare : Calendar
  }

  const formatTimestamp = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const getActivityMessage = (activity: RecentActivity) => {
    if (activity.type === 'contact') {
      return `New contact from ${activity.title}${activity.email ? ` (${activity.email})` : ''}`
    } else {
      return `Event "${activity.title}" is ${activity.status?.toLowerCase()}`
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {session?.user?.name || 'User'}</h1>
        <p className="text-gray-600">Here's what's happening with your dashboard today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboardData?.recentActivities.length ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
                  {dashboardData.recentActivities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type)
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative flex items-start space-x-4 pl-8 pb-6 last:pb-0"
                      >
                        <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'contact' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                          <Icon className={`h-4 w-4 ${activity.type === 'contact' ? 'text-blue-600' : 'text-green-600'
                            }`} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {getActivityMessage(activity)}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(activity.createdAt)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Create Event", href: "/dashboard/events" },
                { title: "Add User", href: "/dashboard/users" },
                { title: "View Contacts", href: "/dashboard/contacts" },
                { title: "Event Tracker", href: "/dashboard/tracker" },
              ].map((action, index) => (
                <motion.a
                  key={action.title}
                  href={action.href}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                </motion.a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
