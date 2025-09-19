'use client';

import { use, useEffect, useRef } from "react";
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

  useEffect(() => { //start of code for the entire map
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({ // map component
      container: mapContainerRef.current, // map container dimensions reference (see bottom)
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=OLLv1xVEP1eyZCDDuYlu", // mapLibre style url
      center: [174.736657, -36.737598],
      zoom: 19,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl( // map controls
      {
        showCompass: true,
        visualizePitch: true,
        showZoom: false,
      }), "bottom-left");

    // clean up on component unmount
    return () => {
      map.remove();
      mapRef.current = null; // this line was added by gpt
    };
  }, []);

   // poll for GTFS-RT data and update markers
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateMarkers(vehicles: Vehicle[]) {
    const map = mapRef.current;
    if (!map) return;

    const incomingIds = new Set<string>();
    for (const v of vehicles) {
      const id = String(v.route_id ?? v.label ?? `${v.lat}_${v.lon}`);
      incomingIds.add(id);
      if (v.lat == null || v.lon == null) continue;

      const existing = markersRef.current[id];
      if (existing) {
        // move existing marker
        existing.setLngLat([v.lon, v.lat]);

        // update label text inside the custom element
        const el = existing.getElement();
        const labelEl = el.querySelector(".bus-label") as HTMLElement | null;
        if (labelEl) labelEl.textContent = v.route_id ?? v.label ?? "";

      } else {
        // create a new marker
        const el = createCustomMarker(v.route_id ?? v.label ?? "");

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([v.lon, v.lat])
          .setPopup(new maplibregl.Popup({
            closeOnClick: false,
            closeButton: false,
            offset: [-1, 53]
          }).setText(String(v.route_id ?? v.label ?? "")))
          .addTo(map);
          marker.togglePopup();

        markersRef.current[id] = marker;
      }
    }

    // remove markers that are no longer present
    for (const id of Object.keys(markersRef.current)) {
      if (!incomingIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    }
  }

  const createCustomMarker = (label: string) => { // bus marker template
    const element = document.createElement("div");
    element.style.backgroundImage = 'url("bus-icon.png")';
    element.style.backgroundSize = "cover";
    element.style.width = "40px";
    element.style.height = "40px";
    element.style.display = "block";
    return element;
  };
  
  
  return ( // map container dimensions
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "100vh", top: "0px", left: "0px" }}
    />
  );
};

export default MapComponent;