'use client'

import { Drawer } from 'vaul'
import { toast } from 'sonner'
import { Plus, Calendar, Wallet, Loader2, Banknote, StickyNote } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { m } from 'framer-motion'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface IncomeRecord {
  id: number
  amount: number
  date: string
  source?: string
}

interface AddIncomeDrawerProps {
  onAdd: (record: IncomeRecord) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export default function AddIncomeDrawer({
  onAdd,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: AddIncomeDrawerProps) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [source, setSource] = useState('')
  const [uploading, setUploading] = useState(false)

  // Internal state if not controlled
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '')
    setAmount(numericValue)
  }

  const handleSubmit = async () => {
    if (!amount || !date) return toast.error('Please fill in amount and date!')

    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in.')
        return
      }

      const tempId = Date.now()
      const optimisticRecord = {
        id: tempId,
        amount: Number(amount),
        date,
        source,
      }

      // Optimistic update
      onAdd(optimisticRecord)
      setOpen(false)

      // Reset form
      setAmount('')
      setSource('')
      setDate(new Date().toLocaleDateString('en-CA'))
      toast.success('Income recorded! 💰')

      const { error } = await supabase.from('income_records').insert([
        {
          amount: Number(amount),
          date: date,
          source: source,
          user_id: user.id,
        },
      ])

      if (error) {
        console.error('Error saving income:', error)
        toast.error('Failed to sync to server.')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('An unexpected error occurred.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Drawer.Root shouldScaleBackground open={open} onOpenChange={setOpen}>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-salon-nude flex flex-col rounded-t-[32px] h-[85%] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none">
          <div className="p-4 bg-white rounded-t-[32px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-8" />
            <div className="max-w-md mx-auto">
              <Drawer.Title className="text-2xl font-serif italic mb-6 text-salon-dark">
                Record Income
              </Drawer.Title>

              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={amount ? formatRupiah(Number(amount)) : ''}
                      onChange={handleAmountChange}
                      placeholder="Rp 0"
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors text-lg font-semibold"
                    />
                    <Banknote
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none opacity-50"
                      size={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Date Received
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors cursor-pointer"
                    />
                    <Calendar
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none"
                      size={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Source (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. Tips, Salary"
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors"
                    />
                    <StickyNote
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none opacity-50"
                      size={20}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full bg-salon-accent text-white p-5 rounded-2xl font-bold shadow-lg shadow-salon-pink/20 mt-4 hover:scale-[1.02] active:scale-[0.98] transition-transform hover:bg-[#c29160] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Income'
                  )}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
