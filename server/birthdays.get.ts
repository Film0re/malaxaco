import type { CharacterBirthdays } from "~~/shared/types/umas";

export default defineCachedEventHandler(
  async () => {
    return await $fetch<CharacterBirthdays>(
      "https://umapyoi.net/api/v1/character/currentbirthdays",
    );
  },
  {
    maxAge: 60 * 60 * 24,
  },
);
