# pls

A simple playlist manager

## What

Considering a lossless music collection (personally owned vinyls, CDs digitalized), a [music library tag manager](https://beets.io/) and a [music player](https://support.apple.com/guide/music/welcome/mac), I wanted to have a tag-, meta- and filename independent way of tracking my (mostly artist-based) playlists. As I update the tags, meta, content, add new items to the collection, filenames usually get out of sync with the player's database, leading to missing tracks in internal playlists.
This utility solves these dependencies by requiring small `pls` files to be colocated with each album (besides the individual audio files), containing the indices of the tracks that are supposed to be present on any/some playlists.
Based on these locally stored indices, M3U playlists are always safe to be regenerated and simply synchronized in any kind of music player application.

## Usage

Not yet published on NPM, so now the package needs manual cloning, install and global linking:

```
git clone https://github.com/imrea/pls pls
cd pls
pnpm i
npm link
```

Then an RC file can be created:

```
pls init
```

The created config should be populated with your preferences

`pls` is now ready to work with your library and pls files.
