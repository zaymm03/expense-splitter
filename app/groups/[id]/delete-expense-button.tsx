"use client";

export default function DeleteExpenseButton({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this expense?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="text-xs text-ink-soft hover:text-owed"
        aria-label="Delete expense"
      >
        Delete
      </button>
    </form>
  );
}