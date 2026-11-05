export type DemoSession={id:string;device:string;location:string;lastActive:string;current:boolean};
export const demoSessions:DemoSession[]=[
{id:"session-current",device:"iPhone · Safari",location:"Lagos, Nigeria",lastActive:"Active now",current:true},
{id:"session-macbook",device:"MacBook Pro · Chrome",location:"Lagos, Nigeria",lastActive:"18 minutes ago",current:false},
{id:"session-windows",device:"Windows PC · Edge",location:"London, United Kingdom",lastActive:"Yesterday",current:false}
];
export type NotificationEvent={id:string;label:string;description:string;email:boolean;push:boolean};
export const notificationEvents:NotificationEvent[]=[
{id:"security",label:"Security alerts",description:"Sign-ins, password changes, and account protection.",email:true,push:true},
{id:"transactions",label:"Transactions",description:"Deposits, withdrawals, and transaction updates.",email:true,push:true},
{id:"savings",label:"Savings goals",description:"Vault progress and upcoming scheduled deposits.",email:true,push:false},
{id:"billing",label:"Billing and invoices",description:"Plan changes, invoices, and billing notices.",email:true,push:false},
{id:"product",label:"Product updates",description:"New features, tips, and service announcements.",email:false,push:false}
];
export const demoInvoices=[
{id:"INV-2026-008",date:"2026-10-01",amount:"$0.00",status:"Paid"},
{id:"INV-2026-007",date:"2026-09-01",amount:"$0.00",status:"Paid"},
{id:"INV-2026-006",date:"2026-08-01",amount:"$0.00",status:"Paid"},
{id:"INV-2026-005",date:"2026-07-01",amount:"$0.00",status:"Paid"}
];
