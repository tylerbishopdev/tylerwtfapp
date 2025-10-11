"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-gradient-to-r",
        orientation === "horizontal" && [
          "h-[2px] w-full",
          "from-transparent via-ssl-gray to-transparent",
          "relative",
          "before:absolute before:inset-0 before:h-px before:bg-[#333] before:top-0",
          "after:absolute after:inset-0 after:h-px after:bg-[#666] after:bottom-0"
        ],
        orientation === "vertical" && [
          "h-full w-[2px]",
          "from-transparent via-ssl-gray to-transparent",
          "relative",
          "before:absolute before:inset-0 before:w-px before:bg-[#333] before:left-0",
          "after:absolute after:inset-0 after:w-px after:bg-[#666] after:right-0"
        ],
        className
      )}
      {...props}
    />
  )
}

export { Separator }