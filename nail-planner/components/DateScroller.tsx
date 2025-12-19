"use client";

import { useState } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { motion } from "framer-motion";

interface DateScrollerProps {
  onDateChange: (date: Date) => void;
}

export default function DateScroller({ onDateChange }: DateScrollerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSelect = (day: Date) => {
    setSelectedDate(day);
    onDateChange(day); // Tell the home page which day was clicked
  };

  // Generate next 7 days
  const days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);

        return (
          <button
            key={day.toString()}
            onClick={() => handleSelect(day)}
            className="relative flex flex-col items-center min-w-[60px] py-3 outline-none"
          >
            <span
              className={`text-xs uppercase font-medium ${
                isSelected ? "text-salon-dark" : "text-gray-400"
              }`}
            >
              {format(day, "EEE")}
            </span>
            <span
              className={`text-lg font-bold ${
                isSelected ? "text-salon-dark" : "text-gray-400"
              }`}
            >
              {format(day, "d")}
            </span>

            {/* The Framer Motion "Active" Dot */}
            {isSelected && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 w-1.5 h-1.5 bg-salon-accent rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
