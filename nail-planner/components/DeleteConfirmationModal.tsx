"use client";

import { useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  clientName,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-salon-pink/20"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                  <AlertTriangle className="text-red-500 w-8 h-8" />
                </div>

                <h3 className="text-xl font-serif italic text-salon-dark mb-2">
                  Delete Appointment?
                </h3>

                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-bold text-salon-dark">
                    {clientName}'s
                  </span>{" "}
                  appointment? This action cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </m.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
