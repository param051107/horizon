// components/XPToast.jsx
import React from "react";
import "./XPToast.css";

export default function XPToast({ amount }) {
  return (
    <div className="xp-toast">
      <span className="xp-plus">+{amount}</span>
      <span className="xp-text">XP</span>
    </div>
  );
}
