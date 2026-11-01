import { StockInForm } from '@/components/StockInForm';

export default function StockInPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Stock receiving</h1>
        <p className="text-slate-600 text-sm mt-1">Official Model 19 receiving voucher entry.</p>
      </div>
      <StockInForm />
    </div>
  );
}
