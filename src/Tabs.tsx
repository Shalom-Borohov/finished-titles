import { IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react'
import { Navigate, Route } from 'react-router-dom'
import { GridIcon, SlidersIcon, StatsIcon } from './components/icons'
import { COMMON_COPY } from './copy/common'
import { HOME_PATH, SETTINGS_PATH, STATS_PATH } from './navigation/paths'
import { HomePage } from './pages/home/HomePage'
import { ListPage } from './pages/list/ListPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { StatsPage } from './pages/stats/StatsPage'

export function Tabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="home" element={<HomePage />} />
        <Route path="home/:type" element={<ListPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route index element={<Navigate to="home" replace />} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" className="floating-tab-bar">
        <IonTabButton tab="home" href={HOME_PATH}>
          <GridIcon />
          <IonLabel>{COMMON_COPY.home}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="stats" href={STATS_PATH}>
          <StatsIcon />
          <IonLabel>{COMMON_COPY.stats}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href={SETTINGS_PATH}>
          <SlidersIcon />
          <IonLabel>{COMMON_COPY.settings}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  )
}
