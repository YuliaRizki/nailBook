'use client' // Required for Framer Motion

import AddAppointmentDrawer from '@/components/AddAppointmentDrawer'
import AppointmentCard from '@/components/AppointmentCard'
import CalendarView from '@/components/CalendarView'
import DateScroller from '@/components/DateScroller'
import ClientDetailsDrawer from '@/components/ClientDetailsDrawer' // Import
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import { supabase } from '@/lib/supabase'
import { m } from 'framer-motion'
import { toast } from 'sonner'
import { Sparkles, Plus, CalendarIcon, LogOut, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/utils'
import MonthlyRevenueDrawer from '@/components/MonthlyRevenueDrawer'
import { TrendingUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function Home() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any>(null) // State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false) // State
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [allBusyDates, setAllBusyDates] = useState<Date[]>([])
  const [busyDates, setBusyDates] = useState<Date[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [monthlyClientCount, setMonthlyClientCount] = useState(0)
  const [isRevenueDrawerOpen, setIsRevenueDrawerOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  // 🔒 Auth Check State
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const fetchBusyDates = async () => {
    // Optimization: Only fetch busy dates for relevant range (e.g., +/- 1 year)
    // This prevents downloading thousands of past appointments
    const today = new Date()
    const startObj = new Date(today)
    startObj.setFullYear(today.getFullYear() - 1)
    const endObj = new Date(today)
    endObj.setFullYear(today.getFullYear() + 1)

    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date')
      .gte('appointment_date', startObj.toISOString().split('T')[0])
      .lte('appointment_date', endObj.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching busy dates:', error.message)
      return
    }

    if (data) {
      // Adding "T00:00:00" ensures the date stays on the correct day locally
      const dates = data.map((b) => new Date(b.appointment_date + 'T00:00:00'))
      setBusyDates(dates)
    }
  }

  const fetchMonthlyRevenue = async () => {
    // Get start/end of current month in Local Date String (YYYY-MM-DD)
    const now = new Date()
    const start = format(startOfMonth(now), 'yyyy-MM-dd')
    const end = format(endOfMonth(now), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('appointments')
      .select('price')
      .gte('appointment_date', start)
      .lte('appointment_date', end)

    if (error) {
      console.error('Error fetching monthly revenue:', error.message)
    } else if (data) {
      const total = data.reduce((acc, curr) => acc + (curr.price || 0), 0)
      setMonthlyRevenue(total)
      setMonthlyClientCount(data.length) // 🔥 Capture count
    }
  }

  useEffect(() => {
    const init = async () => {
      // 1. Check User First
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return // Stop execution if redirecting
      }

      // 2. Set User & Allow Render
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Artist'
      setUserName(name)
      setIsAuthChecking(false)

      // 3. Fetch Data
      fetchBusyDates()
      fetchMonthlyRevenue()
    }

    init()
  }, [])

  // 1. Create a function to fetch data
  const fetchBookings = async (date: Date) => {
    setLoading(true)
    // Fix: Use local date string instead of ISO (which is UTC)
    const formattedDate = date.toLocaleDateString('en-CA') // YYYY-MM-DD

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', formattedDate) // 🔥 Filter by date
      .order('appointment_time', { ascending: true })

    if (error) {
      console.error('Error fetching:', error.message)
    } else {
      // Map the database names back to your UI names
      const formattedBookings = data.map((b: any) => ({
        ...b,
        id: b.id,
        name: b.client_name,
        service: b.service_type,
        time: b.appointment_time,
        price: b.price || 0, // 🔥 Map Price
      }))
      setBookings(formattedBookings)
    }
    setLoading(false)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const dailyRevenue = bookings.reduce((acc, booking) => {
    return acc + (booking.price || 0)
  }, 0)

  const handleDelete = (id: string, clientName: string) => {
    setBookingToDelete({ id, name: clientName })
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!bookingToDelete) return
    const { id } = bookingToDelete

    // Use loose comparison (==) as ID might be number vs string
    const booking = bookings.find((b) => b.id == id)

    // 1. Optimistic Update: Remove immediately
    const previousBookings = bookings
    setBookings((prev) => prev.filter((b) => b.id != id))

    // 2. Delete Image if exists
    if (booking?.reference_image) {
      try {
        const imageUrl = booking.reference_image
        const parts = imageUrl.split('/reference_images/')
        if (parts.length === 2) {
          const fileName = parts[1]
          // We don't await this to keep UI snappy, or we catch errors silently
          supabase.storage
            .from('reference_images')
            .remove([fileName])
            .then(({ error }) => {
              if (error) console.error('Image delete warning:', error)
            })
        }
      } catch (err) {
        console.error('Error parsing image URL:', err)
      }
    }

    // 3. Database Delete
    // Using select() ensures we get confirmation if a row was actually matched and deleted
    const { error, count } = await supabase
      .from('appointments')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('Error deleting:', error.message)
      toast.error(`Delete failed: ${error.message}`)
      // Rollback
      setBookings(previousBookings)
    } else if (count === 0) {
      // No rows deleted - likely permission issue or ID mismatch in DB
      console.warn('Delete operation returned 0 affected rows. Check RLS or ID.')
      toast.error('Could not delete. You might not be the owner of this record.')
      // Rollback
      setBookings(previousBookings)
    } else {
      toast.success('Client data deleted.')
      // Refresh the gold dots on the calendar
      fetchBusyDates()
      fetchMonthlyRevenue()
    }
  }

  // 2. Run fetch when the page opens
  useEffect(() => {
    fetchBookings(selectedDate)
    fetchBusyDates() // Initial fetch for the dots
    fetchMonthlyRevenue() // Initial fetch for monthly revenue

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          fetchBusyDates() // 🔥 This refreshes the dots automatically!
          fetchMonthlyRevenue()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate])

  const addBooking = (newBooking: any) => {
    setBookings((prev) => [...prev, newBooking])
    // Also update revenue optimistically? fetchMonthlyRevenue handles it on DB insert.
  }

  const handleExportCSV = async (filterDate?: Date) => {
    // If filterDate is provided, export only that month. Otherwise export all.
    const isMonthly = !!filterDate
    const filePrefix = isMonthly
      ? `nailbook_monthly_${format(filterDate!, 'yyyy-MM')}`
      : 'nailbook_backup_full'

    const toastId = toast.loading(
      isMonthly ? 'Exporting monthly data...' : 'Exporting full backup...',
    )

    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })

      if (isMonthly) {
        const start = format(startOfMonth(filterDate!), 'yyyy-MM-dd')
        const end = format(endOfMonth(filterDate!), 'yyyy-MM-dd')
        query = query.gte('appointment_date', start).lte('appointment_date', end)
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        toast.dismiss(toastId)
        toast.info('No data found for this period.')
        return
      }

      // Convert to CSV
      const headers = [
        'Client Name',
        'Phone',
        'Service',
        'Date',
        'Time',
        'Price',
        'Payment Method',
        'Notes',
      ]
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          [
            `"${row.client_name || ''}"`, // Quote strings to handle commas
            `"${row.client_phone || ''}"`,
            `"${row.service_type || ''}"`,
            row.appointment_date,
            row.appointment_time,
            row.price,
            row.payment_method,
            `"${(row.notes || '').replace(/"/g, '""')}"`, // Escape quotes in notes
          ].join(','),
        ),
      ].join('\n')

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${filePrefix}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.dismiss(toastId)
      toast.success('Data exported successfully! 📂')
    } catch (err: any) {
      toast.dismiss(toastId)
      console.error('Export failed:', err)
      toast.error('Failed to export data.')
    }
  }

  // 🛑 Block render until auth is confirmed
  if (isAuthChecking) {
    return null
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto bg-salon-nude">
      {/* Header Section */}
      <m.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-10"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-salon-accent mb-1">
            Welcome, {userName}
          </p>
          <h1 className="text-3xl font-serif italic text-salon-dark">Dai Nail Art</h1>
          <p className="text-sm text-gray-400 font-light text-left">Thursday, Dec 18</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="bg-white p-3 rounded-full shadow-sm border border-salon-pink hover:bg-salon-pink/10 transition-colors"
              title="Export Options"
            >
              <Download className="text-salon-accent w-5 h-5" />
            </button>

            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl shadow-salon-pink/20 border border-salon-pink/20 z-50 overflow-hidden flex flex-col p-2">
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-salon-accent mb-1 px-2">
                      Export Specific Month
                    </p>
                    <input
                      type="month"
                      className="w-full text-xs p-2 rounded-lg border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent text-salon-dark min-w-0"
                      onChange={(e) => {
                        if (e.target.value) {
                          // e.target.value is "YYYY-MM"
                          const [year, month] = e.target.value.split('-')
                          // Create date object for that month (e.g. 1st of that month)
                          const selectedMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
                          handleExportCSV(selectedMonth)
                          setIsExportMenuOpen(false)
                        }
                      }}
                    />
                  </div>

                  <div className="h-px bg-gray-100 my-1" />

                  <button
                    onClick={() => {
                      handleExportCSV() // Export all
                      setIsExportMenuOpen(false)
                    }}
                    className="w-full text-left px-2 py-2 text-xs font-bold text-gray-500 hover:text-salon-dark hover:bg-salon-pink/10 transition-colors rounded-lg flex items-center gap-2"
                  >
                    <Download size={14} />
                    Export All Time
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-white p-3 rounded-full shadow-sm border border-salon-pink hover:bg-red-50 transition-colors"
            title="Log Out"
          >
            <LogOut className="text-salon-dark w-5 h-5" />
          </button>
        </div>
      </m.header>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="text-xs uppercase tracking-widest text-salon-accent font-bold flex items-center gap-2"
        >
          <CalendarIcon size={14} />
          {isCalendarOpen ? 'Close Calendar' : 'Choose Date'}
        </button>

        <button
          onClick={() => setIsRevenueDrawerOpen(true)}
          className="text-xs uppercase tracking-widest text-salon-dark/60 hover:text-salon-dark font-bold flex items-center gap-2 transition-colors"
        >
          <TrendingUp size={14} />
          Reports
        </button>
      </div>

      <CalendarView
        selected={selectedDate}
        isOpen={isCalendarOpen}
        onSelect={(date) => {
          if (date) {
            setSelectedDate(date)
            setIsCalendarOpen(false)
          }
        }}
        // Use the state variable here instead of the [new Date...] dummy data
        busyDates={busyDates}
      />

      {/* 1. PLACE THE SCROLLER HERE */}
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <DateScroller onDateChange={handleDateChange} />
      </m.div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-salon-pink/30">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            Monthly Clients
          </p>
          <p className="text-2xl font-serif italic text-salon-dark">{monthlyClientCount}</p>
        </div>
        <div
          onClick={() => setIsRevenueDrawerOpen(true)}
          className="bg-salon-accent/10 p-4 rounded-3xl border border-salon-accent/20 cursor-pointer active:scale-95 transition-transform"
        >
          <p className="text-[10px] uppercase tracking-widest text-salon-accent font-bold">
            This Month
          </p>
          <p className="text-xl font-serif italic text-salon-dark truncate">
            {formatRupiah(monthlyRevenue)}
          </p>
        </div>
      </div>

      {/* Daily Summary Line */}
      <div className="flex justify-between items-center mb-4 px-2 opacity-60">
        <p className="text-xs font-bold text-salon-dark uppercase tracking-widest">
          {bookings.length} Clients • {formatRupiah(dailyRevenue)}
        </p>
      </div>
      {/* 2. APPOINTMENT LIST AREA */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading your day...</p>
        ) : bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <m.div
              key={booking.id}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <AppointmentCard
                id={booking.id}
                clientName={booking.name}
                service={booking.service}
                time={booking.time}
                onDelete={handleDelete}
                onClick={() => {
                  setSelectedBooking(booking)
                  setIsDetailsOpen(true)
                }}
              />
            </m.div>
          ))
        ) : (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-gray-400"
          >
            <div className="bg-white p-4 rounded-full mb-4 shadow-sm">✨</div>
            <p className="italic text-sm">No appointments for today yet</p>
          </m.div>
        )}
      </div>
      <AddAppointmentDrawer onAdd={addBooking} onSaved={() => fetchBookings(selectedDate)} />

      {/* Monthly Revenue Drawer */}
      <MonthlyRevenueDrawer
        isOpen={isRevenueDrawerOpen}
        onClose={() => setIsRevenueDrawerOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        clientName={bookingToDelete?.name || ''}
      />

      {/* Client Details Drawer */}
      {selectedBooking && (
        <ClientDetailsDrawer
          booking={selectedBooking}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
    </main>
  )
}
