// app/api/gtfs-rt/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const GTFS_URL = process.env.AT_GTFSRT_URL;
  if (!GTFS_URL) {
    return new NextResponse("Missing GTFS_RT URL", { status: 500 });
  }

  const resp = await fetch(GTFS_URL, {
    headers: { 
      "Ocp-Apim-Subscription-Key": process.env.AT_GTFSRT_KEY!,
      "Accept": "application/x-protobuf"
    },
  });
  if (!resp.ok) {
    return new NextResponse("Failed to fetch GTFS RT feed", { status: resp.status });
  }

  // Read protobuf bytes
  const arr = new Uint8Array(await resp.arrayBuffer());

  // Dynamically import the bindings on the server to avoid bundler issues:
  const GtfsBindings = await import("gtfs-realtime-bindings");
  // decode:
  const FeedMessage = GtfsBindings.transit_realtime.FeedMessage;
  const feed = FeedMessage.decode(arr);

  // Map the protobuf entities to a small JSON shape that the client can consume:
  const vehicles = (feed.entity || [])
    .map((e: any) => {
      if (!e.vehicle) return null;
      const v = e.vehicle;
      return {
        id: e.id ?? null,
        vehicle_id: (v.vehicle && (v.vehicle.id ?? v.vehicle.label)) ?? null,
        label: v.vehicle?.label ?? v.trip?.tripId ?? null,
        lat: v.position?.latitude ?? null,
        lon: v.position?.longitude ?? null,
        bearing: v.position?.bearing ?? null,
        speed: v.position?.speed ?? null,
        timestamp: v.timestamp ?? null,
        route_id: v.trip?.routeId ?? null,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ vehicles });
}
