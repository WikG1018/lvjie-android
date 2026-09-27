// 抽样与分章冒烟
import { sampleBookChunks, splitChapters } from '../app/js/engine/book-ingest.js'

const chaps = []
for (let i = 1; i <= 50; i++) {
  chaps.push(`第${i}章 标题\n这是正文内容，介绍力量体系与地点。人物在对话。`.repeat(12))
}
const text = chaps.join('\n\n')
const parts = splitChapters(text)
const s = sampleBookChunks(text)
console.log('chapters', parts.length, 'samples', s.samples.length, 'chars', s.totalChars)
if (parts.length < 40) throw new Error('chapter detect got ' + parts.length)
if (s.samples.length < 5 || s.samples.length > 10) throw new Error('sample count ' + s.samples.length)
// 无章节长文
const plain = '字'.repeat(50000)
const s2 = sampleBookChunks(plain)
if (!s2.samples.length) throw new Error('plain sample')
console.log('INGEST_OK')
