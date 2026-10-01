const MAX_FILE_SIZE = 10 * 1024 * 1024
const supportedExtensions = new Set([
  '.avif', '.bmp', '.csv', '.gif', '.heic', '.heif', '.ico', '.jpeg', '.jpg',
  '.log', '.markdown', '.md', '.pdf', '.png', '.svg', '.tif', '.tiff', '.txt',
  '.webp', '.json', '.xml', '.yaml', '.yml',
])
const supportedMimeTypes = new Set([
  'application/pdf', 'application/json', 'application/xml', 'application/yaml',
  'application/x-yaml',
])

export const validateAttachment = (file) => {
  if (!file || file.size === 0) return 'Choose a non-empty file.'
  if (file.size > MAX_FILE_SIZE) return 'Files must be 10 MiB or smaller.'

  const mimeType = file.type.toLowerCase()
  const extension = `.${file.name.split('.').pop().toLowerCase()}`
  const supportedByMime = mimeType.startsWith('image/') || mimeType.startsWith('text/') || supportedMimeTypes.has(mimeType)
  const hasGenericMime = !mimeType || mimeType === 'application/octet-stream'
  const supportedByExtension = supportedExtensions.has(extension)

  if (!supportedByMime && !(hasGenericMime && supportedByExtension)) {
    return 'Supported files are images, PDFs, text, Markdown, JSON, XML, and YAML.'
  }

  return ''
}