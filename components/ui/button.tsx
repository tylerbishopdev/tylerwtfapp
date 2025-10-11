import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center px-4 py-2 font-bold text-[11px] uppercase tracking-[0.5px] border-2 border-transparent rounded transition-all duration-150 ease-in-out relative select-none cursor-pointer active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    {
        variants: {
            variant: {
                default: "vintage-chrome-finish text-api-black border-ssl-gray vintage-control-shadow hover:border-moog-orange hover:shadow-[0_0_8px_rgba(255,107,53,0.3)]",
                destructive: "vintage-anodized-black text-foreground border-peak-red vintage-control-shadow hover:bg-[#333] hover:shadow-[0_0_8px_rgba(255,0,0,0.3)]",
                outline: "bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_8px_rgba(70,130,180,0.3)]",
                secondary: "bg-neve-champagne text-api-black border-ssl-gray vintage-control-shadow hover:border-moog-orange hover:shadow-[0_0_8px_rgba(255,107,53,0.3)]",
                ghost: "text-foreground hover:bg-ssl-gray/20 hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
                success: "bg-power-green text-black border-power-green vintage-control-shadow hover:shadow-[0_0_8px_rgba(50,205,50,0.3)]",
                warning: "bg-warning-amber text-black border-warning-amber vintage-control-shadow hover:shadow-[0_0_8px_rgba(255,176,0,0.3)]",
            },
            size: {
                default: "h-10 px-4",
                sm: "h-8 px-3 text-[10px]",
                lg: "h-12 px-6 text-[12px]",
                icon: "h-10 w-10 p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }