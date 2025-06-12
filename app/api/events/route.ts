import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma-client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { EventCategory } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        console.log("Session:", session); // Debug log

        if (!session?.user?.id) {
            console.log("No session or user ID found"); // Debug log
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) }
        });
        console.log("Found user:", user); // Debug log

        if (!user) {
            console.log("User not found in database"); // Debug log
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const body = await req.json();
        console.log("Request body:", body); // Debug log

        const {
            title,
            description,
            date,
            endDate,
            location,
            category,
        } = body;

        if (!title || !description || !date || !endDate || !location || !category) {
            console.log("Missing fields:", { title, description, date, endDate, location, category }); // Debug log
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        try {
            const event = await prisma.event.create({
                data: {
                    title,
                    description,
                    startDate: new Date(date),
                    endDate: new Date(endDate),
                    location,
                    category: category as "HEALTH" | "EDUCATION" | "ART_AND_CULTURE" | "ENVIRONMENT" | "NATURAL_DISASTER_RELIEF" | "SPORTS_AND_ADVENTURE",
                    status: "ACTIVE",
                    createdById: user.id,
                } as any,
            });
            console.log("Created event:", event); // Debug log

            return NextResponse.json(
                { message: "Event created", event },
                { status: 201 }
            );
        } catch (prismaError) {
            console.error("Prisma error details:", prismaError); // Debug log
            throw prismaError;
        }

    } catch (error) {
        console.error("Event creation error:", error);
        return NextResponse.json(
            { error: "Server error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return new Response(JSON.stringify(events), { status: 200 });
    } catch (error) {
        console.error("Fetch events error:", error);
        return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
        });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const event = await prisma.event.findUnique({
            where: { id }
        }) as any;

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        const currentDate = new Date();
        const endDate = new Date(event.endDate);

        // Check if current date is greater than or equal to end date
        if (currentDate >= endDate) {
            const updatedEvent = await prisma.event.update({
                where: { id },
                data: { status: "COMPLETED" }
            });

            return NextResponse.json(
                { message: "Event status updated", event: updatedEvent },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { message: "Event is still active" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Event update error:", error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
