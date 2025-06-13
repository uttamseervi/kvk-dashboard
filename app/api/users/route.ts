import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/prisma-client"

// CORS headers configuration
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// GET /api/users - Fetch all users
export async function GET(req: Request) {
    try {
        // Get email from URL search params
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')

        if (email) {
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            })

            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404, headers: corsHeaders }
                )
            }

            return NextResponse.json(user, { headers: corsHeaders })
        }
        else {
            const users = await prisma.user.findMany({
                where: {
                    role: {
                        equals: "ADMIN",
                        mode: 'insensitive'
                    }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            })

            return NextResponse.json(users, { headers: corsHeaders })
        }
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500, headers: corsHeaders }
        )
    }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, role, password } = body

        // Validate required fields
        if (!name || !email || !role || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400, headers: corsHeaders }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })
        console.log("existing user", existingUser)
        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400, headers: corsHeaders }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                role,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        })
        console.log("tje new user is ", user)

        return NextResponse.json(user, { status: 201, headers: corsHeaders })
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500, headers: corsHeaders }
        )
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
} 