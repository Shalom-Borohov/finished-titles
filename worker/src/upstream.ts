import { type GenericSchema, parse } from 'valibot'

export const PAGE_SIZE = 20

export async function parseUpstreamJson<Output>(
  response: Response,
  schema: GenericSchema<unknown, Output>,
): Promise<Output> {
  if (!response.ok) {
    throw new Error(`Upstream answered ${response.status}`)
  }

  return parse(schema, await response.json())
}

export function isUsableTitle(title: string | null | undefined): title is string {
  return Boolean(title?.trim())
}

export function isPositiveInteger(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}
