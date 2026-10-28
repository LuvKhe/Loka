import { AVATAR_MAX_LENGTH } from '@loka/shared/validation'

const SIZE = 256

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image could not be read'))
    }
    img.src = url
  })
}

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image')
  if (file.size > 20 * 1024 * 1024) throw new Error('That image is too large')

  const img = await loadImage(file)
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  if (!side) throw new Error('That image could not be read')

  const sx = (img.naturalWidth - side) / 2
  const sy = (img.naturalHeight - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser cannot process images')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE)

  let quality = 0.85
  let out = canvas.toDataURL('image/jpeg', quality)
  while (out.length > AVATAR_MAX_LENGTH - 2000 && quality > 0.4) {
    quality -= 0.1
    out = canvas.toDataURL('image/jpeg', quality)
  }
  if (out.length > AVATAR_MAX_LENGTH) throw new Error('That image is too detailed. Try another photo.')
  return out
}
