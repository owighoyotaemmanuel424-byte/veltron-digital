"use client";
import {useEffect,useState} from "react";
import {motion,useMotionValueEvent,useReducedMotion,useSpring} from "motion/react";
import {cn} from "@/lib/utils";
import {Amount,type AmountProps} from "./Amount";
export type PriceTickerProps=AmountProps & {className?:string;flashDuration?:number};
export function PriceTicker({value,className,flashDuration=650,...amountProps}:PriceTickerProps){
 const reduceMotion=useReducedMotion();
 const spring=useSpring(value,{stiffness:180,damping:24,mass:0.6});
 const [shown,setShown]=useState(value),[direction,setDirection]=useState<"up"|"down"|null>(null);
 // Synchronize the animated spring and direction indicator with incoming market values.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{setDirection(value>shown?"up":value<shown?"down":null);if(reduceMotion){spring.jump(value);setShown(value)}else{spring.set(value)}const timer=window.setTimeout(()=>setDirection(null),flashDuration);return()=>window.clearTimeout(timer)},[value,flashDuration,spring,reduceMotion]);
 useMotionValueEvent(spring,"change",latest=>setShown(latest));
 return <><motion.span aria-hidden="true" className={cn("inline-flex rounded-md transition-colors motion-reduce:transition-none",direction==="up"&&"bg-success/10",direction==="down"&&"bg-danger/10",className)}><Amount {...amountProps} value={shown}/></motion.span><span className="sr-only" role="status" aria-live="polite" aria-atomic="true"><Amount {...amountProps} value={value}/></span></>;
}
