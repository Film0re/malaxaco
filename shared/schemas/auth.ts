import * as v from "valibot";

const Username = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^[\w.-]{3,32}$/, "Use 3–32 letters, numbers, . _ or -")
);
const NewPassword = v.pipe(
  v.string(),
  v.minLength(8, "At least 8 characters"),
  v.maxLength(128, "At most 128 characters")
);

export const RegisterSchema = v.object({ username: Username, password: NewPassword });

export const LoginSchema = v.object({
  username: v.pipe(v.string(), v.trim(), v.minLength(1, "Required"), v.maxLength(32)),
  password: v.pipe(v.string(), v.minLength(1, "Required"), v.maxLength(128))
});
