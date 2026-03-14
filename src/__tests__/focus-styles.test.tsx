/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

const SRC_ROOT = path.resolve(__dirname, '../..')

function getAllTsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return getAllTsxFiles(full)
    if (entry.isFile() && entry.name.endsWith('.tsx')) return [full]
    return []
  })
}

const COMPONENTS_DIR = path.join(SRC_ROOT, 'src/components')
const PAGES_DIR = path.join(SRC_ROOT, 'src/pages')
const INDEX_CSS = path.join(SRC_ROOT, 'src/index.css')

describe('Focus styles: class audit', () => {
  const allFiles = [
    ...getAllTsxFiles(COMPONENTS_DIR),
    ...getAllTsxFiles(PAGES_DIR),
  ]

  it('no component or page file contains legacy focus:ring- classes', () => {
    const violations: string[] = []
    for (const file of allFiles) {
      const content = readFileSync(file, 'utf-8')
      if (/\bfocus:ring-/.test(content)) {
        violations.push(path.relative(SRC_ROOT, file))
      }
    }
    expect(violations, `Files with focus:ring-: ${violations.join(', ')}`).toHaveLength(0)
  })

  it('no component or page file contains focus:outline-none', () => {
    const violations: string[] = []
    for (const file of allFiles) {
      const content = readFileSync(file, 'utf-8')
      if (/\bfocus:outline-none\b/.test(content)) {
        violations.push(path.relative(SRC_ROOT, file))
      }
    }
    expect(violations, `Files with focus:outline-none: ${violations.join(', ')}`).toHaveLength(0)
  })

  it('no component or page file contains focus:border- classes', () => {
    const violations: string[] = []
    for (const file of allFiles) {
      const content = readFileSync(file, 'utf-8')
      if (/\bfocus:border-/.test(content)) {
        violations.push(path.relative(SRC_ROOT, file))
      }
    }
    expect(violations, `Files with focus:border-: ${violations.join(', ')}`).toHaveLength(0)
  })
})

describe('Focus styles: CSS rules present in index.css', () => {
  const css = readFileSync(INDEX_CSS, 'utf-8')

  it('index.css contains :focus-visible outline rule', () => {
    expect(css).toContain(':focus-visible')
  })

  it('index.css contains :focus:not(:focus-visible) suppression rule', () => {
    expect(css).toContain(':focus:not(:focus-visible)')
  })
})
