"use client"; // Required for Framer Motion

import AddAppointmentDrawer from "@/components/AddAppointmentDrawer";
import AppointmentCard from "@/components/AppointmentCard";
import CalendarView from "@/components/CalendarView";
import DateScroller from "@/components/DateScroller";
import ClientDetailsDrawer from "@/components/ClientDetailsDrawer"; // Import
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { supabase } from "@/lib/supabase";
import { m } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Plus, CalendarIcon, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null); // State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false); // State
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [allBusyDates, setAllBusyDates] = useState<Date[]>([]);
  const [busyDates, setBusyDates] = useState<Date[]>([]);
  const [allTimeRevenue, setAllTimeRevenue] = useState(0); // All time revenue
  const [userName, setUserName] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 🔒 Auth Check State
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const fetchBusyDates = async () => {
    // Optimization: Only fetch busy dates for relevant range (e.g., +/- 1 year)
    // This prevents downloading thousands of past appointments
    const today = new Date();
    const startObj = new Date(today);
    startObj.setFullYear(today.getFullYear() - 1);
    const endObj = new Date(today);
    endObj.setFullYear(today.getFullYear() + 1);

    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_date")
      .gte("appointment_date", startObj.toISOString().split("T")[0])
      .lte("appointment_date", endObj.toISOString().split("T")[0]);

    if (error) {
      console.error("Error fetching busy dates:", error.message);
      return;
    }

    if (data) {
      // Adding "T00:00:00" ensures the date stays on the correct day locally
      const dates = data.map((b) => new Date(b.appointment_date + "T00:00:00"));
      setBusyDates(dates);
    }
  };

  const fetchAllTimeRevenue = async () => {
    const { data, error } = await supabase.from("appointments").select("price");

    if (error) {
      console.error("Error fetching total revenue:", error.message);
    } else if (data) {
      const total = data.reduce((acc, curr) => acc + (curr.price || 0), 0);
      setAllTimeRevenue(total);
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. Check User First
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return; // Stop execution if redirecting
      }

      // 2. Set User & Allow Render
      const name =
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Artist";
      setUserName(name);
      setIsAuthChecking(false);

      // 3. Fetch Data
      fetchBusyDates();
      fetchAllTimeRevenue();
    };

    init();
  }, []);

  // 1. Create a function to fetch data
  const fetchBookings = async (date: Date) => {
    setLoading(true);
    // Fix: Use local date string instead of ISO (which is UTC)
    const formattedDate = date.toLocaleDateString("en-CA"); // YYYY-MM-DD

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", formattedDate) // 🔥 Filter by date
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("Error fetching:", error.message);
    } else {
      // Map the database names back to your UI names
      const formattedBookings = data.map((b: any) => ({
        ...b,
        id: b.id,
        name: b.client_name,
        service: b.service_type,
        time: b.appointment_time,
        price: b.price || 0, // 🔥 Map Price
      }));
      setBookings(formattedBookings);
    }
    setLoading(false);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const dailyRevenue = bookings.reduce((acc, booking) => {
    return acc + (booking.price || 0);
  }, 0);

  const handleDelete = (id: string, clientName: string) => {
    setBookingToDelete({ id, name: clientName });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;
    const { id } = bookingToDelete;

    // 1. Optimistic Update: Remove immediately
    const previousBookings = bookings;
    setBookings((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      console.error("Error deleting:", error.message);
      toast.error("Could not delete appointment");
      // 2. Rollback if failed
      setBookings(previousBookings);
    } else {
      toast.success("Client data deleted.");
      // Refresh the gold dots on the calendar
      fetchBusyDates();
      fetchAllTimeRevenue();
    }
  };

  // 2. Run fetch when the page opens
  useEffect(() => {
    fetchBookings(selectedDate);
    fetchBusyDates(); // Initial fetch for the dots
    fetchAllTimeRevenue();

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        () => {
          fetchBookings(selectedDate);
          fetchBusyDates(); // 🔥 This refreshes the dots automatically!
          fetchAllTimeRevenue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const addBooking = (newBooking: any) => {
    setBookings((prev) => [...prev, newBooking]);
  };

  // 🛑 Block render until auth is confirmed
  if (isAuthChecking) {
    return null;
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
          <h1 className="text-3xl font-serif italic text-salon-dark">
            Dai Nail Art
          </h1>
          <p className="text-sm text-gray-400 font-light text-left">
            Thursday, Dec 18
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white p-3 rounded-full shadow-sm border border-salon-pink">
            <Sparkles className="text-salon-accent w-5 h-5" />
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
          {isCalendarOpen ? "Close Calendar" : "Choose Date"}
        </button>
      </div>

      <CalendarView
        selected={selectedDate}
        isOpen={isCalendarOpen}
        onSelect={(date) => {
          if (date) {
            setSelectedDate(date);
            setIsCalendarOpen(false);
          }
        }}
        // Use the state variable here instead of the [new Date...] dummy data
        busyDates={busyDates}
      />

      {/* 1. PLACE THE SCROLLER HERE */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <DateScroller onDateChange={handleDateChange} />
      </m.div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-salon-pink/30">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            Total Clients
          </p>
          <p className="text-2xl font-serif italic text-salon-dark">
            {bookings.length}
          </p>
        </div>
        <div className="bg-salon-accent/10 p-4 rounded-3xl border border-salon-accent/20">
          <p className="text-[10px] uppercase tracking-widest text-salon-accent font-bold">
            Total Revenue
          </p>
          <p className="text-xl font-serif italic text-salon-dark truncate">
            {formatRupiah(allTimeRevenue)}
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
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <AppointmentCard
                id={booking.id}
                clientName={booking.name}
                service={booking.service}
                time={booking.time}
                onDelete={handleDelete}
                onClick={() => {
                  setSelectedBooking(booking);
                  setIsDetailsOpen(true);
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
      <AddAppointmentDrawer onAdd={addBooking} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        clientName={bookingToDelete?.name || ""}
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
  );
}
