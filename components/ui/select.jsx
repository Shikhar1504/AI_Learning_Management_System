import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef(({ className, children, onValueChange, defaultValue, ...props }, ref) => {
  const handleChange = (event) => {
    if (onValueChange) {
      onValueChange(event.target.value);
    }
  };

  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      onChange={handleChange}
      defaultValue={defaultValue}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className="w-full" {...props}>
    {children}
  </div>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef(({ placeholder, ...props }, ref) => (
  <option value="" disabled hidden {...props}>
    {placeholder}
  </option>
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <React.Fragment>
    {children}
  </React.Fragment>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => (
  <option
    className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none", className)}
    value={value}
    ref={ref}
    {...props}
  >
    {children}
  </option>
))
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
