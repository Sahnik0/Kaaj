"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  titleClassName?: string
  descriptionClassName?: string
}

export function PageHeader({ title, description, children, titleClassName, descriptionClassName }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h1 className={cn("text-3xl font-bold tracking-tight", titleClassName)}>{title}</h1>
        {description && <p className={cn("text-muted-foreground", descriptionClassName)}>{description}</p>}
      </div>
      {children}
    </div>
  )
}
