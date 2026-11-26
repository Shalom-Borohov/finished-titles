export async function inTurns<Item>(
  items: readonly Item[],
  parallel: number,
  task: (item: Item) => Promise<void>,
  signal?: AbortSignal,
) {
  let next = 0

  async function takeTurns() {
    while (next < items.length && !signal?.aborted) {
      const item = items[next]

      next += 1
      await task(item)
    }
  }

  await Promise.all(Array.from({ length: parallel }, takeTurns))
}
