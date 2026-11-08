import { useLocation } from 'react-router-dom'

export function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>
}
