'use client';

import dynamic from "next/dynamic";
import { forwardRef } from "react";

const Map = dynamic(() => import("./map"), { ssr: false });

const ClientMap = forwardRef((props, ref) => {
    return <Map ref={ref} {...props} />;
});

export default ClientMap;