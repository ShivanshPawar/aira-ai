export const parseSseFrame = (frame) => {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')

  if (!data) return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}