import { parse, resolve } from 'node:path'
import { globSync, Glob } from 'glob'
import { readFileSync } from 'node:fs'

export function getAlbumsGlob(libraryPath) {
  return new Glob(resolve(libraryPath) + '/*/[0-9][0-9][0-9][0-9] -*', {})
}

export function getPlsGlob(libraryPath, prefixes = []) {
  return new Glob(
    resolve(libraryPath) +
      (prefixes.length ? `/(${prefixes.join('|')})` : '') +
      '/**/pls',
    { nodir: true }
  )
}

export function getPlsPaths(libraryPath, prefixes = []) {
  return globSync(
    prefixes.length
      ? prefixes.map((p) => resolve(libraryPath) + '/' + p + '/**/pls')
      : resolve(libraryPath) + '/**/pls'
  )
}

export function parsePlsFile(plsPath) {
  return readFileSync(plsPath, 'utf8')
    .replaceAll('\r', '')
    .split('\n')
    .filter(Boolean)
    .sort()
}

export function getPlsTracks(plsPath) {
  let tracks = parsePlsFile(plsPath)
  let files = globSync(`${parse(plsPath).dir}/*.{m4a,mp3}`, {
    magicalBraces: true,
    nodir: true,
  }).sort()
  return tracks
    .map((t) => files.find((f) => parse(f).name.startsWith(t)))
    .filter(Boolean)
}

export function ensureLibraryArg(library) {
  if (!library)
    throw new Error(
      `Please either provide <library> as argument or in rc file as LIBRARY`
    )
}
