"use client";

import { Drawer } from "vaul";
import {
  Plus,
  X,
  Calendar,
  Clock,
  User,
  ChevronDown,
  Phone,
  StickyNote,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Appointment {
  id: number;
  name: string;
  service: string;
  time: string;
}

interface AddAppointmentDrawerProps {
  onAdd: (appointment: Appointment) => void;
}

export default function AddAppointmentDrawer({
  onAdd,
}: AddAppointmentDrawerProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [service, setService] = useState("Gel Manicure");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA")); // 🔥 Correct local date
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBooking = async () => {
    if (!name || !time) return alert("Please fill in all fields!");

    setUploading(true);
    let imageUrl = null;

    // 1. Upload Image (if exists)
    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("reference_images")
        .upload(fileName, image);

      if (uploadError) {
        setUploading(false);
        // We warn but don't stop the booking if image fails, or arguably we should stop.
        // Let's stop to be safe so they know image didn't go through.
        return alert("Image upload failed: " + uploadError.message);
      }

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("reference_images")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    // 2. GET USER ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      return alert("You must be logged in to book an appointment.");
    }

    // 3. Insert Appointment
    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          client_name: name,
          client_phone: phone,
          service_type: service,
          appointment_time: time,
          appointment_date: date,
          notes: notes,
          reference_image: imageUrl, // 🔥 Save the URL
          payment_method: paymentMethod,
          user_id: user.id, // 🔥 Link to current user
        },
      ])
      .select();

    setUploading(false);

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      // Success: Reset and Close
      setName("");
      setPhone("");
      setNotes("");
      setImage(null);
      setTime("");
      setService("Gel Manicure");
      setPaymentMethod("Cash");
      setDate(new Date().toLocaleDateString("en-CA"));
      setOpen(false); // Close the drawer
      alert("Appointment saved! ✨");
    }
  };
  return (
    <Drawer.Root shouldScaleBackground open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        {/* We replace the static Plus button in page.tsx with this trigger */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 bg-salon-dark text-white p-4 rounded-full shadow-xl z-50"
        >
          <Plus size={24} />
        </motion.button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-salon-nude flex flex-col rounded-t-[32px] h-[96%] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none">
          <div className="p-4 bg-white rounded-t-[32px] flex-1 overflow-y-auto">
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
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder="e.g. Selena Gomez"
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors"
                    />
                    <User
                      className="absolute right-4 top-[55%] -translate-y-1/2 text-salon-accent pointer-events-none opacity-50"
                      size={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                    {["Cash", "QRIS", "Transfer"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                          paymentMethod === method
                            ? "bg-salon-accent text-white border-salon-accent shadow-lg shadow-salon-accent/20"
                            : "bg-salon-nude/30 border-salon-pink/30 text-salon-dark hover:bg-salon-pink/20"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">
                    Appointment Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onClick={(e) =>
                        (e.target as HTMLInputElement).showPicker?.()
                      }
                      className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none focus:border-salon-accent transition-colors cursor-pointer"
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
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onClick={(e) =>
                          (e.target as HTMLInputElement).showPicker?.()
                        }
                        className="w-full mt-2 p-4 rounded-2xl border border-salon-pink/30 bg-salon-nude/30 outline-none cursor-pointer"
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
                          <span className="truncate max-w-[150px]">
                            {image.name}
                          </span>
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
                    "Confirm Appointment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
