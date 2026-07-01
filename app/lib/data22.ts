import { invoices, customers, revenue } from './placeholder-data';
import { formatCurrency } from './utils';
import type {
  CustomerField,
  InvoiceForm,
  InvoicesTable,
  FormattedCustomersTable,
  Revenue,
} from './definitions';

// Stable IDs for invoices (placeholder data doesn't include them; the DB auto-generates them)
const invoiceIds = [
  '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
  '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d',
  '4a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d',
  '5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d',
  '6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d',
  '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
  '8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d',
  '9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d',
  '0b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e',
  '1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e',
  '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
];

const invoicesWithId = invoices.map((invoice, i) => ({
  ...invoice,
  id: invoiceIds[i],
}));

const ITEMS_PER_PAGE = 6;

export async function fetchRevenue() {
  try {
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('Data fetch completed after 3 seconds.');
    return [...revenue];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const sorted = [...invoicesWithId]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return sorted.map((invoice) => {
      const customer = customers.find((c) => c.id === invoice.customer_id)!;
      return {
        id: invoice.id,
        name: customer.name,
        image_url: customer.image_url,
        email: customer.email,
        amount: formatCurrency(invoice.amount),
      };
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const numberOfInvoices = invoicesWithId.length;
    const numberOfCustomers = customers.length;

    const totalPaidInvoices = formatCurrency(
      invoicesWithId
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0),
    );

    const totalPendingInvoices = formatCurrency(
      invoicesWithId
        .filter((i) => i.status === 'pending')
        .reduce((sum, i) => sum + i.amount, 0),
    );

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  try {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const q = query.toLowerCase();

    let results = invoicesWithId
      .map((inv) => {
        const customer = customers.find((c) => c.id === inv.customer_id)!;
        return {
          id: inv.id,
          customer_id: inv.customer_id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
          date: inv.date,
          amount: inv.amount,
          status: inv.status as 'pending' | 'paid',
        };
      })
      .filter((inv) => {
        if (!query) return true;
        return (
          inv.name.toLowerCase().includes(q) ||
          inv.email.toLowerCase().includes(q) ||
          String(inv.amount).includes(q) ||
          inv.date.includes(q) ||
          inv.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return results.slice(offset, offset + ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const q = query.toLowerCase();

    const count = invoicesWithId.filter((inv) => {
      if (!query) return true;
      const customer = customers.find((c) => c.id === inv.customer_id)!;
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        String(inv.amount).includes(q) ||
        inv.date.includes(q) ||
        inv.status.toLowerCase().includes(q)
      );
    }).length;

    return Math.ceil(count / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const invoice = invoicesWithId.find((i) => i.id === id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return {
      id: invoice.id,
      customer_id: invoice.customer_id,
      amount: invoice.amount / 100,
      status: invoice.status as 'pending' | 'paid',
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    return customers
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const q = query.toLowerCase();

    const results = customers
      .filter((c) => {
        if (!query) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      })
      .map((customer) => {
        const customerInvoices = invoicesWithId.filter(
          (i) => i.customer_id === customer.id,
        );
        const totalInvoices = customerInvoices.length;
        const totalPending = customerInvoices
          .filter((i) => i.status === 'pending')
          .reduce((sum, i) => sum + i.amount, 0);
        const totalPaid = customerInvoices
          .filter((i) => i.status === 'paid')
          .reduce((sum, i) => sum + i.amount, 0);

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
          total_invoices: totalInvoices,
          total_pending: formatCurrency(totalPending),
          total_paid: formatCurrency(totalPaid),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return results;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
