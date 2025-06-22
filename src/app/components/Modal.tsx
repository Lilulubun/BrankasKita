import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded shadow-lg p-6 min-w-[250px] text-center relative">
        {children}
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
} 