"use client";

import { DayPicker } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import "react-day-picker/dist/style.css";

interface CalendarProps {
  selected: Date;
  onSelect: (date: Date | undefined) => void;
  isOpen: boolean;
  busyDates?: Date[]; // Added this prop
}

export default function CalendarView({
  selected,
  onSelect,
  isOpen,
  busyDates = [],
}: CalendarProps) {
  // Define the "busy" modifier
  const modifiers = {
    busy: busyDates, // This connects the data to the CSS class .rdp-day_busy
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white/60 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-salon-pink/20 p-4 border border-white/50 mb-6"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={onSelect}
            modifiers={{ busy: busyDates }}
            modifiersClassNames={{
              busy: "busy-date", // This forces the class "busy-date" onto these days
            }}
            showOutsideDays
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
