
export const MOCK_USER = {
    id: 'demo-user-id',
    email: 'demo@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: new Date().toISOString()
}

export const MOCK_BUSINESS = {
    id: 'demo-business-id',
    name: 'Demo Corp (Oak)',
    currency: 'USD',
    theme_preference: 'oak' as const,
    owner_id: 'demo-user-id',
    created_at: new Date().toISOString()
}

export const MOCK_CUSTOMERS = [
    { id: 'cust-1', name: 'Acme Corp', email: 'contact@acme.com', phone: '555-0100', business_id: 'demo-business-id', logo_url: null },
    { id: 'cust-2', name: 'Globex Inc', email: 'info@globex.com', phone: '555-0199', business_id: 'demo-business-id', logo_url: null }
]

export const MOCK_PROJECTS = [
    { id: 'proj-1', name: 'Website Redesign', status: 'active', customer_id: 'cust-1', business_id: 'demo-business-id', created_at: new Date().toISOString() },
    { id: 'proj-2', name: 'Mobile App', status: 'completed', customer_id: 'cust-2', business_id: 'demo-business-id', created_at: new Date().toISOString() }
]

export const MOCK_EXPENSES = [
    { id: 'exp-1', description: 'Hosting', amount: 150.00, category: 'Software', date: new Date().toISOString(), business_id: 'demo-business-id' },
    { id: 'exp-2', description: 'Office Supplies', amount: 45.50, category: 'Office', date: new Date().toISOString(), business_id: 'demo-business-id' },
    { id: 'exp-3', description: 'Client Lunch', amount: 85.00, category: 'Meals', date: new Date().toISOString(), business_id: 'demo-business-id' }
]

export const MOCK_INVOICES = [
    {
        id: 'inv-1',
        customer_id: 'cust-1',
        status: 'paid',
        invoice_number: 'INV-1001',
        issue_date: new Date().toISOString(),
        due_date: new Date().toISOString(),
        total_amount: 5000.00,
        business_id: 'demo-business-id',
        items: [{ description: 'Design', quantity: 1, unit_price: 5000, amount: 5000 }],
        customers: { name: 'Acme Corp', email: 'contact@acme.com', logo_url: null }
    },
    {
        id: 'inv-2',
        customer_id: 'cust-2',
        status: 'sent',
        invoice_number: 'INV-1002',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
        total_amount: 2500.00,
        business_id: 'demo-business-id',
        items: [{ description: 'Consulting', quantity: 10, unit_price: 250, amount: 2500 }],
        customers: { name: 'Globex Inc', email: 'info@globex.com', logo_url: null }
    }
]
