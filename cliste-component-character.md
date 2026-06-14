# Cliste Component Character Guide
> Companion to `cliste-design-system.md` · Version 1.0 · 2026-06-15
> Stack: Next.js JSX · Tailwind CSS v4 · lucide-react · framer-motion

Dokumen ini mendefinisikan **anatomy**, **semua states**, **feel/timing**, **Tailwind class reference**,
dan **anti-patterns** untuk setiap komponen UI. Gunakan sebagai context prompt untuk AI code generation.

**Cara pakai:**
Paste section komponen yang relevan ke prompt AI kamu:
```
[CONTEXT: cliste-design-system.md §1-3] + [CONTEXT: cliste-component-character.md §Button]
→ "Build a Button component in JSX following this design system"
```

---

## COMPONENT 1: Button

### Anatomy
```
[ icon? 14px ] [ label 13px/500 ] [ trailing-icon? 14px ]
                padding: 0 16px
                height: 36px (default)
                border-radius: 8px
                gap icon–label: 6px
```

### Variants

| Variant | bg | text | border |
|---|---|---|---|
| primary | accent-600 | white | none |
| outline | transparent | accent-600 | 1px solid accent-600 |
| ghost | accent/10 | accent-600 | none |
| neutral | bg-elevated | text-secondary | 0.5px border |
| danger | red-500/10 | red-600 | none |
| danger-solid | red-600 | white | none |

### Sizes

| Size | height | px horizontal | font-size | icon-size |
|---|---|---|---|---|
| sm | 30px | 12px | 12px | 13px |
| default | 36px | 16px | 13px | 14px |
| lg | 42px | 20px | 14px | 16px |

### States — semua variant

```
default:   base styles
hover:     opacity 92% (primary/ghost/danger) ATAU bg slightly darker (outline/neutral)
           cursor: pointer
           transition: all 120ms ease-out

active:    scale(0.97), opacity 88%
           transition: all 80ms ease-out  ← lebih cepat dari hover

focus:     ring-2 ring-offset-2 ring-[accent]/40
           WAJIB untuk keyboard accessibility

disabled:  opacity-40, cursor-not-allowed, pointer-events-none
           JANGAN ubah warna — cukup turunkan opacity

loading:   ganti label dengan <Loader2 size={14} className="animate-spin" />
           lock width (pakai min-w) agar tidak layout shift
           pointer-events-none
```

### Feel
- Transition: `transition-all duration-[120ms] ease-out`
- Active scale: `0.97` — lebih dari ini tidak terasa, kurang dari ini terlalu dramatis
- Primary hover: opacity dip, BUKAN ganti warna bg — menjaga integritas warna accent
- Neutral hover: teks sedikit lebih gelap + border sedikit lebih visible
- Loading: jangan tampilkan icon + spinner bersamaan

### Tailwind Class Reference

```jsx
// Primary
"bg-[var(--accent-600)] text-white h-9 px-4 rounded-[8px] text-[13px] font-medium
 inline-flex items-center gap-1.5 select-none cursor-pointer
 hover:opacity-[0.92] active:scale-[0.97] active:opacity-[0.88]
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-600)]/40 focus-visible:ring-offset-2
 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
 transition-all duration-[120ms] ease-out"

// Outline
"bg-transparent text-[var(--accent-600)] border border-[var(--accent-600)]
 h-9 px-4 rounded-[8px] text-[13px] font-medium
 inline-flex items-center gap-1.5 select-none cursor-pointer
 hover:bg-[var(--accent-100)] active:scale-[0.97]
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-600)]/30 focus-visible:ring-offset-2
 disabled:opacity-40 disabled:cursor-not-allowed
 transition-all duration-[120ms] ease-out"

// Ghost
"bg-[var(--accent-bg-active-dark)] text-[var(--accent-600)]
 h-9 px-4 rounded-[8px] text-[13px] font-medium
 inline-flex items-center gap-1.5 select-none cursor-pointer
 hover:opacity-[0.80] active:scale-[0.97]
 disabled:opacity-40 disabled:cursor-not-allowed
 transition-all duration-[120ms] ease-out"

// Neutral
"bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]
 border border-[var(--color-border)] h-9 px-4 rounded-[8px] text-[13px] font-medium
 inline-flex items-center gap-1.5 select-none cursor-pointer
 hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)]
 active:scale-[0.97]
 disabled:opacity-40 disabled:cursor-not-allowed
 transition-all duration-[120ms] ease-out"

// Danger
"bg-red-500/10 text-red-600 h-9 px-4 rounded-[8px] text-[13px] font-medium
 inline-flex items-center gap-1.5 select-none cursor-pointer
 hover:bg-red-500/15 active:scale-[0.97]
 disabled:opacity-40 disabled:cursor-not-allowed
 transition-all duration-[120ms] ease-out"
```

