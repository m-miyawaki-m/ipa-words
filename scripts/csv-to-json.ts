import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface Term {
  id: number
  url: string
  majorCategoryId: string
  minorCategoryId: string
  name: string
  reading: string
  english: string
  category: string
  subcategory: string
  description: string
}

const csvPath = resolve(__dirname, '../output/ap-shiken-terms.csv')
const outPath = resolve(__dirname, '../public/data/terms.json')

const csv = readFileSync(csvPath, 'utf-8')
const lines = csv.split('\n').filter(line => line.trim())
const header = lines[0].replace(/^\uFEFF/, '') // BOM除去
const keys = header.split(',')
console.log('Header columns:', keys)

const terms: Term[] = []

for (let i = 1; i < lines.length; i++) {
  // CSVパース: 最初の8カンマで分割し、残り全部が説明文
  const line = lines[i]
  const parts: string[] = []
  let idx = 0
  for (let col = 0; col < 8; col++) {
    const next = line.indexOf(',', idx)
    parts.push(line.substring(idx, next))
    idx = next + 1
  }
  parts.push(line.substring(idx).replace(/\r$/, '')) // 残り全部が説明文 (CR除去)

  terms.push({
    id: i,
    url: 'AP',
    majorCategoryId: parts[1],
    minorCategoryId: parts[2],
    name: parts[3],
    reading: parts[4],
    english: parts[5],
    category: parts[6],
    subcategory: parts[7],
    description: parts[8],
  })
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(terms, null, 2), 'utf-8')
console.log(`${terms.length} terms written to ${outPath}`)
