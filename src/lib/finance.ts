export function calcEMI(principal: number, annualRate: number, months: number) {
  const r = annualRate / 100 / 12;
  if (r === 0) return { emi: principal / months, totalInterest: 0, totalPayment: principal };
  const pow = Math.pow(1 + r, months);
  const emi = (principal * r * pow) / (pow - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;
  return { emi, totalInterest, totalPayment };
}

export const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export const fmt2 = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
