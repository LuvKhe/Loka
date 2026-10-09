# Loka — Privacy Model

This document explains how Loka handles your data in plain language.

---

## What Loka stores

### Your profile
- Your display name
- An optional profile picture
- Your university and campus
- Your Loka ID (a short random code like `K7M2-P9RQ`)

Loka does **not** ask for your email address, phone number, home address,
government ID, or payment information.

### Your timetable
Your timetable entries (subject codes, venues, days and times) are stored
in Loka's database so they can be shared with your friends (if you choose).

The timetable engine runs locally on your device — your timetable is never
sent to a server just to calculate what class you are currently in.

### Your location
Loka stores **one temporary record** of your approximate campus location while
you are on campus. This record contains only a place name (e.g. "Science Block"),
never your exact GPS coordinates.

When you leave campus, this record is **deleted**.

Loka does **not** store a history of where you have been.

### Your recovery code
If you choose to save a recovery code, only a secure hash of that code is stored.
The code itself is never stored and cannot be recovered by Loka staff.

---

## What friends can see

If you have enabled sharing, your friends can see:

- Your display name
- Your approximate campus location (e.g. "Science Block")
- What class you are currently in
- When that class ends
- What your next class is
- Whether you are free

Your friends **cannot** see:

- Your exact GPS coordinates
- Where you live or have been outside campus
- Your location when you are off campus (they see "Off campus")
- Your recovery code
- Your internal account ID
- Your location history (there is none)
- Private settings you have turned off

---

## Privacy controls

You can control what your friends see in your Profile settings:

| Setting | What it controls |
|---------|-----------------|
| Location sharing | Whether your location is shared at all |
| Show current class | Whether friends see your current subject |
| Show timetable | Whether friends can see your full timetable for today |
| Show availability | Whether friends see your free/busy status |
| Friends can see me | Master switch — turn this off to go invisible to all friends |

---

## How location works

1. Your device's GPS determines your position.
2. Loka checks whether you are inside the campus boundary.
3. If you are inside campus, Loka identifies the nearest campus building
   (e.g. "Science Block") and sends only that label to friends.
4. Your raw GPS coordinates are processed on Loka's servers and immediately
   discarded — they are never stored in the database.

---

## How campus geofencing works

Loka uses a defined campus boundary. Location sharing only activates when
you are inside this boundary.

- **Entering campus:** Location sharing may start (based on your settings).
- **Leaving campus:** Location sharing stops and your location record is deleted.

Friends will see "Off campus" — not your last known campus location.

---

## What happens outside campus

When you leave campus:
- Your location record is removed from Loka's database
- Friends see "Off campus" instead of your last location
- GPS updates stop (to save battery)

---

## How long temporary location exists

Your location record is overwritten each time it is updated (not appended).
When you leave campus it is deleted. Loka does not retain location records
between campus visits.

---

## What timetable data is stored

- Subject codes and names
- Days and times
- Venue/room (optional)
- Group (optional)
- Lecturer name (optional, if you add it)

Timetable data is stored so your friends can see your schedule (if you
allow it) and so Loka can show your current and next class automatically.

---

## What is NOT stored

- Your home location
- Your travel routes
- Your GPS coordinates (only processed transiently, never stored)
- Location history
- Email address (unless you voluntarily enter one — Loka does not ask for it)
- Phone number
- Government ID
- Payment information

---

## Recovery implications

Because Loka does not use traditional email/password accounts, your profile
is tied to your device.

If you lose your device or uninstall the app **without saving a recovery code**,
you will lose access to your Loka profile. Your friends will need to add you
again with your new Loka ID.

To protect against this, save your recovery code somewhere safe when Loka
shows it to you. Loka cannot recover your account for you.
