import * as v from "valibot";

export const CreateRunSchema = v.object({
  entries: v.pipe(
    v.array(
      v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "Entries can't be empty"),
        v.maxLength(100, "Entries are limited to 100 characters")
      )
    ),
    v.minLength(2, "Add at least two entries"),
    v.maxLength(30, "At most 30 entries")
  )
});

export const RunIdParams = v.object({
  id: v.pipe(v.string(), v.regex(/^\d+$/), v.transform(Number), v.safeInteger(), v.minValue(1))
});

export const PageQuery = v.object({
  page: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^\d+$/),
      v.transform(Number),
      v.safeInteger(),
      v.minValue(1),
      v.maxValue(100_000)
    ),
    "1" // default applies before the pipe, so it's coerced to 1 as well
  )
});
