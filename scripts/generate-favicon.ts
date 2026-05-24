import sharp from 'sharp'
import path from 'path'

async function generateFavicon() {
  const logoPath = path.join(process.cwd(), 'public/logo-removebg-preview.png')
  const outputPath = path.join(process.cwd(), 'app/icon.png')

  const size = 512
  const logoSize = 400

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize)
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 250, g: 208, b: 220, alpha: 1 }
    }
  })
  .composite([{
    input: logo,
    left: Math.floor((size - logoSize) / 2),
    top: Math.floor((size - logoSize) / 2)
  }])
  .png()
  .toFile(outputPath)

  console.log('✅ icon.png created')
}

generateFavicon()
