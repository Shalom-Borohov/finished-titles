export interface Release {
  version: string
  features: string[]
  fixes: string[]
}

export const compareVersions = (first: string, second: string) =>
  first.localeCompare(second, undefined, { numeric: true })

export const newestFirst = (releases: Release[]) =>
  [...releases].sort((first, second) => compareVersions(second.version, first.version))

export function unseenReleases(changelog: Release[], seen: string | null, current: string): Release[] {
  const running = changelog.filter((release) => release.version === current)

  if (running.length === 0) {
    return []
  }

  if (seen === null) {
    return running
  }

  return newestFirst(changelog).filter(
    (release) => compareVersions(release.version, seen) > 0 && compareVersions(release.version, current) <= 0,
  )
}
