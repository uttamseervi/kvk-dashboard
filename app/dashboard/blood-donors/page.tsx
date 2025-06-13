"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { toast } from "sonner"

interface Contact {
    id: number
    name: string
    email: string
    message: string
    date: string
    resolved: boolean
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("unresolved")
    const itemsPerPage = 5

    useEffect(() => {
        fetchContacts()
    }, [])

    const fetchContacts = async () => {
        console.log('Fetching contacts...')
        try {
            const { data } = await axios.get('/api/contact')
            console.log('Received contacts data:', data)
            const formattedContacts = data.contacts.map((contact: any) => ({
                id: contact.id,
                name: contact.name,
                email: contact.email,
                message: contact.message,
                date: new Date(contact.createdAt).toISOString().split('T')[0],
                resolved: contact.resolved || false
            }))
            console.log('Formatted contacts:', formattedContacts)
            setContacts(formattedContacts)
        } catch (error) {
            console.error('Error fetching contacts:', error)
            toast.error('Failed to fetch contacts')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResolvedToggle = async (id: number, currentResolved: boolean) => {
        console.log('Toggling resolved status for contact:', id, 'Current status:', currentResolved)
        try {
            const { data } = await axios.patch('/api/contact', {
                id,
                resolved: !currentResolved,
            })
            console.log('Update response:', data)

            if (data.contact) {
                setContacts(contacts.map(contact =>
                    contact.id === id ? { ...contact, resolved: !currentResolved } : contact
                ))
                toast.success('Contact status updated successfully')
            }
        } catch (error) {
            console.error('Error updating contact status:', error)
            toast.error('Failed to update contact status')
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const { data } = await axios.delete('/api/contact', {
                data: { id }
            })

            if (data.contact) {
                setContacts(contacts.filter(contact => contact.id !== id))
                toast.success('Contact deleted successfully')
            }
        } catch (error) {
            console.error('Error deleting contact:', error)
            toast.error('Failed to delete contact')
        }
    }

    const filteredContacts = contacts.filter(
        (contact) =>
            (contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.message.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (activeTab === 'all' ||
                (activeTab === 'resolved' && contact.resolved) ||
                (activeTab === 'unresolved' && !contact.resolved))
    )

    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Contact Submissions</h1>
                <p className="text-gray-600">Manage and review contact form submissions</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contact List</CardTitle>
                    <CardDescription>All contact form submissions from your website</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                        <TabsList>
                            <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
                            <TabsTrigger value="resolved">Resolved</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : paginatedContacts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">No contacts found</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedContacts.map((contact, index) => (
                                        <motion.tr
                                            key={contact.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell className="font-medium">{contact.name}</TableCell>
                                            <TableCell>{contact.email}</TableCell>
                                            <TableCell className="max-w-xs truncate">{contact.message}</TableCell>
                                            <TableCell>{contact.date}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        checked={contact.resolved}
                                                        onCheckedChange={() => handleResolvedToggle(contact.id, contact.resolved)}
                                                        id={`resolved-${contact.id}`}
                                                    />
                                                    <label
                                                        htmlFor={`resolved-${contact.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        Resolved
                                                    </label>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {contact.resolved && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(contact.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-gray-500">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredContacts.length)} of{" "}
                            {filteredContacts.length} entries
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
