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

    const marker = new maplibregl.Marker() // you are here marker, update to include real time user location later
      .setLngLat([174.736325, -36.737888])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 40]}).setText("You are here"))
      .addTo(map);
    marker.togglePopup();

    const busMarker028 = new maplibregl.Marker({element: createCustomMarker("028")}) // test markers
      .setLngLat([174.736702, -36.737781])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("028"))
      .addTo(map);
    busMarker028.togglePopup();

    const busMarker008 = new maplibregl.Marker({element: createCustomMarker("008")})
      .setLngLat([174.736470, -36.737749])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("008"))
      .addTo(map);
    busMarker008.togglePopup();

    const busMarker023 = new maplibregl.Marker({element: createCustomMarker("023")})
      .setLngLat([174.736461, -36.737650])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("023"))
      .addTo(map);
    busMarker023.togglePopup();

    const busMarker025 = new maplibregl.Marker({element: createCustomMarker("025")})
      .setLngLat([174.736657, -36.737511])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("025"))
      .addTo(map);
    busMarker025.togglePopup();

    const busMarker027 = new maplibregl.Marker({element: createCustomMarker("027")})
      .setLngLat([174.736598, -36.737695])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("027"))
      .addTo(map);
    busMarker027.togglePopup();

    const busMarker029 = new maplibregl.Marker({element: createCustomMarker("029")})
      .setLngLat([174.736558, -36.737576])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("029"))
      .addTo(map);
    busMarker029.togglePopup();

    const busMarker031 = new maplibregl.Marker({element: createCustomMarker("031")})
      .setLngLat([174.736858, -36.737768])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("031"))
      .addTo(map);
    busMarker031.togglePopup();

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