import Button from "@/components/ui/Button";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="mx-auto flex max-w-80 flex-col items-center py-12 text-center">
      {Icon && <Icon size={40} className="mb-2 text-foreground-subtle" strokeWidth={1.5} />}
      <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-[13px] text-foreground-muted leading-relaxed line-clamp-2">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
