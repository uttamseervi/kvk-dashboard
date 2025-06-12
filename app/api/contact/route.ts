import prisma from '@/lib/prisma-client'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    console.log('POST request received to /api/contact')
    try {
        const body = await req.json()
        console.log('Request body:', body)
        const { name, email, phone, subject, message } = body
        console.log(name, email, phone, subject, message)

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Name, Email, and Message are required.' }, { status: 400 })
        }
        const template = `
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
    <h2>Resend Request Details</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Message:</strong></p>
    <p style={{ whiteSpace: 'pre-line' }}>${message}</p>
  </div>
        `

        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: "rishimanjunath15@gmail.com",
            subject: subject,
            html: template,
        });
        if (error) console.log("tje error is ", error)
        console.log("the email data is ", data)

        // Save the contact form data to the database using Prisma
        const newContact = await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                subject,
                message,
            },
        })
        console.log("the new contact is ", newContact)
        return NextResponse.json({ response: newContact }, { status: 201 })

    } catch (error) {
        console.error('Error saving contact:', error)
        return NextResponse.json({ error: 'Failed to save contact information.' }, { status: 500 })
    }
}

// Add OPTIONS handler for CORS preflight requests
// export async function OPTIONS() {
//     return new NextResponse(null, {
//         status: 204,
//         headers: {
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Methods': 'POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type',
//         },
//     })
// }

export async function GET() {
    console.log('GET request received to /api/contact')
    try {
        const contacts = await prisma.contact.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log("Fetched contacts:", contacts)
        return NextResponse.json({ contacts }, { status: 200 });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    console.log('PATCH request received to /api/contact')
    try {
        const body = await req.json();
        console.log('PATCH request body:', body)
        const { id, resolved } = body;

        if (!id || typeof resolved !== 'boolean') {
            console.log('Invalid request: missing id or resolved status')
            return NextResponse.json(
                { error: 'Contact ID and resolution status are required' },
                { status: 400 }
            );
        }

        const updatedContact = await prisma.contact.update({
            where: { id },
            data: { resolved }
        });
        console.log('Updated contact:', updatedContact)

        return NextResponse.json({ contact: updatedContact }, { status: 200 });
    } catch (error) {
        console.error('Error updating contact:', error);
        return NextResponse.json(
            { error: 'Failed to update contact status' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    console.log('DELETE request received to /api/contact')
    try {
        const body = await req.json();
        console.log('DELETE request body:', body)
        const { id } = body;

        if (!id) {
            console.log('Invalid request: missing id')
            return NextResponse.json(
                { error: 'Contact ID is required' },
                { status: 400 }
            );
        }

        const deletedContact = await prisma.contact.delete({
            where: { id }
        });
        console.log('Deleted contact:', deletedContact)

        return NextResponse.json({ contact: deletedContact }, { status: 200 });
    } catch (error) {
        console.error('Error deleting contact:', error);
        return NextResponse.json(
            { error: 'Failed to delete contact' },
            { status: 500 }
        );
    }
}




