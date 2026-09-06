export const languageSuggestionsByCountry: Record<string, string[]> = {
  Nigeria: ['English', 'Yoruba', 'Igbo', 'Hausa', 'Nigerian Pidgin', 'Efik', 'Ibibio', 'Tiv', 'Kanuri', 'Edo', 'Ijaw', 'Urhobo', 'Itsekiri'],
  Ghana: ['English', 'Twi', 'Ewe', 'Ga', 'Dagbani'],
  Kenya: ['English', 'Swahili', 'Kikuyu', 'Luo', 'Kalenjin'],
  'South Africa': ['English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho', 'Tswana'],
  India: ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Punjabi'],
  Germany: ['German', 'English'],
  Canada: ['English', 'French'],
  'United Kingdom': ['English', 'Welsh', 'Scottish Gaelic'],
  'United States': ['English', 'Spanish'],
  'United Arab Emirates': ['Arabic', 'English', 'Hindi', 'Urdu'],
};

export const globalLanguageSuggestions = [
  'English', 'French', 'Spanish', 'Portuguese', 'Arabic', 'German', 'Italian', 'Dutch', 'Chinese', 'Japanese',
  'Korean', 'Hindi', 'Swahili', 'Turkish', 'Russian', 'Greek', 'Hebrew', 'Polish', 'Thai', 'Vietnamese',
  'Indonesian', 'Malay', 'Persian', 'Ukrainian', 'Romanian', 'Bengali', 'Tamil', 'Telugu', 'Punjabi',
];

export function getLanguageSuggestions(country: string, query: string) {
  const countryLanguages = languageSuggestionsByCountry[country] ?? [];
  const ordered = [...new Set([...countryLanguages, ...globalLanguageSuggestions])];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return ordered.filter((language) => language.toLocaleLowerCase().includes(normalizedQuery)).slice(0, 8);
}