### Anti-patterns
```
❌ Font weight 600 atau 700 pada label
❌ Animasi background-color pada primary button (gunakan opacity)
❌ Dua primary button berdampingan — satu harus outline/neutral
❌ Teks ALL CAPS
❌ Label button yang wrap ke 2 baris — truncate atau persingkat
❌ Width button berubah saat loading — lock dengan min-w
❌ border-radius di atas 8px — terasa mainan untuk SaaS
❌ Shadow pada button — flat only
```

---

## COMPONENT 2: Badge

### Anatomy
```
[ icon? 12px ] [ text 11px/500 ]
padding: 3px 8px (default), 2px 6px (sm)
border-radius: 5px (default), 4px (sm)
— BUKAN rounded-full untuk status badge
```

### Variants

| Token | Dark bg | Dark text | Light bg | Light text |
|---|---|---|---|---|
| kejar / success | violet/20 | #C4B5FD | #EDE9FF | #6D28D9 |
| tinjau / warning | amber/15 | #FCD34D | #FEF9C3 | #92400E |
| lewati / danger | red/15 | #FCA5A5 | #FEE2E2 | #991B1B |
| active / online | teal/15 | #6EE7B7 | #ECFDF5 | #065F46 |
| info | blue/15 | #93C5FD | #EFF6FF | #1D4ED8 |
| neutral | bg-elevated | text-secondary | bg-elevated | text-secondary |
| outline | transparent | text-secondary | transparent | text-secondary |

### States
```
default:  static — badge tidak punya hover state sendiri
clickable: hover:opacity-80, cursor-pointer
removable: tampilkan ikon × saat hover (fade in 120ms, 12px, warna sama dengan teks)
```

### Feel
- Badge tidak animate sendiri — muncul/hilang via transisi parent
- Jika count berubah (notif count): animate number saja dengan bounce sekali, bukan container
- JANGAN animate perubahan warna badge

### Anti-patterns
```
❌ rounded-full untuk status/label badge — hanya untuk count avatar badge
❌ font-weight 600+ dalam badge
❌ font-size di bawah 10px
❌ Lebih dari 3 badge berjejer tanpa overflow handling
❌ ALL CAPS untuk badge deskriptif (OK untuk kode pendek: "KEJAR", "TINJAU")
```

---

## COMPONENT 3: Input

### Anatomy
```
[ label 12px, gap 6px di atas ]
[ icon? 16px | text 13px flex-1 | trailing-icon/action? ]
  12px left padding              12px right padding

height: 36px (default), 32px (sm), 42px (lg)
border-radius: 8px
border: 0.5px
```

### States

```
default:
  dark:  bg #120D22, border rgba(255,255,255,0.10), text #EDE8FF, placeholder #5C4F7A
  light: bg #FFFFFF,  border rgba(0,0,0,0.10),      text #150D2E, placeholder #9080B0

hover:
  border sedikit lebih tegas: rgba(255,255,255,0.15) / rgba(0,0,0,0.15)

focus:
  border: 0.5px [accent-600]/50
  ring:   box-shadow 0 0 0 3px [accent-rgb]/15 (dark) / [accent-rgb]/12 (light)
  BUKAN outline — gunakan box-shadow untuk kontrol warna custom
  placeholder: opacity turun ke 0.6

filled (ada value):
  border kembali ke default — tidak persistent highlight
  text: text-primary

disabled:
  opacity-50, cursor-not-allowed
  bg: lebih muted, border: lebih tipis

error:
  border: red-500/60
  ring: red-500/15
  Di bawah input: error message 12px text-red-500, gap 4px, dengan AlertCircle 12px

success (validated):
  trailing icon: CheckCircle 14px text-teal-500
  border tetap default — JANGAN warnai border hijau (terlalu ramai)
```

### Feel
- Focus ring muncul INSTAN — tidak ada transition pada ring
- Border transition: `transition-colors duration-150`
- Label selalu di atas (bukan floating label) — TIDAK pernah bergerak
- Error message slide in: `animate-[slideDown_150ms_ease-out]`

### Tailwind Reference

```jsx
// Label
"text-[12px] text-[var(--color-text-secondary)] font-medium"

// Input dark
"w-full h-9 bg-[#120D22] border border-white/10 rounded-[8px] px-3
 text-[13px] text-[#EDE8FF] placeholder-[#5C4F7A]
 hover:border-white/[0.15]
 focus:outline-none focus:border-[var(--accent-600)]/50
 focus:[box-shadow:0_0_0_3px_rgba(124,58,237,0.15)]
 disabled:opacity-50 disabled:cursor-not-allowed
 transition-colors duration-150"

// Input light
"w-full h-9 bg-white border border-black/10 rounded-[8px] px-3
 text-[13px] text-[#150D2E] placeholder-[#9080B0]
 hover:border-black/[0.15]
 focus:outline-none focus:border-[var(--accent-600)]/50
 focus:[box-shadow:0_0_0_3px_rgba(124,58,237,0.12)]
 disabled:opacity-50 disabled:cursor-not-allowed
 transition-colors duration-150"

// Error message
"flex items-center gap-1 text-[12px] text-red-500 mt-1"
```

