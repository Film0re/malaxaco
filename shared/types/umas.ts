export interface BirthdayCharacter {
  birth_day: number;
  birth_month: number;
  game_id: number;
  id: number;
  name_en: string;
  name_jp: string;
  preferred_url: string;
  sns_icon: string;
}

export interface CharacterBirthdays {
  current_birthdays?: BirthdayCharacter[];
  next_birthdays: BirthdayCharacter[];
}
