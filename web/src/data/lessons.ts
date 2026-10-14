export type LessonModule = 'test' | 'sikkerhed'

export type LessonNavItem = {
  slug: string
  label: string
  path: string
}

export type LessonModuleNav = {
  module: LessonModule
  title: string
  items: LessonNavItem[]
}

export const lessonModules: LessonModuleNav[] = [
  {
    module: 'test',
    title: 'Test',
    items: [
      { slug: 'oversigt', label: 'Oversigt', path: '/test/oversigt' },
      { slug: 'unit', label: 'Unit testing', path: '/test/unit' },
      { slug: 'integration', label: 'Integrationstest', path: '/test/integration' },
      { slug: 'testplan', label: 'Testplan', path: '/test/testplan' },
      { slug: 'metodikker', label: 'Testmetodikker', path: '/test/metodikker' },
      { slug: 'release', label: 'Release og kvalitet', path: '/test/release' },
      { slug: 'bruno-e2e', label: 'Bruno og E2E', path: '/test/bruno-e2e' },
      { slug: 'ci-cd', label: 'CI/CD', path: '/test/ci-cd' },
      { slug: 'tryk', label: 'Tryktest', path: '/test/tryk' },
      { slug: 'performance', label: 'Performance', path: '/test/performance' },
      { slug: 'ux', label: 'UX-test', path: '/test/ux' },
    ],
  },
  {
    module: 'sikkerhed',
    title: 'Sikkerhed',
    items: [
      { slug: 'kryptering', label: 'Kryptering', path: '/sikkerhed/kryptering' },
      { slug: 'standarder', label: 'Standarder', path: '/sikkerhed/standarder' },
      {
        slug: 'authentication',
        label: 'Authentication',
        path: '/sikkerhed/authentication',
      },
      { slug: 'hashing', label: 'Hashing', path: '/sikkerhed/hashing' },
      { slug: 'angreb', label: 'Angreb', path: '/sikkerhed/angreb' },
      { slug: 'tools', label: 'Security tools', path: '/sikkerhed/tools' },
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
