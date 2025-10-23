'use client';

import { useEffect, useState } from "react";

type Vehicle = {
  route_id?: string | null;
  lat?: number | null;
  lon?: number | null;
};

const RANGITOTO_BUS_BAY = {
  lat: -36.73762099522405,
  lon:  174.73675712042015,
};

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ROUTES = [
  "008", "013", "025", "028", "029", "032", "045", "049", "059", "061", "062", "065", "066",
];

function StatusTable() {
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/gtfs-rt", { cache: "no-store" });
        if (!res.ok) throw new Error(`GTFS fetch failed ${res.status}`);
        const data = await res.json();
        const vehicles: Vehicle[] = data.vehicles ?? [];
        const updatedStatuses: Record<string, string> = {};

        for (const route of ROUTES) {
          const routeVehicles = vehicles.filter(v => v.route_id?.includes(route));

          if (routeVehicles.length === 0) {
            updatedStatuses[route] = "Coming";
            continue;
          }

          const nearBus = routeVehicles.some(v => {
            if (!v.lat || !v.lon) return false;
            const dist = getDistanceMeters(
              RANGITOTO_BUS_BAY.lat,
              RANGITOTO_BUS_BAY.lon,
              v.lat,
              v.lon
            );
            return dist < 100; // if within 100 meters
          });

          updatedStatuses[route] = nearBus ? "Arrived" : "Coming";
        }

        setStatuses(updatedStatuses);
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Route</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {ROUTES.map(route => (
          <tr key={route}>
            <th>{route}</th>
            <td>{statuses[route] ?? "Loading"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Table() {
  return <StatusTable />;
}
