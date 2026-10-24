import type { Metadata } from 'next'
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout'

export const metadata: Metadata = { title: 'Terms of Use - Loka' }

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Use">
      <LegalSection title="About Loka">
        <p>
          Loka is a campus app that helps students at the University of Eswatini, Kwaluseni campus see where their
          friends are, based on a class timetable and an optional manual campus check-in. Loka is an independent
          student project and is not operated by, endorsed by, or affiliated with the University of Eswatini.
        </p>
      </LegalSection>
      <LegalSection title="Accepting these terms">
        <p>
          By creating a profile you agree to these terms and to the Privacy Policy. If you do not agree, do not use
          Loka. We may update these terms; when they change materially you will be asked to accept the new version
          before continuing.
        </p>
      </LegalSection>
      <LegalSection title="Your profile and recovery code">
        <p>
          Loka does not use passwords or email. Your profile lives on your device and is protected by a recovery code
          shown once when you sign up. Keep it safe. Anyone with the code can restore your profile, and we cannot
          recover a lost code for you.
        </p>
        <p>Choose a display name that is not misleading, abusive, or someone else's name.</p>
      </LegalSection>
      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>harass, stalk, threaten, or track anyone, or use Loka to find someone who does not want to be found;</li>
          <li>impersonate another person or misrepresent who you are;</li>
          <li>send friend requests in bulk, scrape data, or attempt to bypass limits or security controls;</li>
          <li>probe, attack, or interfere with Loka or its infrastructure, or try to access other users' data;</li>
          <li>use Loka for anything unlawful.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Friends and visibility">
        <p>
          Only people you accept as friends can see your status and campus location, and only as far as your privacy
          settings allow. You are responsible for who you accept. You can change your privacy settings or remove your
          data at any time.
        </p>
      </LegalSection>
      <LegalSection title="Timetable accuracy">
        <p>
          Timetable data in Loka is provided as a convenience and may be out of date or contain errors. Always confirm
          your classes, venues, and times with official university sources. Loka is not responsible for missed classes
          or any decision made from what the app shows.
        </p>
      </LegalSection>
      <LegalSection title="Safety">
        <p>
          Loka is not an emergency or safety service and must not be relied on to locate anyone in an emergency. Meet
          people only in places you are comfortable with.
        </p>
      </LegalSection>
      <LegalSection title="Availability and changes">
        <p>
          Loka is provided as is, without warranties of any kind. It may change, be interrupted, or be discontinued at
          any time. To the extent permitted by law, we are not liable for any loss arising from your use of Loka.
        </p>
      </LegalSection>
      <LegalSection title="Ending your use">
        <p>
          You can delete your profile and all associated data from the Profile screen at any time. We may suspend or
          remove profiles that break these terms.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
