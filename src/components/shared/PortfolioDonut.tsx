"use client";
import {PieChart,Pie,Cell,ResponsiveContainer,Tooltip} from "recharts";
import {cn} from "@/lib/utils";
export type PortfolioSlice={name:string;value:number;color?:string};
export type PortfolioDonutProps={data:PortfolioSlice[];onHover?:(slice:PortfolioSlice|null)=>void;className?:string;height?:number;innerRadius?:number;outerRadius?:number};
const palette=["var(--color-brand)","var(--color-success)","var(--color-warning)","var(--color-info)","var(--color-muted-foreground)"];
export function PortfolioDonut({data,onHover,className,height=240,innerRadius=62,outerRadius=88}:PortfolioDonutProps){return <div className={cn("w-full",className)}><ResponsiveContainer width="100%" height={height}><PieChart><Tooltip formatter={(value)=>[Number(value).toLocaleString(),"Value"]}/><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={3} stroke="var(--color-card)" strokeWidth={2} onMouseEnter={(entry)=>onHover?.(entry as PortfolioSlice)} onMouseLeave={()=>onHover?.(null)}>{data.map((s,i)=><Cell key={s.name} fill={s.color??palette[i%palette.length]}/>)}</Pie></PieChart></ResponsiveContainer></div>}