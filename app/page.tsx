"use client";

import ClientMap from './clientmap';
import Table from './table';
import { use, useState } from 'react';

function Test() {
  return (
    <img 
      src="/face holding back tears.png" 
      alt="Teto Pear" 
    />
  );
}

export default function Sigma() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <section>
      <ClientMap />
      {showPopup || (
        <button className="statusButton" type="button" onClick={() => setShowPopup(true)}>View Bus Status</button>
      )}
      {showPopup && (
        <div className="popup">
          <Table />
          <button className="popupButton" type="button" onClick={() => setShowPopup(false)}>✖</button>
        </div>
      )}
      <button className="recenterButton" type="button"><img src="recenterIcon.png" style={{ width: "25px", height: "25px" }} /></button>
    </section>
  );
}