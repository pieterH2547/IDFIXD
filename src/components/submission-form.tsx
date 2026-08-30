"use client";

import { useActionState } from "react";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/form-state";

/**
 * The only client component in the app.
 *
 * It exists to show validation errors and a success message without a full
 * reload. `useActionState` degrades correctly: with JavaScript disabled the
 * browser posts the form, the same server action runs, and the page
 * re-renders with the result.
 *
 * Both public forms share it. Which fields appear is driven by `fields`,
 * because a claim and a suggestion differ only in wording and in one hidden
 * value.
 */

export type FieldName =
  | "name"
  | "email"
  | "organisation"
  | "websiteUrl"
  | "message";

type FieldSpec = {
  name: FieldName;
  label: string;
  type?: "text" | "email" | "url" | "textarea";
  required?: boolean;
  hint?: string;
};

export function SubmissionForm({
  action,
  fields,
  listingSlug,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldSpec[];
  listingSlug?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {listingSlug ? (
        <input type="hidden" name="listingSlug" value={listingSlug} />
      ) : null}

      {state.message ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      {fields.map((field) => {
        const error = state.errors[field.name];
        const describedBy = error
          ? `${field.name}-error`
          : field.hint
            ? `${field.name}-hint`
            : undefined;

        return (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="mb-1 block text-sm font-medium"
            >
              {field.label}
              {field.required ? (
                <span aria-hidden="true" className="text-red-700">
                  {" "}
                  *
                </span>
              ) : null}
            </label>

            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                rows={5}
                required={field.required}
                aria-describedby={describedBy}
                aria-invalid={error ? true : undefined}
                className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                aria-describedby={describedBy}
                aria-invalid={error ? true : undefined}
                className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
              />
            )}

            {error ? (
              <p
                id={`${field.name}-error`}
                className="mt-1 text-sm text-red-700"
              >
                {error}
              </p>
            ) : field.hint ? (
              <p
                id={`${field.name}-hint`}
                className="mt-1 text-sm text-[var(--color-ink-muted)]"
              >
                {field.hint}
              </p>
            ) : null}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {pending ? "Versturen…" : submitLabel}
      </button>
    </form>
  );
}
