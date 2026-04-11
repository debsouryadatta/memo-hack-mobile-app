import { throwAppError } from "./errors";

/** Keep under Convex doc limits and reject absurd / abusive payloads. */
export const USER_FIELD_LIMITS = {
  emailMax: 320,
  passwordMin: 8,
  passwordMax: 128,
  nameMax: 120,
  phoneMax: 32,
  classMax: 64,
  imageUrlMax: 2048,
  searchTermMax: 200,
} as const;

function assertMaxLen(field: string, value: string, max: number): void {
  if (value.length > max) {
    throwAppError(
      "INVALID_INPUT",
      `${field} must be at most ${max} characters`,
    );
  }
}

function assertMinLen(field: string, value: string, min: number): void {
  if (value.length < min) {
    throwAppError(
      "INVALID_INPUT",
      `${field} must be at least ${min} characters`,
    );
  }
}

export function validateSignupFields(args: {
  email: string;
  password: string;
  name: string;
  phone: string;
  image?: string;
  class: string;
}): void {
  assertMaxLen("Email", args.email, USER_FIELD_LIMITS.emailMax);
  assertMinLen("Password", args.password, USER_FIELD_LIMITS.passwordMin);
  assertMaxLen("Password", args.password, USER_FIELD_LIMITS.passwordMax);
  assertMaxLen("Name", args.name, USER_FIELD_LIMITS.nameMax);
  assertMaxLen("Phone", args.phone, USER_FIELD_LIMITS.phoneMax);
  assertMaxLen("Class", args.class, USER_FIELD_LIMITS.classMax);
  if (args.image !== undefined) {
    assertMaxLen("Image URL", args.image, USER_FIELD_LIMITS.imageUrlMax);
  }
}

export function validateSigninFields(args: {
  email: string;
  password: string;
}): void {
  assertMaxLen("Email", args.email, USER_FIELD_LIMITS.emailMax);
  // Max only: existing accounts may predate current password rules.
  assertMaxLen("Password", args.password, USER_FIELD_LIMITS.passwordMax);
}

export function validatePasswordChange(
  oldPassword: string,
  newPassword: string,
): void {
  assertMaxLen("Current password", oldPassword, USER_FIELD_LIMITS.passwordMax);
  assertMinLen("New password", newPassword, USER_FIELD_LIMITS.passwordMin);
  assertMaxLen("New password", newPassword, USER_FIELD_LIMITS.passwordMax);
}

export function validateOptionalProfilePatch(args: {
  email?: string;
  name?: string;
  phone?: string;
  image?: string;
  class?: string;
}): void {
  if (args.email !== undefined) {
    assertMaxLen("Email", args.email, USER_FIELD_LIMITS.emailMax);
  }
  if (args.name !== undefined) {
    assertMaxLen("Name", args.name, USER_FIELD_LIMITS.nameMax);
  }
  if (args.phone !== undefined) {
    assertMaxLen("Phone", args.phone, USER_FIELD_LIMITS.phoneMax);
  }
  if (args.image !== undefined) {
    assertMaxLen("Image URL", args.image, USER_FIELD_LIMITS.imageUrlMax);
  }
  if (args.class !== undefined) {
    assertMaxLen("Class", args.class, USER_FIELD_LIMITS.classMax);
  }
}

export function validateSearchTerm(searchTerm: string): void {
  assertMaxLen(
    "Search",
    searchTerm,
    USER_FIELD_LIMITS.searchTermMax,
  );
}
