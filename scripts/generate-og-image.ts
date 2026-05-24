import sharp from 'sharp'
import path from 'path'

async function generateOgImage() {
  const logoPath = path.join(process.cwd(), 'public/logo.png')
  const outputPath = path.join(process.cwd(), 'public/og-image.jpg')

  const width = 1200
  const height = 630
  const logoSize = 400

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize)
    .toBuffer()

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 250, g: 208, b: 220 }
    }
  })
  .composite([{
    input: logo,
    left: Math.floor((width - logoSize) / 2),
    top: Math.floor((height - logoSize) / 2)
  }])
  .jpeg({ quality: 90 })
  .toFile(outputPath)

  console.log('✅ og-image.jpg created')
}

generateOgImage()
