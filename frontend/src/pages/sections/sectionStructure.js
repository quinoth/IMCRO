const CONTACT_DEFAULT = {
  title: "Контактная информация",
  text: "По вопросам данного раздела вы можете обратиться в МКУ ИМЦРО. Контактная информация будет уточнена.",
  phone: "+7 (3952) 201-985",
  email: "irk_imcro@bk.ru",
  schedule: "Пн-Пт: 09:00-18:00",
  person: "Ответственный специалист МКУ ИМЦРО",
};

const methodicalDirection = (title, slug, description) => ({
  title,
  path: `/metodicheskoe-prostranstvo/${slug}/`,
  description,
  icon: "book",
});

const METHODICAL_DIRECTIONS = [
  methodicalDirection("Дошкольное образование", "doshkolnoe-obrazovanie", "Материалы для методического сопровождения дошкольных образовательных организаций."),
  methodicalDirection("Начальное общее образование", "nachalnoe-obshchee-obrazovanie", "Методические материалы и сопровождение педагогов начальной школы."),
  methodicalDirection("Дополнительное образование", "dopolnitelnoe-obrazovanie", "Рекомендации, события и материалы для системы дополнительного образования."),
  methodicalDirection("История", "istoriya", "Методическое сопровождение преподавания истории."),
  methodicalDirection("История нашего края", "istoriya-nashego-kraya", "Материалы по региональному историко-культурному содержанию."),
  methodicalDirection("Обществознание", "obshchestvoznanie", "Методические материалы и рекомендации по обществознанию."),
  methodicalDirection("ДНКР", "dnkr", "Сопровождение направления духовно-нравственной культуры России."),
  methodicalDirection("Русский язык", "russkiy-yazyk", "Материалы для преподавателей русского языка."),
  methodicalDirection("Иностранные языки", "inostrannye-yazyki", "Методическое сопровождение преподавания иностранных языков."),
  methodicalDirection("Математика", "matematika", "Материалы для учителей математики и методических объединений."),
  methodicalDirection("Информатика", "informatika", "Методические рекомендации и события по информатике."),
  methodicalDirection("Химия", "himiya", "Материалы для преподавания химии и подготовки обучающихся."),
  methodicalDirection("Биология", "biologiya", "Методическое сопровождение преподавания биологии."),
  methodicalDirection("География", "geografiya", "Материалы, события и рекомендации по географии."),
  methodicalDirection("Байкаловедение", "baykalovedenie", "Региональные материалы и практики по байкаловедению."),
  methodicalDirection("Физкультура", "fizkultura", "Методические материалы по физической культуре."),
  methodicalDirection("ОБЖ", "obzh", "Материалы по основам безопасности жизнедеятельности."),
  methodicalDirection("Технология", "tehnologiya", "Методическое сопровождение предметной области «Технология»."),
  methodicalDirection("Воспитание", "vospitanie", "Практики и материалы по воспитательной работе."),
  methodicalDirection("Психологи", "psihologi", "Материалы для педагогов-психологов образовательных организаций."),
  methodicalDirection("Социальные педагоги", "socialnye-pedagogi", "Справочные и методические материалы для социальных педагогов."),
  methodicalDirection("Молодые специалисты", "molodye-specialisty", "Материалы профессиональной адаптации молодых специалистов."),
];

