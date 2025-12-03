mapboxgl.accessToken = 'pk.eyJ1IjoiMjA2ZXQiLCJhIjoiY21oZHVlNGhsMDZvajJpb3JiYW44NDdkbCJ9.2t0kCjiMB6Mad8U9mEQfKQ';

// 1. Create the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-122.33, 47.61], // Seattle
    zoom: 10
});

// 2. Add zoom + rotation controls
map.addControl(new mapboxgl.NavigationControl(), 'top-right');


// 3. Load data once map is ready
map.on('load', () => {

    console.log("Map Loaded!");

    // --- Add your crime GeoJSON as a source ---
    map.addSource('crimeData', {
        type: 'geojson',
        data: 'MergedData.geojson'   // <<< UPDATED FILE NAME
    });

    // --- HEATMAP LAYER ---
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

    // --- POINT LAYER ---
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

    // --- POPUPS ---
    map.on('click', 'crime-points', (e) => {
        const props = e.features[0].properties;

        const popupHTML = `
            <strong>${props["Primary Offense Description"]}</strong><br>
            <em>${props["Crime Subcategory"]}</em><br><br>
            <strong>Date:</strong> ${props["Occurred Date"]}<br>
            <strong>Time:</strong> ${props["Occurred Time"]}<br>
            <strong>Neighborhood:</strong> ${props["Neighborhood"]}<br>
            <strong>Beat:</strong> ${props["Beat"]}
        `;

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupHTML)
            .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', 'crime-points', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'crime-points', () => {
        map.getCanvas().style.cursor = '';
    });

});
