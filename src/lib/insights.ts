
export interface Insight {
    type: 'warning' | 'suggestion' | 'success'
    message: string
    action?: string
}

export function generateInsights(
    invoices: any[],
    expenses: any[],
    activeBusiness: any
): Insight[] {
    const insights: Insight[] = []

    // AR Analysis
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    const arTotal = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0)

    if (arTotal > 0) {
        insights.push({
            type: 'warning',
            message: `You have ${new Intl.NumberFormat('en-US', { style: 'currency', currency: activeBusiness?.currency || 'USD' }).format(arTotal)} in outstanding invoices.`,
            action: 'Review AR'
        })
    }

    // Expense Analysis
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    if (totalExpenses > 0) {
        // Find top category
        const categoryTotals: Record<string, number> = {}
        expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
        })
        const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

        if (topCategory) {
            const percent = Math.round((topCategory[1] / totalExpenses) * 100)
            if (percent > 30) {
                insights.push({
                    type: 'suggestion',
                    message: `Your highest expense is ${topCategory[0]} (${percent}% of total). Consider looking for cost-saving opportunities here.`,
                    action: 'View Expenses'
                })
            }
        }
    }

    // Contract Terms suggestion
    if (unpaidInvoices.some(i => new Date(i.due_date) < new Date())) {
        insights.push({
            type: 'warning',
            message: 'You have overdue invoices. Consider shortening your payment terms for new projects.',
            action: 'Edit Terms'
        })
    } else if (arTotal === 0 && invoices.length > 0) {
        insights.push({
            type: 'success',
            message: 'Great job! All invoices are paid. Your cash flow looks healthy.',
        })
    }

    return insights
}

export interface FinancialHealthData {
    month: string
    revenue: number
    expenses: number
    profit: number
    isProjected?: boolean
}

export function generateFinancialHealthData(
    invoices: any[],
    expenses: any[]
): FinancialHealthData[] {
    const data: FinancialHealthData[] = []
    const today = new Date()

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const monthKey = d.toLocaleString('default', { month: 'short' })
        const year = d.getFullYear()

        // Filter for this month
        const monthlyInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.issue_date)
            return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === year && inv.status !== 'cancelled'
        })

        const monthlyExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date)
            return expDate.getMonth() === d.getMonth() && expDate.getFullYear() === year
        })

        const revenue = monthlyInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
        const expenseTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)

        data.push({
            month: monthKey,
            revenue,
            expenses: expenseTotal,
            profit: revenue - expenseTotal
        })
    }

    // Simple Forecast (Projected next month)
    // Average growth of last 3 months
    const last3Months = data.slice(-3)
    const avgRevenue = last3Months.reduce((sum, d) => sum + d.revenue, 0) / 3
    const avgExpenses = last3Months.reduce((sum, d) => sum + d.expenses, 0) / 3

    // Add a slight "growth factor" for optimism/demo purposes
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    data.push({
        month: nextMonthDate.toLocaleString('default', { month: 'short' }),
        revenue: avgRevenue * 1.1,
        expenses: avgExpenses * 1.05,
        profit: (avgRevenue * 1.1) - (avgExpenses * 1.05),
        isProjected: true
    })

    return data
}
