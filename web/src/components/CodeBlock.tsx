type CodeBlockProps = {
  language?: string
  children: string
}

export default function CodeBlock({ language, children }: CodeBlockProps) {
  const trimmed = children.replace(/\n$/, '')
  return (
    <pre className="code-block">
      <code className={language ? `language-${language}` : undefined}>
        {trimmed}
      </code>
    </pre>
  )
}
