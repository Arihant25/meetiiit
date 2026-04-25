"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "meetiiit_profile_modal_shown";

export default function ProfileModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => setVisible(false)}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Finish setting up your note</h2>
        <p>
          Add a few interest tags and a short intro — this is what others see
          on the feed. You can always update it later.
        </p>
        <div className="modal-actions">
          <Link href="/profile" className="button-primary">
            Set up profile
          </Link>
          <button className="button-secondary" onClick={() => setVisible(false)}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
