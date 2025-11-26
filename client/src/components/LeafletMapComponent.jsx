import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const startIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: white; width: 12px; height: 12px; border-radius: 50%; border: 2px solid black;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

const currentIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #52525b; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Component to auto-fit bounds
function MapBounds({ positions }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [positions, map]);

    return null;
}

const LeafletMapComponent = ({ positions }) => {
    const center = positions.length > 0
        ? [positions[positions.length - 1].latitude, positions[positions.length - 1].longitude]
        : [0, 0];

    const path = positions.map(pos => [pos.latitude, pos.longitude]);

    return (
        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <MapContainer
                center={center}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: '#000' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {positions.length > 1 && (
                    <Polyline
                        positions={path}
                        pathOptions={{ color: 'white', weight: 4, opacity: 1 }}
                    />
                )}

                {positions.length > 0 && (
                    <Marker position={path[0]} icon={startIcon}>
                        <Popup>Start Point</Popup>
                    </Marker>
                )}

                {positions.length > 1 && (
                    <Marker position={path[path.length - 1]} icon={currentIcon}>
                        <Popup>Current Position</Popup>
                    </Marker>
                )}

                <MapBounds positions={positions} />
            </MapContainer>
        </div>
    );
};

export default LeafletMapComponent;
