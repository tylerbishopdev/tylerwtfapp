import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold transition-all duration-200",
    {
        variants: {
            variant: {
                default: "bg-moog-orange text-black",
                secondary: "bg-neve-champagne text-api-black",
                destructive: "bg-peak-red text-white",
                outline: "text-foreground border border-current",
                success: "bg-power-green text-black shadow-[0_0_6px_rgba(50,205,50,0.5)]",
                warning: "bg-warning-amber text-black shadow-[0_0_6px_rgba(255,176,0,0.5)]",
                signal: "bg-signal-orange text-black shadow-[0_0_6px_rgba(255,140,0,0.5)]",
                ready: "bg-ready-blue text-white shadow-[0_0_6px_rgba(30,144,255,0.5)]",
                vintage: "bg-ssl-gray text-white",
            },
            size: {
                default: "h-5 text-[10px]",
                sm: "h-4 text-[9px] px-1",
                lg: "h-6 text-[11px] px-2",
                indicator: "h-3 w-3 p-0 rounded-full",
            },
            pulse: {
                true: "animate-pulse",
                false: "",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            pulse: false,
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, pulse, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, size, pulse }), className)} {...props} />
    )
}

export { Badge, badgeVariants }