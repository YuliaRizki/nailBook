"use client";

import { Drawer } from "vaul";
import { toast } from "sonner";
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
  ChevronDown,
  Pencil,
  Check,
  Banknote,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";

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
    price?: number;
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
  const [paymentMethod, setPaymentMethod] = useState(booking?.payment_method || "N/A");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  useEffect(() => {
    setPaymentMethod(booking?.payment_method || "N/A");
  }, [booking?.payment_method, booking?.id]);

  const handlePaymentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMethod = e.target.value;
    setPaymentMethod(newMethod);
    setIsUpdatingPayment(true);
    
    const { error } = await supabase
      .from("appointments")
      .update({ payment_method: newMethod })
      .eq("id", booking.id);
      
    if (error) {
      toast.error("Failed to update payment");
      setPaymentMethod(booking?.payment_method || "N/A");
    } else {
      toast.success("Payment updated to " + newMethod);
      if (booking) {
        booking.payment_method = newMethod; // update parent optimistically
      }
    }
    
    setIsUpdatingPayment(false);
  };

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editName, setEditName] = useState(booking?.client_name || "");
  const [editPhone, setEditPhone] = useState(booking?.client_phone || "");
  const [isSavingClient, setIsSavingClient] = useState(false);

  useEffect(() => {
    if (!isEditingClient) {
      setEditName(booking?.client_name || "");
      setEditPhone(booking?.client_phone || "");
    }
  }, [booking?.client_name, booking?.client_phone, isEditingClient]);

  const handleSaveClient = async () => {
    if (!editName.trim()) {
      toast.error("Client name cannot be empty");
      return;
    }

    setIsSavingClient(true);
    // Update all appointments with the old client name to the new one
    // This updates the current session AND the history!
    const { error } = await supabase
      .from("appointments")
      .update({ client_name: editName, client_phone: editPhone })
      .eq("client_name", booking.client_name);

    if (error) {
      toast.error("Failed to update client details");
    } else {
      toast.success("Client details updated");
      if (booking) {
        booking.client_name = editName; // Optimistic update
        booking.client_phone = editPhone;
      }
      setIsEditingClient(false);
      // Also refresh the history since client details changed
      fetchHistory();
    }
    setIsSavingClient(false);
  };

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

  const [editingHistoryId, setEditingHistoryId] = useState<any>(null);
  const [editHistoryNote, setEditHistoryNote] = useState("");
  const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);

  const startEditHistory = (record: any) => {
    setEditingHistoryId(record.id);
    setEditHistoryNote(record.notes || "");
  };

  const cancelEditHistory = () => {
    setEditingHistoryId(null);
    setEditHistoryNote("");
  };

  const handleSaveHistory = async (id: any) => {
    setIsUpdatingHistory(true);
    const { error } = await supabase
      .from("appointments")
      .update({ notes: editHistoryNote })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update history note");
    } else {
      toast.success("History note updated");
      setHistory((prev) =>
        prev.map((r) => (r.id === id ? { ...r, notes: editHistoryNote } : r))
      );
      setEditingHistoryId(null);
    }
    setIsUpdatingHistory(false);
  };

  const [isEditingSession, setIsEditingSession] = useState(false);
  const [sessionData, setSessionData] = useState({
    time: booking?.appointment_time || "",
    date: booking?.appointment_date || "",
    service: booking?.service_type || "",
    notes: booking?.notes || "",
    price: booking?.price ? booking.price.toString() : "",
  });
  const [isSavingSession, setIsSavingSession] = useState(false);

  useEffect(() => {
    if (!isEditingSession) {
      setSessionData({
        time: booking?.appointment_time || "",
        date: booking?.appointment_date || "",
        service: booking?.service_type || "",
        notes: booking?.notes || "",
        price: booking?.price ? booking.price.toString() : "",
      });
    }
  }, [booking, isEditingSession]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setSessionData((prev) => ({ ...prev, price: numericValue }));
  };

  const handleSaveSession = async () => {
    setIsSavingSession(true);
    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_time: sessionData.time,
        appointment_date: sessionData.date,
        service_type: sessionData.service,
        notes: sessionData.notes,
        price: sessionData.price ? Number(sessionData.price) : 0,
      })
      .eq("id", booking.id);

    if (error) {
      toast.error("Failed to update session details");
    } else {
      toast.success("Session details updated");
      if (booking) {
        booking.appointment_time = sessionData.time;
        booking.appointment_date = sessionData.date;
        booking.service_type = sessionData.service;
        booking.notes = sessionData.notes;
        booking.price = sessionData.price ? Number(sessionData.price) : 0;
      }
      setIsEditingSession(false);
    }
    setIsSavingSession(false);
  };

  useEffect(() => {
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
            <div className="flex justify-between items-start mb-8 min-h-[4rem]">
              {isEditingClient ? (
                <div className="flex-1 mr-4 space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-3xl font-serif italic text-salon-dark bg-white/50 border border-salon-pink/40 rounded-xl px-3 py-1 outline-none focus:border-salon-accent"
                    placeholder="Client Name"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="flex-1 text-sm bg-white/50 border border-salon-pink/40 rounded-xl px-3 py-1.5 outline-none focus:border-salon-accent text-salon-dark"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Drawer.Title className="text-3xl font-serif italic text-salon-dark mb-1">
                    {booking.client_name}
                  </Drawer.Title>
                  <div className="flex items-center gap-2 text-salon-accent text-sm font-bold uppercase tracking-widest mt-2">
                    <Star size={14} fill="currentColor" />
                    <span>VIP Client</span>
                  </div>
                  {booking.client_phone && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1 font-medium">
                      <Phone size={12} />
                      {booking.client_phone}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                {isEditingClient ? (
                  <button
                    onClick={handleSaveClient}
                    disabled={isSavingClient}
                    className="bg-salon-accent text-white p-4 rounded-full shadow-md hover:bg-[#c29160] transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {isSavingClient ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
                  </button>
                ) : (
                  <>
                    {booking.client_phone && (
                      <a
                        href={`tel:${booking.client_phone}`}
                        className="bg-white p-4 rounded-full shadow-sm text-salon-dark hover:bg-salon-accent hover:text-white transition-colors border border-salon-pink/20"
                      >
                        <Phone size={24} />
                      </a>
                    )}
                    <button
                      onClick={() => setIsEditingClient(true)}
                      className="bg-white p-4 rounded-full shadow-sm text-salon-dark hover:bg-salon-accent hover:text-white transition-colors border border-salon-pink/20"
                    >
                      <Pencil size={24} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Section: Today's Session */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-salon-pink/30 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Current Session
                </h3>
                {isEditingSession ? (
                  <button onClick={handleSaveSession} disabled={isSavingSession} className="text-salon-accent hover:text-[#c29160] transition-colors p-1">
                    {isSavingSession ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                ) : (
                  <button onClick={() => setIsEditingSession(true)} className="text-gray-400 hover:text-salon-accent transition-colors p-1">
                    <Pencil size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-salon-nude/50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-salon-accent mb-2">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase">Time</span>
                  </div>
                  {isEditingSession ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="time"
                        value={sessionData.time}
                        onChange={(e) => setSessionData(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full text-lg font-bold text-salon-dark bg-white border border-salon-pink/40 rounded-lg px-2 py-1 outline-none"
                      />
                      <input
                        type="date"
                        value={sessionData.date}
                        onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full text-xs text-gray-500 bg-white border border-salon-pink/40 rounded-lg px-2 py-1 outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-salon-dark">
                        {booking.appointment_time}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.appointment_date).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>

                <div className="bg-salon-nude/50 p-4 rounded-2xl relative">
                  <div className="flex items-center gap-2 text-salon-accent mb-2">
                    <Star size={16} />
                    <span className="text-xs font-bold uppercase">Service</span>
                  </div>
                  {isEditingSession ? (
                    <input
                      type="text"
                      value={sessionData.service}
                      onChange={(e) => setSessionData(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full text-lg font-bold text-salon-dark bg-white border border-salon-pink/40 rounded-lg px-2 py-1 outline-none"
                    />
                  ) : (
                    <p className="text-lg font-bold text-salon-dark break-words">
                      {booking.service_type}
                    </p>
                  )}
                </div>

                <div className="bg-salon-nude/50 p-4 rounded-2xl col-span-2 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-salon-accent">
                      <CreditCard size={16} />
                      <span className="text-xs font-bold uppercase">Payment</span>
                    </div>
                    {isUpdatingPayment ? (
                      <Loader2 size={14} className="animate-spin text-salon-accent" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )}
                  </div>
                  <select
                    value={paymentMethod === "N/A" ? "" : paymentMethod}
                    onChange={handlePaymentChange}
                    disabled={isUpdatingPayment}
                    className="w-full text-lg font-bold text-salon-dark bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>

                <div className="bg-salon-nude/50 p-4 rounded-2xl col-span-2 relative">
                  <div className="flex items-center gap-2 text-salon-accent mb-2">
                    <Banknote size={16} />
                    <span className="text-xs font-bold uppercase">Amount</span>
                  </div>
                  {isEditingSession ? (
                    <input
                      type="text"
                      value={sessionData.price ? formatRupiah(Number(sessionData.price)) : ""}
                      onChange={handlePriceChange}
                      placeholder="Rp 0"
                      className="w-full text-lg font-bold text-salon-dark bg-white border border-salon-pink/40 rounded-lg px-2 py-1 outline-none"
                    />
                  ) : (
                    <p className="text-lg font-bold text-salon-dark">
                      {booking.price ? formatRupiah(booking.price) : "Rp 0"}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {(isEditingSession || booking.notes) && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <StickyNote size={16} />
                    <span className="text-xs font-bold uppercase">Notes</span>
                  </div>
                  {isEditingSession ? (
                    <textarea
                      value={sessionData.notes}
                      onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-salon-dark text-sm bg-white border border-salon-pink/40 rounded-2xl px-4 py-3 outline-none resize-none min-h-[80px]"
                      placeholder="Add notes..."
                    />
                  ) : (
                    <p className="text-salon-dark text-sm leading-relaxed bg-salon-nude/30 p-4 rounded-2xl italic border border-salon-pink/20">
                      "{booking.notes}"
                    </p>
                  )}
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
                      className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-salon-accent">
                            {record.service_type}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-white/60">
                              {new Date(
                                record.appointment_date
                              ).toLocaleDateString()}
                            </p>
                            {record.price ? (
                              <>
                                <span className="text-white/30">•</span>
                                <p className="text-xs font-bold text-salon-accent/80">
                                  {formatRupiah(record.price)}
                                </p>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {new Date(record.appointment_date) > new Date() && (
                            <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full text-white font-bold">
                              UPCOMING
                            </span>
                          )}
                          {editingHistoryId === record.id ? (
                            <div className="flex gap-2">
                              <button onClick={cancelEditHistory} className="text-white/60 hover:text-white">
                                <X size={14} />
                              </button>
                              <button onClick={() => handleSaveHistory(record.id)} disabled={isUpdatingHistory} className="text-salon-accent hover:text-white">
                                {isUpdatingHistory ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEditHistory(record)} className="opacity-50 hover:opacity-100 transition-opacity text-white hover:text-salon-accent p-1">
                              <Pencil size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {editingHistoryId === record.id ? (
                        <textarea
                          value={editHistoryNote}
                          onChange={(e) => setEditHistoryNote(e.target.value)}
                          className="w-full text-xs text-white bg-white/10 border border-white/20 rounded-lg p-2 outline-none focus:border-salon-accent resize-none min-h-[60px] italic mb-3"
                          placeholder="Add notes..."
                          autoFocus
                        />
                      ) : record.notes ? (
                        <p className="text-xs text-white/80 italic mb-3 line-clamp-2">
                          "{record.notes}"
                        </p>
                      ) : null}

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
