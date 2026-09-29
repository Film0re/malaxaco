import { getCurrentBirthdays } from "~/services/umas";

export function useUmaBirthdays() {
  const { data, pending, error } = useAsyncData("character-birthdays", () => getCurrentBirthdays());

  return {
    birthdays: data,
    pending,
    error,
  };
}
