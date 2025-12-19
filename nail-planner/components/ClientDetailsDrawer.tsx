"use client";

import { Drawer } from "vaul";
import {
  X,
  Phone,
  Clock,
  Calendar,
  StickyNote,
  Image as ImageIcon,
  History,
  Star,
  Loader2,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface ClientDetailsDrawerProps {
  booking: {
    id: any;
    client_name: string;
    client_phone?: string;
    service_type: string;
    appointment_time: string;
    appointment_date: string;
    notes?: string;
    reference_image?: string;
    payment_method?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClientDetailsDrawer({
  booking,
  open,
  onOpenChange,
}: ClientDetailsDrawerProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!open || !booking?.client_name) return;

      setLoadingHistory(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_name", booking.client_name)
        .neq("id", booking.id) // Exclude current booking
        .order("appointment_date", { ascending: false });

      if (!error && data) {
        setHistory(data);
      }
      setLoadingHistory(false);
    };

    fetchHistory();
  }, [open, booking]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 h-[85%] bg-salon-nude rounded-t-[32px] z-[100] outline-none flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Grabber */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />

            {/* Header: Client Info */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <Drawer.Title className="text-3xl font-serif italic text-salon-dark mb-1">
                  {booking.client_name}
                </Drawer.Title>
                <div className="flex items-center gap-2 text-salon-accent text-sm font-bold uppercase tracking-widest">
                  <Star size={14} fill="currentColor" />
                  <span>VIP Client</span>
                </div>
              </div>
              {booking.client_phone && (
                <a
                  href={`tel:${booking.client_phone}`}
                  className="bg-white p-4 rounded-full shadow-sm text-salon-dark hover:bg-salon-accent hover:text-white transition-colors"
                >
                  <Phone size={24} />
                </a>
              )}
            </div>

            {/* Section: Today's Session */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-salon-pink/30 mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Current Session
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-salon-nude/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-salon-accent mb-2">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase">Time</span>
                  </div>
                  <p className="text-lg font-bold text-salon-dark">
                    {booking.appointment_time}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.appointment_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-salon-nude/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-salon-accent mb-2">
                    <Star size={16} />
                    <span className="text-xs font-bold uppercase">Service</span>
                  </div>
                  <p className="text-lg font-bold text-salon-dark">
                    {booking.service_type}
                  </p>
                </div>

                <div className="bg-salon-nude/50 p-4 rounded-2xl col-span-2">
                  <div className="flex items-center gap-2 text-salon-accent mb-2">
                    <CreditCard size={16} />
                    <span className="text-xs font-bold uppercase">Payment</span>
                  </div>
                  <p className="text-lg font-bold text-salon-dark">
                    {booking.payment_method || "N/A"}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <StickyNote size={16} />
                    <span className="text-xs font-bold uppercase">Notes</span>
                  </div>
                  <p className="text-salon-dark text-sm leading-relaxed bg-salon-nude/30 p-4 rounded-2xl italic border border-salon-pink/20">
                    "{booking.notes}"
                  </p>
                </div>
              )}

              {/* Reference Image */}
              {booking.reference_image && (
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <ImageIcon size={16} />
                    <span className="text-xs font-bold uppercase">
                      Reference
                    </span>
                  </div>
                  <div className="relative w-48 aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md">
                    <Image
                      src={booking.reference_image}
                      alt="Nail Reference"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section: Client History */}
            <div className="bg-salon-dark text-white p-6 rounded-3xl relative overflow-hidden min-h-[200px]">
              <div className="absolute top-0 right-0 p-32 bg-salon-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2">
                <History size={14} />
                Client History
              </h3>

              <div className="space-y-6 relative z-10">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin text-salon-accent" />
                  </div>
                ) : history.length > 0 ? (
                  history.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-salon-accent">
                            {record.service_type}
                          </p>
                          <p className="text-xs text-white/60">
                            {new Date(
                              record.appointment_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {new Date(record.appointment_date) > new Date() && (
                          <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full text-white font-bold">
                            UPCOMING
                          </span>
                        )}
                      </div>

                      {record.notes && (
                        <p className="text-xs text-white/80 italic mb-3 line-clamp-2">
                          "{record.notes}"
                        </p>
                      )}

                      {record.reference_image && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 mt-2">
                          <Image
                            src={record.reference_image}
                            alt="Past Reference"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/40 italic text-center py-4">
                    No previous history found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
