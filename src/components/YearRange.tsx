type YearRangeProps = {
  releaseYear?: number
  endYear?: number
  className?: string
}

export function YearRange({ releaseYear, endYear, className }: YearRangeProps) {
  if (!releaseYear) {
    return null
  }

  return (
    <span className={className} dir="ltr">
      {endYear && endYear !== releaseYear ? `${releaseYear}–${endYear}` : releaseYear}
    </span>
  )
}
