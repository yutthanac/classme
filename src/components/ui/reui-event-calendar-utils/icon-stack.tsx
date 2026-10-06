// @ts-nocheck
import * as React from "react"
import { cn } from "@/lib/utils"

export function IconStack({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center p-2 rounded-xl bg-slate-100 text-slate-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
