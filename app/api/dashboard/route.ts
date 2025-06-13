import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma-client'
import { Contact, Event } from '@prisma/client'

interface ContactActivity {
    type: 'contact'
    id: number
    title: string
    email: string
    resolved: boolean
    createdAt: Date
}

interface EventActivity {
    type: 'event'
    id: number
    title: string
    status: string
    createdAt: Date
}

type Activity = ContactActivity | EventActivity

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const [
            totalContacts,
            activeEvents,
            totalAdmins,
            totalModerators,
            recentActivities
        ] = await Promise.all([
            prisma.contact.count(),
            prisma.event.count({
                where: {
                    status: 'ACTIVE'
                }
            }),
            prisma.user.count({
                where: {
                    role: 'Admin'
                }
            }),
            prisma.user.count({
                where: {
                    role: 'MODERATOR'
                }
            }),
            Promise.all([
                prisma.contact.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.event.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                })
            ]).then(([contacts, events]) => {
                return [
                    ...contacts.map(contact => ({
                        type: 'contact',
                        id: contact.id,
                        title: contact.name,
                        email: contact.email,
                        createdAt: contact.createdAt
                    })),
                    ...events.map(event => ({
                        type: 'event',
                        id: event.id,
                        title: event.title,
                        status: event.status,
                        createdAt: event.createdAt
                    }))
                ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)
            })
        ])

        return NextResponse.json({
            stats: {
                totalContacts,
                activeEvents,
                totalAdmins,
                totalModerators
            },
            recentActivities
        })
    } catch (error) {
        console.error('Dashboard API Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
} 