### Anti-patterns
```
❌ Floating/animated label yang bergerak saat focus
❌ Border merah penuh saat error — gunakan opacity 60%
❌ Animate ring/glow saat focus — harus muncul instan
❌ Placeholder sebagai pengganti label — selalu ada label terpisah di atas
❌ Height di bawah 32px — terlalu kecil untuk touch
```

---

## COMPONENT 4: Select / Dropdown

### Anatomy
```
Trigger (sama height/style dengan Input):
[ selected value atau placeholder ] [ ChevronDown 14px ]

Dropdown panel:
  [ search input — optional, jika > 8 opsi ]
  [ option item × N ]
  max-height: 240px, overflow-y: auto
  min-width: 100% width trigger
  border-radius: 10px
  border: 0.5px
  bg: bg-surface
  padding: 6px
  z-index: 50
```

### States
```
trigger closed: identik dengan Input default
trigger open:   border accent/50, ring sama dengan Input focus
                ChevronDown rotate 180deg — transition: rotate 150ms ease-out

dropdown appear:
  opacity 0 → 1, translateY 4px → 0, scale 0.98 → 1
  duration: 120ms ease-out

dropdown disappear:
  reverse, 80ms ease-in

option default:  bg transparent, text text-primary, px-3 py-2 text-[13px], rounded-[7px]
option hover:    bg-[var(--color-bg-elevated)]
option selected: bg-[accent]/10, text accent-600, Check 14px icon di kanan
option disabled: opacity-40, cursor-not-allowed, tidak ada hover effect

search in dropdown (jika ada):
  sama persis dengan Input component, border-radius 7px
  sticky di atas list, border-bottom 0.5px
```

### Feel
- Dropdown muncul dengan snappy ease-out — BUKAN spring (spring terasa salah untuk select)
- Max 8 opsi visible tanpa scroll — lebih dari itu wajib ada search
- ChevronDown rotation adalah sinyal utama open state — jangan skip
- Dropdown click-outside tutup: 0ms delay

### Anti-patterns
```
❌ Animate dropdown dengan slide-down only — gunakan opacity + translateY + scale
❌ Tutup dropdown saat hover opsi — hanya saat click
❌ z-index konflik — gunakan portal untuk dropdown di dalam modal
❌ Dropdown lebih sempit dari triggernya
❌ Scroll dalam dropdown tanpa scrollbar yang visible (gunakan overflow-y-auto)
```

---

## COMPONENT 5: Toggle / Switch

### Anatomy
```
Track:  width 36px, height 20px, border-radius: 9999px
Thumb:  width 16px, height 16px, border-radius: 9999px, bg white
        translateX: 2px (off) → 18px (on)
```

### States
```
off:    track bg-[var(--color-border)]/40 (muted, grayish)
        thumb: white, translateX(2px)

on:     track bg-[var(--accent-600)]
        thumb: white, translateX(18px)

hover off:  track bg-[var(--color-border)]/60
hover on:   track opacity 90%

focus:  ring-2 ring-[accent]/40 pada track (bukan thumb)

disabled:   opacity-40, cursor-not-allowed
            tetap tampilkan state yang benar, hanya dimuted

transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)  ← sedikit overshoot saat ON
            background-color 200ms ease-out
```

### Feel
- Ini SATU-SATUNYA komponen yang menggunakan spring transition (subtle overshoot saat "on")
- Saat "off": thumb slide balik tanpa overshoot (snappy)
- Track color berubah bersamaan dengan thumb movement

### Anti-patterns
```
❌ Track lebih kecil dari 34×18px — terlalu sulit di-tap
❌ Warna selain accent untuk state "on"
❌ Label teks di dalam track (gaya iOS — terlihat dated)
❌ Animate width track (hanya thumb position + track color yang berubah)
❌ Tidak ada visual feedback untuk disabled state
```

---

## COMPONENT 6: Sidebar

### Anatomy
```
width: 240px (expanded), 64px (collapsed)
height: 100vh, position: fixed left-0 top-0
dark:  bg #120D22, border-right 1px rgba(255,255,255,0.05)
light: bg #FFFFFF,  border-right 0.5px rgba(0,0,0,0.07)

Struktur atas-bawah:
┌───────────────────────────────┐
│ Logo + App Name  [ collapse ] │  h-14, px-3, border-bottom 0.5px
├───────────────────────────────┤
│ Section label (optional)      │  11px uppercase, text-muted, px-3, mt-5 mb-1
│ Nav item                      │  height 38px, px-2, rounded-[8px]
│ Nav item (active)             │
│ Nav item                      │
│                               │
│     flex-1 spacer             │
│                               │
├───────────────────────────────┤
│ User avatar + name            │  h-14, px-3, border-top 0.5px
└───────────────────────────────┘
```

