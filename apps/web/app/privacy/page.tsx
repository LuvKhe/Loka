import type { Metadata } from 'next'
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout'

export const metadata: Metadata = { title: 'Privacy Policy - Loka' }

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <LegalSection title="What we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>Your display name and an optional avatar.</li>
          <li>Your Loka ID, a short public identifier generated for you. It is not derived from any personal detail.</li>
          <li>A hash of your recovery code. The code itself is shown once and is never stored.</li>
          <li>Your timetable entries: module codes, days, times, groups, and venues.</li>
          <li>Your friend requests and friendships.</li>
          <li>Your privacy settings and the version of these terms you accepted.</li>
          <li>Your current campus location, only if you choose to check in.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Location">
        <p>
          Loka does not read your device's GPS. Your campus location is a building you pick yourself. We store only the
          building label for your latest check-in, replace it each time you check in, and remove it when you leave campus
          or turn sharing off. We do not keep a history of where you have been.
        </p>
      </LegalSection>
      <LegalSection title="Who can see your information">
        <p>
          Only friends you have accepted can see your status and campus location, and only what your privacy settings
          allow. Nobody else can see your timetable or location. Loka does not sell your data and does not show ads.
        </p>
      </LegalSection>
      <LegalSection title="No account details">
        <p>
          Loka does not ask for an email address, phone number, or password. Your profile is tied to an anonymous
          session on your device.
        </p>
      </LegalSection>
      <LegalSection title="Service providers">
        <p>
          Loka stores its data with Supabase and is hosted on Vercel. These providers process data on our behalf to run
          the service. Where timetable scanning is used, the image you submit is processed to extract text and is not
          used to make decisions about access or privacy.
        </p>
      </LegalSection>
      <LegalSection title="Security">
        <p>
          Data is protected by access rules in the database, so each person can read and change only what they are
          allowed to. Requests are rate limited and connections are encrypted. No system is perfectly secure, so please
          keep your recovery code private.
        </p>
      </LegalSection>
      <LegalSection title="Retention and deletion">
        <p>
          We keep your data while your profile exists. You can permanently delete your profile from the Profile screen,
          which removes your profile, timetable, friendships, requests, settings, and location. Deletion cannot be
          undone.
        </p>
      </LegalSection>
      <LegalSection title="Changes">
        <p>
          If this policy changes in a meaningful way, you will be asked to review and accept the updated version.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
