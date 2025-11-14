import { createFileRoute } from '@tanstack/react-router'
import AllEvents from '../pages/AllEvents'

export const Route = createFileRoute('/allevents')({
  component: AllEvents,
})
