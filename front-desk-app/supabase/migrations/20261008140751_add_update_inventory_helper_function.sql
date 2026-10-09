create or replace function public.apply_inventory_movement(
  p_inventory_id   uuid,
  p_user_id        uuid,
  p_movement_type  text,
  p_quantity       numeric,     -- signed: positive = 'in', negative = 'out'
  p_reference_type text,
  p_notes          text
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_qty numeric;
begin
  if p_movement_type not in ('in', 'out') then
    raise exception 'Invalid movement_type: %', p_movement_type;
  end if;

  insert into public.inventory_movements
    (inventory_id, movement_type, quantity, reference_type, performed_by, notes)
  values
    (p_inventory_id, p_movement_type, p_quantity, p_reference_type, p_user_id, p_notes);

  update public.inventory
     set current_quantity = coalesce(current_quantity, 0) + p_quantity
   where id = p_inventory_id
  returning current_quantity into v_new_qty;

  if v_new_qty is null then
    raise exception 'Inventory item % not found', p_inventory_id;
  end if;

  return v_new_qty;
end;
$$;

-- Reload PostgREST's schema cache so the RPC is discoverable immediately
notify pgrst, 'reload schema';