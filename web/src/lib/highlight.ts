import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import http from 'highlight.js/lib/languages/http'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import nginx from 'highlight.js/lib/languages/nginx'
import powershell from 'highlight.js/lib/languages/powershell'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('css', css)
hljs.registerLanguage('http', http)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('nginx', nginx)
hljs.registerLanguage('powershell', powershell)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('razor', csharp)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('yml', yaml)

const ALIASES: Record<string, string> = {
  html: 'xml',
  razor: 'csharp',
  tsx: 'typescript',
  ts: 'typescript',
  js: 'javascript',
  shell: 'bash',
  sh: 'bash',
  yml: 'yaml',
  text: 'plaintext',
  plain: 'plaintext',
}

export function highlightCode(code: string, language?: string): {
  html: string
  language: string | undefined
} {
  const trimmed = code.replace(/\n$/, '')
  if (!language || language === 'text' || language === 'plain' || language === 'plaintext') {
    return { html: escapeHtml(trimmed), language: undefined }
  }

  const resolved = ALIASES[language] ?? language
  try {
    if (hljs.getLanguage(resolved)) {
      return {
        html: hljs.highlight(trimmed, { language: resolved, ignoreIllegals: true }).value,
        language,
      }
    }
  } catch {
    /* fall through */
  }

  return { html: escapeHtml(trimmed), language }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
