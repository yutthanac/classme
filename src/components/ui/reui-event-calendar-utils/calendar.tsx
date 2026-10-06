// @ts-nocheck
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"
import { cn } from "@/lib/utils"

export type CalendarProps = {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

function Calendar({
  selected,
  onSelect,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(selected || new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weekHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div className={cn("p-3 bg-white rounded-xl shadow-xs border border-slate-100", className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-xs font-bold text-slate-800">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekHeaders.map((h) => (
          <div key={h} className="text-[11px] font-semibold text-slate-400 py-1">
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => {
          const isSelected = selected ? isSameDay(d, selected) : false
          const isCurrent = isSameMonth(d, currentMonth)

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect?.(d)}
              className={cn(
                "h-7 w-7 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-colors cursor-pointer",
                !isCurrent && "text-slate-300",
                isCurrent && !isSelected && "text-slate-700 hover:bg-slate-100",
                isSelected && "bg-pink-600 text-white font-bold shadow-xs"
              )}
            >
              {format(d, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
