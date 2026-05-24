import sharp from 'sharp'
import path from 'path'

async function generateFavicon() {
  const logoPath = path.join(process.cwd(), 'public/logo.png')
  const outputPath = path.join(process.cwd(), 'app/icon.png')

  await sharp(logoPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath)

  console.log('✅ icon.png created')
}

generateFavicon()
