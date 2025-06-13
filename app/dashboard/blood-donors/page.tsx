"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import axios from "axios"
import { toast } from "sonner"

interface BloodDonor {
    id: number
    name: string
    email: string
    phone: string | null
    bloodGroup: string
    city: string
    donationDate: string
    message: string | null
}

export default function BloodDonorsPage() {
    const [donors, setDonors] = useState<BloodDonor[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("")
    const [selectedCity, setSelectedCity] = useState<string>("")
    const [selectedDonor, setSelectedDonor] = useState<BloodDonor | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const itemsPerPage = 5

    const bloodGroups = [
        "A_POSITIVE", "A_NEGATIVE",
        "B_POSITIVE", "B_NEGATIVE",
        "O_POSITIVE", "O_NEGATIVE",
        "AB_POSITIVE", "AB_NEGATIVE"
    ]

    const formatBloodGroup = (group: string) => {
        const [type, sign] = group.split('_')
        return `${type}${sign === 'POSITIVE' ? '+' : '-'}`
    }

    useEffect(() => {
        fetchDonors()
    }, [selectedBloodGroup, selectedCity])

    const fetchDonors = async () => {
        try {
            const params = new URLSearchParams()
            if (selectedBloodGroup) params.append('bloodGroup', selectedBloodGroup)
            if (selectedCity) params.append('city', selectedCity)

            const { data } = await axios.get(`/api/blood-donation?${params.toString()}`)
            const formattedDonors = data.map((donor: any) => ({
                id: donor.id,
                name: donor.name,
                email: donor.email,
                phone: donor.phone,
                bloodGroup: donor.bloodGroup,
                city: donor.city,
                donationDate: new Date(donor.donationDate).toISOString().split('T')[0],
                message: donor.message
            }))
            setDonors(formattedDonors)
        } catch (error) {
            console.error('Error fetching blood donors:', error)
            toast.error('Failed to fetch blood donors')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const { data } = await axios.delete(`/api/blood-donation?id=${id}`)
            if (data.message) {
                setDonors(donors.filter(donor => donor.id !== id))
                toast.success('Blood donor record deleted successfully')
            }
        } catch (error) {
            console.error('Error deleting blood donor:', error)
            toast.error('Failed to delete blood donor record')
        }
    }

    const handleViewDetails = (donor: BloodDonor) => {
        setSelectedDonor(donor)
        setIsDialogOpen(true)
    }

    const filteredDonors = donors.filter(
        (donor) =>
            donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donor.city.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil(filteredDonors.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedDonors = filteredDonors.slice(startIndex, startIndex + itemsPerPage)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Blood Donors</h1>
                <p className="text-gray-600">Manage and view blood donor information</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Blood Donor List</CardTitle>
                    <CardDescription>All registered blood donors in the system</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4 mb-4">
                        <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, email, or city..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <select
                                value={selectedBloodGroup}
                                onChange={(e) => setSelectedBloodGroup(e.target.value)}
                                className="border rounded-md px-3 py-2"
                            >
                                <option value="">All Blood Groups</option>
                                {bloodGroups.map(group => (
                                    <option key={group} value={group}>
                                        {formatBloodGroup(group)}
                                    </option>
                                ))}
                            </select>
                            <Input
                                placeholder="Filter by city..."
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Blood Group</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Donation Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : paginatedDonors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">No blood donors found</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedDonors.map((donor, index) => (
                                        <motion.tr
                                            key={donor.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell className="font-medium">{donor.name}</TableCell>
                                            <TableCell>{donor.email}</TableCell>
                                            <TableCell>{donor.phone || '-'}</TableCell>
                                            <TableCell>{formatBloodGroup(donor.bloodGroup)}</TableCell>
                                            <TableCell>{donor.city}</TableCell>
                                            <TableCell>{donor.donationDate}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewDetails(donor)}
                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(donor.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-gray-500">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDonors.length)} of{" "}
                            {filteredDonors.length} entries
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Blood Donor Details</DialogTitle>
                        <DialogDescription>
                            Complete information about the blood donor
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDonor && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">Name:</span>
                                <span className="col-span-3">{selectedDonor.name}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">Email:</span>
                                <span className="col-span-3">{selectedDonor.email}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">Phone:</span>
                                <span className="col-span-3">{selectedDonor.phone || '-'}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">Blood Group:</span>
                                <span className="col-span-3">{formatBloodGroup(selectedDonor.bloodGroup)}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">City:</span>
                                <span className="col-span-3">{selectedDonor.city}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">Donation Date:</span>
                                <span className="col-span-3">{selectedDonor.donationDate}</span>
                            </div>
                            {selectedDonor.message && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="font-medium">Message:</span>
                                    <span className="col-span-3">{selectedDonor.message}</span>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
