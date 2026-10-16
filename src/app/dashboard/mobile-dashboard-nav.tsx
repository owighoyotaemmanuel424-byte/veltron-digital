"use client";

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "./logout-button";
import styles from "./dashboard.module.css";

type Props = { name: string; email: string; initials: string; sites: number; documents: number; calls: number };

export default function MobileDashboardNav({ name, email, initials, sites, documents, calls }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <div className={styles.mobileBar}>
        <Link className={styles.brand} href="/" onClick={close}>
          <span className={styles.brandMark}>v</span>Veltron<span>Digital</span>
        </Link>
        <button className={styles.menuButton} type="button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="veltron-mobile-navigation" onClick={() => setOpen((value) => !value)}>
          <span className={open ? styles.menuLineOpen : styles.menuLine} />
          <span className={open ? styles.menuLineOpen : styles.menuLine} />
          <span className={open ? styles.menuLineOpen : styles.menuLine} />
        </button>
      </div>
      {open && <button className={styles.mobileScrim} type="button" aria-label="Close navigation menu" onClick={close} />}
      <aside id="veltron-mobile-navigation" className={open ? `${styles.mobileDrawer} ${styles.mobileDrawerOpen}` : styles.mobileDrawer} aria-label="Mobile workspace navigation" aria-hidden={!open}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Workspace menu</span>
          <button type="button" className={styles.drawerClose} aria-label="Close navigation menu" onClick={close}>×</button>
        </div>
        <p className={styles.groupLabel}>YOUR WORKSPACE</p>
        <Link className={`${styles.navLink} ${styles.active}`} href="/dashboard" onClick={close}><span className={styles.navIcon}>◫</span>Dashboard</Link>
        <Link className={styles.navLink} href="/dashboard/orders" onClick={close}><span className={styles.navIcon}>↗</span>My orders</Link>
        <Link className={styles.navLink} href="/services" onClick={close}><span className={styles.navIcon}>◇</span>Browse services</Link>
        <Link className={styles.navLink} href="/dashboard/security" onClick={close}><span className={styles.navIcon}>⌑</span>Account security</Link>
        <p className={styles.groupLabel}>TOOLS & ACTIVITY</p>
        <Link className={styles.navLink} href="/dashboard/products" onClick={close}><span className={styles.navIcon}>▦</span>Products & tools</Link>
        <div className={styles.drawerBottom}>
          <div className={styles.profile}>
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.profileText}><strong>{name}</strong><small>{email}</small></span>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
