import { describe, expect, it } from 'vitest'
import { CHANGELOG as APP_CHANGELOG } from '../../src/appUpdate/changelog'
import { type Release, newestFirst, unseenReleases } from '../../src/appUpdate/releases'

const release = (version: string): Release => ({ version, features: [], fixes: [] })

const CHANGELOG = [release('1.2.0'), release('1.10.0'), release('1.3.0'), release('1.2.1')]

const versionsOf = (releases: Release[]) => releases.map((entry) => entry.version)

describe('releases the phone has not seen yet', () => {
  it('lists every release after the last one seen, newest first', () => {
    expect(versionsOf(unseenReleases(CHANGELOG, '1.2.0', '1.10.0'))).toEqual(['1.10.0', '1.3.0', '1.2.1'])
  })

  it('compares versions by number, not as text', () => {
    expect(versionsOf(unseenReleases(CHANGELOG, '1.3.0', '1.10.0'))).toEqual(['1.10.0'])
  })

  it('leaves out releases newer than the running version', () => {
    expect(versionsOf(unseenReleases(CHANGELOG, '1.2.0', '1.3.0'))).toEqual(['1.3.0', '1.2.1'])
  })

  it('is empty once the running version was seen', () => {
    expect(unseenReleases(CHANGELOG, '1.3.0', '1.3.0')).toEqual([])
  })

  it('shows only the running release when nothing was seen before', () => {
    expect(versionsOf(unseenReleases(CHANGELOG, null, '1.3.0'))).toEqual(['1.3.0'])
  })

  it('is empty while the running version has no release, even after an earlier one was seen', () => {
    expect(unseenReleases(CHANGELOG, '1.2.0', '1.3.5')).toEqual([])
  })

  it('is empty after a rollback to a version older than the one seen', () => {
    expect(unseenReleases(CHANGELOG, '1.10.0', '1.3.0')).toEqual([])
  })
})

describe('every release', () => {
  it('is listed newest first', () => {
    expect(versionsOf(newestFirst(CHANGELOG))).toEqual(['1.10.0', '1.3.0', '1.2.1', '1.2.0'])
  })
})

describe('the app changelog', () => {
  it('has a release for the running version', () => {
    expect(versionsOf(APP_CHANGELOG)).toContain(__APP_VERSION__)
  })
})
