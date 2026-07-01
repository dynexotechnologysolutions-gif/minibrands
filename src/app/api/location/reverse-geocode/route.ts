import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required parameters." },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude values." },
        { status: 400 }
      );
    }

    // Call OpenStreetMap Nominatim reverse geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
      {
        headers: {
          "User-Agent": "MinibrandsMarketplace/1.0",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Nominatim API Error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: "Failed to resolve coordinates via reverse geocoding." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const addr = data.address || {};

    // Normalize results to fit Address schema fields
    const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "";
    
    // Choose the best field for Area/Locality
    const area =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.quarter ||
      addr.subdistrict ||
      addr.county ||
      "";

    const district = addr.state_district || addr.county || city || "";
    const state = addr.state || "";
    const pincode = addr.postcode || "";
    const country = addr.country || "India";

    // Combine street fields if available
    const street = [addr.road, addr.suburb].filter(Boolean).join(", ") || area;

    return NextResponse.json({
      success: true,
      address: {
        area,
        city,
        district,
        state,
        pincode,
        country,
        street,
      },
      rawDisplayName: data.display_name,
    });
  } catch (error: any) {
    console.error("[Reverse Geocode API Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