### Nav Item States
```
default:
  dark:  text-[#5C4F7A], icon same color
         hover: text-[#9580BE], bg rgba(255,255,255,0.04)
  light: text-[#5B4D7A]
         hover: text-[#150D2E], bg rgba(0,0,0,0.04)
  transition: colors 120ms ease-out

active:
  dark:  bg-[var(--accent-bg-active-dark)], text-[#A78BFA], icon sama
  light: bg-[var(--accent-100)],            text-[var(--accent-600)], icon sama
  TIDAK ada hover/active:scale — active state bersifat persisten (route saat ini)

dengan badge (unread count):
  badge: h-5 min-w-5 bg-[accent-600] text-white text-[10px] rounded-full
         posisi: ml-auto (kanan item)

collapsed state (64px):
  sembunyikan label teks dan section labels
  tengahkan icon dalam 40×40px
  active item: tampilkan left accent bar (3px lebar, full height item, bg-accent-600)
  hover: tampilkan tooltip kanan + 12px berisi label teks
```

### Logo Zone
```
Logo icon:       26×26px, bg-[accent-600], border-radius 7px, icon white 14px
App name:        13px/500, text-primary
Collapse toggle: ChevronLeft/Right 16px, text-muted, hover:text-primary
                 posisi: end of logo row atau absolute right-3
```

### Collapse Animation
```
width: 240px → 64px
transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1)

label text collapse: opacity 1 → 0, duration 100ms (hilang SEBELUM width selesai)
label text expand:   opacity 0 → 1, duration 150ms, delay 150ms (muncul SETELAH width settle)
```

### Anti-patterns
```
❌ Drop shadow pada sidebar — flat, border only
❌ hover:scale pada nav item — terlalu bouncy untuk navigasi
❌ Active bg muncul saat hover non-active item — active state HANYA untuk current route
❌ Tooltip saat sidebar expanded — redundan
❌ Collapse di bawah 64px — icon butuh breathing room
❌ Lebih dari 8 nav item tanpa section label grouping
```

---

## COMPONENT 7: Topbar

### Anatomy
```
height: 56px
bg: sama dengan page bg (menyatu dengan konten — BUKAN bg-surface)
border-bottom: 0.5px — muncul hanya saat scroll
position: sticky top-0, z-10

Struktur:
[ Page title 16px/500 ] ──────────────── [ Search ] [ Bell ] [ Avatar ]
  kiri                                          kanan, gap-2
```

### States
```
top of page:  tidak ada border-bottom (atau 0.5px sangat subtle/invisible)
saat scroll:  border-bottom muncul: transition border-color 200ms ease-out
              bg bisa sedikit lebih opaque (optional)

search trigger:
  dark:  bg #1A1332, border rgba(255,255,255,0.08), text #5C4F7A
         hover: border rgba(255,255,255,0.15), text #9580BE
  light: bg #EFEBFF, border rgba(0,0,0,0.08), text #9080B0
         hover: border rgba(0,0,0,0.15)
  height: 32px, width: 200px → 280px saat focus
  width transition: 200ms ease-out
  border-radius: 8px
  placeholder: "Cari..." + "⌘K" hint 12px text-muted

bell button:
  32×32px, rounded-[8px]
  default: text-muted
  hover: bg-[var(--color-bg-elevated)], text text-secondary
  dengan notif: red dot 6×6px absolute top-1 right-1 bg-red-500

avatar:
  32×32px circle, bg-[accent-600], initials 12px/500 white
  hover: opacity-90
  click: buka user dropdown
```

### Anti-patterns
```
❌ Topbar sticky dengan bg opacity berat — visual noise saat scroll
❌ Lebih dari 3 action item di cluster kanan
❌ Animate page title saat route berubah — text langsung update
❌ Breadcrumb di dalam topbar untuk halaman simple
```

---

## COMPONENT 8: AppSwitcher

### Anatomy
```
Trigger: icon button 32×32px di sidebar logo zone atau topbar
         tampilkan LayoutGrid 16px atau icon app aktif

Dropdown panel:
  width: 220px
  border-radius: 12px
  border: 0.5px
  bg: bg-surface
  padding: 8px

App items (list atau 2-column grid):
  tiap item: rounded-[8px], padding 10px, display flex, gap-2
  [ app icon 28×28px rounded-[8px] bg-[app-accent] ] [ app name 12px/500 ]
  active:    bg-[accent]/10, checkmark icon 12px di kanan
  hover:     bg-[var(--color-bg-elevated)]
```

### Feel
```
appear:     opacity 0→1, scale 0.96→1, translateY 4px→0, 130ms ease-out
            transform-origin: top-left (dari posisi trigger)
disappear:  reverse, 90ms ease-in

active app: accent dot atau checkmark pada icon corner
```

### Anti-patterns
```
❌ Jangan tampilkan app yang user tidak punya akses (filter by role)
❌ Jangan animate icon app aktif — static indicator saja
```

---

## COMPONENT 9: Card (Surface)

