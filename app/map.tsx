'use client';

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Vehicle = {
  id: string | null;
  vehicle_id?: string | null;
  label?: string | null;
  lat: number | null;
  lon: number | null;
  timestamp?: number | null;
  route_id?: string | null;
};

const POLL_MS = 1500;

const MapComponent = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});

  useEffect(() => { 
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=OLLv1xVEP1eyZCDDuYlu",
      center: [174.736657, -36.737598],
      zoom: 19,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      visualizePitch: true,
      showZoom: false,
    }), "bottom-left");

    // clean up on component unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // poll GTFS data + update marker locations
  useEffect(() => {
    let stopped = false;

    async function fetchAndUpdate() {
      if (!mapRef.current) return;
      try {
        const res = await fetch("/api/gtfs-rt", { cache: "no-store" });
        if (!res.ok) {
          console.error("GTFS-RT fetch failed:", res.status);
          return;
        }
        const json = await res.json();
        const vehicles: Vehicle[] = json.vehicles ?? [];
        updateMarkers(vehicles);
      } catch (err) {
        console.error("GTFS-RT polling error:", err);
      } finally {
        if (!stopped) setTimeout(fetchAndUpdate, POLL_MS);
      }
    }

    fetchAndUpdate();
    return () => { stopped = true; };
  }, []);

  function updateMarkers(vehicles: Vehicle[]) {
    const map = mapRef.current;
    if (!map) return;

    const incomingIds = new Set<string>();

    for (const v of vehicles) {
      if (v.lat == null || v.lon == null) continue;

      const id = String(v.vehicle_id ?? v.id ?? v.route_id ?? `${v.lat}_${v.lon}`);
      incomingIds.add(id);

      const existing = markersRef.current[id];

      if (existing) {
        // update existing marker position & label
        existing.setLngLat([v.lon, v.lat]);

        const el = existing.getElement();
        const labelEl = el.querySelector(".bus-label") as HTMLElement | null;
        if (labelEl) labelEl.textContent = v.route_id ?? v.label ?? "";
      } else {
        // marker template
        const el = document.createElement("div");
        el.className = "bus-marker";
        el.style.display = "flex";
        el.style.flexDirection = "column";
        el.style.alignItems = "center";
        el.style.transform = "translate(-50%, -100%)";

        const icon = document.createElement("div");
        icon.className = "bus-icon";
        icon.style.backgroundImage = 'url("/bus-icon.png")';
        icon.style.backgroundSize = "cover";
        icon.style.width = "36px";
        icon.style.height = "36px";

        const label = document.createElement("div");
        label.className = "bus-label";
        label.textContent = v.route_id ?? v.vehicle_id ?? "";
        label.style.marginTop = "-4px";
        label.style.fontSize = "12px";
        label.style.color = "black";
        label.style.fontWeight = "600";
        label.style.background = "transparent";
        label.style.pointerEvents = "none";

        el.appendChild(icon);
        el.appendChild(label);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([v.lon, v.lat]);

        if (mapRef.current) {
          marker.addTo(mapRef.current);
        }

        markersRef.current[id] = marker;
      }
    }

    // remove markers
    for (const id of Object.keys(markersRef.current)) {
      if (!incomingIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    }
  }

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "100vh", top: "0px", left: "0px" }}
    />
  );
};

export default MapComponent;