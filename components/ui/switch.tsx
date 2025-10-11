"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-[50px] items-center rounded-xl border-2 transition-all duration-200 ease-in-out relative cursor-pointer",
        "data-[state=unchecked]:vintage-anodized-black data-[state=unchecked]:border-[#555] data-[state=unchecked]:vintage-inset-shadow",
        "data-[state=checked]:bg-power-green data-[state=checked]:border-power-green data-[state=checked]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_8px_rgba(50,205,50,0.3)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moog-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full transition-all duration-200 ease-in-out",
          "vintage-chrome-finish vintage-control-shadow",
          "data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }