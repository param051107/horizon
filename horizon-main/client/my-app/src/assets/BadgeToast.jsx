// components/BadgeToast.jsx
import React, { useEffect } from "react";
import "./BadgeToast.css";

export default function BadgeToast({ badge, index, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="badge-toast" style={{ animationDelay: `${index * 150}ms` }}>
      <div className="badge-icon">{badge.icon}</div>
      <div className="badge-info">
        <div className="badge-earned">Badge Unlocked!</div>
        <div className="badge-name">{badge.label}</div>
        <div className="badge-desc">{badge.desc}</div>
      </div>
    </div>
  );
}
