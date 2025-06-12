import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma-client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const event = await prisma.event.delete({
            where: {
                id: params.id,
            },
        });

        return NextResponse.json(
            { message: "Event deleted successfully", event },
            { status: 200 }
        );
    } catch (error) {
        console.error("Event deletion error:", error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
} 