### Anatomy
```
dark:  bg #1A1332, border 0.5px rgba(255,255,255,0.07)
light: bg #FFFFFF,  border 0.5px rgba(0,0,0,0.07)
border-radius: 10px (default), 14px (large panel)
padding: 16px (default), 12px (compact), 20px (spacious)
```

### Variants
```
surface (default):
  tidak ada hover — pure container
  
interactive card:
  hover: border rgba(255,255,255,0.12) / rgba(0,0,0,0.12)
  cursor: pointer
  transition: border-color 120ms ease-out
  TIDAK ada scale pada large card — disorienting

selected card:
  border: 1.5px [accent-600]  ← sedikit lebih tebal sebagai sinyal selected
  bg: [accent]/5

danger zone card (destruktif):
  border: red-500/20
  bg: red-500/5
```

### Card Header Pattern
```
[ Title 14px/500 ] ─────────────── [ action(s) ]
[ Subtitle 12px text-secondary ]

Divider bawah header (opsional):
  border-b 0.5px, margin: 12px -16px (extend to card edges)
```

### Anti-patterns
```
❌ Card di dalam card — maksimal 1 level nesting
❌ Drop shadow — border only
❌ border-radius di atas 14px
❌ Animate card width/height (layout shift)
❌ bg-surface untuk elevated card — gunakan bg-elevated
```

---

## COMPONENT 10: Stat / Metric Card

### Anatomy
```
bg: bg-elevated, border-radius: 10px, padding: 14px 16px

[ section label 10px uppercase text-muted, letter-spacing 0.06em ]
[ big number 24–28px/500 accent-color atau text-primary ]
[ delta badge? ] + [ sub-label 12px text-secondary ]
[ sparkline chart? — optional, right-aligned atau di bawah ]
```

### Delta Badge
```
positif: bg-teal/10  text-teal-600 (light) / text-teal-300 (dark)  — "↑ 12.5%"
negatif: bg-red/10   text-red-600  (light) / text-red-300  (dark)  — "↓ 3.2%"
netral:  bg-border   text-secondary                                 — "→ 0%"

font: 11px/500, padding 2px 6px, border-radius 4px
```

### Sparkline (jika ada)
```
stroke-width: 1.5px
fill: TIDAK ada (line only)
dots: TIDAK ada
color: accent-400 (dark) / accent-600 (light)
area: 40px height, 60–80px width, right-aligned dalam card
```

### Anti-patterns
```
❌ Animate angka counting up saat halaman load — distracting di dashboard
❌ Lebih dari 2 desimal dalam angka metrik
❌ Lebih dari 4 metric card dalam 1 baris
❌ Icon di dalam area angka metrik — tempatkan di label zone
❌ Sparkline dengan area fill + dots — terlalu ramai
```

---

## COMPONENT 11: Table

### Anatomy
```
Container: overflow-x-auto, border-radius 10px, border 0.5px
Table: width 100%, border-collapse collapse

Header row:
  bg: bg-elevated
  text: 11px/500, text-muted, UPPERCASE, letter-spacing 0.06em
  padding: 10px 16px
  border-bottom: 0.5px border

Body rows:
  height: 48px (default), 40px (compact), 56px (comfortable)
  padding: 0 16px
  border-bottom: 0.5px border (row terakhir: tidak ada border)
  text: 13px text-primary (kolom utama), 13px text-secondary (metadata)

hover row: bg-[var(--color-bg-elevated)]
selected row: bg-[accent]/8, border-left: 2px solid accent-600 (left accent strip)

checkbox column (jika ada):
  width: 40px
  checkbox: 16×16px, rounded-[4px]
  header checkbox: indeterminate state jika sebagian row dipilih
```

### Sortable Column Header
```
default:    text-muted, tidak ada sort icon
hover:      text-secondary, tampilkan ChevronsUpDown 12px (netral)
sorted asc: text-primary, ChevronUp 12px accent color
sorted desc:text-primary, ChevronDown 12px accent color
transition: text color 120ms ease-out
```

### Sticky Header
```
position: sticky, top: 0
bg HARUS match container bg — tidak bisa transparan (overlap rows saat scroll)
border-bottom tetap visible saat scroll
```

### Anti-patterns
```
❌ Zebra striping (alternating row bg) — terlalu noisy dengan palette gelap
❌ Column dividers — hanya row border
❌ Row height > 64px — gunakan expandable row
❌ Animate row reorder — langsung re-render
❌ Overflow teks tanpa truncation — gunakan ellipsis + tooltip on hover
```

---

## COMPONENT 12: Kanban Board & Card

### Board Anatomy
```
Layout: flex row, horizontal scroll
Columns: min-width 280px, max-width 320px, gap 12px
Board padding: 16px horizontal
Column body: overflow-y-auto, max-height: calc(100vh - topbar - col-header)
```

