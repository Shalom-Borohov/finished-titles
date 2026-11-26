import { Component, type ReactNode } from 'react'
import { RecoveryScreen } from './RecoveryScreen'

type RecoveryBoundaryProps = {
  children: ReactNode
}

export class RecoveryBoundary extends Component<RecoveryBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <RecoveryScreen /> : this.props.children
  }
}
