export const DOMU_SECTIONS = [
  {
    path: "/dom-uchitelya/o-strukturnom-podrazdelenii/",
    title: "О структурном подразделении",
    text: "Сведения о задачах, формате работы и городских педагогических инициативах Дома учителя.",
    icon: "people",
  },
  {
    path: "/dom-uchitelya/meropriyatiya/",
    title: "Мероприятия",
    text: "Анонсы встреч, семинаров, мастер-классов и городских событий для педагогов.",
    icon: "calendar",
  },
  {
    path: "/dom-uchitelya/kontaktnaya-informaciya/",
    title: "Контактная информация",
    text: "Адрес, телефон, режим работы и информация для связи со специалистами подразделения.",
    icon: "clipboard",
  },
];

export const DOMU_LEGACY_REDIRECTS = [
  { from: "/dom-uchitelya/o-dome/", to: "/dom-uchitelya/o-strukturnom-podrazdelenii/" },
  { from: "/dom-uchitelya/programma/", to: "/dom-uchitelya/meropriyatiya/" },
  { from: "/dom-uchitelya/master-klassy/", to: "/dom-uchitelya/meropriyatiya/" },
  { from: "/dom-uchitelya/molodye-pedagogi/", to: "/metodicheskoe-prostranstvo/molodye-specialisty/" },
  { from: "/dom-uchitelya/nastavnichestvo/", to: "/dom-uchitelya/" },
  { from: "/dom-uchitelya/klub-pedagogov/", to: "/dom-uchitelya/" },
  { from: "/dom-uchitelya/pedagogicheskaya-gostinaya/", to: "/dom-uchitelya/" },
  { from: "/dom-uchitelya/konkursy/", to: "/dom-uchitelya/meropriyatiya/" },
  { from: "/dom-uchitelya/itogi/", to: "/dom-uchitelya/meropriyatiya/" },
  { from: "/dom-uchitelya/fotogalereya/", to: "/dom-uchitelya/meropriyatiya/" },
];
