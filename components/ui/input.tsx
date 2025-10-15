import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <div className="space-y-2">

                <input type={type}
                    className={cn(
                        "flex h-auto w-full rounded-md border time-counter border-input input-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    {...props}
                /><div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="h-2 w-2 animate-pulse bg-primary" />
                </div>
            </div>

        )
    }
)
Input.displayName = "Input"

export { Input }
