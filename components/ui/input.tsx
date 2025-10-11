import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "w-full px-3 py-2.5 vintage-font-technical text-xs text-api-black bg-white border-2 border-[#ccc] rounded-[3px] vintage-inset-shadow transition-all duration-200 ease-in-out",
                    "focus:outline-none focus:border-ready-blue focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_0_0_2px_rgba(30,144,255,0.2)]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "placeholder:text-ssl-gray placeholder:opacity-70",
                    "file:border-0 file:bg-transparent file:text-xs file:font-medium",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }