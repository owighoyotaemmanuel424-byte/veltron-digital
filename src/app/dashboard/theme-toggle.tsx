"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

const KEY = "veltron-dashboard-theme";

export default function DashboardThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      const next = saved === "light";
      document.documentElement.dataset.veltronTheme = next ? "light" : "dark";
    } catch {
      document.documentElement.dataset.veltronTheme = "dark";
    }
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.veltronTheme = next ? "light" : "dark";
    try {
      window.localStorage.setItem(KEY, next ? "light" : "dark");
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={light}
      title={light ? "Switch to dark theme" : "Switch to light theme"}
    >
      <span aria-hidden="true">{light ? "☾" : "☼"}</span>
      <span>{light ? "Light" : "Dark"}</span>
    </button>
  );
}
