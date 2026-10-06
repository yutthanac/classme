// @ts-nocheck
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "accent"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
  render?: React.ReactElement
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, render, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const variantStyles = {
      default: "bg-pink-600 text-white hover:bg-pink-700 shadow-xs",
      outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
      ghost: "hover:bg-slate-100 text-slate-700",
      link: "text-pink-600 underline-offset-4 hover:underline",
      accent: "bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200",
    }

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-xs",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-10 rounded-xl px-6 text-sm",
      icon: "h-8 w-8 p-0",
    }

    const classNames = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
      variantStyles[variant] || variantStyles.default,
      sizeStyles[size] || sizeStyles.default,
      className
    )

    if (render) {
      return React.cloneElement(render, {
        className: cn(classNames, render.props.className),
        ref,
        ...props,
      })
    }

    return (
      <Comp
        className={classNames}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
