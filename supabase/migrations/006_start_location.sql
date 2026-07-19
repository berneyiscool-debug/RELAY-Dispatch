-- v1.3 Maps: per-user dispatch start location.
-- {address: text, geo: {lat,lng,formattedAddress,placeId}} — when null, routing
-- falls back to the company office address.
alter table profiles
  add column if not exists start_location jsonb;
