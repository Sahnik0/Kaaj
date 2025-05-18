"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface RetroBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  backLink?: string
  className?: string
  contentClassName?: string
  headerClassName?: string
  interactive?: boolean
  hoverEffect?: "lift" | "push" | "glow" | "none"
  onClick?: () => void
}

export function RetroBox({
  title,
  backLink,
  children,
  className,
  contentClassName,
  headerClassName,
  interactive = true,
  hoverEffect = "lift",
  onClick,
  ...props
}: RetroBoxProps) {
  const [isPressed, setIsPressed] = useState(false)

  // Interactive handlers
  const handleMouseDown = () => {
    if (interactive) setIsPressed(true)
  }

  const handleMouseUp = () => {
    if (interactive) setIsPressed(false)
  }

  const handleMouseLeave = () => {
    if (interactive) setIsPressed(false)
  }

  const handleClick = () => {
    if (interactive && onClick) onClick()
  }

  // Hover effect classes
  const getHoverClasses = () => {
    if (!interactive) return ""

    switch (hoverEffect) {
      case "lift":
        return "hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      case "push":
        return "hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      case "glow":
        return "hover:shadow-[0px_0px_8px_2px_rgba(255,215,0,0.6)]"
      default:
        return ""
    }
  }

  // Pressed effect classes
  const getPressedClasses = () => {
    if (!interactive) return ""
    return isPressed ? "translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : ""
  }

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] rounded-none p-0 overflow-hidden",
        interactive && "transition-all duration-200 cursor-pointer",
        getHoverClasses(),
        getPressedClasses(),
        className,
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {(title || backLink) && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 border-b-2 border-black dark:border-white bg-yellow-300 dark:bg-yellow-600",
            headerClassName,
          )}
        >
          {backLink && (
            <Link href={backLink} className="p-1 hover:bg-yellow-400 dark:hover:bg-yellow-700 rounded-sm">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          {title && <h3 className="font-bold text-lg">{title}</h3>}
        </div>
      )}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </div>
  )
}
