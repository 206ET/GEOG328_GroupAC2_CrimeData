mapboxgl.accessToken = 'pk.eyJ1IjoiMjA2ZXQiLCJhIjoiY21oZHVlNGhsMDZvajJpb3JiYW44NDdkbCJ9.2t0kCjiMB6Mad8U9mEQfKQ';

// 2. Create the map
const map = new mapboxgl.Map({
    container: 'map', // must match the div id in index.html
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-122.33, 47.61], // Seattle
    zoom: 10
});

// 3. zoom and rotation controls
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

// 4. When the map loads, i'll add crime layers here
map.on('load', () => {
    console.log('Map is ready!');
    
});
