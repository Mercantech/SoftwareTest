import type { Lang } from './LanguageContext'

const ui = {
  da: {
    logo: 'Mercantec · Test & sikkerhed',
    navHome: 'Forside',
    navObjectives: 'Målpinde',
    navTest: 'Test',
    navSecurity: 'Sikkerhed',
    navAria: 'Hovednavigation',
    footer: 'Software test og sikkerhed · Mercantec',
    langToggleAria: 'Skift sprog',
    langDa: 'DA',
    langEn: 'EN',
    homeEyebrow: 'Mercantec pensum',
    homeTitle: 'Software test og sikkerhed',
    homeLead:
      'Interaktivt overblik over test, kvalitet og sikkerhed — fra unit tests til CI/CD og web-sikkerhed.',
    homeCtaObjectives: 'Se målpinde',
    homeCtaTest: 'Start med test',
    hubTitle: 'Målpinde',
    hubLead:
      'Alle 15 målpinde for faget softwaretest og sikkerhed (16484). Brug linkene til at hoppe mellem site, Notion og eksempel-repo.',
    hubColId: '#',
    hubColObjective: 'Målpinde',
    hubColLinks: 'Links',
    moduleTest: 'Test',
    moduleSecurity: 'Sikkerhed',
    tocAria: 'Indholdsfortegnelse',
    sidebarAria: 'Lektionsnavigation',
    mermaidExpand: 'Åbn fuldstørrelse',
    mermaidModalTitle: 'Diagram',
    mermaidZoomIn: 'Zoom ind',
    mermaidZoomOut: 'Zoom ud',
    mermaidReset: 'Nulstil',
    mermaidClose: 'Luk',
    mermaidHint: 'Scroll for at zoome · træk for at flytte · Esc for at lukke',
    mermaidLoading: 'Tegner diagram…',
    mermaidError: 'Diagramfejl',
  },
  en: {
    logo: 'Mercantec · Test & security',
    navHome: 'Home',
    navObjectives: 'Objectives',
    navTest: 'Testing',
    navSecurity: 'Security',
    navAria: 'Main navigation',
    footer: 'Software testing and security · Mercantec',
    langToggleAria: 'Switch language',
    langDa: 'DA',
    langEn: 'EN',
    homeEyebrow: 'Mercantec curriculum',
    homeTitle: 'Software testing and security',
    homeLead:
      'An interactive overview of testing, quality and security — from unit tests to CI/CD and web security.',
    homeCtaObjectives: 'View objectives',
    homeCtaTest: 'Start with testing',
    hubTitle: 'Learning objectives',
    hubLead:
      'All 15 learning objectives for software testing and security (16484). Use the links to jump between the site, Notion and example repos.',
    hubColId: '#',
    hubColObjective: 'Objective',
    hubColLinks: 'Links',
    moduleTest: 'Testing',
    moduleSecurity: 'Security',
    tocAria: 'Table of contents',
    sidebarAria: 'Lesson navigation',
    mermaidExpand: 'Open fullscreen',
    mermaidModalTitle: 'Diagram',
    mermaidZoomIn: 'Zoom in',
    mermaidZoomOut: 'Zoom out',
    mermaidReset: 'Reset',
    mermaidClose: 'Close',
    mermaidHint: 'Scroll to zoom · drag to pan · Esc to close',
    mermaidLoading: 'Drawing diagram…',
    mermaidError: 'Diagram error',
  },
} as const

export type UiKey = keyof (typeof ui)['da']

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key]
}
