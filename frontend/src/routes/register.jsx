import { createFileRoute } from '@tanstack/react-router'
import Register from '../components/Register'

export const Route = createFileRoute('/register')({
  component: Register,
})
