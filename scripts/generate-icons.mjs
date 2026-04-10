import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const cx = size / 2

  // Background
  ctx.fillStyle = '#0F0F1A'
  ctx.fillRect(0, 0, size, size)

  // Draw 5 stacked token circles
  const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF922B']
  const r = size * 0.12
  colors.forEach((color, i) => {
    const y = size * 0.75 - i * r * 1.8
    ctx.beginPath()
    ctx.arc(cx, y, r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = size * 0.015
    ctx.stroke()
  })

  // Label TT at top
  ctx.fillStyle = '#FF6B6B'
  ctx.font = `bold ${size * 0.18}px Arial`
  ctx.textAlign = 'center'
  ctx.fillText('TT', cx, size * 0.2)

  return canvas.toBuffer('image/png')
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', generateIcon(192))
writeFileSync('public/icon-512.png', generateIcon(512))
console.log('✅ Icons generated: public/icon-192.png, public/icon-512.png')
