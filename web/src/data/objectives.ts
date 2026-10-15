import type { Lang } from '../i18n/LanguageContext'

export type ObjectiveLevel = 'H3' | 'H4'

export type Objective = {
  id: number
  level: ObjectiveLevel
  title: Record<Lang, string>
  sitePath: string
  notionUrl: string
  repoUrl: string
}

export const NOTION_FAG =
  'https://app.notion.com/p/4cf42c2ac18c472d985facefaadec379'
const NOTION_WEEK =
  'https://app.notion.com/p/308dab5ca23780cb9582f7857e1288af'
const REPO_H4_MAGS = 'https://github.com/Mercantech/h4-mags'
const REPO_SITE = 'https://github.com/Mercantech/SoftwareTest'

export const objectives: Objective[] = [
  {
    id: 1,
    level: 'H3',
    title: {
      da: 'Lærlingen har en generel viden om metoder og løsninger til at fejl- og funktionsteste en udviklet softwareløsning, samt om løsninger, der kan forbedre sikkerheden på en web-enabled applikation.',
      en: 'The apprentice has general knowledge of methods and solutions for fault and functional testing of developed software, and of solutions that can improve security on a web-enabled application.',
    },
    sitePath: '/test/oversigt',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 2,
    level: 'H3',
    title: {
      da: 'Lærlingen kan tilrettelægge en testplan, som indeholder test til funktionelle krav.',
      en: 'The apprentice can prepare a test plan that includes tests for functional requirements.',
    },
    sitePath: '/test/testplan',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 3,
    level: 'H3',
    title: {
      da: 'Lærlingen kan anvende forskellige relevante testmetodikker.',
      en: 'The apprentice can apply various relevant testing methodologies.',
    },
    sitePath: '/test/metodikker',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 4,
    level: 'H3',
    title: {
      da: 'Lærlingen kan vurdere, hvornår en software-release er tilstrækkeligt testet.',
      en: 'The apprentice can assess when a software release is sufficiently tested.',
    },
    sitePath: '/test/release',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 5,
    level: 'H3',
    title: {
      da: 'Lærlingen kan gennemføre en scriptet test på en app- eller webplatform.',
      en: 'The apprentice can carry out a scripted test on an app or web platform.',
    },
    sitePath: '/test/bruno-e2e',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 6,
    level: 'H4',
    title: {
      da: 'Lærlingen kan integrere automatiserede tests i software udviklingscyklussen.',
      en: 'The apprentice can integrate automated tests into the software development lifecycle.',
    },
    sitePath: '/test/ci-cd',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 8,
    level: 'H4',
    title: {
      da: 'Lærlingen kan aflæse performancetabeller og identificere flaskehalse i et kompliceret system.',
      en: 'The apprentice can read performance tables and identify bottlenecks in a complex system.',
    },
    sitePath: '/test/performance',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 9,
    level: 'H4',
    title: {
      da: 'Lærlingen kan redegøre for UX-tests (User Experience), som evaluerer kundeoplevelsen.',
      en: 'The apprentice can explain UX tests (User Experience) that evaluate the customer experience.',
    },
    sitePath: '/test/ux',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 10,
    level: 'H4',
    title: {
      da: 'Lærlingen har en generel viden om data-kryptering, og kan anvende krypteringsformer som f.eks. SSL i forbindelse med udvikling af webbaserede applikationer.',
      en: 'The apprentice has general knowledge of data encryption and can apply forms of encryption such as SSL when developing web-based applications.',
    },
    sitePath: '/sikkerhed/kryptering',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 11,
    level: 'H4',
    title: {
      da: 'Lærlingen kan indhente viden omkring softwaresikkerhedsstandarder og kendte sikkerhedshuller i eksisterende software.',
      en: 'The apprentice can obtain knowledge about software security standards and known vulnerabilities in existing software.',
    },
    sitePath: '/sikkerhed/standarder',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 12,
    level: 'H4',
    title: {
      da: 'Lærlingen har en generel viden om authentication og kan udvikle programmer, der anvender authentication.',
      en: 'The apprentice has general knowledge of authentication and can develop programs that use authentication.',
    },
    sitePath: '/sikkerhed/authentication',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 13,
    level: 'H4',
    title: {
      da: 'Lærlingen har en generel viden om Hashing-kodning, og kan anvende kodningsformer som f.eks. MD5 i forbindelse med udvikling af webbaserede applikationer.',
      en: 'The apprentice has general knowledge of hashing and can apply encoding forms such as MD5 when developing web-based applications.',
    },
    sitePath: '/sikkerhed/hashing',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 14,
    level: 'H4',
    title: {
      da: 'Lærlingen har en generel viden om forskellige former for hacking angreb, som f.eks. SQL injection og XSS (Cross-Site Scripting), og kan anvende denne viden til at sikre egne udviklede webbaserede applikationer.',
      en: 'The apprentice has general knowledge of various forms of hacking attacks, such as SQL injection and XSS (Cross-Site Scripting), and can use this knowledge to secure their own web-based applications.',
    },
    sitePath: '/sikkerhed/angreb',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 15,
    level: 'H4',
    title: {
      da: 'Lærlingen kan anvende forskellige website security tools til at teste sikkerheden på udviklet software.',
      en: 'The apprentice can use various website security tools to test the security of developed software.',
    },
    sitePath: '/sikkerhed/tools',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
]

export function getObjectiveByPath(path: string): Objective | undefined {
  return objectives.find((o) => o.sitePath === path)
}

export function objectiveTitle(objective: Objective, lang: Lang): string {
  return objective.title[lang]
}
