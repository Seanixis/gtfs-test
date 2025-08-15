'use client';

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapComponent = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current, // Reference to the map container
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=OLLv1xVEP1eyZCDDuYlu", // MapLibre style URL
      center: [174.736657, -36.737598],
      zoom: 19,
    });

    map.addControl(new maplibregl.NavigationControl(
      {
        showCompass: true,
        visualizePitch: true,
        showZoom: false,
      }), "bottom-left");

    const marker = new maplibregl.Marker()
      .setLngLat([174.736325, -36.737888])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 40]}).setText("You are here"))
      .addTo(map);
    marker.togglePopup();

    const busMarker028 = new maplibregl.Marker({element: createCustomMarker()})
      .setLngLat([174.736702, -36.737781])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("028"))
      .addTo(map);
    busMarker028.togglePopup();

    const busMarker008 = new maplibregl.Marker({element: createCustomMarker()})
      .setLngLat([174.736470, -36.737749])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("008"))
      .addTo(map);
    busMarker008.togglePopup();

    const busMarker023 = new maplibregl.Marker({element: createCustomMarker()})
      .setLngLat([174.736461, -36.737650])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("023"))
      .addTo(map);
    busMarker023.togglePopup();

    const busMarker025 = new maplibregl.Marker({element: createCustomMarker()})
      .setLngLat([174.736657, -36.737511])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("025"))
      .addTo(map);
    busMarker025.togglePopup();

    const busMarker027 = new maplibregl.Marker({element: createCustomMarker()})
      .setLngLat([174.736598, -36.737695])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("027"))
      .addTo(map);
    busMarker027.togglePopup();

    const busMarker029 = new maplibregl.Marker({element: createCustomMarker()})
      .setLngLat([174.736558, -36.737576])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("029"))
      .addTo(map);
    busMarker029.togglePopup();

    const busMarker031 = new maplibregl.Marker({element: createCustomMarker()})
      .setLngLat([174.736858, -36.737768])
      .setPopup(new maplibregl.Popup({closeOnClick: false, closeButton: false, offset: [-1, 51]}).setText("031"))
      .addTo(map);
    busMarker031.togglePopup();

    // Clean up on component unmount
    return () => map.remove();
  }, []);

  const createCustomMarker = () => {
    const element = document.createElement("div");
    element.style.backgroundImage = 'url("bus-icon.png")';
    element.style.backgroundSize = "cover";
    element.style.width = "40px";
    element.style.height = "40px";
    element.style.display = "block";
    return element;
  };

    const locaterMarker = () => {
    const element = document.createElement("div");
    element.style.backgroundImage = 'url("bus-icon.png")';
    element.style.backgroundSize = "cover";
    element.style.width = "40px";
    element.style.height = "40px";
    element.style.display = "block";
    return element;
  };

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "100vh", top: "0px", left: "0px" }}
    />
  );
};

export default MapComponent;