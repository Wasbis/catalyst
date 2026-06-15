"use client";

import { useActionState } from "react";
import { promoteTender } from "@/actions/tenderActions";
import Button from "@/components/ui/Button";

const initialState = { error: null };

export default function PromoteButton({ id }) {
  const [state, formAction, pending] = useActionState(async () => {
    const result = await promoteTender(id);
    return { error: result.success ? null : result.error };
  }, initialState);

  return (
    <form action={formAction}>
      <Button type="submit" variant="neutral" size="sm" disabled={pending}>
        {pending ? "Memproses..." : "Promote"}
      </Button>
      {state?.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </form>
  );
}
