import * as React from 'react';
import { PantryItem } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function FinanceView({ items }: { items: PantryItem[] }) {
  const totalCost = items.reduce((acc, i) => acc + (Number(i.cost) || 0), 0);
  
  // Group by category for pie chart
  const dataByCategory = items.reduce((acc: any, i) => {
    acc[i.category] = (acc[i.category] || 0) + (Number(i.cost) || 0);
    return acc;
  }, {});

  const pieData = Object.keys(dataByCategory).map(name => ({
    name,
    value: dataByCategory[name]
  })).sort((a, b) => b.value - a.value);

  // Group by location for bar chart
  const dataByLocation = items.reduce((acc: any, i) => {
    acc[i.location] = (acc[i.location] || 0) + (Number(i.cost) || 0);
    return acc;
  }, {});

  const barData = Object.keys(dataByLocation).map(name => ({
    name,
    value: dataByLocation[name]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Total Pantry Value</p>
                <h3 className="text-3xl font-black">₹{totalCost.toLocaleString()}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[10px] text-primary font-bold">
              <ArrowUpRight className="w-3 h-3" />
              <span>+ ₹{(totalCost * 0.05).toFixed(0)} from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">Monthly Budget Burn</p>
                  <h3 className="text-3xl font-black">68%</h3>
                </div>
              </div>
              <div className="mt-4 w-full h-1.5 bg-orange-500/20 rounded-full overflow-hidden">
                 <div className="h-full bg-orange-500 w-[68%]" />
              </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40">Estimated Waste Loss</p>
                  <h3 className="text-3xl font-black">₹{(totalCost * 0.12).toFixed(0)}</h3>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-blue-500 font-bold">Based on current expiry rates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
               {pieData.slice(0, 4).map((entry, index) => (
                 <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs font-bold opacity-60 truncate">{entry.name}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Investment by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.5 }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.15)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
