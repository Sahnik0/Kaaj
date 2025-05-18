"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import { Alert } from "@/components/retroui/Alert"
import { CheckCircle, Info, X, AlertTriangle } from "lucide-react"

export function RetroToaster() {
  const { toasts, dismiss } = useToast()
  const [exitingToasts, setExitingToasts] = React.useState<string[]>([])
  
  // Function to handle toast dismissal with animation
  const handleDismiss = React.useCallback((id: string) => {
    console.log("Dismissing toast:", id)
    
    // Mark the toast as exiting to trigger animation
    setExitingToasts(prev => [...prev, id])
    
    // Wait for animation to complete before actual dismissal
    setTimeout(() => {
      dismiss(id)
      setExitingToasts(prev => prev.filter(toastId => toastId !== id))
    }, 300) // Match animation duration
  }, [dismiss])
  
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col items-end p-4 space-y-2 max-w-[320px]">
      {toasts.map(({ id, title, description, variant, ...props }) => {
        let icon = <Info className="h-4 w-4 mr-2 flex-shrink-0" />
        let status = "info"
        
        if (variant === "destructive") {
          icon = <X className="h-4 w-4 mr-2 flex-shrink-0" />
          status = "error"
        } else if (variant === "success") {
          icon = <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          status = "success"
        } else if (variant === "warning") {
          icon = <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
          status = "warning"
        }
        
        const isExiting = exitingToasts.includes(id)
        const animationClass = isExiting ? "toast-exit" : "toast-enter"
        
        return (
          <Alert 
            key={id} 
            status={status as any}
            className={`w-full max-w-[280px] flex items-start shadow-lg ${animationClass}`}
            {...props}
          >
            <div className="flex items-start w-full">
              {icon}
              <div className="flex-1 mr-2">
                {title && <Alert.Title className="text-sm font-medium">{title}</Alert.Title>}
                {description && <Alert.Description className="text-xs mt-1">{description}</Alert.Description>}
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(id);
                }}
                className="p-1 rounded-sm opacity-70 hover:opacity-100 hover:bg-black/10 focus:outline-none"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
