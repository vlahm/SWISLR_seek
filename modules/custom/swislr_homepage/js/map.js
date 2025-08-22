  (function (Drupal) {
  Drupal.behaviors.swislrMap = {
    attach: function (context, settings) {
      const map = L.map('map', {
        zoomControl: false
      })//.setView([20, 0], 2);

      // Fit to CONUS bounds
      const conusBounds = [
        [24.5, -125], // Southwest corner
        [49.5, -66.9] // Northeast corner
      ];
      map.fitBounds(conusBounds);
      map.setMaxBounds(conusBounds);
      map.setMinZoom(map.getZoom());

      //L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //  maxZoom: 18,
      //}).addTo(map);
      // const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	    // maxZoom: 17,
	    // attribution: 'Map data: &copy; OpenTopoMap, OSM contributors'
      const topo = L.tileLayer(
        'https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 16,
          attribution: 'USGS'
      });

      const landCover = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Cover_Type_Year/default/2020-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', {
        maxZoom: 9,
        attribution: 'NASA MODIS Land Cover'
      });

      topo.addTo(map);

      const baseMaps = {
        "Topographic": topo,
        "Land Cover": landCover
      };

	  const layerControl = L.control.layers(null, null, { collapsed: false }).addTo(map);

      L.control.layers(baseMaps).addTo(map);

      L.control.zoom({
        position: 'topright'
      }).addTo(map);

	  // Stories from the Field layer
      const storiesUrl = '/stories.geojson'; // from the Views GeoJSON display
      
      // Optional: an icon for story markers (or omit for default)
      // const storyIcon = L.icon({ iconUrl: '/themes/custom/yourtheme/images/pin.svg', iconSize: [28, 28] });
      
      const storiesLayer = L.markerClusterGroup(); // requires leaflet.markercluster; otherwise use L.geoJSON directly
      
      fetch(storiesUrl, { credentials: 'same-origin' })
        .then(r => r.json())
        .then(geojson => {
          const featureLayer = L.geoJSON(geojson, {
            // pointToLayer: (feature, latlng) => L.marker(latlng, { icon: storyIcon }),
            onEachFeature: (feature, layer) => {
              const p = feature.properties || {};
              const title = p.name || 'Story';
              const path = p.view_node || '#';
              const date = p.field_date || '';
              const img = p.field_image || '';
              const tags = Array.isArray(p.field_tags) ? p.field_tags.join(', ') : (p.field_tags || '');
      
              const imgHtml = img ? `<div style="margin-bottom:.5rem;"><img src="${img}" alt="" style="max-width:220px; height:auto; border-radius:8px;"></div>` : '';
              const html = `
                ${imgHtml}
                <div style="max-width:260px;">
                  <h3 style="margin:.2rem 0 0.4rem 0; font-size:1rem;">
                    <a href="${path}" style="text-decoration:none;">${title}</a>
                  </h3>
                  ${date ? `<div style="font-size:.85rem; opacity:.8;">${date}</div>` : ''}
                  ${tags ? `<div style="font-size:.85rem; margin-top:.25rem;">Tags: ${tags}</div>` : ''}
                  <div style="margin-top:.5rem;">
                    <a href="${path}" class="btn btn-sm btn-primary">Read story</a>
                  </div>
                </div>
              `;
              layer.bindPopup(html, { maxWidth: 320 });
            }
          });
      
          storiesLayer.addLayer(featureLayer);
          storiesLayer.addTo(map);
      
          // add to the layer control if you have one:
          if (layerControl) layerControl.addOverlay(storiesLayer, 'Stories from the Field');
        })
        .catch(console.error);

    }
  };
})(Drupal);

