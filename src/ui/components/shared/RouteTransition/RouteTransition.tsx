/**
 * <RouteTransition>
 *
 * Fades content in on mount / route change. Cheap, universal way to avoid
 * hard cuts between screens.
 */

import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import s from './RouteTransition.module.css'

export interface RouteTransitionProps {
  children: ReactNode
}

export function RouteTransition({ children }: RouteTransitionProps): JSX.Element {
  const location = useLocation()
  return (
    <div key={location.pathname} className={s.wrap}>
      {children}
    </div>
  )
}

export default RouteTransition
