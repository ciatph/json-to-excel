import { z } from 'zod'

// Zod schema for TendayMunicipalityItem
const TendayMunicipalityItemSchema = z.object({
  cover: z.string(),
  day: z.number(),
  day_format: z.string(),
  day_str: z.string(),
  humidity: z.number(),
  municipality: z.string(),
  province: z.string(),
  rainfall: z.string(),
  rainfall_amt_text: z.string(),
  tmax: z.number(),
  tmean: z.number(),
  tmin: z.number(),
  wdirection: z.string(),
  wspeed: z.number(),
})

// Zod schema for TendayHistoricalItem
const TendayHistoricalItemSchema = z.object({
  date_archived: z.number(),
  date_archived_str: z.string(),
  date_created: z.number(),
  date_created_str: z.string(),
  date_end: z.string().nullable(),
  date_end_str: z.string().nullable(),
  date_forecast: z.string().nullable(),
  date_forecast_str: z.string().nullable(),
  date_range: z.string().nullable(),
  date_start: z.string().nullable(),
  date_start_str: z.string().nullable(),
  error: z.object({}).nullable(), // Assuming error can be any object
  id: z.string(),
  municipalities: z.record(z.array(TendayMunicipalityItemSchema)).nullable(), // Record of TendayMunicipalityItem
})

// Create (infer) TS types from zod
export type TendayHistoricalItem = z.infer<typeof TendayHistoricalItemSchema>
export type TendayMunicipalityItem = z.infer<typeof TendayMunicipalityItemSchema>

export {
  TendayHistoricalItemSchema,
  TendayMunicipalityItemSchema
}
