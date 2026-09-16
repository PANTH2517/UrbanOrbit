import { describe, it, expect } from "vitest";
import { CITIES, DEFAULT_CITY_ID, getActiveCity } from "./cities";

describe("cities config", () => {
  it("DEFAULT_CITY_ID points at a real entry in CITIES", () => {
    expect(CITIES[DEFAULT_CITY_ID]).toBeDefined();
  });

  it("getActiveCity returns the default city's full record", () => {
    const city = getActiveCity();
    expect(city.id).toBe(DEFAULT_CITY_ID);
    expect(city.center).toHaveLength(2);
    expect(typeof city.name).toBe("string");
    expect(typeof city.municipalBody).toBe("string");
  });

  it("every city has a valid lat/lng center", () => {
    Object.values(CITIES).forEach((city) => {
      const [lat, lng] = city.center;
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    });
  });
});
