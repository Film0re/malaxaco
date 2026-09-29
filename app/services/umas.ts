export async function getCurrentBirthdays(): Promise<CharacterBirthdays> {
  return await $fetch<CharacterBirthdays>("https://umapyoi.net/api/v1/character/currentbirthdays");
}
