
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    console.log('Checking expense_categories...')
    const { data: data1, error: error1 } = await supabase.from('expense_categories').select('*').limit(5)
    if (error1) console.error('Error expense_categories:', error1.message)
    else console.log('expense_categories data:', data1)

    console.log('Checking custom_expense_categories...')
    const { data: data2, error: error2 } = await supabase.from('custom_expense_categories').select('*').limit(5)
    if (error2) console.error('Error custom_expense_categories:', error2.message)
    else console.log('custom_expense_categories data:', data2)
}

checkTables()
