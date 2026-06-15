import { List, LayoutGrid } from "lucide-react";

const VIEWS = [
  { id: "list", label: "List", icon: List },
  { id: "kanban", label: "Kanban", icon: LayoutGrid },
];

export default function ListKanbanToggle({ currentView, onChange }) {
  return (
    <div className="flex overflow-hidden rounded-[10px] border border-border bg-surface">
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-[13.5px] font-medium transition-colors duration-120 ease-out cursor-pointer ${
            currentView === id ? "bg-accent text-white" : "text-foreground-muted hover:bg-surface-hover"
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
