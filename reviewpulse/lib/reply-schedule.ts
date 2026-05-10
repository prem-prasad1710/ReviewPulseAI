import { DateTime } from 'luxon'

export interface ReplyScheduleConfig {
  enabled: boolean
  startHour: number
  endHour: number
  workingDays: number[]
  timezone: string
}

const defaultConfig: ReplyScheduleConfig = {
  enabled: false,
  startHour: 9,
  endHour: 18,
  workingDays: [1, 2, 3, 4, 5, 6],
  timezone: 'Asia/Kolkata',
}

export function mergeReplySchedule(
  partial?: Partial<ReplyScheduleConfig> | null
): ReplyScheduleConfig {
  if (!partial) return { ...defaultConfig }
  return {
    enabled: partial.enabled ?? defaultConfig.enabled,
    startHour: partial.startHour ?? defaultConfig.startHour,
    endHour: partial.endHour ?? defaultConfig.endHour,
    workingDays:
      Array.isArray(partial.workingDays) && partial.workingDays.length > 0
        ? partial.workingDays
        : defaultConfig.workingDays,
    timezone: partial.timezone || defaultConfig.timezone,
  }
}

/** Luxon ISO weekday 1=Mon..7=Sun → spec 0=Sun..6=Sat */
function toSpecWeekday(d: DateTime): number {
  return d.weekday === 7 ? 0 : d.weekday
}

/** Next slot inside working hours with ±10 min jitter. */
export function nextAvailableSlot(config: ReplyScheduleConfig, from: Date = new Date()): Date {
  const zone = config.timezone
  const start = DateTime.fromJSDate(from, { zone })
  let t = start.plus({ minutes: 2 })

  for (let i = 0; i < 200; i++) {
    const wd = toSpecWeekday(t)
    if (!config.workingDays.includes(wd)) {
      t = t.plus({ days: 1 }).set({ hour: config.startHour, minute: 0, second: 0, millisecond: 0 })
      continue
    }
    if (t.hour < config.startHour) {
      t = t.set({ hour: config.startHour, minute: 0, second: 0, millisecond: 0 })
    }
    if (t.hour >= config.endHour) {
      t = t.plus({ days: 1 }).set({ hour: config.startHour, minute: 0, second: 0, millisecond: 0 })
      continue
    }
    const jitterMs = Math.floor(Math.random() * 600_000) - 300_000
    const slot = t.plus({ milliseconds: jitterMs })
    if (slot <= start) {
      t = t.plus({ minutes: 5 })
      continue
    }
    if (
      toSpecWeekday(slot) !== wd ||
      slot.hour < config.startHour ||
      slot.hour >= config.endHour ||
      !config.workingDays.includes(toSpecWeekday(slot))
    ) {
      t = t.plus({ minutes: 10 })
      continue
    }
    return slot.toUTC().toJSDate()
  }

  return start.plus({ hours: 6 }).toUTC().toJSDate()
}
