'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  ClipboardCopy,
  X,
  ChevronDown,
} from 'lucide-react';

export type ImportOptionType = 'file' | 'image' | 'camera' | 'paste';

interface ImportSpeedDialProps {
  onSelectOption: (option: ImportOptionType) => void;
  direction?: 'down' | 'up';
  className?: string;
}

interface SpeedDialItem {
  id: ImportOptionType;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  rotation: number;
}

// Downward arc trajectory: cascading smoothly below button
const ITEMS_DOWN: SpeedDialItem[] = [
  {
    id: 'camera',
    label: 'Camera',
    subLabel: 'ถ่ายรูปสด AI',
    icon: Camera,
    x: -6,
    y: 12,
    rotation: 4,
  },
  {
    id: 'image',
    label: 'Image',
    subLabel: 'รูปภาพใบรายชื่อ',
    icon: ImageIcon,
    x: -16,
    y: 70,
    rotation: 8,
  },
  {
    id: 'file',
    label: 'File',
    subLabel: 'ไฟล์ Excel / CSV',
    icon: FileSpreadsheet,
    x: -28,
    y: 128,
    rotation: 12,
  },
];

const ITEMS_UP: SpeedDialItem[] = [
  {
    id: 'camera',
    label: 'Camera',
    subLabel: 'ถ่ายรูปสด AI',
    icon: Camera,
    x: -6,
    y: -60,
    rotation: -4,
  },
  {
    id: 'image',
    label: 'Image',
    subLabel: 'รูปภาพใบรายชื่อ',
    icon: ImageIcon,
    x: -16,
    y: -120,
    rotation: -8,
  },
  {
    id: 'file',
    label: 'File',
    subLabel: 'ไฟล์ Excel / CSV',
    icon: FileSpreadsheet,
    x: -28,
    y: -180,
    rotation: -12,
  },
];

export default function ImportSpeedDial({
  onSelectOption,
  direction = 'down',
  className = '',
}: ImportSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = direction === 'down' ? ITEMS_DOWN : ITEMS_UP;
  const isDown = direction === 'down';

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionId: ImportOptionType) => {
    setIsOpen(false);
    onSelectOption(optionId);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Floating Options Arc Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div
            className={`absolute ${
              isDown ? 'top-full mt-2' : 'bottom-full mb-2'
            } right-0 z-50 pointer-events-auto`}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: item.x,
                    y: item.y,
                    rotate: item.rotation,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.2,
                    x: 0,
                    y: 0,
                    transition: { duration: 0.15 },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 24,
                    delay: isDown ? index * 0.04 : (items.length - 1 - index) * 0.04,
                  }}
                  className={`absolute ${
                    isDown ? 'top-0' : 'bottom-0'
                  } right-0 flex items-center gap-2.5 whitespace-nowrap cursor-pointer group`}
                  onClick={() => handleSelect(item.id)}
                >
                  {/* Pill Label */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-950 text-white shadow-xl border border-slate-700/70 backdrop-blur-md flex items-center gap-1.5 transition-colors"
                  >
                    <span className="text-xs font-black tracking-wide text-slate-100 group-hover:text-pink-300">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      • {item.subLabel}
                    </span>
                  </motion.div>

                  {/* Circular Action Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-full bg-slate-900/95 hover:bg-pink-600 text-white shadow-xl hover:shadow-pink-500/30 border border-slate-700/70 hover:border-pink-400 flex items-center justify-center transition-all cursor-pointer ring-2 ring-slate-800/40"
                    title={`${item.label} (${item.subLabel})`}
                  >
                    <Icon className="w-5 h-5 text-white transition-transform group-hover:rotate-6" />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
          isOpen
            ? 'bg-slate-900 text-white border border-slate-800 shadow-md ring-2 ring-pink-500/30'
            : 'bg-white hover:bg-pink-50/30 text-slate-700 hover:text-pink-600 border border-slate-200 hover:border-pink-300'
        }`}
        aria-expanded={isOpen}
      >
        {/* Animated Icon morph: UploadCloud <-> X */}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="flex items-center justify-center"
        >
          {isOpen ? (
            <X className="w-4 h-4 text-pink-400" />
          ) : (
            <UploadCloud className="w-4 h-4 text-pink-600" />
          )}
        </motion.div>

        <span>{isOpen ? 'ปิดเมนู' : 'นำเข้ารายชื่อ'}</span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-3.5 h-3.5 ${isOpen ? 'text-pink-400' : 'text-slate-400'}`} />
        </motion.div>
      </motion.button>
    </div>
  );
}
