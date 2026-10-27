/**
 * SQL Server previously stored naive GETDATE() values without a timezone.
 * New orders use createdAtUtc, a real ISO-8601 instant from SYSUTCDATETIME().
 * Never guess an offset for legacy rows.
 */
const DEFAULT_RESTAURANT_TIME_ZONE = 'America/Sao_Paulo'
const configuredTimeZone = import.meta.env?.VITE_RESTAURANT_TIME_ZONE

export const formatOrderTime = (createdAtUtc, legacyCreatedAt = null) => {
  if (typeof createdAtUtc === 'string' &&
      /(?:Z|[+-]\d{2}:\d{2})$/i.test(createdAtUtc)) {
    const instant = new Date(createdAtUtc)
    if (Number.isFinite(instant.getTime())) {
      try {
        return new Intl.DateTimeFormat('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
          timeZone: configuredTimeZone || DEFAULT_RESTAURANT_TIME_ZONE,
        }).format(instant)
      } catch {
        // Unsupported IANA timezone: prefer local device formatting.
        return instant.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    }
  }

  // Historic values cannot be converted reliably: the database stored
  // a server-local wall clock with no offset or zone.
  const match = typeof legacyCreatedAt === 'string' &&
    legacyCreatedAt.match(/[T ](\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]} (servidor)` : '—'
}
