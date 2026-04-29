// ─── TransportTracking.jsx ───────────────────────────────────────────────────
// FLEET MONITORING PAGE
//
// AUDIT NOTES:
//   ✓ Preserved: Leaflet map, socket live updates, bus markers, GPS sharing for staff,
//                search, bus info cards, driver perspective
//   ✗ Fixed: Hardcoded API/socket URLs everywhere
//   ✗ Fixed: Raw axios/socket calls
//   ✗ Fixed: Map created without cleanup guard
//   ✗ Fixed: GPS watch not cleaned up properly in all exit paths
//   + Added: API layer + useSocket hook
//   + Added: Auth store integration
//   + Added: Framer-motion card animations
//   + Added: Connection status indicator
//   + Added: Better empty state
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bus, Clock, MapPin, Navigation, Signal, X, Share2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useAuthStore from '../stores/authStore';
import { useSocket } from '../hooks/useSocket';
import { busAPI } from '../lib/api';
import { ROLES } from '../lib/constants';
import { formatTime } from '../lib/utils';

const TransportTracking = () => {
  const user = useAuthStore((s) => s.user);
  const { on, isConnected } = useSocket();

  const [buses, setBuses] = useState({});
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const watchIdRef = useRef(null);

  // ── Fetch Initial Locations ──
  const fetchInitialLocations = useCallback(async () => {
    try {
      const response = await busAPI.getAll();
      if (response.data.success) {
        const map = {};
        response.data.data.forEach((bus) => (map[bus.busId] = bus));
        setBuses(map);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialLocations();
  }, [fetchInitialLocations]);

  // ── Socket: Live updates ──
  useEffect(() => {
    const cleanup = on('bus-location-updated', (data) => {
      setBuses((prev) => ({
        ...prev,
        [data.busId]: { ...prev[data.busId], lat: data.lat, lng: data.lng, updatedAt: data.updatedAt },
      }));
    });
    return cleanup;
  }, [on]);

  // ── Leaflet Map Init ──
  useEffect(() => {
    const L = window.L;
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstanceRef.current);
    setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Map Markers ──
  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    Object.entries(buses).forEach(([id, data]) => {
      let marker = markersRef.current[id];
      if (!marker) {
        const iconHtml = `<div class="relative w-10 h-10 rounded-full shadow-xl border-4 border-white flex items-center justify-center text-white bg-blue-600 transition-all duration-300 transform hover:scale-110"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg></div>`;
        const customIcon = L.divIcon({ className: 'custom-bus-marker', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] });
        marker = L.marker([data.lat, data.lng], { icon: customIcon }).addTo(mapInstanceRef.current);
        marker.on('click', () => setSelectedBusId(id));
        markersRef.current[id] = marker;
      } else {
        marker.setLatLng([data.lat, data.lng]);
      }
    });
  }, [buses]);

  // ── GPS Broadcast (Staff only) ──
  useEffect(() => {
    if (isSharingLocation && user?.branch && navigator.geolocation) {
      toast.success('GPS Broadcast active.');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setBuses((prev) => ({
            ...prev,
            [user.branch]: { ...prev[user.branch], lat: latitude, lng: longitude, updatedAt: new Date() },
          }));
          busAPI.updateLocation({ x: latitude, y: longitude }).catch((err) => console.error('Broadcast failed', err));
        },
        (error) => {
          console.error('GPS Error:', error);
          toast.error('GPS Error: ' + error.message);
          setIsSharingLocation(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isSharingLocation, user]);

  const filteredBuses = Object.entries(buses).filter(([id]) =>
    id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)] relative flex flex-col bg-slate-50 overflow-hidden rounded-2xl border border-slate-200">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 z-20 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Fleet Monitoring</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Signal size={14} className={isConnected ? 'text-emerald-500' : 'text-slate-300'} />
            {isConnected ? 'Live Connection Active' : 'Connecting to satellite...'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Find bus..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {user?.role === ROLES.STAFF && (
            <button
              onClick={() => setIsSharingLocation(!isSharingLocation)}
              className={`px-4 py-2 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm ${isSharingLocation ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              <Share2 size={16} />
              {isSharingLocation ? 'Stop Sharing' : 'Share Live GPS'}
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

        {/* Bus Info Card */}
        <AnimatePresence>
          {selectedBusId && buses[selectedBusId] && (
            <motion.div
              key="bus-info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-80 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl z-[500]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Bus size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">{selectedBusId}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{buses[selectedBusId].driverName || 'System Active'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedBusId(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">Last Contact</span>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    <Clock size={14} className="text-blue-500" />
                    {formatTime(buses[selectedBusId].updatedAt)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">Status</span>
                  <span className="text-sm font-bold text-emerald-600">Active</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 p-2 rounded-lg">
                <MapPin size={14} className="text-red-500" />
                <span className="truncate">{buses[selectedBusId].lat?.toFixed(5)}, {buses[selectedBusId].lng?.toFixed(5)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bus Cards */}
      <AnimatePresence>
        {!selectedBusId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 right-6 lg:left-8 lg:w-96 flex gap-4 overflow-x-auto pb-4 z-10"
          >
            {filteredBuses.map(([id, data]) => (
              <div
                key={id}
                onClick={() => {
                  setSelectedBusId(id);
                  if (mapInstanceRef.current) mapInstanceRef.current.flyTo([data.lat, data.lng], 15);
                }}
                className="shrink-0 bg-white/90 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg cursor-pointer hover:bg-white transition-all w-48"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Bus size={16} />
                  </div>
                  <span className="font-bold text-slate-800">{id}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Updated</span>
                  <span className="text-slate-600">{formatTime(data.updatedAt)}</span>
                </div>
              </div>
            ))}
            {filteredBuses.length === 0 && (
              <div className="bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-400">No active units detected.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransportTracking;
