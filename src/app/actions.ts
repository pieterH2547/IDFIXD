"use server";

import { prisma } from "@/lib/db";
import { submissionSchema, type SubmissionKind } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

/**
 * The only two writes the public site performs.
 *
 * Server actions rather than `/api/*` routes: no fetch wrapper, no JSON
 * envelope, no second place for the validation to live, and the forms keep
 * working without JavaScript. The trade is that these are only callable
 * from this app, which is exactly the scope wanted.
 *
 * Storing a submission is all that happens. No email is sent, no account is
 * created, nothing is verified. Read them with `npm run db:studio` — see
 * docs/ARCHITECTURE.md on why there is no admin UI.
 *
 * Note that `FormState` and `EMPTY_FORM_STATE` live in
 * `src/lib/form-state.ts`, not here: a `"use server"` module may only
 * export async functions, because every export becomes a callable endpoint.
 */

async function submit(
  kind: SubmissionKind,
  formData: FormData,
): Promise<FormState> {
  const parsed = submissionSchema.safeParse({
    kind,
    listingSlug: str(formData.get("listingSlug")),
    name: str(formData.get("name")) ?? "",
    email: str(formData.get("email")) ?? "",
    organisation: str(formData.get("organisation")) ?? "",
    websiteUrl: str(formData.get("websiteUrl")) ?? "",
    message: str(formData.get("message")) ?? "",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return { ok: false, message: "Controleer de velden hieronder.", errors };
  }

  await prisma.submission.create({ data: parsed.data });

  return {
    ok: true,
    message: "Bedankt — uw bericht is binnen. We nemen contact op.",
    errors: {},
  };
}

export async function submitClaim(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return submit("CLAIM", formData);
}

export async function submitSuggestion(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return submit("SUGGESTION", formData);
}

function str(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" ? value : undefined;
}