### Column
```
bg: bg-surface (satu level di atas cards)
border-radius: 12px
padding: 8px, gap between cards: 6px

Header (height 40px):
  [ status label 12px/500 ] [ count badge ] ──── [ + ] [ ⋯ ]
  border-bottom: 0.5px, margin-bottom: 8px

Count badge:
  bg-elevated, text-muted, 10px, px-2 py-0.5, rounded-full
  UPDATE instan saat card dipindah (optimistic)

Drag-over state:
  bg sedikit berubah ke bg-elevated
  dashed border: 1.5px accent-600/30, border-radius 12px
  transition: background 150ms
```

### Kanban Card
```
bg: bg-elevated
border: 0.5px
border-radius: 10px
padding: 12px
cursor: grab (default), grabbing (saat drag)

Struktur:
[ source badge 10px ] ────────────────── [ ⋯ ]
[ Title 13px/500, max 2 baris, line-clamp-2 ]
[ agency 12px text-secondary, truncate ]
[ ────────────────────────────────────── ]
[ score badge ] ──────────────── [ deadline 11px text-muted ]

Score badge: KEJAR/TINJAU/LEWATI sesuai design token
Deadline: text-red-500 jika ≤ 7 hari, text-muted otherwise
```

### Drag States
```
card sedang didrag (ghost di posisi asal):
  opacity: 0.40

clone yang mengikuti cursor:
  opacity: 1
  scale: 1.02
  box-shadow: 0 8px 24px rgba(0,0,0,0.4)  ← PENGECUALIAN: hanya saat drag
  cursor: grabbing

drop target slot (diantara cards):
  height: sama dengan card yang didrag
  bg: accent-600/10
  border: 1px dashed accent-600/40
  border-radius: 10px
  muncul di antara items menunjukkan posisi drop
```

### Feel
- Cards snap ke posisi drop — BUKAN spring
- Column counter update instan (optimistic UI)
- Drop ke posisi sama: card snap balik instan, tanpa animasi

### Anti-patterns
```
❌ Animate card enter/exit dalam column — hanya saat drag
❌ Shadow pada card dalam kondisi normal — hanya saat dragging
❌ Column lebih sempit dari 260px
❌ Column header dengan warna berbeda per status — gunakan teks berwarna saja
❌ Animate column count badge saat berubah
```

---

## COMPONENT 13: Modal

### Anatomy
```
Overlay: fixed inset-0, bg rgba(0,0,0,0.60) [dark] / rgba(0,0,0,0.40) [light]
         backdrop-blur: TIDAK (berat di GPU)
         z-50

Panel:
  posisi: fixed, centered via flex overlay
  width: 480px (default), 600px (wide/form), 360px (confirm)
  max-height: 85vh
  bg: bg-surface
  border: 0.5px
  border-radius: 14px
  overflow: hidden

Struktur:
┌─────────────────────────────────────┐
│ [ Title 16px/500 ]  ──── [ X 16px ]│  padding 16px 20px, border-bottom 0.5px
├─────────────────────────────────────┤
│  Content area                        │  padding 20px
│  overflow-y: auto                    │  max-height: calc(85vh - 56px - 56px)
├─────────────────────────────────────┤
│  [ Cancel ]      [ Primary action ] │  padding 12px 20px, border-top 0.5px
└─────────────────────────────────────┘
  footer buttons: right-aligned, gap-2
```

### Animation
```
appear:
  overlay: opacity 0→1, 150ms ease-out
  panel:   opacity 0→1, scale 0.96→1, translateY 8px→0, 180ms ease-out
           panel LEBIH LAMBAT dari overlay (overlay settle dulu)

disappear:
  panel:   opacity 1→0, scale 1→0.96, translateY 0→4px, 120ms ease-in
           panel keluar LEBIH DULU dari overlay
  overlay: opacity 1→0, 100ms ease-in (dengan delay 40ms)

close triggers: tombol X, Escape key, click overlay (configurable)

state loading (form submit):
  primary button → loading state
  disable semua input + cancel button
  JANGAN tutup modal saat loading
```

### Confirm Dialog (destruktif)
```
width: 360px (lebih sempit — fokus)
Tidak ada content scroll
Icon: AlertTriangle 20px text-amber-500 (di atas title)
Title: "Hapus [nama item spesifik]?" — JANGAN generic "Apakah kamu yakin?"
Body:  Satu kalimat konsekuensi
Buttons: [ Batal (neutral) ] [ Hapus (danger-solid) ]
```

### Anti-patterns
```
❌ backdrop-blur — berat di banyak GPU
❌ Konten modal overflow tanpa internal scroll
❌ Modal di dalam modal — maksimal 1 level
❌ Auto-close setelah sukses (kecuali confirm sederhana)
❌ Overlay dan panel timing sama — panel harus lead saat close
❌ Title generik "Apakah kamu yakin?" — selalu sebutkan nama itemnya
❌ Form submit tanpa loading state
```

---

## COMPONENT 14: Toast / Notification

