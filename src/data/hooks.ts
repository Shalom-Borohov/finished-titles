import { useLiveQuery } from 'dexie-react-hooks'
import { allEntries } from './repo'

export function useAllEntries() {
  return useLiveQuery(allEntries)
}
