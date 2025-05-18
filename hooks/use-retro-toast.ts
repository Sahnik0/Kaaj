"use client"

import * as React from "react"
import { toast as originalToast } from "@/hooks/use-toast"
import type { ToastProps } from "@/components/ui/toast"

// Custom RetroUI toast utility that wraps the original toast function
export function useRetroToast() {
  // Map variant names to status for RetroUI
  function mapVariantToStatus(variant?: ToastProps["variant"]) {
    if (variant === "destructive") return "error"
    if (variant === "default") return "info"
    return variant || "info"
  }
  
  const toast = (props: Parameters<typeof originalToast>[0]) => {
    // Add RetroUI specific classes if needed
    return originalToast({
      ...props,
      // Map variant to the corresponding RetroUI status
      className: `retro-toast ${props.className || ""}`
    })
  }
  
  // Add variant-specific helper methods
  toast.error = (props: Omit<Parameters<typeof toast>[0], "variant">) => 
    toast({ ...props, variant: "destructive" })
  
  toast.success = (props: Omit<Parameters<typeof toast>[0], "variant">) => 
    toast({ ...props, variant: "success" })
    
  toast.warning = (props: Omit<Parameters<typeof toast>[0], "variant">) => 
    toast({ ...props, variant: "warning" })
    
  toast.info = (props: Omit<Parameters<typeof toast>[0], "variant">) => 
    toast({ ...props, variant: "default" })
    
  // Return the wrapped toast function and the original useToast return values
  return { toast }
}
