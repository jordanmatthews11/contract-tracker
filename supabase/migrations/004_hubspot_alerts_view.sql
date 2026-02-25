-- View: Syndicated HubSpot deals that have no matching deal_id in contracts.
-- Used by the Contracts page alert banner. Server-side NOT EXISTS is not subject
-- to any client row-limit caps.

create or replace view public.vw_hubspot_syndicated_missing as
select h.*
from public.hubspot_deals h
where h.fa_arr_type = 'Syndicated'
  and not exists (
    select 1 from public.contracts c where c.deal_id = h.hs_deal_id
  );
