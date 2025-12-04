// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiMjA2ZXQiLCJhIjoiY21oZHVlNGhsMDZvajJpb3JiYW44NDdkbCJ9.2t0kCjiMB6Mad8U9mEQfKQ';

// Create the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-122.33, 47.61],  // Seattle
    zoom: 10
});

// Add zoom controls
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

// When the map loads, fetch the crime data
map.on('load', () => {
    console.log("Map loaded");

    fetch('assets/MergedData.geojson')
        .then(res => res.json())
        .then(data => {
            console.log("Loaded features:", data.features.length);

            // 1) Add source
            map.addSource('crime', {
                type: 'geojson',
                data: data
            });

            // 2) Heatmap layer
            map.addLayer({
                id: 'crime-heat',
                type: 'heatmap',
                source: 'crime',
                maxzoom: 15,
                paint: {
                    'heatmap-weight': 1,
                    'heatmap-intensity': 1.2,
                    'heatmap-radius': 25,
                    'heatmap-opacity': 0.8
                }
            });

            // 3) Point layer
            map.addLayer({
                id: 'crime-points',
                type: 'circle',
                source: 'crime',
                minzoom: 11,
                paint: {
                    'circle-radius': 4,
                    'circle-color': '#ff5733',
                    'circle-opacity': 0.8
                }
            });

            // 4) Popups with context using NEW FIELD NAMES
            map.on('click', 'crime-points', (e) => {
                const props = e.features[0].properties;

                const html = `
                    <strong>${props["Offense Category"] || "Crime"}</strong><br>
                    <em>${props["Offense Sub Category"] || ""}</em><br><br>
                    <strong>Reported:</strong> ${props["Report DateTime"] || "N/A"}<br>
                    <strong>Occurred:</strong> ${props["Offense Date"] || "N/A"}<br>
                    <strong>Neighborhood:</strong> ${props["Neighborhood"] || "N/A"}<br>
                    <strong>Beat:</strong> ${props["Beat"] || "N/A"}<br>
                    <strong>Sector:</strong> ${props["Sector"] || "N/A"}<br>
                    <strong>Precinct:</strong> ${props["Precinct"] || "N/A"}
                `;

                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(map);
            });

            // Change cursor on hover
            map.on('mouseenter', 'crime-points', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'crime-points', () => {
                map.getCanvas().style.cursor = '';
            });
        })
        .catch(err => {
            console.error("GeoJSON load error:", err);
        });
});
