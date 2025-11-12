import { createFileRoute } from '@tanstack/react-router'
import AllEvents from '../pages/AllEvents'

export const Route = createFileRoute('/')({
  component: AllEvents,
})
