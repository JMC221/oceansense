import {useEffect, useState} from 'react';
import { MapContainer, TileLayer, Polygon, Popup, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { EditControl } from 'react-leaflet-draw';
import type {ZonePayload, ZoneEditorProps, Zone} from '../../types';
import { ZoneClient } from '../../api/ZoneClient';
import { GeoUtils } from '../../utils/GeoUtils';
import type { Layer, Polygon as LeafletPolygon, LatLng, LatLngExpression } from 'leaflet';

interface DrawCreatedEvent {
    layerType: string;
    layer: Layer;
}

interface ShapeEditedEvent {
    layers: {
        getLayers: () => Layer[];
    };
}

// Camera Controller - makes the camera fly to the shape by listening to the sidebar
const MapController = ({ selectedZoneId, zones }: { selectedZoneId: number | null, zones: Zone[] }) => {
    const map = useMap();

    useEffect(() => {
        if (!selectedZoneId) return;
        const zone = zones.find(z => z.id === selectedZoneId);
        if (!zone || !zone.coordinates) return;

        const safePositions = typeof zone.coordinates === 'string'
        ? GeoUtils.toLeaflet(zone.coordinates) : zone.coordinates;

        try {
            // Create a temporary shape to calculate the math for the camera
            const tempPoly = L.polygon(safePositions as LatLngExpression[]);
            const bounds = tempPoly.getBounds();
            if (bounds.isValid()) {
                // Fly the camera smoothly to the zone
                map.flyToBounds(bounds, { duration: 1.2, padding: [50, 50] });
            }
        } catch (e) {
            console.error("Could not fly to zone", e);
        }
    }, [selectedZoneId, zones, map]);
    return null;
};


export const ZoneEditor = ({ zones, setZones }: ZoneEditorProps) => {
    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
    // CREATE MODAL STATE
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newZoneData, setNewZoneData] = useState({name: '', color: 'green'});
    const [tempDrawEvent, setTempDrawEvent] = useState<DrawCreatedEvent | null>(null);

    // DELETE MODAL STATE
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // EDIT MODAL STATE
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editZoneData, setEditZoneData] = useState<{id: number, name: string, color: string} | null>(null);

    // SEARCH STATE
    const [searchQuery, setSearchQuery] = useState("");

    const handleCreate = () => {
        const drawBtn = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;

        if (drawBtn) {
            drawBtn.click();
        } else {
            alert("Map is still loading the drawing tools...")
        }
    };

    // Catch the drawn shape and open the Create Modal
    const onPolygonDrawn = async (e: DrawCreatedEvent ) => {
        setTempDrawEvent(e);
        setNewZoneData({name: '', color: 'green'});
        setIsCreateModalOpen(true);
    };
    // After manager clicks save in the Create Modal
    const submitCreateModal = async () => {
        if (!tempDrawEvent || !newZoneData.name.trim()) return;

        const { layer } = tempDrawEvent;
        // Cast to Polygon inside the function
        const polygonLayer = layer as LeafletPolygon;
        // Extract the raw Leaflet coordinates
        const rawLatLngs = (polygonLayer.getLatLngs() as LatLng[][])[0];
        // Flip coordinates: Leaflet [Lat, Lng] -> GeoJSON [Lng, Lat]
        const geoJsonPolygon = GeoUtils.toGeoJSON(rawLatLngs);

        // Prepare the payload
        const backendPayload: ZonePayload = {
            name: newZoneData.name,
            color: newZoneData.color,
            coordinates: JSON.stringify(geoJsonPolygon)
        };

        try {
            // Send the real coordinates to Spring Boot
            const savedZone = await ZoneClient.create(backendPayload);

            // Debug
            // Safely convert back to Leaflet coordinates for the map
            // console.log(" EXACT BACKEND RESPONSE:", savedZone);
            // Format the backend coordinates for Leaflet
            let safePositions;
            if (typeof savedZone.coordinates === 'string') {
                safePositions = GeoUtils.toLeaflet(savedZone.coordinates);
            } else {
                // If the backend returns a parsed JSON object instead of a string
                // stringify it before passing it to the utility
                safePositions = GeoUtils.toLeaflet(JSON.stringify(savedZone.coordinates));
            }
            // console.log(" LEAFLET POSITIONS:", safePositions);

            // Build display object strictly from the backend data
            const zoneForDisplay = {
                id: savedZone.id,
                name: savedZone.name,
                color: savedZone.color,
                coordinates: safePositions
            };
            // Update the UI
            setZones(prevZones => [...prevZones, zoneForDisplay]);
        } catch (error) {
            console.error("Network error:", error);
            alert(`Backend rejected the zone: ${error}`);
        } finally {
            // Remove temporary drawing layer because React will re-render the official saved shape
            polygonLayer.remove();
            setIsCreateModalOpen(false);
            setTempDrawEvent(null);
        }

    };

    // The manager clicked Cancel in the Create Modal
    const cancelCreateModal = () => {
        if (tempDrawEvent && tempDrawEvent.layer) {
            tempDrawEvent.layer.remove();
        }
        setIsCreateModalOpen(false);
        setTempDrawEvent(null);
    };

    const handleShapeEdit = async (e: ShapeEditedEvent) => {
        // Get all the layers the manager just modified
        const modifiedLayers = e.layers.getLayers();

        for (const layer of modifiedLayers) {
            const polygonLayer = layer as LeafletPolygon;

            const className = polygonLayer.options.className;
            if (!className || !className.startsWith('zone-layer-')) continue;

            const zoneId = parseInt(className.replace('zone-layer-', ''));
            const zoneToEdit = zones.find(z => z.id === zoneId);
            if (!zoneToEdit) continue;

            // Extract the newly dragged coordinates
            const rawLatLngs = (polygonLayer.getLatLngs() as LatLng[][])[0];
            const geoJsonPolygon = GeoUtils.toGeoJSON(rawLatLngs);

            // Prepare the payload (keeping the existing name and color)
            const backendPayload: ZonePayload = {
                name: zoneToEdit.name,
                color: zoneToEdit.color,
                coordinates: JSON.stringify(geoJsonPolygon)
            };

            try {
                // send the new shape to Spring Boot
                await ZoneClient.update(zoneId, backendPayload);

                // Safely format the data for React
                const safePositions = GeoUtils.toLeaflet(backendPayload.coordinates);

                // Update the state to ensure app stays in sync with the map
                setZones(prevZones => prevZones.map(z =>
                z.id === zoneId ? { ...z, coordinates: safePositions } : z
                ));
            } catch(error) {
                console.error("Network error:", error);
                alert(`Backend rejected the shape update for ${zoneToEdit.name}`);
            }
        }
    };

    // Triggered by the "Delete Zone" button
    const handleDeleteClick = async () => {
        if (!selectedZoneId) {
            alert("Please select a zone first!");
            return;
        }
        setIsDeleteModalOpen(true);
    };

    // Triggered by "Yes, Delete" inside the modal
    const confirmDelete = async () => {
        if (!selectedZoneId) return;

        try {
            await ZoneClient.remove(selectedZoneId);
            setZones(zones.filter(z => z.id !== selectedZoneId));
            setSelectedZoneId(null);
        } catch (error) {
            console.error("Network error:", error);
            alert(`Backend rejected the delete: ${error}.`);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedZoneId) {
            alert("Select a zone first!");
            return;
        }

        const zoneToEdit = zones.find(z => z.id === selectedZoneId);
        if (!zoneToEdit) return;

        setEditZoneData({id: zoneToEdit.id!, name: zoneToEdit.name, color: zoneToEdit.color});
        setIsEditModalOpen(true);
    };

    const submitEditModal = async () => {
        if (!editZoneData) return;
        const originalZone = zones.find(z => z.id === editZoneData.id);
        if (!originalZone) return;

        // Only ping the database if manager changed the name or the color
        if (editZoneData.name !== originalZone.name || editZoneData.color !== originalZone.color) {

           // Ensures we have a Leaflet array before converting to GeoJSON
           const currentCoords = typeof originalZone.coordinates === 'string'
            ? GeoUtils.toLeaflet(originalZone.coordinates) : originalZone.coordinates;
           const geoJsonPolygon = GeoUtils.toGeoJSON(currentCoords);

            // Prepare the backend payload
            const backendPayload: ZonePayload = {
                name: editZoneData.name,
                color: editZoneData.color,
                coordinates: JSON.stringify(geoJsonPolygon)
            };

            try {
                // Send the PUT request using the Client
                await ZoneClient.update(editZoneData.id, backendPayload);

                // Update the screen only if the database accepts the change
                setZones(prevZones => prevZones.map(z =>
                    z.id === selectedZoneId ? { ...z, name: editZoneData.name, color: editZoneData.color } : z
                ));
            } catch (error) {
                console.error("Network error:", error);
                alert(`Backend rejected the update: ${error}`);
            }
        }
        // CLose the modal
        setIsEditModalOpen(false);

    };

    // Filtering array runs every time the manager types a letter
    const filteredZones = zones.filter((zone) =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        // Ensures there is no full-page scroll.
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

            <div className="button-group" style={{ flexShrink: 0, marginBottom: '15px' }}>
                <button className="btn-primary" onClick={handleCreate}>Draw New Zone</button>
                <button className="btn-secondary" onClick={handleEdit}>Edit Zone</button>
                <button className="btn-danger" onClick={handleDeleteClick}>Delete Zone</button>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexGrow: 1, minHeight: 0 }}>

                {/* Map Column */}
                <div style={{ flexGrow: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #eaecf0', position: 'relative' }}>
                    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

                        <MapController selectedZoneId={selectedZoneId} zones={zones} />

                        <FeatureGroup>
                            <EditControl
                                position="topright"
                                onCreated={onPolygonDrawn}
                                onEdited={handleShapeEdit}
                                edit={{ edit: {}, remove: false }}
                                draw={{
                                    rectangle: false, circle: false, circlemarker: false,
                                    marker: false, polyline: false, polygon: true
                                }}
                            />

                            {zones.map((zone) => {
                                const safePositions = typeof zone.coordinates === 'string'
                                    ? GeoUtils.toLeaflet(zone.coordinates)
                                    : zone.coordinates;

                                const isSelected = selectedZoneId === zone.id;

                                return (
                                    <Polygon
                                        key={`${zone.id}-${zone.color}`}
                                        positions={safePositions}
                                        pathOptions={{
                                            color: zone.color,
                                            className: `zone-layer-${zone.id}`,
                                            weight: isSelected ? 6 : 3,
                                            fillOpacity: isSelected ? 0.5 : 0.2
                                        }}
                                    >
                                        <Popup>
                                            <div style={{ minWidth: '160px' }}>
                                                <div style={{ borderBottom: '2px solid #eaecf0', paddingBottom: '6px', marginBottom: '8px' }}>
                                                    <h4 style={{ margin: '0 0 4px 0' }}>{zone.name}</h4>
                                                    <span style={{
                                                        backgroundColor: zone.color === 'red' ? '#ffebee' : '#e8f5e9',
                                                        color: zone.color === 'red' ? '#c62828' : '#2e7d32',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {zone.color === 'red' ? 'Restricted' : 'Permitted'}
                                                    </span>
                                                </div>

                                                <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '6px', borderRadius: '4px' }}>
                                                    {Array.isArray(safePositions) && safePositions.map((point: LatLngExpression, i: number) => {
                                                        const lat = Array.isArray(point) ? point[0] : (point as LatLng).lat;
                                                        const lng = Array.isArray(point) ? point[1] : (point as LatLng).lng;

                                                        if (lat === undefined || lng === undefined) return null;

                                                        return (
                                                            <div key={i} style={{ marginBottom: '4px' }}>
                                                                <strong>P{i + 1}:</strong> {lat.toFixed(4)}, {lng.toFixed(4)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Polygon>
                                );
                            })}
                        </FeatureGroup>
                    </MapContainer>
                </div>

                {/* List Column */}
                <div style={{ width: '250px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #eaecf0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>

                    <h4 style={{ margin: '0 0 10px 0', flexShrink: 0 }}>Active Zones</h4>

                    {/* --- Search Bar Input --- */}
                    <input
                        type="text"
                        placeholder="🔍 Search zones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px', marginBottom: '12px',
                            borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box',
                            flexShrink: 0, fontSize: '13px'
                        }}
                    />

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', flexGrow: 1, paddingRight: '5px' }}>
                        {/* --- Empty State Check --- */}
                        {filteredZones.length === 0 ? (
                            <li style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '20px' }}>
                                No zones found matching "{searchQuery}"
                            </li>
                        ) : (
                            filteredZones.map((zone) => (
                                <li key={zone.id} onClick={() => setSelectedZoneId(zone.id!)}
                                    style={{
                                        padding: '10px', marginBottom: '8px', borderRadius: '6px', cursor: 'pointer',
                                        backgroundColor: selectedZoneId === zone.id ? '#e6f2ff' : 'transparent',
                                        border: selectedZoneId === zone.id ? '1px solid #007aff' : '1px solid transparent',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                    <span style={{
                                        display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                                        backgroundColor: zone.color === 'red' ? '#c62828' : '#2e7d32',
                                        marginRight: '10px', flexShrink: 0
                                    }}></span>
                                    <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {zone.name}
                                    </strong>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* --- CUSTOM EDIT MODAL --- */}
            {isEditModalOpen && editZoneData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '24px', borderRadius: '12px',
                        width: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Edit Zone Details</h3>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Zone Name</label>
                            <input
                                type="text"
                                value={editZoneData.name}
                                onChange={e => setEditZoneData({...editZoneData, name: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Zone Type</label>
                            <select
                                value={editZoneData.color}
                                onChange={e => setEditZoneData({...editZoneData, color: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            >
                                <option value="green">Permitted (Green)</option>
                                <option value="red">Restricted (Red)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                            >Cancel</button>
                            <button
                                onClick={submitEditModal}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#007aff', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM CREATE MODAL --- */}
            {isCreateModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '24px', borderRadius: '12px',
                        width: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Save New Zone</h3>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Zone Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Sector 7G"
                                value={newZoneData.name}
                                onChange={e => setNewZoneData({...newZoneData, name: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Zone Type</label>
                            <select
                                value={newZoneData.color}
                                onChange={e => setNewZoneData({...newZoneData, color: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                            >
                                <option value="green">Permitted (Green)</option>
                                <option value="red">Restricted (Red)</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={cancelCreateModal}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                            >Discard</button>
                            <button
                                onClick={submitCreateModal}
                                disabled={!newZoneData.name.trim()}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: newZoneData.name.trim() ? '#007aff' : '#ccc', color: 'white', cursor: newZoneData.name.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                            >Save Zone</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM DELETE MODAL --- */}
            {isDeleteModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '24px', borderRadius: '12px',
                        width: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', textAlign: 'center'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#c62828' }}>Confirm Deletion</h3>
                        <p style={{ fontSize: '14px', color: '#555', marginBottom: '24px' }}>
                            Are you sure you want to delete this zone? This action cannot be undone.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >Cancel</button>
                            <button
                                onClick={confirmDelete}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#c62828', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
