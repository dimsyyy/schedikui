'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type {Category} from '@/lib/types';

type SpendingReportProps = {
  categories: Category[];
};

const chartConfig = {
  budget: {
    label: 'Budget',
    color: 'hsl(var(--chart-1))',
  },
  spent: {
    label: 'Spent',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function SpendingReport({categories}: SpendingReportProps) {
  const chartData = categories.map(cat => ({
    name: cat.name,
    budget: cat.budget,
    spent: cat.spent,
  }));

  const formatCurrency = (value: number) => `$${value.toFixed(0)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs. Spending</CardTitle>
        <CardDescription>
          A visual breakdown of your allocated budget versus actual spending per category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{top: 5, right: 20, left: -10, bottom: 5}}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrency}
                />
                <ChartTooltip
                  cursor={{fill: 'hsl(var(--muted))'}}
                  content={<ChartTooltipContent formatter={formatCurrency} />}
                />
                <Legend />
                <Bar
                  dataKey="budget"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="spent"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}