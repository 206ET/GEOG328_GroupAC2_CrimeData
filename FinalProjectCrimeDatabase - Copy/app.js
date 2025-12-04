mapboxgl.accessToken =
  "pk.eyJ1IjoiZGtldmluMTIiLCJhIjoiY21panNheXRoMThlcDNkcTI2dzh2ejJvaiJ9.jqrkLjBADpNtEb01BCiN9g";

console.log("js.js loaded");

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  center: [-122.33, 47.61],
  zoom: 11
});

// filter state
const state = {
  crimeType: "all",
  startDate: null,
  endDate: null
};

function buildFilter() {
  const filters = ["all"];

  // Category filter
  if (state.crimeType && state.crimeType !== "all") {
    filters.push(["==", ["get", "Offense Category"], state.crimeType]);
  }

}

map.on("load", () => {
  console.log("map style loaded");

  //Source Code
  map.addSource("crime", {
    type: "geojson",
    data: "assets/MergedData.geojson"
  });

  map.addLayer({
    id: "crime-points",
    type: "circle",
    source: "crime",
    paint: {

      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10, 1.5,
        14, 6
      ],

      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10, 0.0,
        12, 0.4,
        14, 0.8
      ],
      "circle-color": [
        "match",
        ["get", "Offense Category"],
        "VIOLENT CRIME", "#b91c1c",
        "PROPERTY CRIME", "#1d4ed8",
        "ALL OTHER", "#9ca3af",
        /* default */ "#9ca3af"
      ]
    }
  });

  // Heatmap layer
  map.addLayer(
    {
      id: "crime-heat",
      type: "heatmap",
      source: "crime",
      maxzoom: 15,
      paint: {
        "heatmap-weight": 1,
        "heatmap-intensity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 1,
          13, 2
        ],
        "heatmap-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 15,
          14, 25
        ],

        "heatmap-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 1.0,
          12, 0.6,
          14, 0.0
        ]
      }
    },
    "crime-points"
  );

  // Point Click Popup
  map.on("click", "crime-points", (e) => {
    const feature = e.features[0];
    const props = feature.properties;

    const html = `
      <strong>${props["Offense Category"] || "Crime"}</strong><br/>
      Report #: ${props["Report Number"] || "N/A"}<br/>
      Neighborhood: ${props.Neighborhood || "N/A"}<br/>
      Precinct: ${props.Precinct || "N/A"}<br/>
      Beat: ${props.Beat || "N/A"}
    `;

    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });

  // Pointer cursor on hover
  map.on("mouseenter", "crime-points", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "crime-points", () => {
    map.getCanvas().style.cursor = "";
  });

  // Hook up sidebar controls
  setupUI();
});

function setupUI() {
  const crimeTypeSelect = document.getElementById("crime-type-select");
  const startInput = document.getElementById("start-date");
  const endInput = document.getElementById("end-date");
  const applyDateBtn = document.getElementById("apply-date-btn");

  if (crimeTypeSelect) {
    crimeTypeSelect.addEventListener("change", () => {
      state.crimeType = crimeTypeSelect.value;
      applyFilterToMap();
    });
  }

  if (applyDateBtn) {
    applyDateBtn.addEventListener("click", () => {
      state.startDate = startInput?.value || null;
      state.endDate = endInput?.value || null;
      applyFilterToMap();
    });
  }
}

function applyFilterToMap() {
  const filter = buildFilter();

  if (map.getLayer("crime-points")) {
    map.setFilter("crime-points", filter);
  }
  if (map.getLayer("crime-heat")) {
    map.setFilter("crime-heat", filter);
  }
}
