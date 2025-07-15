import { SimpleProfitLossTable } from '@/components/profit-loss/SimpleProfitLossTable';

export default function ProfitLoss() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profit & Loss</h1>
        <p className="text-muted-foreground">
          View profit and loss data from Xero accounting system
        </p>
      </div>
      <SimpleProfitLossTable />
    </div>
  );
}