const RAW_SECTION_TREE = [
  {
    title: "ТПМПК",
    path: "/tpmpk/",
    icon: "psychology",
    description: "Документы, состав комиссии и нормативная база для прохождения ПМПК.",
    contact: {
      title: "ТПМПК г. Иркутска",
      text: "Для записи и уточнения порядка прохождения комиссии используйте телефон ТПМПК.",
      phone: "+7 (3952) 48-12-56",
      email: "irk_imcro@bk.ru",
      schedule: "Пн-Пт: 09:00-17:00",
      person: "Секретарь территориальной ПМПК",
    },
    children: [
      {
        title: "Перечень документов для прохождения ПМПК",
        path: "/tpmpk/dokumenty/",
        description: "Список документов, заявлений и справок для подготовки к обследованию.",
      },
      {
        title: "Состав территориальной ПМПК",
        path: "/tpmpk/sostav/",
        description: "Информация о специалистах и направлениях работы комиссии.",
      },
      {
        title: "Нормативные документы",
        path: "/tpmpk/npa/",
        description: "Правовые основания, регламенты и официальные документы комиссии.",
      },
    ],
  },
  {
    title: "НОКО",
    path: "/noko/",
    icon: "clipboard",
    description: "Независимая оценка качества образования, ГИА и аналитические материалы.",
    contact: {
      title: "Горячая линия НОКО",
      text: "По вопросам независимой оценки качества образования можно обратиться в рабочее время.",
      phone: "8 (800) 555-35-35",
      email: "irk_imcro@bk.ru",
      schedule: "Пн-Пт: 09:00-18:00",
      person: "Координатор НОКО",
    },
    children: [
      {
        title: "Оперативная информация",
        path: "/noko/operativnaya-informaciya/",
        description: "Официальные сообщения и актуальные изменения по НОКО.",
      },
      {
        title: "ГИА 9 класс",
        path: "/noko/gia-9/",
        description: "Материалы и сопровождение государственной итоговой аттестации в 9 классе.",
        children: [
          {
            title: "Оперативная информация",
            path: "/noko/gia-9/operativnaya-informaciya/",
            description: "Срочные сообщения, графики и организационные обновления.",
          },
          {
            title: "Нормативные документы",
            path: "/noko/gia-9/normativnye-dokumenty/",
            description: "Приказы, письма, регламенты и официальные требования.",
          },
          {
            title: "Методическое сопровождение",
            path: "/noko/gia-9/metodicheskoe-soprovozhdenie/",
            description: "Рекомендации, консультации и материалы для подготовки.",
          },
          {
            title: "Для участников с ОВЗ",
            path: "/noko/gia-9/dlya-uchastnikov-s-ovz/",
            description: "Порядок и условия прохождения ГИА для участников с ОВЗ.",
          },
        ],
      },
      {
        title: "ГИА 11 (12) класс",
        path: "/noko/gia-11/",
        description: "Материалы и сопровождение итоговой аттестации выпускников 11 и 12 классов.",
        children: [
          {
            title: "Оперативная информация",
            path: "/noko/gia-11/operativnaya-informaciya/",
            description: "Актуальные объявления, сроки и организационные обновления.",
          },
          {
            title: "Нормативные документы",
            path: "/noko/gia-11/normativnye-dokumenty/",
            description: "Официальные документы, регламенты и требования текущего года.",
          },
          {
            title: "Методическое сопровождение",
            path: "/noko/gia-11/metodicheskoe-soprovozhdenie/",
            description: "Методические материалы, консультации и рекомендации экспертов.",
          },
          {
            title: "Для участников с ОВЗ",
            path: "/noko/gia-11/dlya-uchastnikov-s-ovz/",
            description: "Условия, документы и сопровождение участников с ОВЗ.",
          },
        ],
      },
      {
        title: "Сборники и альманахи",
        path: "/noko/sborniki/",
        description: "Электронные сборники, альманахи и аналитические материалы НОКО.",
      },
    ],
  },
  {
    title: "Молодые педагоги",
    path: "/molodye-pedagogi/",
    icon: "spark",
    description: "Профессиональная поддержка, городское сообщество и полезные материалы для молодых специалистов.",
    children: [
      {
        title: "Совет молодых педагогов города Иркутска",
        path: "/molodye-pedagogi/sovet-molodyh-pedagogov/",
        description: "Работа совета, инициативы и городские встречи молодых педагогов.",
      },
      {
        title: "Полезная информация для молодых педагогов",
        path: "/molodye-pedagogi/poleznaya-informaciya/",
        description: "Рекомендации, материалы адаптации и ответы на частые вопросы.",
      },
    ],
  },
  {
    title: "Курсы повышения квалификации",
    path: "/kpk/",
    icon: "certificate",
    description: "Курсы повышения квалификации и мониторинг профессиональных дефицитов педагогов.",
    children: [
      {
        title: "Список курсов повышения квалификации",
        path: "/kpk/spisok-kursov-povysheniya-kvalifikacii/",
        description: "Актуальные программы повышения квалификации педагогических работников.",
      },
      {
        title: "Мониторинг профессиональных дефицитов педагогических работников города",
        path: "/kpk/monitoring-professionalnyh-deficitov/",
        description: "Материалы мониторинга, аналитика и рекомендации по развитию компетенций.",
      },
    ],
  },
  {
    title: "Предметные области",
    path: "/predmetnye-oblasti/",
    icon: "book",
    description: "Методические материалы, ГМС, события и конкурсы по предметным направлениям.",
    children: [
      {
        title: "Новости / события",
        path: "/predmetnye-oblasti/novosti-sobytiya/",
        description: "Актуальные новости и события предметных направлений.",
      },
      {
        title: "ГМС",
        path: "/predmetnye-oblasti/gms/",
        description: "Материалы городских методических сообществ и заседаний.",
      },
      {
        title: "Методические материалы",
        path: "/predmetnye-oblasti/metodicheskie-materialy/",
        description: "Подборки, рекомендации и практические материалы для педагогов.",
      },
      {
        title: "Конференции, вебинары, семинары, мастер-классы",
        path: "/predmetnye-oblasti/konferencii-vebinary-seminary-master-klassy/",
        description: "Профессиональные события и материалы для обмена опытом.",
      },
      {
        title: "Олимпиады, конкурсы",
        path: "/predmetnye-oblasti/olimpiady-konkursy/",
        description: "Предметные олимпиады, конкурсы и материалы сопровождения.",
      },
    ],
  },
  {
    title: "Наставничество",
    path: "/nastavnichestvo/",
    icon: "people",
    description: "Документы, новости и сервис поиска наставника для педагогов.",
    children: [
      {
        title: "Нормативные документы",
        path: "/nastavnichestvo/normativnye-dokumenty/",
        description: "Регламенты, положения и документы системы наставничества.",
      },
      {
        title: "Найти наставника",
        path: "/nastavnichestvo/nayti-nastavnika/",
        description: "Информация для педагогов, которым нужна наставническая поддержка.",
      },
      {
        title: "Новости / события",
        path: "/nastavnichestvo/novosti-sobytiya/",
        description: "Актуальные события, встречи и практики наставничества.",
      },
    ],
  },
  {
    title: "НСУ СКИП",
    path: "/nsu-skip/",
    icon: "science",
    description: "Основная информация и новости направления НСУ СКИП.",
    children: [
      {
        title: "Основная информация",
        path: "/nsu-skip/osnovnaya-informaciya/",
        description: "Цели, задачи, документы и справочная информация направления.",
      },
      {
        title: "Новости / события",
        path: "/nsu-skip/novosti-sobytiya/",
        description: "Новости, объявления и материалы событий НСУ СКИП.",
      },
    ],
  },
  {
    title: "Конкурсы",
    path: "/konkursy/",
    icon: "award",
    description: "Конкурсы для детей и профессиональные конкурсы для педагогов.",
    children: [
      {
        title: "Для детей",
        path: "/konkursy/dlya-detey/",
        description: "Конкурсные направления, положения и результаты для обучающихся.",
      },
      {
        title: "Для педагогов",
        path: "/konkursy/dlya-pedagogov/",
        description: "Профессиональные конкурсы, положения и итоги для педагогов.",
        children: [
          {
            title: "Конкурсы методических разработок",
            path: "/konkursy/dlya-pedagogov/konkursy-metodicheskih-razrabotok/",
            description: "Материалы и положения конкурсов методических разработок.",
          },
          {
            title: "«Новая волна»",
            path: "/konkursy/dlya-pedagogov/novaya-volna/",
            description: "Информация о конкурсе, этапах участия и итогах.",
          },
          {
            title: "«Сердце отдаю детям»",
            path: "/konkursy/dlya-pedagogov/serdce-otdayu-detyam/",
            description: "Материалы конкурса педагогов дополнительного образования.",
          },
          {
            title: "Лучший педагог / воспитатель ДОУ",
            path: "/konkursy/dlya-pedagogov/luchshiy-pedagog-vospitatel-dou/",
            description: "Положения, сроки и результаты конкурса для педагогов ДОУ.",
          },
          {
            title: "«Учитель года»",
            path: "/konkursy/dlya-pedagogov/uchitel-goda/",
            description: "Материалы конкурса профессионального мастерства педагогов.",
          },
          {
            title: "«Урок в формате ФГОС-3.0»",
            path: "/konkursy/dlya-pedagogov/urok-v-formate-fgos-3-0/",
            description: "Конкурсные материалы и методические разработки уроков.",
          },
        ],
      },
    ],
  },
  {
    title: "Олимпиады для детей",
    path: "/olimpiady-dlya-detey/",
    icon: "graduation",
    description: "Всероссийские, муниципальные и региональные олимпиады для обучающихся.",
    children: [
      {
        title: "Всероссийская олимпиада школьников",
        path: "/olimpiady-dlya-detey/vserossiyskaya-olimpiada-shkolnikov/",
        description: "Этапы, документы и результаты Всероссийской олимпиады школьников.",
        children: [
          {
            title: "Школьный этап",
            path: "/olimpiady-dlya-detey/vserossiyskaya-olimpiada-shkolnikov/shkolnyy-etap/",
            description: "Информация, графики и материалы школьного этапа.",
          },
          {
            title: "Муниципальный этап",
            path: "/olimpiady-dlya-detey/vserossiyskaya-olimpiada-shkolnikov/municipalnyy-etap/",
            description: "Документы, графики и итоги муниципального этапа.",
          },
          {
            title: "Результаты",
            path: "/olimpiady-dlya-detey/vserossiyskaya-olimpiada-shkolnikov/rezultaty/",
            description: "Протоколы, списки участников и итоговые материалы.",
          },
        ],
      },
      {
        title: "Муниципальные и региональные олимпиады",
        path: "/olimpiady-dlya-detey/municipalnye-i-regionalnye-olimpiady/",
        description: "Информация о муниципальных и региональных олимпиадных направлениях.",
        children: [
          {
            title: "Муниципальные олимпиады",
            path: "/olimpiady-dlya-detey/municipalnye-i-regionalnye-olimpiady/municipalnye-olimpiady/",
            description: "Положения, сроки и результаты муниципальных олимпиад.",
          },
          {
            title: "Региональные олимпиады",
            path: "/olimpiady-dlya-detey/municipalnye-i-regionalnye-olimpiady/regionalnye-olimpiady/",
            description: "Материалы и результаты региональных олимпиад.",
          },
        ],
      },
    ],
  },
  {
    title: "Конференции для детей",
    path: "/konferencii-dlya-detey/",
    icon: "calendar",
    description: "Муниципальные, региональные и всероссийские конференции для обучающихся.",
    children: [
      {
        title: "Муниципальные конференции",
        path: "/konferencii-dlya-detey/municipalnye-konferencii/",
        description: "Городские конференции для обучающихся по различным направлениям.",
        children: [
          {
            title: "«Ступеньки открытий»",
            path: "/konferencii-dlya-detey/municipalnye-konferencii/stupenki-otkrytiy/",
            description: "Материалы конференции исследовательских и проектных работ.",
          },
          {
            title: "«Эврика»",
            path: "/konferencii-dlya-detey/municipalnye-konferencii/evrika/",
            description: "Положения, сроки и итоги конференции «Эврика».",
          },
          {
            title: "«Открытый мир»",
            path: "/konferencii-dlya-detey/municipalnye-konferencii/otkrytyy-mir/",
            description: "Материалы конференции для представления детских исследований.",
          },
          {
            title: "«Юность. Творчество. Поиск»",
            path: "/konferencii-dlya-detey/municipalnye-konferencii/yunost-tvorchestvo-poisk/",
            description: "Информация о конференции, секциях и результатах.",
          },
          {
            title: "«Удивительная Вселенная»",
            path: "/konferencii-dlya-detey/municipalnye-konferencii/udivitelnaya-vselennaya/",
            description: "Материалы конференции естественно-научной направленности.",
          },
        ],
      },
      {
        title: "Региональные конференции",
        path: "/konferencii-dlya-detey/regionalnye-konferencii/",
        description: "Региональные конференции, положения и итоговые материалы.",
        children: [
          {
            title: "«Тайны психологии»",
            path: "/konferencii-dlya-detey/regionalnye-konferencii/tayny-psihologii/",
            description: "Материалы региональной конференции «Тайны психологии».",
          },
        ],
      },
      {
        title: "Всероссийские конференции",
        path: "/konferencii-dlya-detey/vserossiyskie-konferencii/",
        description: "Информация о всероссийских конференциях и участии обучающихся.",
      },
    ],
  },
  {
    title: "Образовательная программа",
    path: "/obrazovatelnaya-programma/",
    icon: "compass",
    description: "Конференции, совещания, панорамы и форумы образовательной программы.",
    children: [
      {
        title: "Конференции РАО",
        path: "/obrazovatelnaya-programma/konferencii-rao/",
        description: "Материалы и информационное сопровождение конференций РАО.",
      },
      {
        title: "Августовские педагогические совещания",
        path: "/obrazovatelnaya-programma/avgustovskie-pedagogicheskie-soveshchaniya/",
        description: "Программы, материалы и итоги августовских совещаний.",
      },
      {
        title: "Образовательная панорама",
        path: "/obrazovatelnaya-programma/obrazovatelnaya-panorama/",
        description: "Материалы образовательной панорамы и городских площадок.",
      },
      {
        title: "Образовательный форум",
        path: "/obrazovatelnaya-programma/obrazovatelnyy-forum/",
        description: "Информация, программа и материалы образовательного форума.",
      },
    ],
  },
  {
    title: "Полезная информация",
    path: "/poleznaya-informaciya/",
    icon: "shield",
    description: "Важные информационные материалы для пользователей сайта.",
    children: [
      {
        title: "Осторожно, мошенники!",
        path: "/poleznaya-informaciya/ostorozhno-moshenniki/",
        description: "Памятки, предупреждения и рекомендации по защите от мошенничества.",
      },
    ],
  },
  {
    title: "Дом учителя",
    path: "/dom-uchitelya/",
    icon: "people",
    description: "Городская площадка профессионального общения, мероприятий и методической поддержки педагогов.",
  },
  {
    title: "Деятельность",
    path: "/deyatelnost/",
    icon: "compass",
    description: "Проекты и направления деятельности МКУ ИМЦРО для сопровождения муниципальной системы образования.",
  },
  {
    title: "Методическое пространство",
    path: "/metodicheskoe-prostranstvo/",
    icon: "book",
    description: "Предметные и профессиональные направления методического сопровождения педагогов.",
    children: METHODICAL_DIRECTIONS,
  },
  {
    title: "Инновационная деятельность",
    path: "/innovacionnaya-deyatelnost/",
    icon: "spark",
    description: "Инновационные практики, проектные инициативы и сопровождение развития образовательных организаций.",
  },
  {
    title: "Воспитательное пространство",
    path: "/vospitatelnoe-prostranstvo/",
    icon: "people",
    description: "Материалы, события и практики по воспитательной работе в образовательных организациях.",
  },
  {
    title: "Муниципальный семейный клуб «ФамилиЯ»",
    path: "/municipalnyy-semeynyy-klub-familiya/",
    icon: "people",
    description: "Информационная страница муниципального семейного клуба «ФамилиЯ».",
  },
];

