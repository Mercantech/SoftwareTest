import { useMemo } from 'react'
import { highlightCode } from '../lib/highlight'

type CodeBlockProps = {
  language?: string
  children: string
}

export default function CodeBlock({ language, children }: CodeBlockProps) {
  const { html, language: label } = useMemo(
    () => highlightCode(children, language),
    [children, language],
  )

  return (
    <div className="code-block-wrap">
      {label ? <span className="code-block__lang">{label}</span> : null}
      <pre className="code-block">
        <code
          className={label ? `hljs language-${label}` : 'hljs'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  )
}
