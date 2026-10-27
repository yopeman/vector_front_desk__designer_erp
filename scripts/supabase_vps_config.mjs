import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: './.env.vps', quiet: false })

// Project 1: frontdesk
const frontdeskSupabaseUrl = process.env.FRONTDESK_SUPABASE_PUBLIC_URL
const frontdeskSupabaseKey = process.env.FRONTDESK_ANON_KEY

// Project 2: hr
const hrSupabaseUrl = process.env.HR_SUPABASE_PUBLIC_URL
const hrSupabaseKey = process.env.HR_ANON_KEY

// Project 3: store
const storeSupabaseUrl = process.env.STORE_SUPABASE_PUBLIC_URL
const storeSupabaseKey = process.env.STORE_ANON_KEY

// Check connection
async function checkSupabaseConnection(name, url, key) {
  console.log(`${name}: connection url ${url}`);
  
  try {
    // Perform a lightweight query (e.g., fetching a dummy selection or health check)
    // Replace 'your_table_name' with a valid table in your database, or just limit to 1 row
    const { data, error } = await createClient(url, key)
      .from('users') 
      .select('*')
      .limit(1)

    if (error) {
      throw error
    }

    console.log(`${name}: ✅ Supabase connection successful!`)
    console.log({data})
  } catch (error) {
    console.error(`${name}: ❌ Supabase connection failed:`, error.message)
  }
}

// Test
checkSupabaseConnection('Frontdesk', frontdeskSupabaseUrl, frontdeskSupabaseKey)
checkSupabaseConnection('Hr', hrSupabaseUrl, hrSupabaseKey)
checkSupabaseConnection('Store', storeSupabaseUrl, storeSupabaseKey,)
