class LocationService {
  static async getLocationName(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Nominatim API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      const locationName =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.address?.state ||
        "Lokasi tidak dikenal";
      return locationName;
    } catch (error) {
      console.error(`Failed to fetch location name for ${lat},${lon}:`, error);
      throw new Error("Gagal memuat nama lokasi");
    }
  }
}

export default LocationService;
