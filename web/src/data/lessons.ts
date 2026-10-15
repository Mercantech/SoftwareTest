import type { Lang } from '../i18n/LanguageContext'

export type LessonModule = 'test' | 'sikkerhed'

export type LessonNavItem = {
  slug: string
  label: Record<Lang, string>
  path: string
}

export type LessonModuleNav = {
  module: LessonModule
  title: Record<Lang, string>
  items: LessonNavItem[]
}

export const lessonModules: LessonModuleNav[] = [
  {
    module: 'test',
    title: { da: 'Test', en: 'Testing' },
    items: [
      { slug: 'oversigt', label: { da: 'Oversigt', en: 'Overview' }, path: '/test/oversigt' },
      { slug: 'unit', label: { da: 'Unit testing', en: 'Unit testing' }, path: '/test/unit' },
      {
        slug: 'integration',
        label: { da: 'Integrationstest', en: 'Integration testing' },
        path: '/test/integration',
      },
      { slug: 'testplan', label: { da: 'Testplan', en: 'Test plan' }, path: '/test/testplan' },
      {
        slug: 'metodikker',
        label: { da: 'Testmetodikker', en: 'Test methodologies' },
        path: '/test/metodikker',
      },
      {
        slug: 'release',
        label: { da: 'Release og kvalitet', en: 'Release and quality' },
        path: '/test/release',
      },
      {
        slug: 'bruno-e2e',
        label: { da: 'Bruno og E2E', en: 'Bruno and E2E' },
        path: '/test/bruno-e2e',
      },
      { slug: 'ci-cd', label: { da: 'CI/CD', en: 'CI/CD' }, path: '/test/ci-cd' },
      {
        slug: 'performance',
        label: { da: 'Performance', en: 'Performance' },
        path: '/test/performance',
      },
      { slug: 'ux', label: { da: 'UX-test', en: 'UX testing' }, path: '/test/ux' },
    ],
  },
  {
    module: 'sikkerhed',
    title: { da: 'Sikkerhed', en: 'Security' },
    items: [
      {
        slug: 'kryptering',
        label: { da: 'Kryptering', en: 'Encryption' },
        path: '/sikkerhed/kryptering',
      },
      {
        slug: 'standarder',
        label: { da: 'Standarder', en: 'Standards' },
        path: '/sikkerhed/standarder',
      },
      {
        slug: 'authentication',
        label: { da: 'Authentication', en: 'Authentication' },
        path: '/sikkerhed/authentication',
      },
      { slug: 'hashing', label: { da: 'Hashing', en: 'Hashing' }, path: '/sikkerhed/hashing' },
      { slug: 'angreb', label: { da: 'Angreb', en: 'Attacks' }, path: '/sikkerhed/angreb' },
      {
        slug: 'tools',
        label: { da: 'Security tools', en: 'Security tools' },
        path: '/sikkerhed/tools',
      },
      { slug: 'gdpr', label: { da: 'GDPR og cookies', en: 'GDPR and cookies' }, path: '/sikkerhed/gdpr' },
    ],
  },
]

export function getModuleNav(module: LessonModule): LessonModuleNav {
  const found = lessonModules.find((m) => m.module === module)
  if (!found) {
    throw new Error(`Ukendt modul: ${module}`)
  }
  return found
}
