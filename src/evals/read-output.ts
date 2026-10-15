export function readEvalOutput(output: unknown): { text: string; tools: string[] } {
  const tools = new Set<string>()
  const texts: string[] = []

  const visit = (value: unknown, inAssistant: boolean) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      for (const item of value) visit(item, inAssistant)
      return
    }
    const record = value as Record<string, unknown>
    const assistant = inAssistant || record.role === 'assistant'
    if (typeof record.toolName === 'string') {
      const explicit =
        record.type === 'tool-call' || record.type === 'tool-invocation' || record.type === 'tool-result'
      const invocation = typeof record.toolCallId === 'string' || record.state === 'result' || record.state === 'call'
      if (explicit || invocation) tools.add(record.toolName)
    }
    if (assistant && record.type === 'text' && typeof record.text === 'string') {
      texts.push(record.text)
    }
    for (const child of Object.values(record)) visit(child, assistant)
  }

  visit(output, false)
  return { text: [...new Set(texts)].join('\n'), tools: [...tools] }
}
