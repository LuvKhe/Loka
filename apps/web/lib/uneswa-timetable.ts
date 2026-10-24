// UNESWA Kwaluseni Lecturing Timetable (Full Time) — generated 02 Oct 2026
// Extracted from prog02102026.pdf (32 pages, 19 programmes)
// Day: 1=Monday … 5=Friday

export interface ProgrammeSlot {
  moduleCode: string
  day: number
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
  venue: string
}

export interface Programme {
  id: string
  name: string
  slots: ProgrammeSlot[]
}

// ─── Helper ───────────────────────────────────────────────────────────────────
// Time slots in use across the timetable
// 07:00-07:50, 08:00-08:50, 09:00-09:50, 10:00-10:50, 11:00-11:50,
// 12:00-12:50, 13:00-13:50, 14:00-14:50, 15:00-15:50, 16:00-16:50, 17:00-17:50

export const UNESWA_PROGRAMMES: Programme[] = [

  // ── Pages 1-2: Bachelor of Commerce ─────────────────────────────────────────
  {
    id: 'bcom',
    name: 'Bachelor of Commerce (B.Com)',
    slots: [
      // Monday
      { moduleCode: 'ACF411', day: 1, startTime: '08:00', endTime: '08:50', venue: 'G.001' },
      { moduleCode: 'BUS427', day: 1, startTime: '09:00', endTime: '09:50', venue: 'G.001' },
      { moduleCode: 'BUS421', day: 1, startTime: '10:00', endTime: '10:50', venue: 'G.001' },
      { moduleCode: 'BUS111', day: 1, startTime: '11:00', endTime: '11:50', venue: 'G.105' },
      { moduleCode: 'BUS301', day: 1, startTime: '12:00', endTime: '12:50', venue: 'G.001' },
      { moduleCode: 'ECO101', day: 1, startTime: '13:00', endTime: '13:50', venue: 'MPH' },
      { moduleCode: 'BUS221', day: 1, startTime: '14:00', endTime: '14:50', venue: 'G.001' },
      { moduleCode: 'ACF213', day: 1, startTime: '15:00', endTime: '15:50', venue: 'G.001' },
      // Tuesday
      { moduleCode: 'BUS433', day: 2, startTime: '08:00', endTime: '08:50', venue: 'G.001' },
      { moduleCode: 'LAW213', day: 2, startTime: '09:00', endTime: '09:50', venue: 'G.001' },
      { moduleCode: 'BUS425', day: 2, startTime: '10:00', endTime: '10:50', venue: 'G.001' },
      { moduleCode: 'BUS111', day: 2, startTime: '11:00', endTime: '11:50', venue: 'G.102' },
      { moduleCode: 'ECO101', day: 2, startTime: '13:00', endTime: '13:50', venue: 'MPH' },
      { moduleCode: 'BUS327', day: 2, startTime: '14:00', endTime: '14:50', venue: 'G.001' },
      { moduleCode: 'ACF419', day: 2, startTime: '15:00', endTime: '15:50', venue: 'G.001' },
      // Wednesday
      { moduleCode: 'BUS231', day: 3, startTime: '08:00', endTime: '08:50', venue: 'G.001' },
      { moduleCode: 'ACF411', day: 3, startTime: '09:00', endTime: '09:50', venue: 'G.001' },
      { moduleCode: 'BUS427', day: 3, startTime: '10:00', endTime: '10:50', venue: 'G.001' },
      { moduleCode: 'BUS111', day: 3, startTime: '11:00', endTime: '11:50', venue: 'G.105' },
      { moduleCode: 'BUS301', day: 3, startTime: '14:00', endTime: '14:50', venue: 'G.001' },
      { moduleCode: 'ACF213', day: 3, startTime: '15:00', endTime: '15:50', venue: 'G.005/G.006' },
      // Thursday
      { moduleCode: 'BUS433', day: 4, startTime: '08:00', endTime: '08:50', venue: 'G.103' },
      { moduleCode: 'LAW213', day: 4, startTime: '09:00', endTime: '09:50', venue: 'G.001' },
      { moduleCode: 'BUS421', day: 4, startTime: '10:00', endTime: '10:50', venue: 'G.001' },
      { moduleCode: 'BUS221', day: 4, startTime: '11:00', endTime: '11:50', venue: 'G.001' },
      { moduleCode: 'BUS327', day: 4, startTime: '13:00', endTime: '13:50', venue: 'G.001' },
      { moduleCode: 'ACF419', day: 4, startTime: '14:00', endTime: '14:50', venue: 'G.001' },
      { moduleCode: 'BUS425', day: 4, startTime: '15:00', endTime: '15:50', venue: 'G.001' },
      // Friday
      { moduleCode: 'BUS231', day: 5, startTime: '08:00', endTime: '08:50', venue: 'G.102' },
      { moduleCode: 'ECO101', day: 5, startTime: '10:00', endTime: '10:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'BUS111', day: 5, startTime: '11:00', endTime: '11:50', venue: 'G.106' },
    ],
  },

  // ── Page 3: B.Ed. Secondary (Business Education) ─────────────────────────────
  {
    id: 'bed-sec-bus',
    name: 'B.Ed. Secondary (Business Education)',
    slots: [
      { moduleCode: 'BUS111', day: 1, startTime: '11:00', endTime: '11:50', venue: 'G.105' },
      { moduleCode: 'ECO101', day: 1, startTime: '13:00', endTime: '13:50', venue: 'MPH' },
      { moduleCode: 'CTE301', day: 1, startTime: '14:00', endTime: '14:50', venue: 'G.102' },
      { moduleCode: 'BUS111', day: 2, startTime: '11:00', endTime: '11:50', venue: 'G.102' },
      { moduleCode: 'EFM301', day: 2, startTime: '13:00', endTime: '13:50', venue: 'A4.4' },
      { moduleCode: 'ECO101', day: 2, startTime: '13:00', endTime: '13:50', venue: 'MPH' },
      { moduleCode: 'ACF213', day: 2, startTime: '15:00', endTime: '15:50', venue: 'G.001' },
      { moduleCode: 'BUS111', day: 3, startTime: '11:00', endTime: '11:50', venue: 'G.105' },
      { moduleCode: 'CTE301', day: 3, startTime: '14:00', endTime: '14:50', venue: 'G.105' },
      { moduleCode: 'EFM301', day: 3, startTime: '14:00', endTime: '14:50', venue: 'A4.4' },
      { moduleCode: 'ACF213', day: 3, startTime: '15:00', endTime: '15:50', venue: 'G.005/G.006' },
      { moduleCode: 'ECO101', day: 5, startTime: '10:00', endTime: '10:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'BUS111', day: 5, startTime: '11:00', endTime: '11:50', venue: 'G.106' },
    ],
  },

  // ── Page 4: B.Ed. Primary (Language Arts) ────────────────────────────────────
  {
    id: 'bed-prim-la',
    name: 'B.Ed. Primary (Language Arts)',
    slots: [
      { moduleCode: 'ALL405', day: 2, startTime: '09:00', endTime: '09:50', venue: 'A4.2' },
      { moduleCode: 'ALL405', day: 4, startTime: '10:00', endTime: '10:50', venue: 'A4.2' },
    ],
  },

  // ── Pages 5-7: B.Ed. Secondary (Science) ─────────────────────────────────────
  {
    id: 'bed-sec-sci',
    name: 'B.Ed. Secondary (Science)',
    slots: [
      // Monday
      { moduleCode: 'CHE201', day: 1, startTime: '07:00', endTime: '07:50', venue: 'CH2.1' },
      { moduleCode: 'BIO201', day: 1, startTime: '08:00', endTime: '08:50', venue: 'BL.2.1' },
      { moduleCode: 'GEP101', day: 1, startTime: '09:00', endTime: '09:50', venue: 'S.1.23' },
      { moduleCode: 'EFM201', day: 1, startTime: '10:00', endTime: '10:50', venue: 'MS 2.4' },
      { moduleCode: 'MAT101', day: 1, startTime: '11:00', endTime: '11:50', venue: 'MS 2.4' },
      { moduleCode: 'PHY201', day: 1, startTime: '12:00', endTime: '12:50', venue: 'PH2.1' },
      { moduleCode: 'CTE201', day: 1, startTime: '13:00', endTime: '13:50', venue: 'A2.1' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      // Tuesday
      { moduleCode: 'CHE301', day: 2, startTime: '07:00', endTime: '07:50', venue: 'CH2.1' },
      { moduleCode: 'BIO301', day: 2, startTime: '08:00', endTime: '08:50', venue: 'BL.2.1' },
      { moduleCode: 'MAT201', day: 2, startTime: '10:00', endTime: '10:50', venue: 'MS 2.4' },
      { moduleCode: 'PHY301', day: 2, startTime: '12:00', endTime: '12:50', venue: 'PH2.1' },
      { moduleCode: 'CTE301', day: 2, startTime: '13:00', endTime: '13:50', venue: 'A2.1' },
      { moduleCode: 'EFM301', day: 2, startTime: '14:00', endTime: '14:50', venue: 'MS 2.4' },
      // Wednesday
      { moduleCode: 'CHE201', day: 3, startTime: '07:00', endTime: '07:50', venue: 'CH2.1' },
      { moduleCode: 'BIO201', day: 3, startTime: '08:00', endTime: '08:50', venue: 'BL.2.1' },
      { moduleCode: 'GEP201', day: 3, startTime: '09:00', endTime: '09:50', venue: 'S.1.23' },
      { moduleCode: 'EFM201', day: 3, startTime: '10:00', endTime: '10:50', venue: 'MS 2.4' },
      { moduleCode: 'PHY201', day: 3, startTime: '12:00', endTime: '12:50', venue: 'PH2.1' },
      { moduleCode: 'ACS201', day: 3, startTime: '13:00', endTime: '13:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CSC201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      // Thursday
      { moduleCode: 'CHE301', day: 4, startTime: '07:00', endTime: '07:50', venue: 'CH2.1' },
      { moduleCode: 'BIO301', day: 4, startTime: '08:00', endTime: '08:50', venue: 'BL.2.1' },
      { moduleCode: 'MAT201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'MS 2.4' },
      { moduleCode: 'PHY301', day: 4, startTime: '12:00', endTime: '12:50', venue: 'PH2.1' },
      { moduleCode: 'CTE301', day: 4, startTime: '13:00', endTime: '13:50', venue: 'A2.1' },
      { moduleCode: 'ACS101', day: 4, startTime: '14:00', endTime: '14:50', venue: 'Sports Emporium' },
      // Friday
      { moduleCode: 'MAT101', day: 5, startTime: '08:00', endTime: '08:50', venue: 'Tent 2' },
      { moduleCode: 'GEP101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'S.1.23' },
      { moduleCode: 'CSC201', day: 5, startTime: '10:00', endTime: '10:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'ACS201', day: 5, startTime: '11:00', endTime: '11:50', venue: 'Sports Emporium' },
    ],
  },

  // ── Pages 8-9: B.Ed. Primary NP ──────────────────────────────────────────────
  {
    id: 'bed-prim-np',
    name: 'B.Ed. Primary NP',
    slots: [
      { moduleCode: 'PED101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'MPH' },
      { moduleCode: 'EFM101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'A4.2' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'HIS101', day: 2, startTime: '08:00', endTime: '08:50', venue: 'C.1.10' },
      { moduleCode: 'ENG101', day: 2, startTime: '09:00', endTime: '09:50', venue: 'C.1.6' },
      { moduleCode: 'MAT101', day: 2, startTime: '11:00', endTime: '11:50', venue: 'MS 2.4' },
      { moduleCode: 'PHY101', day: 2, startTime: '13:00', endTime: '13:50', venue: 'PH2.1' },
      { moduleCode: 'PED201', day: 3, startTime: '08:00', endTime: '08:50', venue: 'MPH' },
      { moduleCode: 'EFM201', day: 3, startTime: '10:00', endTime: '10:50', venue: 'A4.2' },
      { moduleCode: 'CTE101', day: 3, startTime: '13:00', endTime: '13:50', venue: 'C.1.9' },
      { moduleCode: 'ACS201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CSC101', day: 4, startTime: '08:00', endTime: '08:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'ALL101', day: 4, startTime: '09:00', endTime: '09:50', venue: 'C.1.8' },
      { moduleCode: 'MAT201', day: 4, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'ENG201', day: 5, startTime: '09:00', endTime: '09:50', venue: 'C.1.6' },
      { moduleCode: 'HIS201', day: 5, startTime: '10:00', endTime: '10:50', venue: 'G.102' },
      { moduleCode: 'MAT101', day: 5, startTime: '11:00', endTime: '11:50', venue: 'Tent 2' },
    ],
  },

  // ── Pages 10-11: B.Ed. Secondary (Humanities) ────────────────────────────────
  {
    id: 'bed-sec-hum',
    name: 'B.Ed. Secondary (Humanities)',
    slots: [
      { moduleCode: 'ALL201', day: 1, startTime: '09:00', endTime: '09:50', venue: 'A3.2' },
      { moduleCode: 'EFM201', day: 1, startTime: '10:00', endTime: '10:50', venue: 'MS 2.3' },
      { moduleCode: 'GEP201', day: 1, startTime: '11:00', endTime: '11:50', venue: 'C.1.10' },
      { moduleCode: 'CTE201', day: 1, startTime: '14:00', endTime: '14:50', venue: 'B.1.6' },
      { moduleCode: 'HIS201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'A4.2' },
      { moduleCode: 'ENG201', day: 2, startTime: '09:00', endTime: '09:50', venue: 'C.1.6' },
      { moduleCode: 'TRS201', day: 2, startTime: '11:00', endTime: '11:50', venue: 'A4.4' },
      { moduleCode: 'ACS201', day: 2, startTime: '14:00', endTime: '14:50', venue: 'Tent 2' },
      { moduleCode: 'GEP301', day: 3, startTime: '09:00', endTime: '09:50', venue: 'C.1.10' },
      { moduleCode: 'CTE301', day: 3, startTime: '14:00', endTime: '14:50', venue: 'G.102' },
      { moduleCode: 'HIS301', day: 4, startTime: '08:00', endTime: '08:50', venue: 'A4.2' },
      { moduleCode: 'ENG301', day: 4, startTime: '09:00', endTime: '09:50', venue: 'SC.LEC.TH.I' },
      { moduleCode: 'TRS301', day: 4, startTime: '11:00', endTime: '11:50', venue: 'A4.4' },
      { moduleCode: 'ALL301', day: 5, startTime: '09:00', endTime: '09:50', venue: 'A3.2' },
      { moduleCode: 'EFM301', day: 5, startTime: '10:00', endTime: '10:50', venue: 'MS 2.3' },
      { moduleCode: 'ACS101', day: 5, startTime: '14:00', endTime: '14:50', venue: 'Sports Emporium' },
    ],
  },

  // ── Page 12: P.G.C.E. ─────────────────────────────────────────────────────────
  {
    id: 'pgce',
    name: 'P.G.C.E.',
    slots: [
      { moduleCode: 'CTE501', day: 1, startTime: '08:00', endTime: '08:50', venue: 'A2.5' },
      { moduleCode: 'EFM501', day: 1, startTime: '10:00', endTime: '10:50', venue: 'C.1.6' },
      { moduleCode: 'CTE503', day: 2, startTime: '09:00', endTime: '09:50', venue: 'A2.3' },
      { moduleCode: 'EFM503', day: 2, startTime: '11:00', endTime: '11:50', venue: 'C.1.8' },
      { moduleCode: 'CTE505', day: 3, startTime: '08:00', endTime: '08:50', venue: 'C.1.10' },
      { moduleCode: 'EFM505', day: 3, startTime: '10:00', endTime: '10:50', venue: 'A4.4' },
      { moduleCode: 'CTE507', day: 4, startTime: '09:00', endTime: '09:50', venue: 'Tent 2' },
      { moduleCode: 'EFM507', day: 4, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'CTE509', day: 5, startTime: '08:00', endTime: '08:50', venue: 'A2.5' },
    ],
  },

  // ── Page 13: B.A. JMC ────────────────────────────────────────────────────────
  {
    id: 'ba-jmc',
    name: 'B.A. Journalism, Media & Communication (JMC)',
    slots: [
      { moduleCode: 'JMC101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'SOC101', day: 1, startTime: '09:00', endTime: '09:50', venue: 'A4.1' },
      { moduleCode: 'ENG101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'A4.4' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'JMC201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'JMC Studio' },
      { moduleCode: 'LAW101', day: 2, startTime: '09:00', endTime: '09:50', venue: 'B.3.1' },
      { moduleCode: 'POL101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'B.3.2' },
      { moduleCode: 'ALL101', day: 2, startTime: '11:00', endTime: '11:50', venue: 'C.1.10' },
      { moduleCode: 'JMC301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'JMC Studio' },
      { moduleCode: 'SOC201', day: 3, startTime: '09:00', endTime: '09:50', venue: 'A2.1' },
      { moduleCode: 'ENG201', day: 3, startTime: '10:00', endTime: '10:50', venue: 'A2.5' },
      { moduleCode: 'ACS201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'JMC401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'JMC Studio' },
      { moduleCode: 'LAW201', day: 4, startTime: '09:00', endTime: '09:50', venue: 'A2.6' },
      { moduleCode: 'POL201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'MPH' },
      { moduleCode: 'ALL201', day: 4, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'JMC101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'G.102' },
      { moduleCode: 'SOC101', day: 5, startTime: '10:00', endTime: '10:50', venue: 'A4.1' },
    ],
  },

  // ── Pages 14-15: Bachelor of Arts in Humanities ───────────────────────────────
  {
    id: 'ba-hum',
    name: 'Bachelor of Arts in Humanities',
    slots: [
      { moduleCode: 'ALL101', day: 1, startTime: '09:00', endTime: '09:50', venue: 'A4.1' },
      { moduleCode: 'EFM101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'A4.2' },
      { moduleCode: 'GEP101', day: 1, startTime: '11:00', endTime: '11:50', venue: 'A4.3' },
      { moduleCode: 'CTE101', day: 1, startTime: '13:00', endTime: '13:50', venue: 'A4.4' },
      { moduleCode: 'HIS101', day: 2, startTime: '08:00', endTime: '08:50', venue: 'B.1.6' },
      { moduleCode: 'ENG101', day: 2, startTime: '09:00', endTime: '09:50', venue: 'A4.1' },
      { moduleCode: 'TRS101', day: 2, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'ACS101', day: 2, startTime: '14:00', endTime: '14:50', venue: 'MS 2.4' },
      { moduleCode: 'ALL201', day: 3, startTime: '09:00', endTime: '09:50', venue: 'A4.2' },
      { moduleCode: 'GEP201', day: 3, startTime: '11:00', endTime: '11:50', venue: 'A4.3' },
      { moduleCode: 'HIS201', day: 4, startTime: '08:00', endTime: '08:50', venue: 'A4.4' },
      { moduleCode: 'ENG201', day: 4, startTime: '09:00', endTime: '09:50', venue: 'Tent 2' },
      { moduleCode: 'TRS201', day: 4, startTime: '11:00', endTime: '11:50', venue: 'SC.LEC.TH.I' },
      { moduleCode: 'ACS201', day: 4, startTime: '14:00', endTime: '14:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'ALL301', day: 5, startTime: '09:00', endTime: '09:50', venue: 'A4.1' },
      { moduleCode: 'EFM301', day: 5, startTime: '10:00', endTime: '10:50', venue: 'A4.2' },
    ],
  },

  // ── Page 16: B.Sc. Actuarial and Financial Mathematics ───────────────────────
  {
    id: 'bsc-afm',
    name: 'B.Sc. Actuarial and Financial Mathematics',
    slots: [
      { moduleCode: 'STA101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'ECO101', day: 1, startTime: '13:00', endTime: '13:50', venue: 'MPH' },
      { moduleCode: 'MAT101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'MS 2.4' },
      { moduleCode: 'ACS101', day: 1, startTime: '15:00', endTime: '15:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'STA201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'ACF101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'MPH' },
      { moduleCode: 'MAT201', day: 2, startTime: '14:00', endTime: '14:50', venue: 'MS 2.4' },
      { moduleCode: 'CSC101', day: 2, startTime: '15:00', endTime: '15:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'STA301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'ECO201', day: 3, startTime: '13:00', endTime: '13:50', venue: 'Sports Emporium' },
      { moduleCode: 'GSC101', day: 3, startTime: '14:00', endTime: '14:50', venue: 'G.005/G.006' },
      { moduleCode: 'STA401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'ACF201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'MPH' },
      { moduleCode: 'MAT301', day: 4, startTime: '14:00', endTime: '14:50', venue: 'MS 2.4' },
      { moduleCode: 'ECO101', day: 5, startTime: '10:00', endTime: '10:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'ACS201', day: 5, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 1' },
    ],
  },

  // ── Pages 17-19: Bachelor of Science ─────────────────────────────────────────
  {
    id: 'bsc',
    name: 'Bachelor of Science',
    slots: [
      { moduleCode: 'BIO101', day: 1, startTime: '07:00', endTime: '07:50', venue: 'BL.2.1' },
      { moduleCode: 'CHE101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'CH2.1' },
      { moduleCode: 'ECO101', day: 1, startTime: '13:00', endTime: '13:50', venue: 'MPH' },
      { moduleCode: 'MAT101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'S.2.55' },
      { moduleCode: 'PHY101', day: 1, startTime: '15:00', endTime: '15:50', venue: 'PH2.1' },
      { moduleCode: 'BIO201', day: 2, startTime: '07:00', endTime: '07:50', venue: 'BL.2.1' },
      { moduleCode: 'CHE201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'CH2.1' },
      { moduleCode: 'STA101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'G.103' },
      { moduleCode: 'GEP101', day: 2, startTime: '11:00', endTime: '11:50', venue: 'MPH' },
      { moduleCode: 'CSC101', day: 2, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'BIO301', day: 3, startTime: '07:00', endTime: '07:50', venue: 'BL.2.1' },
      { moduleCode: 'CHE301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'CH2.1' },
      { moduleCode: 'MAT201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'PHY201', day: 3, startTime: '15:00', endTime: '15:50', venue: 'PH2.3' },
      { moduleCode: 'BIO401', day: 4, startTime: '07:00', endTime: '07:50', venue: 'BL.2.1' },
      { moduleCode: 'CHE401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'CH2.1' },
      { moduleCode: 'STA201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'MS 2.1' },
      { moduleCode: 'EFM101', day: 4, startTime: '13:00', endTime: '13:50', venue: 'A2.6' },
      { moduleCode: 'ECO201', day: 5, startTime: '09:00', endTime: '09:50', venue: 'Tent 2' },
      { moduleCode: 'MAT101', day: 5, startTime: '11:00', endTime: '11:50', venue: 'Sports Emporium' },
      { moduleCode: 'ACS101', day: 5, startTime: '14:00', endTime: '14:50', venue: 'MFAC Lab 1' },
    ],
  },

  // ── Pages 20-21: B.Eng. Electrical and Electronic ────────────────────────────
  {
    id: 'beng-ee',
    name: 'B.Eng. (Electrical and Electronic)',
    slots: [
      { moduleCode: 'EEE101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'EE 2.1' },
      { moduleCode: 'CHE101', day: 1, startTime: '09:00', endTime: '09:50', venue: 'CH2.1' },
      { moduleCode: 'MAT101', day: 1, startTime: '11:00', endTime: '11:50', venue: 'EE 2.2' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'EEE201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'EE 2.1' },
      { moduleCode: 'PHY101', day: 2, startTime: '09:00', endTime: '09:50', venue: 'EE 2.3' },
      { moduleCode: 'MAT201', day: 2, startTime: '11:00', endTime: '11:50', venue: 'EE 2.4' },
      { moduleCode: 'CSC101', day: 2, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'EEE301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'EE 2.2' },
      { moduleCode: 'CHE201', day: 3, startTime: '09:00', endTime: '09:50', venue: 'CH2.8' },
      { moduleCode: 'MAT301', day: 3, startTime: '11:00', endTime: '11:50', venue: 'EE 2.7' },
      { moduleCode: 'ACS201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'Sports Emporium' },
      { moduleCode: 'EEE401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'EE 2.1' },
      { moduleCode: 'PHY201', day: 4, startTime: '09:00', endTime: '09:50', venue: 'EE 2.3' },
      { moduleCode: 'MAT401', day: 4, startTime: '11:00', endTime: '11:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'EEE101', day: 5, startTime: '08:00', endTime: '08:50', venue: 'A2.1' },
      { moduleCode: 'EEE201', day: 5, startTime: '09:00', endTime: '09:50', venue: 'MFAC Lab 1' },
    ],
  },

  // ── Page 22: B.Sc. Information Science ───────────────────────────────────────
  {
    id: 'bsc-is',
    name: 'B.Sc. Information Science',
    slots: [
      { moduleCode: 'CSI101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CSC101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'A2.6' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CSI201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'MAT101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'A4.4' },
      { moduleCode: 'CSC201', day: 2, startTime: '14:00', endTime: '14:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'CSI301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'MAT201', day: 3, startTime: '10:00', endTime: '10:50', venue: 'MS 2.4' },
      { moduleCode: 'ACS201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'G.005/G.006' },
      { moduleCode: 'CSI401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'Tent 2' },
      { moduleCode: 'CSC301', day: 4, startTime: '10:00', endTime: '10:50', venue: 'Sports Emporium' },
      { moduleCode: 'CSI101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'CSC101', day: 5, startTime: '10:00', endTime: '10:50', venue: 'B.3.1' },
    ],
  },

  // ── Pages 23-24: B.Sc. Geographic Information Science ────────────────────────
  {
    id: 'bsc-gis',
    name: 'B.Sc. in Geographic Information Science',
    slots: [
      { moduleCode: 'GEP101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'MAT101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'MPH' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'GEP201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'SC.LEC.TH.I' },
      { moduleCode: 'CSC101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'B.1.6' },
      { moduleCode: 'PHY101', day: 2, startTime: '13:00', endTime: '13:50', venue: 'B.1.2' },
      { moduleCode: 'GEP301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'MFAC Lab 2' },
      { moduleCode: 'MAT201', day: 3, startTime: '10:00', endTime: '10:50', venue: 'A4.3' },
      { moduleCode: 'ACS201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'Sports Emporium' },
      { moduleCode: 'GEP401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'A4.4' },
      { moduleCode: 'CSC201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'GEP101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'Tent 2' },
      { moduleCode: 'GEP201', day: 5, startTime: '10:00', endTime: '10:50', venue: 'G.001' },
    ],
  },

  // ── Page 25: B.Sc. Information Technology ─────────────────────────────────────
  {
    id: 'bsc-it',
    name: 'B.Sc. Information Technology',
    slots: [
      { moduleCode: 'CSC101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'MS 2.4' },
      { moduleCode: 'MAT101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'G.001' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CSC201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'MPH' },
      { moduleCode: 'ACF101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CSC301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'Tent 2' },
      { moduleCode: 'MAT201', day: 3, startTime: '10:00', endTime: '10:50', venue: 'Sports Emporium' },
      { moduleCode: 'BUS101', day: 3, startTime: '13:00', endTime: '13:50', venue: 'A2.1' },
      { moduleCode: 'CSC401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'SC.LEC.TH.I' },
      { moduleCode: 'ACS201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'CSC101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'CSC201', day: 5, startTime: '10:00', endTime: '10:50', venue: 'G.103' },
    ],
  },

  // ── Page 26: B.Sc. Computer Science Education ─────────────────────────────────
  {
    id: 'bsc-cse',
    name: 'B.Sc. Computer Science Education (Comp.Sci.Ed.)',
    slots: [
      { moduleCode: 'CSC101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'G.102' },
      { moduleCode: 'CTE101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'G.105' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CSC201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'A2.3' },
      { moduleCode: 'EFM101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'C.1.6' },
      { moduleCode: 'MAT101', day: 2, startTime: '13:00', endTime: '13:50', venue: 'MPH' },
      { moduleCode: 'CSC301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'CTE201', day: 3, startTime: '10:00', endTime: '10:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'ACS201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'CSC401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'Sports Emporium' },
      { moduleCode: 'BUS101', day: 4, startTime: '10:00', endTime: '10:50', venue: 'Tent 2' },
      { moduleCode: 'CSC101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'G.102' },
    ],
  },

  // ── Pages 27-29: B.A. Social Sciences ────────────────────────────────────────
  {
    id: 'ba-soc-sci',
    name: 'B.A. Social Sciences',
    slots: [
      { moduleCode: 'ECO101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'G.102' },
      { moduleCode: 'GEP101', day: 1, startTime: '09:00', endTime: '09:50', venue: 'G.103' },
      { moduleCode: 'DEM101', day: 1, startTime: '10:00', endTime: '10:50', venue: 'G.105' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'MAT101', day: 2, startTime: '08:00', endTime: '08:50', venue: 'A4.2' },
      { moduleCode: 'SOC101', day: 2, startTime: '09:00', endTime: '09:50', venue: 'A4.3' },
      { moduleCode: 'PAD101', day: 2, startTime: '10:00', endTime: '10:50', venue: 'A4.4' },
      { moduleCode: 'POL101', day: 2, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 2' },
      { moduleCode: 'ECO201', day: 3, startTime: '08:00', endTime: '08:50', venue: 'MPH' },
      { moduleCode: 'STA101', day: 3, startTime: '09:00', endTime: '09:50', venue: 'Tent 2' },
      { moduleCode: 'CSC101', day: 3, startTime: '14:00', endTime: '14:50', venue: 'Sports Emporium' },
      { moduleCode: 'SOC201', day: 4, startTime: '09:00', endTime: '09:50', venue: 'SC.LEC.TH.I' },
      { moduleCode: 'PAD201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'SC.LEC.TH.II' },
      { moduleCode: 'POL201', day: 4, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'DEM201', day: 5, startTime: '08:00', endTime: '08:50', venue: 'G.102' },
      { moduleCode: 'GEP201', day: 5, startTime: '09:00', endTime: '09:50', venue: 'G.103' },
      { moduleCode: 'ACS201', day: 5, startTime: '14:00', endTime: '14:50', venue: 'MFAC Lab 2' },
    ],
  },

  // ── Page 30: Bachelor of Social Work ─────────────────────────────────────────
  {
    id: 'bsw',
    name: 'Bachelor of Social Work',
    slots: [
      { moduleCode: 'SWK101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'A3.1' },
      { moduleCode: 'SOC101', day: 1, startTime: '09:00', endTime: '09:50', venue: 'G.103' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'SWK201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'A2.2' },
      { moduleCode: 'POL101', day: 2, startTime: '09:00', endTime: '09:50', venue: 'C.1.10' },
      { moduleCode: 'GEP101', day: 2, startTime: '11:00', endTime: '11:50', venue: 'SC.LEC.TH.I' },
      { moduleCode: 'SWK301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'A3.1' },
      { moduleCode: 'SOC201', day: 3, startTime: '09:00', endTime: '09:50', venue: 'MFAC Lab 2' },
      { moduleCode: 'STA101', day: 3, startTime: '11:00', endTime: '11:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'SWK401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'A2.2' },
      { moduleCode: 'ACS201', day: 4, startTime: '10:00', endTime: '10:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'CSC101', day: 4, startTime: '14:00', endTime: '14:50', venue: 'FNB Cyberspace' },
      { moduleCode: 'SWK101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'G.103' },
    ],
  },

  // ── Page 31: LL.B. (N/P) ─────────────────────────────────────────────────────
  {
    id: 'llb',
    name: 'LL.B. (N/P)',
    slots: [
      { moduleCode: 'LAW101', day: 1, startTime: '08:00', endTime: '08:50', venue: 'B.3.1' },
      { moduleCode: 'ECO101', day: 1, startTime: '09:00', endTime: '09:50', venue: 'A4.2' },
      { moduleCode: 'ACS101', day: 1, startTime: '14:00', endTime: '14:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'LAW201', day: 2, startTime: '08:00', endTime: '08:50', venue: 'A4.3' },
      { moduleCode: 'POL101', day: 2, startTime: '09:00', endTime: '09:50', venue: 'A2.2' },
      { moduleCode: 'SOC101', day: 2, startTime: '11:00', endTime: '11:50', venue: 'A2.3' },
      { moduleCode: 'LAW301', day: 3, startTime: '08:00', endTime: '08:50', venue: 'A2.5' },
      { moduleCode: 'ECO201', day: 3, startTime: '09:00', endTime: '09:50', venue: 'A2.6' },
      { moduleCode: 'ACS201', day: 3, startTime: '14:00', endTime: '14:50', venue: 'MPH' },
      { moduleCode: 'LAW401', day: 4, startTime: '08:00', endTime: '08:50', venue: 'G.106' },
      { moduleCode: 'CSC101', day: 4, startTime: '10:00', endTime: '10:50', venue: 'MFAC Lab 1' },
      { moduleCode: 'LAW101', day: 5, startTime: '09:00', endTime: '09:50', venue: 'SC.LEC.TH.I' },
      { moduleCode: 'LAW201', day: 5, startTime: '10:00', endTime: '10:50', venue: 'SC.LEC.TH.II' },
    ],
  },
]

// ─── Derived helpers ───────────────────────────────────────────────────────────

/** Get unique module codes for a programme */
export function getModuleCodes(programmeId: string): string[] {
  const prog = UNESWA_PROGRAMMES.find((p) => p.id === programmeId)
  if (!prog) return []
  return Array.from(new Set(prog.slots.map((s) => s.moduleCode))).sort()
}

/** Get all slots for a specific module within a programme */
export function getModuleSlots(programmeId: string, moduleCode: string): ProgrammeSlot[] {
  const prog = UNESWA_PROGRAMMES.find((p) => p.id === programmeId)
  if (!prog) return []
  return prog.slots.filter((s) => s.moduleCode === moduleCode)
}

/** Day number → display label */
export const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
}
