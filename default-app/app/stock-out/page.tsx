import { StockOutForm } from '@/components/StockOutForm';

export default function StockOutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Stock issue</h1>
        <p className="text-slate-600 text-sm mt-1">Official Model 20 requisition and issue entry.</p>
      </div>
      <StockOutForm />
    </div>
  );
}
