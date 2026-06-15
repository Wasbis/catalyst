import { Search } from "lucide-react";
import Input from "@/components/ui/Input";

export default function SearchInput({ className = "", wrapperClassName = "", ...props }) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
      <Input type="search" className={`pl-9 ${className}`} {...props} />
    </div>
  );
}
