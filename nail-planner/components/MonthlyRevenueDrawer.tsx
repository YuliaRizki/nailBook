'use client'

import { Drawer } from 'vaul'
import { formatRupiah } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, TrendingUp, CalendarDays, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'

interface MonthlyRevenueDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MonthlyRevenueDrawer({ isOpen, onClose }: MonthlyRevenueDrawerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [revenueData, setRevenueData] = useState<
    { date: string; total: number; count: number; manual: number }[]
  >([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [allTimeRevenue, setAllTimeRevenue] = useState(0)

  // Fetch All Time Revenue (Lifetime)
  const fetchOverallRevenue = async () => {
    // 1. All Appointments
    const { data: apptData, error: apptError } = await supabase.from('appointments').select('price')

    // 2. All Manual Income
    const { data: incomeData, error: incomeError } = await supabase
      .from('income_records')
      .select('amount')

    let total = 0
    if (apptData) total += apptData.reduce((acc, curr) => acc + (curr.price || 0), 0)
    if (incomeData) total += incomeData.reduce((acc, curr) => acc + (curr.amount || 0), 0)

    setAllTimeRevenue(total)
  }

  const fetchMonthlyData = async (date: Date) => {
    setLoading(true)
    const start = format(startOfMonth(date), 'yyyy-MM-dd')
    const end = format(endOfMonth(date), 'yyyy-MM-dd')

    // 1. Fetch Appointments
    const { data: apptData, error: apptError } = await supabase
      .from('appointments')
      .select('appointment_date, price')
      .gte('appointment_date', start)
      .lte('appointment_date', end)
      .order('appointment_date', { ascending: true })

    // 2. Fetch Manual Income
    const { data: incomeData, error: incomeError } = await supabase
      .from('income_records')
      .select('date, amount')
      .gte('date', start)
      .lte('date', end)

    if (apptError) console.error('Error fetching appointments:', apptError)
    if (incomeError) {
      // Gracefully fail if table doesn't exist
      // if (incomeError && incomeError.code !== '42P01') console.error('Error fetching income:', incomeError)
    }

    // Aggregate data
    const aggregated: Record<string, { total: number; count: number; manual: number }> = {}
    let total = 0

    // Process Appointments
    if (apptData) {
      apptData.forEach((appt) => {
        const dateKey = appt.appointment_date
        const price = appt.price || 0

        if (!aggregated[dateKey]) {
          aggregated[dateKey] = { total: 0, count: 0, manual: 0 }
        }
        aggregated[dateKey].total += price
        aggregated[dateKey].count += 1
        total += price
      })
    }

    // Process Manual Income
    if (incomeData) {
      incomeData.forEach((inc) => {
        const dateKey = inc.date
        const amount = inc.amount || 0

        if (!aggregated[dateKey]) {
          aggregated[dateKey] = { total: 0, count: 0, manual: 0 }
        }
        aggregated[dateKey].total += amount
        aggregated[dateKey].manual += amount
        total += amount
      })
    }

    const sortedData = Object.entries(aggregated)
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        count: stats.count,
        manual: stats.manual,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setRevenueData(sortedData)
    setTotalRevenue(total)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      fetchMonthlyData(currentMonth)
      fetchOverallRevenue()
    }
  }, [isOpen, currentMonth])

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-salon-nude flex flex-col rounded-t-[32px] h-[90%] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none">
          <div className="p-4 bg-white rounded-t-[32px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-8" />

            <div className="max-w-md mx-auto">
              <Drawer.Title className="text-2xl font-serif italic mb-2 text-salon-dark text-center">
                Monthly Revenue
              </Drawer.Title>

              {/* Month Navigator */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-500" />
                </button>
                <span className="text-sm font-bold uppercase tracking-widest text-salon-accent">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Total Card */}
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Monthly Card */}
                <div className="bg-salon-accent text-white p-5 rounded-3xl shadow-lg shadow-salon-accent/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <TrendingUp size={32} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                    This Month
                  </p>
                  <div className="text-2xl font-serif italic truncate">
                    {loading ? (
                      <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                      formatRupiah(totalRevenue)
                    )}
                  </div>
                </div>

                {/* Lifetime Card */}
                {/* Lifetime Card */}
                <div className="bg-salon-pink-light text-white p-5 rounded-3xl shadow-lg shadow-gray-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Wallet size={32} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
                    Total Revenue
                  </p>
                  <div className="text-xl font-serif italic truncate">
                    {formatRupiah(allTimeRevenue)}
                  </div>
                </div>
              </div>

              {/* Daily Breakdown */}
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">
                Daily Breakdown
              </h3>

              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-salon-accent" />
                  </div>
                ) : revenueData.length > 0 ? (
                  revenueData.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-salon-pink/20 text-salon-dark">
                          <CalendarDays size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-salon-dark">
                            {format(parseISO(day.date), 'EEE, d MMM')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {day.count > 0 &&
                              `${day.count} ${day.count === 1 ? 'client' : 'clients'}`}
                            {day.count > 0 && day.manual > 0 && ' • '}
                            {day.manual > 0 && 'Extra Income'}
                          </p>
                        </div>
                      </div>
                      <p className="font-serif italic text-salon-accent text-lg">
                        {formatRupiah(day.total)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <p className="italic">No revenue recorded for this month.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
