import { IonApp } from '@ionic/react'
import { IonReactMemoryRouter } from '@ionic/react-router'
import { render, screen } from '@testing-library/react'
import { AppRoutes } from '../../src/App'
import { LocationProbe } from './LocationProbe'

export function renderAt(path: string) {
  return render(
    <IonApp>
      <IonReactMemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <LocationProbe />
      </IonReactMemoryRouter>
    </IonApp>,
  )
}

export function currentPath() {
  return screen.getByTestId('location').textContent
}
