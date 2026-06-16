"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const FALLBACK_TIMEOUT_MS = 4000;

// Mendeteksi navigasi internal (klik <Link>/<a> ke route lain) untuk memicu
// animasi loading di sidebar. Reset otomatis saat pathname berubah, atau
// setelah timeout sebagai fallback (mis. navigasi gagal / query-only change).
export function useNavigationLoading() {
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      const anchor = event.target.closest("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      setPendingPath(url.pathname);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setPendingPath(null), FALLBACK_TIMEOUT_MS);
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Loading selesai begitu pathname aktif sudah sama dengan target navigasi
  return pendingPath !== null && pendingPath !== pathname;
}
