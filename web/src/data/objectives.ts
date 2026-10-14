export type ObjectiveLevel = 'H3' | 'H4'

export type Objective = {
  id: number
  level: ObjectiveLevel
  title: string
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
    title:
      'Lærlingen har en generel viden om metoder og løsninger til at fejl- og funktionsteste en udviklet softwareløsning, samt om løsninger, der kan forbedre sikkerheden på en web-enabled applikation.',
    sitePath: '/test/oversigt',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 2,
    level: 'H3',
    title:
      'Lærlingen kan tilrettelægge en testplan, som indeholder test til funktionelle krav.',
    sitePath: '/test/testplan',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 3,
    level: 'H3',
    title: 'Lærlingen kan anvende forskellige relevante testmetodikker.',
    sitePath: '/test/metodikker',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 4,
    level: 'H3',
    title:
      'Lærlingen kan vurdere, hvornår en software-release er tilstrækkeligt testet.',
    sitePath: '/test/release',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 5,
    level: 'H3',
    title:
      'Lærlingen kan gennemføre en scriptet test på en app- eller webplatform.',
    sitePath: '/test/bruno-e2e',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 6,
    level: 'H4',
    title:
      'Lærlingen kan integrere automatiserede tests i software udviklingscyklussen.',
    sitePath: '/test/ci-cd',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 7,
    level: 'H4',
    title:
      'Lærlingen kan gennemføre en tryktest, hvor performance og krav til hardware medtages.',
    sitePath: '/test/tryk',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 8,
    level: 'H4',
    title:
      'Lærlingen kan aflæse performancetabeller og identificere flaskehalse i et kompliceret system.',
    sitePath: '/test/performance',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 9,
    level: 'H4',
    title:
      'Lærlingen kan redegøre for UX-tests (User Experience), som evaluerer kundeoplevelsen.',
    sitePath: '/test/ux',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 10,
    level: 'H4',
    title:
      'Lærlingen har en generel viden om data-kryptering, og kan anvende krypteringsformer som f.eks. SSL i forbindelse med udvikling af webbaserede applikationer.',
    sitePath: '/sikkerhed/kryptering',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 11,
    level: 'H4',
    title:
      'Lærlingen kan indhente viden omkring softwaresikkerhedsstandarder og kendte sikkerhedshuller i eksisterende software.',
    sitePath: '/sikkerhed/standarder',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
  {
    id: 12,
    level: 'H4',
    title:
      'Lærlingen har en generel viden om authentication og kan udvikle programmer, der anvender authentication.',
    sitePath: '/sikkerhed/authentication',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 13,
    level: 'H4',
    title:
      'Lærlingen har en generel viden om Hashing-kodning, og kan anvende kodningsformer som f.eks. MD5 i forbindelse med udvikling af webbaserede applikationer.',
    sitePath: '/sikkerhed/hashing',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 14,
    level: 'H4',
    title:
      'Lærlingen har en generel viden om forskellige former for hacking angreb, som f.eks. SQL injection og XSS (Cross-Site Scripting), og kan anvende denne viden til at sikre egne udviklede webbaserede applikationer.',
    sitePath: '/sikkerhed/angreb',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_H4_MAGS,
  },
  {
    id: 15,
    level: 'H4',
    title:
      'Lærlingen kan anvende forskellige website security tools til at teste sikkerheden på udviklet software.',
    sitePath: '/sikkerhed/tools',
    notionUrl: NOTION_WEEK,
    repoUrl: REPO_SITE,
  },
]

export function getObjectiveByPath(path: string): Objective | undefined {
  return objectives.find((o) => o.sitePath === path)
}
