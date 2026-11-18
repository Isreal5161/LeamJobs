export const formatJobCompensation = (compensation: string) => compensation
  .replace(/\bNGN\b/gi, '₦')
  .replace(/\bUSD\b/gi, '$')
  .replace(/\d+(?:\.\d+)?/g, (amount) => {
    const value = Number(amount);
    return Number.isFinite(value) ? new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(value) : amount;
  });
