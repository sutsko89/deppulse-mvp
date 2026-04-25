/**
 * Dependency parsers for various package managers.
 * Supported: npm (package-lock.json, package.json), pip (requirements.txt), composer (composer.lock)
 */

import type { OsvPackage } from '@/lib/osv/client'

export interface ParseResult {
  packages: OsvPackage[]
  ecosystem: string
  lockfileType: string
}

/**
 * Parse package-lock.json (npm) — primary lock format
 */
export function parsePackageLockJson(content: string): OsvPackage[] {
  const lock = JSON.parse(content)
  const packages: OsvPackage[] = []

  // npm lockfile v2/v3: packages object
  if (lock.packages) {
    for (const [key, value] of Object.entries(lock.packages as Record<string, { version?: string; dev?: boolean }>)) {
      if (!key || key === '' || !value.version) continue
      const name = key.startsWith('node_modules/')
        ? key.slice('node_modules/'.length)
        : key
      if (!name) continue
      packages.push({
        name,
        version: value.version,
        ecosystem: 'npm',
      })
    }
  } else if (lock.dependencies) {
    // v1 fallback
    for (const [name, dep] of Object.entries(lock.dependencies as Record<string, { version?: string }>)) {
      if (!dep.version) continue
      packages.push({ name, version: dep.version, ecosystem: 'npm' })
    }
  }

  return packages
}

/**
 * Parse package.json dependencies (fallback when no lockfile)
 */
export function parsePackageJson(content: string): OsvPackage[] {
  const pkg = JSON.parse(content)
  const packages: OsvPackage[] = []
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  for (const [name, version] of Object.entries(deps as Record<string, string>)) {
    // Strip semver range operators
    const cleanVersion = version.replace(/^[\^~>=<]+/, '').split(' ')[0]
    if (!cleanVersion || cleanVersion.includes('*')) continue
    packages.push({ name, version: cleanVersion, ecosystem: 'npm' })
  }

  return packages
}

/**
 * Parse requirements.txt (pip)
 */
export function parseRequirementsTxt(content: string): OsvPackage[] {
  const packages: OsvPackage[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue

    // package==version or package>=version
    const match = trimmed.match(/^([A-Za-z0-9_.-]+)[>=<!~]+=?([A-Za-z0-9._-]+)/)
    if (match) {
      packages.push({
        name: match[1].toLowerCase(),
        version: match[2],
        ecosystem: 'PyPI',
      })
    }
  }

  return packages
}

/**
 * Parse composer.lock (PHP)
 */
export function parseComposerLock(content: string): OsvPackage[] {
  const lock = JSON.parse(content)
  const packages: OsvPackage[] = []

  const allPkgs = [...(lock.packages ?? []), ...(lock['packages-dev'] ?? [])]
  for (const pkg of allPkgs) {
    if (!pkg.name || !pkg.version) continue
    const version = pkg.version.replace(/^v/, '')
    packages.push({ name: pkg.name, version, ecosystem: 'Packagist' })
  }

  return packages
}

/**
 * Parse go.sum (Go)
 */
export function parseGoSum(content: string): OsvPackage[] {
  const packages: OsvPackage[] = []
  const seen = new Set<string>()

  for (const line of content.split('\n')) {
    const parts = line.trim().split(' ')
    if (parts.length < 2) continue
    const [module, versionWithHash] = parts
    const version = versionWithHash.split('/')[0].replace(/^v/, '')
    const key = `${module}@${version}`
    if (seen.has(key)) continue
    seen.add(key)
    packages.push({ name: module, version, ecosystem: 'Go' })
  }

  return packages
}

/**
 * Auto-detect and parse by filename.
 */
export function parseByFilename(filename: string, content: string): ParseResult {
  const name = filename.toLowerCase().split('/').pop() ?? filename

  if (name === 'package-lock.json') {
    return { packages: parsePackageLockJson(content), ecosystem: 'npm', lockfileType: 'package-lock.json' }
  }
  if (name === 'package.json') {
    return { packages: parsePackageJson(content), ecosystem: 'npm', lockfileType: 'package.json' }
  }
  if (name === 'requirements.txt') {
    return { packages: parseRequirementsTxt(content), ecosystem: 'PyPI', lockfileType: 'requirements.txt' }
  }
  if (name === 'composer.lock') {
    return { packages: parseComposerLock(content), ecosystem: 'Packagist', lockfileType: 'composer.lock' }
  }
  if (name === 'go.sum') {
    return { packages: parseGoSum(content), ecosystem: 'Go', lockfileType: 'go.sum' }
  }

  throw new Error(`Unsupported lockfile: ${filename}`)
}