### Anatomy
```
posisi: fixed bottom-4 right-4 (pilih satu posisi, konsisten)
z-index: 60 (di atas modal)
width: 320px
border-radius: 10px
border: 0.5px
padding: 12px 14px

Struktur:
[ icon 16px ] [ title 13px/500 ] ──────── [ X 14px ]
              [ message 12px text-secondary ] (optional)

progress bar (optional):
  2px height di bagian bawah toast
  bg: accent-600 untuk info, teal untuk success, dst
  width: 100% → 0% selama duration (CSS animation)
```

### Variants

| Type | Icon | Color | Left border |
|---|---|---|---|
| success | CheckCircle | teal-500 (dark: teal-300) | 2px teal-500 |
| warning | AlertTriangle | amber-500 | 2px amber-500 |
| error | XCircle | red-500 | 2px red-500 |
| info | Info | accent-400 | 2px accent-600 |
| default | — | — | tidak ada |

### Animation
```
appear (dari kanan):
  translateX 24px→0, opacity 0→1, 200ms ease-out

disappear (ke kanan):
  translateX 0→24px, opacity 1→0, 150ms ease-in

stacking (multiple toasts):
  toast baru masuk dari bawah, existing toast terangkat
  max 3 visible — yang lebih lama auto-dismiss atau di-stack di bawah

auto-dismiss: 4000ms (info/success), 6000ms (error — perlu lebih lama dibaca)
hover: pause auto-dismiss timer
```

### Anti-patterns
```
❌ Posisi top-center — menghalangi konten
❌ Auto-dismiss error < 5 detik
❌ Action button di dalam toast — gunakan inline notification
❌ Stack lebih dari 3 toast — dismiss yang paling lama
❌ Toast untuk background operation yang tidak dipicu user
```

---

## COMPONENT 15: Empty State

### Anatomy
```
Container: centered, padding 48px vertical
width: fit-content, max-width 320px, margin: auto

[ Icon 40px, text-muted ]     ← outline only, JANGAN filled
[ Title 15px/500 ]             ← spesifik, bukan "No data"
[ Description 13px text-secondary, max 2 baris ]
[ CTA button (opsional) ]      ← primary action untuk fix empty state

gap: 8px (icon→title), 6px (title→desc), 16px (desc→button)
```

### Copy Rules (PENTING)
```
❌ "No data found"        → ✅ "Belum ada tender"
❌ "No results"           → ✅ "Tidak ada tender yang cocok dengan filter ini"
❌ "Nothing here yet"     → ✅ "Tambah proyek pertamamu"

Title:   spesifik ke jenis data (tender, project, karyawan, KBLI)
Desc:    "mengapa" (first time) ATAU "cara fix" (filtered empty)
Button:  aksi konkret — "Tambah Tender", "Reset Filter", bukan "Get Started"
```

### Variants
```
first-empty (belum ada data sama sekali):
  tampilkan CTA button, tone encouraging
  icon: relevan ke tipe data (FileSearch untuk tender, Users untuk HR, dll)

filtered-empty (data ada tapi tidak ada yang match):
  tampilkan "Reset Filter" atau "Ubah filter"
  icon: Search atau Filter
  deskripsi fokus ke filter, bukan ke create data

error-empty (gagal load):
  icon: WifiOff atau AlertTriangle
  title: "Gagal memuat data"
  desc: "Coba lagi atau hubungi support jika masalah terus berlanjut"
  button: "Coba Lagi" → trigger refetch
```

### Anti-patterns
```
❌ Emoji sedih/rusak sebagai icon
❌ Tampilkan empty state saat masih loading — tampilkan skeleton
❌ Animate icon empty state (bounce, pulse) — terasa mainan
❌ Generic copy — SELALU sebutkan tipe data spesifik
```

---

## COMPONENT 16: Loading Skeleton

### Anatomy
```
Cocokkan PERSIS dengan shape konten yang sedang diload:
  Text line:   height 12–14px, border-radius 4px, lebar bervariasi
  Avatar:      circle, ukuran exact sama dengan target
  Card:        dimensi sama dengan card target
  Table row:   height 48px, kolom dengan lebar perkiraan
  Metric card: dimensi sama, placeholders untuk label + number
```

### Animation
```
Shimmer sweep (BUKAN opacity pulse):
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 75%
  )
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

dark:  --skeleton-base: #1A1332; --skeleton-highlight: #221A42
light: --skeleton-base: #EFEBFF; --skeleton-highlight: #F7F4FF
```

### Rules
```
- SELALU tampilkan skeleton untuk initial page load (jangan blank/empty)
- Tampilkan skeleton hanya untuk load ≥ 400ms
  (lebih cepat dari itu: jangan tampilkan — lebih jarring daripada langsung render konten)
- Gunakan jumlah skeleton rows yang sama dengan jumlah konten yang diharapkan (default: 5)
- Hapus skeleton INSTAN saat data datang (tidak perlu fade-out)
- Match border-radius dengan konten target
- JANGAN pakai warna accent untuk skeleton — gunakan neutral muted saja
```

