// Central place for the "which city is this deployment showing" concept.
// UrbanOrbit currently runs one city at a time (DEFAULT_CITY); the shape
// here is deliberately city-agnostic so a future city switcher just needs
// to add entries to CITIES and swap DEFAULT_CITY_ID at runtime, instead of
// hunting down hardcoded coordinates/copy across every page.
export const CITIES = {
  pune: {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    center: [18.5204, 73.8567],
    zoom: 12,
    municipalBody: "Pune Municipal Corporation",
  },
  ranchi: {
    id: "ranchi",
    name: "Ranchi",
    state: "Jharkhand",
    center: [23.3441, 85.3096],
    zoom: 12,
    municipalBody: "Ranchi Municipal Corporation",
  },
};

export const DEFAULT_CITY_ID = "pune";

export function getActiveCity() {
  return CITIES[DEFAULT_CITY_ID];
}
