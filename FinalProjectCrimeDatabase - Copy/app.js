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

  // Date filters
  // We check a couple of likely date property names that may exist
  // in the GeoJSON produced by our cleaning pipeline. The input
  // from the date <input> will be an ISO date string: "YYYY-MM-DD".
  // This code assumes the date properties in the GeoJSON are also
  // formatted as ISO date-only strings (or start with YYYY-MM-DD).
  if (state.startDate) {
    const start = state.startDate;
    // allow either Offense Date or Occurred Date
    const startAny = [
      "any",
      [">=", ["get", "Offense Date"], start],
      [">=", ["get", "Occurred Date"], start]
    ];
    filters.push(startAny);
  }

  if (state.endDate) {
    const end = state.endDate;
    const endAny = [
      "any",
      ["<=", ["get", "Offense Date"], end],
      ["<=", ["get", "Occurred Date"], end]
    ];
    filters.push(endAny);
  }

  return filters;

}

map.on("load", () => {
  console.log("map style loaded");

  //Source Code
  // Add an empty source first, then fetch + normalize dates to numeric `ts` property
  map.addSource("crime", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  // Helper to parse many possible date string formats into epoch ms
  function parseDateToTs(s) {
    if (s === null || s === undefined) return NaN;
    const str = String(s).trim();
    if (!str) return NaN;

    // Quick ISO date at start: YYYY-MM-DD
    let m = str.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) {
      const t = Date.parse(m[1] + "T00:00:00");
      if (!isNaN(t)) return t;
    }

    // Try direct parse
    let t = Date.parse(str);
    if (!isNaN(t)) return t;

    // Pattern like: 2024 Nov 13 08:34:00 PM -> convert to "Nov 13 2024 08:34:00 PM"
    m = str.match(/^(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})\s+(\d{1,2}:\d{2}:\d{2})\s*(AM|PM)?$/i);
    if (m) {
      const year = m[1];
      const monDay = `${m[2]} ${m[3]}`;
      const time = m[4];
      const ampm = m[5] || "";
      const reform = `${monDay} ${year} ${time} ${ampm}`.trim();
      t = Date.parse(reform);
      if (!isNaN(t)) return t;
    }

    // Fallback: try to find any YYYY/MM/DD or MM/DD/YYYY
    m = str.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (m) {
      const iso = `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
      t = Date.parse(iso + "T00:00:00");
      if (!isNaN(t)) return t;
    }

    // Give up
    return NaN;
  }

  // Fetch the GeoJSON, normalize date fields into numeric `ts` (ms since epoch)
  fetch("assets/MergedData.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (data && Array.isArray(data.features)) {
        data.features.forEach((f) => {
          const props = f.properties || {};

          // try multiple likely date property names
          const dateCandidates = [
            props["ts"] ? props["ts"] : null,
            props["Offense Date"],
            props["OffenseDate"],
            props["Occurred Date"],
            props["OccurredDate"],
            props["Report DateTime"],
            props["Report Date"]
          ];

          let ts = NaN;
          for (const c of dateCandidates) {
            if (c === null || c === undefined) continue;
            const parsed = parseDateToTs(c);
            if (!isNaN(parsed)) {
              ts = parsed;
              break;
            }
          }

          // If we couldn't parse any date, but there is a property 'date' or 'Date', try those
          if (isNaN(ts)) {
            const extra = props["date"] || props["Date"] || props["Occurred DateTime"];
            ts = parseDateToTs(extra);
          }

          // Attach numeric timestamp and an ISO date for convenience
          props.ts = isNaN(ts) ? null : ts;
          props.date_iso = props.ts ? new Date(props.ts).toISOString().slice(0, 10) : null;
          f.properties = props;
        });
      }

      // set the normalized data back to the map source
      const src = map.getSource("crime");
      if (src) src.setData(data);
    })
    .catch((err) => console.error("Failed to load/normalize crime GeoJSON:", err));

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

      // convert to epoch ms so comparisons are numeric and reliable
      if (state.startDate) {
        // start of day
        state.startTs = Date.parse(state.startDate + "T00:00:00");
      } else {
        state.startTs = null;
      }

      if (state.endDate) {
        // end of day
        state.endTs = Date.parse(state.endDate + "T23:59:59");
      } else {
        state.endTs = null;
      }
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
