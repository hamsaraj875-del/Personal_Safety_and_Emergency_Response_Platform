// Google Maps Platform Configuration
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof window !== 'undefined' ? (localStorage.getItem('jagrath_gmaps_key') || localStorage.getItem('jagrat_gmaps_key')) : '') ||
  "";

export const GOOGLE_MAPS_ID = "DEMO_MAP_ID";

export const GOOGLE_MAPS_ATTRIBUTION = ["gmp_git_agentskills_v1"];