function normalizeNode(node, parent = null) {
  const normalized = {
    ...node,
    path: normalizePath(node.path),
    parentPath: parent?.path || "",
    parentTitle: parent?.title || "",
    rootPath: parent?.rootPath || normalizePath(node.path),
    rootTitle: parent?.rootTitle || node.title,
    level: parent ? parent.level + 1 : 1,
    contact: node.contact || (parent?.level ? undefined : CONTACT_DEFAULT),
  };

  normalized.children = (node.children || []).map((child) => normalizeNode(child, normalized));
  return normalized;
}

export function normalizePath(path) {
  if (!path) return "/";
  const cleanPath = String(path).split("#")[0].split("?")[0] || "/";
  return cleanPath === "/" ? "/" : cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;
}

export const SECTION_TREE = RAW_SECTION_TREE.map((node) => normalizeNode(node));

export function flattenSectionTree(tree = SECTION_TREE) {
  return tree.flatMap((node) => [node, ...flattenSectionTree(node.children || [])]);
}

export const SECTION_PAGE_ROUTES = flattenSectionTree(SECTION_TREE).map((node) => ({
  path: node.path,
  node,
}));

export const SECTION_HOME_CARDS = SECTION_TREE.map((node) => ({
  title: node.title,
  description: node.description,
  href: node.path,
  icon: node.icon,
}));

export function findSectionByPath(path) {
  const target = normalizePath(path);
  return flattenSectionTree(SECTION_TREE).find((node) => node.path === target) || null;
}

export function getSectionBreadcrumbItems(node) {
  if (!node) return [{ label: "Главная", to: "/" }];
  const flat = flattenSectionTree(SECTION_TREE);
  const chain = [];
  let current = node;
  while (current) {
    chain.unshift(current);
    current = current.parentPath ? flat.find((item) => item.path === current.parentPath) : null;
  }

  return [
    { label: "Главная", to: "/" },
    ...chain.map((item, index) => (
      index === chain.length - 1
        ? { label: item.title }
        : { label: item.title, to: item.path }
    )),
  ];
}

export function getRootSection(node) {
  if (!node) return null;
  return SECTION_TREE.find((section) => section.path === node.rootPath) || node;
}
