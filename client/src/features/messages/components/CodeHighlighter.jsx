import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('typescript', typescript)

const codeTheme = {
  'code[class*="language-"]': {
    background: 'transparent',
    color: '#d7d9ce',
    fontFamily: '"DM Mono", Consolas, monospace',
    textShadow: 'none',
  },
  'pre[class*="language-"]': {
    background: 'transparent',
    color: '#d7d9ce',
    textShadow: 'none',
  },
  comment: { color: '#7f897a', fontStyle: 'italic' },
  punctuation: { color: '#c8ccc2' },
  'attr-name': { color: '#f0a57f' },
  'class-name': { color: '#f0a57f' },
  boolean: { color: '#f0a57f' },
  constant: { color: '#f0a57f' },
  number: { color: '#f0a57f' },
  keyword: { color: '#d59bf5' },
  property: { color: '#f58c82' },
  tag: { color: '#f58c82' },
  selector: { color: '#b9d987' },
  string: { color: '#b9d987' },
  char: { color: '#b9d987' },
  builtin: { color: '#b9d987' },
  function: { color: '#79c9f3' },
  variable: { color: '#79c9f3' },
  operator: { color: '#d7d9ce' },
}

const CodeHighlighter = ({ language, code }) => (
  <SyntaxHighlighter customStyle={{ maxWidth: '100%', margin: 0, overflowX: 'auto', overflowWrap: 'normal', padding: '1rem', whiteSpace: 'pre', fontSize: '13px', lineHeight: 1.7, background: '#161815' }} language={language} style={codeTheme} PreTag="div">
    {code}
  </SyntaxHighlighter>
)

export default CodeHighlighter
