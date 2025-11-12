import { createFileRoute } from '@tanstack/react-router'
import ViewRegistrations from '../../components/ViewRegistrations'
export const Route = createFileRoute('/getregistration/$id')({
  component: ViewRegistrations,
})


