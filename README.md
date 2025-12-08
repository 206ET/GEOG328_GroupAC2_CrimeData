# GEOG328_GroupAC2_CrimeData

# Project description
The Seattle Crime Explorer is an interactive Web GIS appliction designed to visualize crime patterns throughout Seattle using real incident data from the Seattle Police Department. The map uses heatmaps, point markers, and dynamic filtering features to help users understand where crimes occur, what types of crimes are most common, and how patterns vary throughout different neighborhoods and time periods. The application goal is to make public safety data more accessible and easily understandable for residents, students, lawmakers, and community organizations. 

# Project Goal

The primary goal of this project is to create a **public, interactive, and easy-to-use Web GIS platform** that empowers users to explore Seattle’s crime landscape. More specifically, our aims include:

### 1. Increase Data Accessibility
Public safety data is often difficult to interpret in list or spreadsheet formats. Our project turns raw police data into an intuitive map where patterns become instantly visible.

### 2. Support Community Awareness
Residents can identify hotspots, understand neighborhood trends, and make more informed decisions about safety.

### 3. Support Policymaking and Planning
By revealing spatial and temporal patterns, this tool can help organizations and government agencies evaluate resource allocation and crime-prevention strategies.

### 4. Promote Transparency
Police-reported crime data is available to the public but rarely shown in a user-friendly, interactive format. We aim to present it clearly and responsibly.

Overall, the goal is to deliver a **high-quality**, **usable**, and **educational** tool that helps people understand how crime varies across space and time in Seattle.

---

# Application URL

📍 **Live Website:**  
https://206et.github.io/GEOG328_GroupAC2_CrimeData/
---

# Main Functions

### Heatmap / Point Transition (Zoom-Based)
- Zoomed-out heatmap  
- Zoomed-in point markers  
- Smooth Mapbox-powered transitions  

### Crime Type Filtering
- Violent Crime  
- Property Crime  
- All Other  
- All Types  

### Neighborhood Filtering
- Auto-populated  
- Based on official neighborhood boundaries  

### Date Range Filtering
- Converts messy SPD date formats into unified timestamps  
- Allows seasonal or multi-year analysis  

### Interactive Popups
Displays:
- Category  
- Subcategory  
- Report Number  
- Neighborhood  
- Precinct & Beat  
- Offense Date  

### Real-Time Statistics Panel
- Filtered totals  
- Percentage breakdowns  
- Category counts  
- Top neighborhoods  
- Temporal coverage  

### Fully Responsive Design
- Mobile + tablet support  
- Sidebar collapses  
- Map auto-resizes with `map.resize()`  

---

# Data Sources

### Seattle Police Department Crime Data (2008–Present)  
https://data.seattle.gov/Public-Safety/SPD-Crime-Data-2008-Present/tazs-3rd5

### Seattle Neighborhood Boundaries  
https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::neighborhood-map-atlas-neighborhoods

### Kaggle Crime Dataset (Supplementary)  
https://www.kaggle.com/datasets/adoumtaiga/crime-data-set

---

# Applied Libraries & Web Services

### Libraries
- Mapbox GL JS v3.2.0  

### Web Services
- GitHub Pages  
- Mapbox Basemap Tiles  
- GeoJSON  

# AI Use Disclosure

ChatGPT was used for:
- Debugging JavaScript  
- Improving responsive CSS  
- README formatting  
- Generating descriptive text  

All code logic, data decisions, and testing were completed by Group AC2.

---

# Team Members

- **Yeabkal S**  
- **Emmanuel T**  
- **Kevin D**  
- **Amartya C**  
- **Girum W**

