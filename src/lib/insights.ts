
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
