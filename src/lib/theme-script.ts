export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "rip:theme";

/** Runs before hydration so the first paint already has the right theme. Dark is the default. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t!=="light";var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}})()`;
