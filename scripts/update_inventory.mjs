import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ quiet: true })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE key in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const updateInventory = async ({userId, type, itemName, quantity}) => {
  console.log('Updating inventory...')
  console.log('User ID:', userId)
  console.log('Type:', type)
  console.log('Item Name:', itemName)
  console.log('Quantity:', quantity)

  // Update inventory
  const { data: existingInventoryData } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .eq('name', itemName)

  let inventoryId = existingInventoryData?.id  
  if (!existingInventoryData) {
    const { data: insertedInventoryData } = await supabase.from('inventory').insert({
        name: itemName,
        item_code: `${itemName}-001`.toLowerCase(),
        user_id: userId
    })
    inventoryId = insertedInventoryData?.id
  }

  const inventoryMovementType = type === 'in' ? 'in' : 'out'
  const quantityToUpdate = type === 'in' ? quantity : -quantity

  const { data: insertedInventoryMovementData } = await supabase.from('inventory_movements').insert({
      inventory_id: inventoryId,
      movement_type: inventoryMovementType,
      quantity: quantityToUpdate,
      user_id: userId
  })

  const { data: updatedInventoryData } = await supabase.from('inventory').update({
      current_quantity: existingInventoryData?.current_quantity + quantityToUpdate
  }).eq('id', inventoryId)

  console.log('Inventory updated successfully!')
}

updateInventory({
  userId: "1fbb9459-bea3-415a-abd5-5348f1afecdc",
  type: "in",
  itemName: "Plywood",
  quantity: 10
})