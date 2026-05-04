"use client"

import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border p-4 shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-bottom-5 ${
            toast.variant === "destructive"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "bg-background text-foreground"
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
              {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
              {toast.description && <p className="text-sm opacity-90">{toast.description}</p>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}