### Anti-patterns
```
❌ Spinner sebagai pengganti skeleton untuk list/table load
❌ Generic rectangle blocks yang tidak match shape konten
❌ Animate dengan pulse (opacity change) — gunakan shimmer sweep
❌ Tampilkan skeleton untuk load < 400ms
❌ Tampilkan error state sementara skeleton masih visible
❌ Skeleton berwarna (accent, merah, dll) — neutral only
```

---

## Quick Reference: Transition Timing

| Interaksi | Duration | Easing |
|---|---|---|
| Button hover/active | 120ms | ease-out |
| Input border/color | 150ms | ease-out |
| Dropdown/popover appear | 120ms | ease-out |
| Dropdown/popover disappear | 80ms | ease-in |
| Modal appear | 180ms | ease-out |
| Modal disappear | 120ms | ease-in |
| Sidebar collapse/expand | 250ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Sidebar label text | 100ms (hide) / 150ms+150ms delay (show) | ease-out |
| Toggle thumb | 200ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Toggle track color | 200ms | ease-out |
| Toast appear | 200ms | ease-out |
| Toast dismiss | 150ms | ease-in |
| Input focus ring | 0ms | INSTAN |
| Table row hover | 100ms | ease-out |
| Card interactive border | 120ms | ease-out |
| AppSwitcher appear | 130ms | ease-out |
| Page transition | 200ms | ease-out |
| ChevronDown rotation (select) | 150ms | ease-out |
| Search input expand | 200ms | ease-out |
| Topbar border appear on scroll | 200ms | ease-out |

---

## Quick Reference: Component Dimensions

| Komponen | Default | Compact | Large |
|---|---|---|---|
| Button height | 36px | 30px | 42px |
| Input height | 36px | 32px | 42px |
| Select trigger | 36px | 32px | — |
| Table row height | 48px | 40px | 56px |
| Topbar height | 56px | — | 64px |
| Sidebar width expanded | 240px | — | — |
| Sidebar width collapsed | 64px | — | — |
| Sidebar nav item height | 38px | — | — |
| Sidebar logo zone height | 56px | — | — |
| Card padding | 16px | 12px | 20px |
| Card border-radius | 10px | — | 14px |
| Modal width default | 480px | 360px (confirm) | 600px |
| Modal border-radius | 14px | — | — |
| Toast width | 320px | — | — |
| Toast border-radius | 10px | — | — |
| Kanban column min-width | 280px | — | 320px |
| Kanban card border-radius | 10px | — | — |
| Avatar size (topbar/nav) | 32px | — | — |
| Icon size (nav sidebar) | 16px | — | — |
| Icon size (button inline) | 14px | — | — |
| Icon size (header/standalone) | 20px | — | — |
| Icon size (empty state) | 40px | — | — |

---

## AI Prompt Block — Copy-Paste Siap Pakai

Saat minta AI generate komponen, sertakan blok ini + section komponen yang relevan:

```
DESIGN SYSTEM RULES (WAJIB DIIKUTI — tidak ada pengecualian):

BASE TOKENS:
Dark:  bg-base #0B0719 · bg-surface #120D22 · bg-elevated #1A1332
       border rgba(255,255,255,0.07)
       text-primary #EDE8FF · text-secondary #9580BE · text-muted #5C4F7A
Light: bg-base #F7F4FF · bg-surface #FFFFFF · bg-elevated #EFEBFF
       border rgba(0,0,0,0.07)
       text-primary #150D2E · text-secondary #5B4D7A · text-muted #9080B0

ACCENT (sesuaikan per app):
  Project Maker:  --accent-600 #7C3AED · --accent-active-dark rgba(124,58,237,0.18) · --accent-light #EDE9FF
  Admin CMS:      --accent-600 #2563EB · --accent-active-dark rgba(37,99,235,0.18)  · --accent-light #EFF6FF
  Project Mgmt:   --accent-600 #0F9172 · --accent-active-dark rgba(15,145,114,0.18) · --accent-light #ECFDF5

TYPOGRAPHY:
  Font: Inter · Weight: 400 (body) dan 500 (heading/metric) ONLY — jangan 600 atau 700
  Sentence case — tidak ada ALL CAPS kecuali label 10–11px

BORDERS & RADIUS:
  Border: 0.5px · Radius: 8px (button/input), 10px (card/table), 14px (modal/panel)

ALWAYS:
  transition-all duration-[120ms] ease-out pada interactive element
  active:scale-[0.97] pada button/chip
  focus-visible:ring-2 focus-visible:ring-[accent]/40 pada semua interactive
  lucide-react untuk semua icon: size 16 (nav), 14 (inline), 20 (header)

NEVER:
  font-weight 600 atau 700
  border-radius di atas 14px (kecuali pill = 9999px)
  gradients (bg-gradient-*, gradient-to-*)
  box-shadow / drop-shadow (kecuali saat dragging kanban card)
  colored outer container background
  Tailwind gray-* — gunakan token hex di atas
  floating/animated label pada input
```
