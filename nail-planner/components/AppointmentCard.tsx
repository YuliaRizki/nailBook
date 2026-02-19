'use client'

import { m } from 'framer-motion'
import { MessageCircle, Trash2 } from 'lucide-react'

interface AppointmentProps {
  id: string
  clientName: string
  service: string
  time: string
  status?: 'pending' | 'completed' | 'no-show'
  onDelete: (id: string, clientName: string) => void
  onClick?: () => void
}

export default function AppointmentCard({
  clientName,
  service,
  time,
  status = 'pending',
  onDelete,
  id,
  onClick,
}: AppointmentProps) {
  const sendWhatsApp = () => {
    const message = `Hi! This is Glow Nails. Just a reminder for your appointment at ${time}. See you soon! 💅`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  return (
    <m.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="relative bg-white p-5 rounded-3xl border border-salon-pink/50 shadow-sm flex justify-between items-center group mb-4 cursor-pointer"
    >
      <div className="flex gap-4 items-center min-w-0 flex-1">
        {/* Time Circle */}
        <div className="bg-salon-nude p-3 rounded-2xl text-center min-w-[60px] shrink-0">
          <span className="text-xs font-bold text-salon-accent block uppercase leading-none mb-1">
            Time
          </span>
          <span className="text-sm font-bold text-salon-dark">{time}</span>
        </div>

        {/* Client Info */}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-salon-dark text-lg leading-tight truncate">{clientName}</h3>
          <p className="text-gray-400 text-sm font-light truncate">{service}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            sendWhatsApp()
          }}
          className="bg-green-50 p-3 rounded-full text-green-600 hover:bg-green-100 transition-colors"
        >
          <MessageCircle size={20} fill="currentColor" className="opacity-20" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id, clientName)
          }}
          className="bg-red-50 p-3 rounded-full text-red-600 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </m.div>
  )
}
