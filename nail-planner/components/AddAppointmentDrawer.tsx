'use client'

import { Drawer } from 'vaul'
import { toast } from 'sonner'
import {
  Plus,
  Calendar,
  Clock,
  User,
  ChevronDown,
  Phone,
  StickyNote,
  Image as ImageIcon,
  Loader2,
  Banknote,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { m } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ClientSuggestion {
  name: string
  phone: string
}

interface Appointment {
  id: number
  name: string
  service: string
  time: string
}

interface AddAppointmentDrawerProps {
  onAdd: (appointment: Appointment) => void
  onSaved?: () => void
}

const toLocalInputDate = (d: Date = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeTime = (value: string) => {
  const cleaned = value.replace('.', ':').trim()
  if (!cleaned) return ''

  const [rawHour = '', rawMinute = ''] = cleaned.split(':')
  if (!rawHour || !rawMinute) return cleaned

  const hour = rawHour.padStart(2, '0')
  const minute = rawMinute.padStart(2, '0').slice(0, 2)
  return `${hour}:${minute}`
}

const formatDisplayDate = (value: string) => {
  if (!value) return 'Select date'

  const [yearStr, monthStr, dayStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!year || !month || !day) return value

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${monthNames[month - 1]} ${year}`
}

const formatDisplayTime = (value: string) => {
  const normalized = normalizeTime(value)
  return normalized || '--:--'
}

export default function AddAppointmentDrawer({ onAdd, onSaved }: AddAppointmentDrawerProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [price, setPrice] = useState('') // Raw number string
  const [service, setService] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(toLocalInputDate())
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const drawerBodyRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)

  // 🧠 Client Suggestions State
  const [allClients, setAllClients] = useState<ClientSuggestion[]>([])
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // 1. Fetch unique clients on load (or when drawer opens)
  useEffect(() => {
    if (open) {
      const fetchClients = async () => {
        const { data } = await supabase
          .from('appointments')
          .select('client_name, client_phone')
          .not('client_name', 'is', null) // Avoid nulls
          .order('created_at', { ascending: false })

        if (data) {
          // Filter unique names using a Map
          const uniqueClientsMap = new Map()
          data.forEach((item) => {
            const name = item.client_name?.trim()
            if (name && !uniqueClientsMap.has(name.toLowerCase())) {
              uniqueClientsMap.set(name.toLowerCase(), {
                name: name,
                phone: item.client_phone || '',
              })
            }
          })
          setAllClients(Array.from(uniqueClientsMap.values()))
        }
      }
      fetchClients()
    }
  }, [open])

  // Keep mobile/desktop open behavior consistent: always start from top of the form.
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      drawerBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    })
  }, [open])

  // 2. Filter suggestions when typing
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)

    if (value.length > 0) {
      const filtered = allClients.filter((client) =>
        client.name.toLowerCase().includes(value.toLowerCase()),
      )
      setSuggestions(filtered.slice(0, 5)) // Limit to top 5
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const selectClient = (client: ClientSuggestion) => {
    setName(client.name)
    setPhone(client.phone) // 🔥 Auto-fill phone
    setShowSuggestions(false)
  }

  // Helper functions
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '')
    setPrice(numericValue)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '')
    setPhone(numericValue)
  }

  const handleBooking = async () => {
    if (!name || !time) return toast.error('Please fill in all fields!')

    // 1. Optimistic Update
    const tempId = Date.now()
    const optimisticBooking = {
      id: tempId,
      name,
      service,
      time: normalizeTime(time),
      price: Number(price), // Pass price to optimistic
    }
    onAdd(optimisticBooking)

    // Close & Reset immediately for snappy feel
    setOpen(false)
    setName('')
    setPhone('')
    setNotes('')
    setImage(null)
    setTime('')
    setPrice('')
    setService('Gel Manicure')
    setPaymentMethod('Cash')
    setDate(toLocalInputDate())

    toast.success('Appointment successfully created! ✨')

    // 2. Background Upload & Insert
    try {
      setUploading(true)
      let imageUrl = null

      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('reference_images')
          .upload(fileName, image)

        if (uploadError) {
          console.error('Image upload failed:', uploadError)
          toast.error('Image upload failed, but appointment saved locally.')
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('reference_images')
            .getPublicUrl(fileName)
          imageUrl = publicUrlData.publicUrl
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // This is a critical edge case if they somehow logged out.
        // We can't revert the UI easily without more complex state management,
        // but we can alert them.
        toast.error('You must be logged in to sync to the server.')
        return
      }

      const { error } = await supabase.from('appointments').insert([
        {
          client_name: name,
          client_phone: phone,
          service_type: service,
          appointment_time: normalizeTime(time),
          appointment_date: date,
          notes: notes,
          reference_image: imageUrl,
          payment_method: paymentMethod,
          price: price ? Number(price) : 0, // 🔥 Insert Price
          user_id: user.id,
        },
      ])

      if (error) {
        console.error('Error saving:', error)
        toast.error('Failed to sync appointment to server.')
      } else {
        console.log('Synced to DB successfully')
        onSaved?.()
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
      <Drawer.Trigger asChild>
        {/* We replace the static Plus button in page.tsx with this trigger */}
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 bg-salon-dark text-white p-4 rounded-full shadow-xl z-50"
        >
          <Plus size={24} />
        </m.button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-salon-nude flex flex-col rounded-t-[32px] h-[96%] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none">
          <div ref={drawerBodyRef} className="p-4 bg-white rounded-t-[32px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-8" />
            <div className="max-w-md mx-auto">
              <Drawer.Title className="text-2xl font-serif italic mb-6 text-salon-dark">
                New Booking
              </Drawer.Title>

              {/* Simple Form Brainstorm */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Client Name
                  </label>
                  <div className="relative">
                    <input
                      value={name}
                      onChange={handleNameChange} // 🔥 Updated handler
                      onFocus={() => name && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                      type="text"
                      placeholder="e.g. Selena Gomez"
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors"
                      autoComplete="off"
                    />
                    <User
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none opacity-50"
                      size={20}
                    />

                    {/* 🧠 Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-salon-pink/20 border border-salon-pink/20 z-50 overflow-hidden max-h-48 overflow-y-auto">
                        {suggestions.map((client, index) => (
                          <button
                            key={index}
                            onClick={() => selectClient(client)}
                            className="w-full text-left px-4 py-3 hover:bg-salon-pink/10 transition-colors flex flex-col border-b border-gray-50 last:border-none"
                          >
                            <span className="text-sm font-bold text-salon-dark">{client.name}</span>
                            {client.phone && (
                              <span className="text-xs text-gray-400">{client.phone}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      value={phone}
                      onChange={handlePhoneChange}
                      type="tel"
                      placeholder="e.g. +1 234 567 890"
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors"
                    />
                    <Phone
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none opacity-50"
                      size={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Service
                  </label>
                  <div className="relative">
                    <input
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      type="text"
                      placeholder="e.g. Gel Manicure"
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors"
                    />
                    <ChevronDown
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none opacity-0" // Hidden but kept for spacing if needed
                      size={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {['Cash', 'QRIS', 'Transfer'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                          paymentMethod === method
                            ? 'bg-salon-accent text-white border-salon-accent shadow-lg shadow-salon-accent/20'
                            : 'bg-salon-nude/30 border-salon-pink/30 text-salon-dark hover:bg-salon-pink/20'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={price ? formatRupiah(Number(price)) : ''}
                      onChange={handlePriceChange}
                      placeholder="Rp 0"
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors"
                    />
                    <Banknote
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none opacity-50"
                      size={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Appointment Date
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => dateInputRef.current?.showPicker?.()}
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors cursor-pointer text-left text-salon-dark"
                    >
                      {formatDisplayDate(date)}
                    </button>
                    <input
                      ref={dateInputRef}
                      type="date"
                      min={toLocalInputDate()} // Disable past dates using local date, not UTC
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Appointment date"
                    />
                    <Calendar
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none"
                      size={20}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                      Time
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => timeInputRef.current?.showPicker?.()}
                        className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none cursor-pointer text-left text-salon-dark"
                      >
                        {formatDisplayTime(time)}
                      </button>
                      <input
                        ref={timeInputRef}
                        type="time"
                        value={time}
                        onChange={(e) => setTime(normalizeTime(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Appointment time"
                      />
                      <Clock
                        className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none"
                        size={20}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Notes & Reference
                  </label>
                  <div className="relative">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special requests, designs, etc."
                      className="w-full mt-2 p-4 pb-12 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors resize-none h-32"
                    />
                    <StickyNote
                      className="absolute right-4 top-4 text-salon-accent pointer-events-none opacity-50"
                      size={20}
                    />

                    {/* Attach Image Button */}
                    <div className="absolute bottom-4 left-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-xs font-bold text-salon-accent hover:text-salon-dark transition-colors bg-white/50 px-3 py-1.5 rounded-lg border border-salon-accent/20"
                      >
                        {image ? (
                          <span className="truncate max-w-[150px]">{image.name}</span>
                        ) : (
                          <>
                            <ImageIcon size={16} />
                            Attach Photo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBooking} // Changed from handleSubmit
                  disabled={uploading}
                  className="w-full bg-salon-accent text-white p-5 rounded-2xl font-bold shadow-lg shadow-salon-pink/20 mt-4 hover:scale-[1.02] active:scale-[0.98] transition-transform hover:bg-[#c29160] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    'Confirm Appointment'
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
