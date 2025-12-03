// 1. Your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiMjA2ZXQiLCJhIjoiY21oZHVlNGhsMDZvajJpb3JiYW44NDdkbCJ9.2t0kCjiMB6Mad8U9mEQfKQ';

// 2. Create the map
const map = new mapboxgl.Map({
    container: 'map',                    // div id in index.html
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-122.33, 47.61],           // Seattle
    zoom: 10
});

// 3. Zoom + rotation controls
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

// 4. When the map loads, add sources and layers
map.on('load', () => {
    console.log('Map is ready!');

    // ---- Crime GeoJSON source ----
    map.addSource('crimeData', {
        type: 'geojson',
        data: 'assets/MergedData.geojson'   
    });

    // ---- Heatmap layer ----
    map.addLayer({
        id: 'crime-heat',
        type: 'heatmap',
        source: 'crimeData',
        maxzoom: 15,
        paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': 1.2,
            'heatmap-radius': 25,
            'heatmap-opacity': 0.8
        }
    });

    // ---- Point layer (shows when you zoom in) ----
    map.addLayer({
        id: 'crime-points',
        type: 'circle',
        source: 'crimeData',
        minzoom: 12,
        paint: {
            'circle-radius': 4,
            'circle-color': '#ff5733',
            'circle-opacity': 0.8
        }
    });

    // ---- Popups on click ----
    map.on('click', 'crime-points', (e) => {
        const props = e.features[0].properties;

        const popupHTML = `
            <strong>${props["Primary Offense Description"] || "Unknown offense"}</strong><br>
            <em>${props["Crime Subcategory"] || ""}</em><br><br>
            <strong>Date:</strong> ${props["Occurred Date"] || "N/A"}<br>
            <strong>Time:</strong> ${props["Occurred Time"] || "N/A"}<br>
            <strong>Neighborhood:</strong> ${props["Neighborhood"] || "N/A"}<br>
            <strong>Beat:</strong> ${props["Beat"] || "N/A"}
        `;

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupHTML)
            .addTo(map);
    });

    // Change cursor on hover so points feel clickable
    map.on('mouseenter', 'crime-points', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'crime-points', () => {
        map.getCanvas().style.cursor = '';
    });
});
