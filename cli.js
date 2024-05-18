#!/usr/bin/env node

import { program } from 'commander'
import { resolve } from 'node:path'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import rc from 'rc'

import {
  ensureLibraryArg,
  getAlbumsGlob,
  getPlsGlob,
  getPlsPaths,
  getPlsTracks,
  parsePlsFile,
} from './utils.js'

const NAME = 'pls'
const config = rc(NAME)

program.name(NAME)

program
  .command('init')
  .description('Installs an rc file')
  .action(async (_options) => {
    let rcTarget = resolve(process.env.HOME, `.${NAME}rc`)
    writeFileSync(rcTarget, 'LIBRARY=\nPLAYLIST=\nOUTPUT=', {
      encoding: 'utf8',
    })
    console.log(`✅ rc successfully written to: ${rcTarget}`)
  })

program
  .command('info')
  .description('Displays rc configuration')
  .action(async (_library, _options) => {
    let { LIBRARY, PLAYLIST, OUTPUT } = config
    console.table({ LIBRARY, PLAYLIST, OUTPUT })
  })

program
  .command('add')
  .description('Populates library with empty `pls` files where missing')
  .argument('[library]', 'Path to library', config.LIBRARY)
  .action(async (library, _options) => {
    ensureLibraryArg(library)
    let albums = getAlbumsGlob(library)
    let logs = []
    for await (const album of albums) {
      let plsPath = `${album}/pls`
      if (existsSync(plsPath)) continue
      writeFileSync(plsPath, '', { encoding: 'utf8' })
      logs.push({
        artist: album.split('/').at(-2),
        album: album.split('/').at(-1).slice(7),
        status: 'written',
      })
    }
    console.table(logs)
  })

program
  .command('prune')
  .description('Removes empty `pls` files from library')
  .argument('[library]', 'Path to library', config.LIBRARY)
  .action(async (library, _options) => {
    ensureLibraryArg(library)
    console.log({ library })
    let albums = getAlbumsGlob(library)
    let logs = []
    for await (const album of albums) {
      let plsPath = `${album}/pls`
      if (!existsSync(plsPath)) continue
      if (statSync(plsPath).size > 0) continue
      rmSync(plsPath)
      logs.push({
        artist: album.split('/').at(-2),
        album: album.split('/').at(-1).slice(7),
        status: 'removed',
      })
    }
    console.table(logs)
  })

program
  .command('list')
  .description('Lists existing `pls` information')
  .argument('[library]', 'Path to library', config.LIBRARY)
  .action(async (library, _options) => {
    ensureLibraryArg(library)
    let pls = getPlsGlob(library)
    let logs = []
    for await (const plsPath of pls) {
      if (statSync(plsPath).size === 0) continue
      let pls = parsePlsFile(plsPath)
      logs.push({
        artist: plsPath.split('/').at(-3),
        album: plsPath.split('/').at(-2).slice(7),
        tracks: pls.join(', '),
      })
    }
    console.table(
      logs.sort((a, b) =>
        `${a.artist} ${a.album}`.localeCompare(`${b.artist} ${b.album}`)
      )
    )
  })

program
  .command('format')
  .description('Formats existing `pls`')
  .argument('[library]', 'Path to library', config.LIBRARY)
  .action(async (library, _options) => {
    ensureLibraryArg(library)
    let pls = getPlsGlob(library)
    for await (const plsPath of pls) {
      if (statSync(plsPath).size === 0) continue
      let pls = parsePlsFile(plsPath)
      writeFileSync(plsPath, pls.join('\n'), 'utf8')
    }
  })

program
  .command('generate')
  .description('Generates M3U playlists')
  .argument('[library]', 'Path to library', config.LIBRARY)
  .option('-c <playlist>', 'Path to playlist JSON map', config.PLAYLIST)
  .option('-o <folder>', 'Playlists output folder', config.OUTPUT)
  .option(
    '-p <playlist>, --playlist <playlist>',
    'Specific playlist to be generated from the config'
  )
  .action(async (library, { o, c, p }) => {
    ensureLibraryArg(library)
    let playlists = JSON.parse(readFileSync(c, 'utf8'))
    let entries = Object.entries(playlists)
    console.log(`📖 Using playlist: '${resolve(c)}'`)

    if (p) {
      console.log(`📖 Filter: ${p}`)
      entries = [entries.find(([playlist]) => playlist === p)].filter(Boolean)
    }

    for (const [playlist, prefixes] of entries) {
      let tracks = getPlsPaths(library, prefixes)
        .sort((a, b) => (a.split('/').at(-2) < b.split('/').at(-2) ? 1 : -1))
        .flatMap(getPlsTracks)

      mkdirSync(resolve(o), { recursive: true })
      writeFileSync(resolve(o, `${playlist}.m3u`), tracks.join('\n'), 'utf8')
      console.log(
        `✅ ${playlist}: ${tracks.length} tracks written to "${resolve(o, `${playlist}.m3u`)}"`
      )
    }
  })

program.parse()
