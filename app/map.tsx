'use client';

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Point } from "geojson";

type Vehicle = {
  id: string | null;
  vehicle_id?: string | null;
  label?: string | null;
  lat: number | null;
  lon: number | null;
  timestamp?: number | null;
  route_id?: string | null;
};

const POLL_MS = 2000;

const MapComponent = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // init map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=OLLv1xVEP1eyZCDDuYlu",
      center: [174.736657, -36.737598],
      zoom: 19,
    });
    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
        showZoom: false,
      }),
      "bottom-left"
    );

    // load bus icon for symbol layer
    map.on("load", async () => {
      try {
        const image = await map.loadImage("/bus-icon.png");
        if (!map.hasImage("bus-icon")) {
          map.addImage("bus-icon", image.data);
        }

        // create geojson source
        map.addSource("buses", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        // add symbol layer to map
        map.addLayer({
          id: "buses-layer",
          type: "symbol",
          source: "buses",
          layout: {
            "icon-image": "bus-icon",
            "icon-size": 0.075,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            "text-field": ["get", "route_id"],
            "text-offset": [0, 2.8],
            "text-anchor": "bottom",
            "text-size": 12,
            "text-font": ["Open Sans Bold"],
          },
        });
      } catch (err) {
        console.error("Error loading bus icon:", err);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // pull GTFS data + update GeoJSON markers
  useEffect(() => {
    let stopped = false;

    async function fetchAndUpdate() {
      const map = mapRef.current;
      if (!map) return;

      // only proceed if map + bus source exist
      if (!map.isStyleLoaded() || !map.getSource("buses")) {
        setTimeout(fetchAndUpdate, 1000);
        return;
      }

      try {
        const res = await fetch("/api/gtfs-rt", { cache: "no-store" });
        if (!res.ok) {
          console.error("GTFS-RT fetch failed:", res.status);
          return;
        }

        const json = await res.json();
        const vehicles: Vehicle[] = json.vehicles ?? [];

        // code for geojson featurecollection
        const features: Feature<Point, { route_id: string | null }>[] =
          vehicles
            .filter((v) => v.lat != null && v.lon != null)
            .map((v) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [v.lon!, v.lat!],
              },
              properties: {
                route_id: v.route_id ?? v.label ?? "",
              },
            }));

        const collection: FeatureCollection<Point, { route_id: string | null }> = {
          type: "FeatureCollection",
          features,
        };

        const src = map.getSource("buses") as maplibregl.GeoJSONSource | undefined;
        if (src) {
          requestAnimationFrame(() => src.setData(collection));
        }
      } catch (err) {
        console.error("GTFS-RT polling error:", err);
      } finally {
        if (!stopped) setTimeout(fetchAndUpdate, POLL_MS);
      }
    }

    // Wait until map is fully loaded before polling
    const map = mapRef.current;
    if (map) {
      const startPolling = () => {
        fetchAndUpdate();
        map.off("load", startPolling);
      };

      if (map.isStyleLoaded()) startPolling();
      else map.on("load", startPolling);
    }

    return () => {
      stopped = true;
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "100vh", top: "0px", left: "0px" }}
    />
  );
};

export default MapComponent;