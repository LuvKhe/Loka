// POST /api/timetable/scan
// Accepts a multipart/form-data upload with a timetable image.
// Sends it to Gemini Vision and returns a ScanResult.
// The image is never stored — it's processed in memory and discarded.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ScanResult, ScannedClass } from '@loka/shared/types'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const SYSTEM_PROMPT = `You are a timetable parser. Extract ALL classes from this university timetable image.

Return a JSON object with this exact structure:
{
  "classes": [
    {
      "subjectCode": "string (e.g. CS101, required)",
      "subjectName": "string or null",
      "group": "string or null (e.g. G1, Group A, T1)",
      "venue": "string or null (building/room/location)",
      "day": "string or null (full day name: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)",
      "startTime": "string or null (24h HH:MM format)",
      "endTime": "string or null (24h HH:MM format)",
      "confidence": number between 0 and 1
    }
  ],
  "ambiguities": [
    {
      "field": "one of: group, venue, day, time, subject_code",
      "subjectCode": "which subject this is about",
      "options": ["option1", "option2"],
      "message": "human-readable description of the ambiguity"
    }
  ],
  "overallConfidence": number between 0 and 1
}

Rules:
- Extract EVERY class visible, even if confidence is low
- Convert all times to 24-hour HH:MM format (e.g. 2:30pm → 14:30)
- If a field is unclear or missing, set it to null
- If there are multiple groups for the same subject, create one entry per group
- If a day repeats classes at different times, create one entry per time slot
- Only add an ambiguity if you genuinely cannot determine the value
- Do not invent or guess subject names if not shown
- Return ONLY the JSON object, no markdown, no explanation`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Vision API not configured' }, { status: 500 })
    }

    // Parse multipart form
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate type and size (10MB limit)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Image must be JPEG, PNG, or WebP' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type === 'image/heic' || file.type === 'image/heif'
      ? 'image/jpeg'
      : file.type

    // Call Gemini with retry on 503
    const geminiBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    })

    let geminiRes: Response | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 1500))
      geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: geminiBody,
      })
      if (geminiRes.status !== 503) break
    }

    if (!geminiRes || !geminiRes.ok) {
      const err = await geminiRes?.text()
      console.error('Gemini error:', err)
      const is503 = geminiRes?.status === 503
      return NextResponse.json(
        { error: is503 ? 'Vision API is busy — please try again in a moment' : 'Vision API error' },
        { status: 502 },
      )
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      return NextResponse.json({ error: 'No response from vision API' }, { status: 502 })
    }

    // Parse the JSON response
    let parsed: { classes: ScannedClass[]; ambiguities: ScanResult['ambiguities']; overallConfidence: number }
    try {
      parsed = JSON.parse(rawText)
    } catch {
      console.error('Gemini returned non-JSON:', rawText)
      return NextResponse.json({ error: 'Could not parse vision API response' }, { status: 502 })
    }

    // Validate and sanitise
    const classes: ScannedClass[] = (parsed.classes ?? []).map((c) => ({
      subjectCode: String(c.subjectCode ?? '').trim().toUpperCase(),
      subjectName: c.subjectName ? String(c.subjectName).trim() : null,
      group: c.group ? String(c.group).trim() : null,
      venue: c.venue ? String(c.venue).trim() : null,
      day: c.day ? String(c.day).trim() : null,
      startTime: c.startTime ? String(c.startTime).trim() : null,
      endTime: c.endTime ? String(c.endTime).trim() : null,
      confidence: Math.min(1, Math.max(0, Number(c.confidence) || 0.5)),
    })).filter((c) => c.subjectCode.length > 0)

    const result: ScanResult = {
      classes,
      ambiguities: parsed.ambiguities ?? [],
      overallConfidence: Math.min(1, Math.max(0, Number(parsed.overallConfidence) || 0)),
      error: null,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
