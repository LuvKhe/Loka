// Recovery code display — shown exactly once after onboarding
// The plaintext recovery code is passed via sessionStorage (set in OnboardingClient)
// and cleared as soon as this page renders it.
import RecoveryCodeClient from './RecoveryCodeClient'

export default function OnboardingRecoveryPage() {
  return <RecoveryCodeClient />
}
