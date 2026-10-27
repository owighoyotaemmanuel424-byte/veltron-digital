"use client";
import { useState } from "react";
import { Bell, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UIPrimitivesPreview() {
  const { theme, setTheme } = useTheme();
  const [checked, setChecked] = useState(true);
  const [progress, setProgress] = useState(68);
  return <TooltipProvider delayDuration={200}><main className="min-h-screen bg-bg px-4 py-8 text-text sm:px-8">
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-brand">VELTRON DESIGN SYSTEM</p><h1 className="mt-2 text-3xl font-bold tracking-tight">UI primitives</h1><p className="mt-2 text-muted-foreground">Theme-aware, accessible foundations.</p></div><div className="flex items-center gap-2"><Button variant="outline" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Sun className="size-4" /> Toggle theme</Button><Button variant="ghost" aria-label="Notifications"><Bell /></Button></div></header>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Buttons & badges</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button>Default</Button><Button variant="brand">Brand</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button><Button size="sm">Small</Button><Button size="lg">Large</Button><Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="outline">Outline</Badge><Badge variant="success">Success</Badge><Badge variant="danger">Danger</Badge><Badge variant="warning">Warning</Badge><StatusPill label="Operational" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Inputs</CardTitle></CardHeader><CardContent className="space-y-4"><label className="block space-y-2 text-sm">Email address<Input type="email" placeholder="you@example.com" /></label><label className="block space-y-2 text-sm">Notes<Textarea placeholder="Add a note…" /></label><Select defaultValue="services"><SelectTrigger aria-label="Choose category"><SelectValue placeholder="Choose category" /></SelectTrigger><SelectContent><SelectItem value="services">Services</SelectItem><SelectItem value="orders">Orders</SelectItem><SelectItem value="account">Account</SelectItem></SelectContent></Select></CardContent></Card>
        <Card><CardHeader><CardTitle>Tabs & toggles</CardTitle></CardHeader><CardContent className="space-y-4"><Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList><TabsContent value="overview">Your workspace overview.</TabsContent><TabsContent value="activity">Recent account activity.</TabsContent><div className="flex flex-wrap items-center gap-4"><Toggle aria-label="Toggle notifications"><Bell className="size-4" /></Toggle><label className="flex items-center gap-2 text-sm"><Switch checked={checked} onCheckedChange={setChecked} /> Notifications {checked ? "on" : "off"}</label></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Overlays</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3"><Dialog><DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Confirm action</DialogTitle><DialogDescription>This is a theme-aware Radix dialog.</DialogDescription></DialogHeader><DialogFooter><Button>Got it</Button></DialogFooter></DialogContent></Dialog><Sheet><SheetTrigger asChild><Button variant="outline">Open sheet</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Quick panel</SheetTitle><SheetDescription>Drawer content goes here.</SheetDescription></SheetHeader></SheetContent></Sheet><Popover><PopoverTrigger asChild><Button variant="outline">Popover</Button></PopoverTrigger><PopoverContent>Popover content using theme tokens.</PopoverContent></Popover><Tooltip><TooltipTrigger asChild><Button variant="ghost">Hover or focus</Button></TooltipTrigger><TooltipContent>Accessible tooltip</TooltipContent></Tooltip></CardContent></Card>
        <Card><CardHeader><CardTitle>Feedback & loading</CardTitle></CardHeader><CardContent className="space-y-4"><Alert><AlertTitle>Heads up</AlertTitle><AlertDescription>This is a neutral alert using semantic tokens.</AlertDescription></Alert><Alert variant="success"><AlertTitle>All systems operational</AlertTitle><AlertDescription>Your settings are up to date.</AlertDescription></Alert><div className="flex items-center gap-3"><Spinner /><span className="text-sm text-muted-foreground">Loading preview data</span></div><Skeleton className="h-4 w-3/4" /><Skeleton className="h-10 w-full" /><div className="flex items-center gap-3"><Progress value={progress} className="max-w-sm" /><Button size="sm" variant="outline" onClick={() => setProgress(progress >= 100 ? 20 : progress + 10)}>{progress}%</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Empty state & separators</CardTitle></CardHeader><CardContent className="space-y-4"><EmptyState title="No activity yet" description="Your recent activity will appear here." actionLabel="Explore services" actionHref="/services" /><Separator /><div className="text-sm text-muted-foreground">Content separated by a theme-aware rule.</div></CardContent></Card>
      </section>
      <Card><CardHeader><CardTitle>Scroll area & typography</CardTitle></CardHeader><CardContent className="space-y-4"><p>Tabular money digits: <span className="font-tabular">₦1,234,567.89</span></p><ScrollArea className="h-24 rounded-md border border-border p-4"><div className="space-y-2 text-sm">{Array.from({length: 8}, (_, index) => <p key={index}>Scrollable example row {index + 1}</p>)}</div></ScrollArea></CardContent><CardFooter className="text-sm text-muted-foreground">Temporary component review page.</CardFooter></Card>
    </div>
  </main></TooltipProvider>;
}
