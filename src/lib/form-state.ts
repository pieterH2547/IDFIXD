/**
 * The shape a form action returns.
 *
 * This lives outside `src/app/actions.ts` because a `"use server"` module
 * may only export async functions — every other export becomes a callable
 * server endpoint, so Next rejects the file outright. The type is erased at
 * compile time and would be fine; `EMPTY_FORM_STATE` is a real object and
 * is not.
 */
export type FormState = {
  ok: boolean;
  message: string;
  /** Field name → first error. Empty when `ok`. */
  errors: Record<string, string>;
};

export const EMPTY_FORM_STATE: FormState = {
  ok: false,
  message: "",
  errors: {},
};
