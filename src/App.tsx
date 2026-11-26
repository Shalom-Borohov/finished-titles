import { IonApp, IonRouterOutlet } from '@ionic/react'
import { IonReactHashRouter } from '@ionic/react-router'
import { Navigate, Route } from 'react-router-dom'
import { HOME_PATH } from './navigation/paths'
import { RecoveryBoundary } from './pages/recovery/RecoveryBoundary'
import { Tabs } from './Tabs'

export function AppRoutes() {
  return (
    <IonRouterOutlet>
      <Route path="/tabs/*" element={<Tabs />} />
      <Route path="/" element={<Navigate to={HOME_PATH} replace />} />
    </IonRouterOutlet>
  )
}

export function App() {
  return (
    <RecoveryBoundary>
      <IonApp>
        <IonReactHashRouter>
          <AppRoutes />
        </IonReactHashRouter>
      </IonApp>
    </RecoveryBoundary>
  )
}
