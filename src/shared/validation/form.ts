import { z } from "zod";

/** Field-level errors keyed by input name, plus an optional form-level message. */
export type FormErrors = Record<string, string[] | undefined>;
export type FormState = { ok: boolean; message?: string; errors?: FormErrors };

export const initialFormState: FormState = { ok: false };

/** Convert FormData into a plain object. Keys listed in `arrays` use getAll(). */
export function formDataToObject(fd: FormData, arrays: readonly string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    out[key] = arrays.includes(key) ? fd.getAll(key) : fd.get(key);
  }
  for (const key of arrays) if (!(key in out)) out[key] = [];
  return out;
}

export function fieldErrors(error: z.ZodError): FormErrors {
  return z.flattenError(error).fieldErrors as FormErrors;
}

/** HTML checkbox: present ("on"/"true") → true, absent → false. */
export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** Empty string → undefined, so optional inputs behave. */
export const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const optionalHttpsUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .url({ protocol: /^https$/, error: "Enter a full https:// link" })
    .max(500)
    .optional(),
);

/** Menu images must live in our Vercel Blob store (the only host next/image allows). */
export const optionalImageUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .url({ protocol: /^https$/, hostname: /\.public\.blob\.vercel-storage\.com$/, error: "Upload the image again" })
    .max(500)
    .optional(),
);

export const optionalInt = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce
      .number({ error: `${label} must be a whole number` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be ${max} or less`)
      .optional(),
  );

export const requiredInt = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} must be a whole number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be ${max} or less`);

export const id = z.string().min(1).max(64);
