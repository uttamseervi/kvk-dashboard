import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma-client'

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    return addCorsHeaders(new NextResponse(null, { status: 204 }))
}

// POST /api/blood-donation - Create a new blood donation record
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, phone, bloodGroup, city, message } = body

        // Validate required fields
        if (!name || !email || !bloodGroup || !city || !message) {
            return addCorsHeaders(NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            ))
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        // Check last donation if user exists
        if (user?.id) {
            const lastDonation = await prisma.bloodDonor.findFirst({
                where: {
                    userId: user.id
                },
                orderBy: {
                    donationDate: 'desc'
                }
            })

            if (lastDonation) {
                const threeMonthsAgo = new Date()
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

                if (lastDonation.donationDate > threeMonthsAgo) {
                    return addCorsHeaders(NextResponse.json(
                        { error: "You can only donate blood once every 3 months" },
                        { status: 400 }
                    ))
                }
            }
        }

        // Create blood donation record
        const donation = await prisma.bloodDonor.create({
            data: {
                name,
                email,
                phone,
                bloodGroup,
                city,
                message,
                userId: user?.id || null
            }
        })

        return addCorsHeaders(NextResponse.json(donation, { status: 201 }))
    } catch (error) {
        console.error("Error creating blood donation:", error)
        return addCorsHeaders(NextResponse.json(
            { error: "Failed to create blood donation record" },
            { status: 500 }
        ))
    }
}

// GET /api/blood-donation - Get all blood donations with optional filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const bloodGroup = searchParams.get('bloodGroup')
        const city = searchParams.get('city')
        const userId = searchParams.get('userId')

        // Build where clause
        const where: any = {}
        if (bloodGroup) where.bloodGroup = bloodGroup
        if (city) where.city = city
        if (userId) where.userId = parseInt(userId)

        const donations = await prisma.bloodDonor.findMany({
            where,
            orderBy: {
                donationDate: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        return addCorsHeaders(NextResponse.json(donations))
    } catch (error) {
        console.error("Error fetching blood donations:", error)
        return addCorsHeaders(NextResponse.json(
            { error: "Failed to fetch blood donations" },
            { status: 500 }
        ))
    }
}

// PATCH /api/blood-donation - Update a blood donation record
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json()
        const { id, name, email, phone, bloodGroup, city, message } = body

        if (!id) {
            return addCorsHeaders(NextResponse.json(
                { error: "Donation ID is required" },
                { status: 400 }
            ))
        }

        // Check if the donation exists
        const existingDonation = await prisma.bloodDonor.findUnique({
            where: { id }
        })

        if (!existingDonation) {
            return addCorsHeaders(NextResponse.json(
                { error: "Donation not found" },
                { status: 404 }
            ))
        }

        // Update the donation
        const updatedDonation = await prisma.bloodDonor.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                bloodGroup,
                city,
                message
            }
        })

        return addCorsHeaders(NextResponse.json(updatedDonation))
    } catch (error) {
        console.error("Error updating blood donation:", error)
        return addCorsHeaders(NextResponse.json(
            { error: "Failed to update blood donation" },
            { status: 500 }
        ))
    }
}

// DELETE /api/blood-donation - Delete a blood donation record
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return addCorsHeaders(NextResponse.json(
                { error: "Donation ID is required" },
                { status: 400 }
            ))
        }

        // Check if the donation exists
        const existingDonation = await prisma.bloodDonor.findUnique({
            where: { id: parseInt(id) }
        })

        if (!existingDonation) {
            return addCorsHeaders(NextResponse.json(
                { error: "Donation not found" },
                { status: 404 }
            ))
        }

        // Delete the donation
        await prisma.bloodDonor.delete({
            where: { id: parseInt(id) }
        })

        return addCorsHeaders(NextResponse.json(
            { message: "Blood donation record deleted successfully" },
            { status: 200 }
        ))
    } catch (error) {
        console.error("Error deleting blood donation:", error)
        return addCorsHeaders(NextResponse.json(
            { error: "Failed to delete blood donation" },
            { status: 500 }
        ))
    }
} 