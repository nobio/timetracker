"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { Loader2 } from "lucide-react";

interface ExtraHoursChartProps {
    timeUnit: "day" | "week" | "month" | "year";
    accumulate: boolean;
}

interface ExtraHourData {
    date: string; // ISO date format "YYYY-MM-DD" or similar timeUnit bucket string
    extra_hour: number;
    hour: number;
}

export function ExtraHoursChart({ timeUnit, accumulate }: ExtraHoursChartProps) {
    const { data: stats, isLoading, error } = useQuery<ExtraHourData[]>({
        queryKey: ["statistics", "extrahours", timeUnit, accumulate],
        queryFn: async () => {
            // The backend util checks accumulate === 'true' strictly.
            const { data, error } = await apiClient.GET("/statistics/extrahours", {
                params: {
                    query: {
                        timeUnit,
                        accumulate: accumulate ? true : false,
                    }
                }
            });
            if (error) throw new Error("Failed to fetch extra hours statistics");
            return data as unknown as ExtraHourData[];
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                <p>Loading Extra Hours statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                <p>Failed to load extra hours data.</p>
            </div>
        );
    }

    const chartData = stats || [];

    // Calculate color based on the final extra_hour value
    const finalBalance = chartData.length > 0 ? chartData[chartData.length - 1].extra_hour : 0;
    const isPositiveBalance = finalBalance >= 0;

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${isPositiveBalance ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                    }`}>
                    <p className={`text-sm font-medium mb-1 ${isPositiveBalance ? "text-emerald-600" : "text-rose-600"
                        }`}>
                        {accumulate ? "Total Accumulated Balance" : "Current Period Balance"}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                        {finalBalance > 0 ? "+" : ""}{Math.round(finalBalance * 10) / 10}h
                    </p>
                </div>
            </div>

            <div className="h-[400px] w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
                    >
                        <defs>
                            <linearGradient id="colorExtra" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ stroke: '#F1F5F9', strokeWidth: 2 }}
                            formatter={(value: number | undefined) => {
                                const display = value == null ? '—' : Math.round(value * 10) / 10;
                                return [display, 'Overtime Balance'];
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="extra_hour"
                            name="Overtime"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorExtra)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
