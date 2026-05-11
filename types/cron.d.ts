declare module 'cron' {
  export class CronJob {
    constructor(
      cronTime: string | Date,
      onTick: () => void,
      onComplete?: () => void,
      start?: boolean,
      timeZone?: string,
      context?: unknown,
      runOnInit?: boolean
    )
    start(): void
    stop(): void
  }
}
