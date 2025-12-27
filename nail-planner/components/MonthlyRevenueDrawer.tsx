'use client'

import { Drawer } from 'vaul'
import { formatRupiah } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, TrendingUp, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'

interface MonthlyRevenueDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MonthlyRevenueDrawer({ isOpen, onClose }: MonthlyRevenueDrawerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [revenueData, setRevenueData] = useState<{ date: string; total: number; count: number }[]>(
    [],
  )
  const [totalRevenue, setTotalRevenue] = useState(0)

  const fetchMonthlyData = async (date: Date) => {
    setLoading(true)
    const start = startOfMonth(date).toISOString()
    const end = endOfMonth(date).toISOString()

    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date, price')
      .gte('appointment_date', start)
      .lte('appointment_date', end)
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Error fetching monthly revenue:', error)
    } else if (data) {
      // Aggregate data by date
      const aggregated: Record<string, { total: number; count: number }> = {}
      let total = 0

      data.forEach((appt) => {
        const dateKey = appt.appointment_date
        const price = appt.price || 0

        if (!aggregated[dateKey]) {
          aggregated[dateKey] = { total: 0, count: 0 }
        }
        aggregated[dateKey].total += price
        aggregated[dateKey].count += 1
        total += price
      })

      const sortedData = Object.entries(aggregated).map(([date, stats]) => ({
        date,
        total: stats.total,
        count: stats.count,
      }))

      setRevenueData(sortedData)
      setTotalRevenue(total)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      fetchMonthlyData(currentMonth)
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
              <div className="bg-salon-accent text-white p-6 rounded-3xl shadow-lg shadow-salon-accent/20 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <TrendingUp size={48} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                  Total Earned
                </p>
                <div className="text-4xl font-serif italic">
                  {loading ? <Loader2 className="animate-spin" /> : formatRupiah(totalRevenue)}
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
                            {day.count} {day.count === 1 ? 'client' : 'clients'}
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
