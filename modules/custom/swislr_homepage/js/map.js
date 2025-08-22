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

      //const topo = L.tileLayer(
      //  'https://basemap.nationalmap.gov/ArcGIS/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
      //    maxZoom: 16,
      //    attribution: 'USGS'
      //});

      //const landCover = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Cover_Type_Year/default/2020-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', {
      //  maxZoom: 9,
      //  attribution: 'NASA MODIS Land Cover'
      //});

      // (A) NLCD 2021 tiles (USGS/MRLC via ArcGIS tiles) — working endpoint:
      //const nlcd2021 = L.tileLayer(
      //  'https://tiles.arcgis.com/tiles/CD5mKowwN6nIaqd8/arcgis/rest/services/NLCD_2021_RBS/MapServer/tile/{z}/{y}/{x}',
      //  { maxZoom: 15, attribution: 'USGS MRLC NLCD 2021', opacity: 0.8 }
      //); // :contentReference[oaicite:2]{index=2}
      
      // (B) NASA GIBS Land Cover (IGBP, annual) via WMS — valid layer id + time:
      const modisLC = L.tileLayer.wms(
        'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
        {
          layers: 'MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual',
          format: 'image/png',
          transparent: true,
          time: '2019-01-01' // pick any supported year in the layer’s time domain
        }
      ); // :contentReference[oaicite:3]{index=3}
      

      // 1) OSM Standard — neutral + fast
      //const osmStd = L.tileLayer(
      //  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      //  { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }
      //);
      
      // 2) CARTO Positron (light gray)
      //    Tip: use _nolabels for choropleths or to place your own labels
      const cartoPositron = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, attribution: 'Map tiles by CARTO, © OpenStreetMap' }
      );
      //const cartoPositronNoLabels = L.tileLayer(
      //  'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      //  { maxZoom: 19, attribution: 'Map tiles by CARTO, © OpenStreetMap' }
      //);
      // (CARTO’s terms require attribution and a paid key for heavy/commercial use.) :contentReference[oaicite:0]{index=0}
      
      // 3) Esri Light Gray Canvas (very low contrast)
      //    (Raster tiles; no separate label layer here, so it behaves like “no labels”.)
      //const esriLightGray = L.tileLayer(
      //  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      //  { maxZoom: 16, attribution: 'Esri, HERE, Garmin, FAO, NOAA, USGS' }
      //);
      // Esri documents basemap style access & usage here. :contentReference[oaicite:1]{index=1}
      
      // 4) OpenTopoMap — cleaner than USGSTopo, still topographic
      const openTopo = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        { maxZoom: 17, attribution: 'Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap' }
      );
      // (Community docs/examples reference this template.) :contentReference[oaicite:2]{index=2}
      
      // 5) Esri World Imagery — for an aerial/satellite option
      const esriImagery = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS community' }
      );
      // Esri’s item page describes coverage & credits. :contentReference[oaicite:3]{index=3}


      //topo.addTo(map);
      cartoPositron.addTo(map);

      const baseMaps = {
		"Positron":cartoPositron,
		"Topo":openTopo,
		"Satellite":esriImagery
      };

      const overlays = {
        'MODIS Land Cover': modisLC
      };

      const layerControl = L.control.layers(baseMaps, overlays, { collapsed: false }).addTo(map);
      
      // Keep overlays on top when toggled:
      //map.on('overlayadd', e => {
      //  if (e.layer && e.layer.bringToFront) e.layer.bringToFront();
      //});
      //
      //L.control.zoom({ position: 'topright' }).addTo(map);

      //const OpacityControl = L.Control.extend({
      //  options: { position: 'topright' },
      //  onAdd: function() {
      //    const div = L.DomUtil.create('div', 'leaflet-bar');
      //    div.style.padding = '8px';
      //    div.style.background = 'white';
      //    div.style.lineHeight = '1.1';
      //    div.style.minWidth = '160px';
      //    div.innerHTML = `
      //      <div style="font-weight:600; margin-bottom:6px;">Overlay opacity</div>
      //      <label style="font-size:12px; display:block; margin-top:6px;">MODIS LC</label>
      //      <input id="modisRange" type="range" min="0" max="1" step="0.05" value="${modisLC.options.opacity ?? 1}" style="width:140px;">
      //    `;
      //    // prevent map drag when using sliders
      //    L.DomEvent.disableClickPropagation(div);
      //    L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);
      //
      //    setTimeout(() => {
      //      const n = div.querySelector('#nlcdRange');
      //      const m = div.querySelector('#modisRange');
      //      if (n) n.addEventListener('input', e => nlcd2021.setOpacity(parseFloat(e.target.value)));
      //      if (m) m.addEventListener('input', e => modisLC.setOpacity(parseFloat(e.target.value)));
      //    }, 0);
      //
      //    return div;
      //  }
      //});
      //map.addControl(new OpacityControl());


      // -------- Show slider + legend only when MODIS GIBS is toggled on --------
      
      // Legend image (vertical SVG from GIBS for the IGBP land-cover layer)
      const gibsLegendUrl =
        //'https://gibs.earthdata.nasa.gov/legends/MODIS_IGBP_Land_Cover_Type_V.svg';
		'https://svs.gsfc.nasa.gov/vis/a000000/a002200/a002264/legend.jpg';
      
      // Minimal control with an opacity slider + legend image
      const GibsControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function () {
          const box = L.DomUtil.create('div', 'leaflet-bar gibs-ui');
          box.style.padding = '8px';
          box.style.background = 'white';
          box.style.lineHeight = '1.1';
          box.style.minWidth = '160px';
          box.style.display = 'none'; // start hidden
      
          box.innerHTML = `
            <div style="font-weight:600; margin-bottom:6px;">MODIS Land Cover</div>
            <label style="font-size:12px;">Opacity</label>
            <input id="gibsOpacity" type="range" min="0" max="1" step="0.05" value="1" style="width:140px;">
            <div style="margin-top:6px; font-size:12px; opacity:.8;">Legend</div>
            <img src="${gibsLegendUrl}" alt="IGBP Legend"
                 style="width: 300px; height: auto; display:block; margin-top:4px;">
          `;
      
          // block map interactions while using the UI
          L.DomEvent.disableClickPropagation(box);
          L.DomEvent.on(box, 'mousewheel', L.DomEvent.stopPropagation);
      
          // wire the slider
          const slider = box.querySelector('#gibsOpacity');
          slider.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            modisLC.setOpacity(v);
            // keep overlay on top while changing opacity
            if (map.hasLayer(modisLC) && modisLC.bringToFront) modisLC.bringToFront();
          });
      
          // stash for show/hide
          this._box = box;
          this._slider = slider;
          return box;
        },
        show() { if (this._box) this._box.style.display = ''; },
        hide() { if (this._box) this._box.style.display = 'none'; },
        setSlider(v) { if (this._slider) this._slider.value = String(v); }
      });
      
      const gibsControl = new GibsControl().addTo(map);
      
      // helper to sync control visibility with overlay state
      function refreshGibsUi() {
        if (map.hasLayer(modisLC)) {
          gibsControl.show();
          // reflect current layer opacity in the slider (defaults to 1 if unset)
          const current = (modisLC.options.opacity ?? 1);
          gibsControl.setSlider(current);
        } else {
          gibsControl.hide();
        }
      }
      
      // react to layer toggles from the layer control
      map.on('overlayadd',  e => { if (e.layer === modisLC) refreshGibsUi(); });
      map.on('overlayremove', e => { if (e.layer === modisLC) refreshGibsUi(); });
      
      // also run once on init (in case you programmatically add modisLC by default)
      refreshGibsUi();

		
	 // ---- NOAA SLR overlays (U.S. coastal) ----
     // Helpers to build service names/URLs for 0–10 ft increments (0.5 allowed)
     function slrServiceName(feet) {
       // 0.5 => "0_5", 3 => "3"
       const tag = (feet % 1 === 0) ? String(feet) : String(feet).replace('.', '_');
       return `slr_${tag}ft`;
     }
     function confServiceName(feet) {
       const tag = (feet % 1 === 0) ? String(feet) : String(feet).replace('.', '_');
       return `conf_${tag}ft`;
     }
     function slrLayer(feet, opts = {}) {
       const url = `https://www.coast.noaa.gov/arcgis/rest/services/dc_slr/${slrServiceName(feet)}/MapServer/tile/{z}/{y}/{x}`;
       return L.tileLayer(url, {
         maxZoom: 16,
         opacity: opts.opacity ?? 1,
         attribution: 'NOAA OCM Sea Level Rise (screening tool)'
       });
     }
     function confLayer(feet, opts = {}) {
       const url = `https://www.coast.noaa.gov/arcgis/rest/services/dc_slr/${confServiceName(feet)}/MapServer/tile/{z}/{y}/{x}`;
       return L.tileLayer(url, {
         maxZoom: 16,
         opacity: opts.opacity ?? 0.6,
         attribution: 'NOAA OCM SLR Mapping Confidence'
       });
     }
     
     // Active layers
     let currentFeet = 3;
     let slr = slrLayer(currentFeet, { opacity: 0.9 });
     let slrConf = null; // created on demand
     
     // Add to your existing layers control if you like:
     if (typeof layerControl !== 'undefined') {
       layerControl.addOverlay(slr, `NOAA SLR ${currentFeet} ft (depth)`);
     }
     
     // Keep overlays on top
     map.on('overlayadd', e => { e.layer?.bringToFront?.(); });
     
     // ---- Legend fetcher (ArcGIS REST /legend?f=pjson) ----
     async function buildNoaaLegend(feet) {
       const svc = slrServiceName(feet);
       const url = `https://www.coast.noaa.gov/arcgis/rest/services/dc_slr/${svc}/MapServer/legend?f=pjson`;
       const res = await fetch(url, { credentials: 'omit' });
       const json = await res.json();
       // Find the raster layer legend (Depth)
       const depth = json.layers.find(l => String(l.layerName).includes('Depth')) || json.layers[1];
       if (!depth) return '';
       const items = depth.legend || [];
       return items.map(it => {
         const img = `data:${it.contentType};base64,${it.imageData}`;
         const label = it.label || '';
         return `<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                   <img src="${img}" width="${it.width}" height="${it.height}" alt="">
                   <span style="font-size:12px;">${label}</span>
                 </div>`;
       }).join('');
     }
     
     // ---- UI Control: feet select, opacity slider, legend, confidence toggle ----
     const SlrControl = L.Control.extend({
       options: { position: 'topright' },
       onAdd: function () {
         const box = L.DomUtil.create('div', 'leaflet-bar');
         box.style.background = 'white'; box.style.padding = '8px'; box.style.minWidth = '200px';
     
         const feetOpts = Array.from({length: 21}, (_, i) => (i * 0.5).toFixed(1))  // 0.0..10.0
           .map(v => v.endsWith('.0') ? String(parseInt(v)) : v);
     
         box.innerHTML = `
           <div style="font-weight:600;margin-bottom:6px;">Sea Level Rise (NOAA)</div>
           <label style="font-size:12px;">Feet above MHHW</label>
           <select id="slrFeet" style="width:100%;margin:2px 0 6px 0;">
             ${feetOpts.map(v => `<option value="${v}" ${v==currentFeet? 'selected':''}>${v} ft</option>`).join('')}
           </select>
           <label style="font-size:12px;">Opacity</label>
           <input id="slrOpacity" type="range" min="0" max="1" step="0.05" value="${slr.options.opacity ?? 1}" style="width:100%;">
           <label style="font-size:12px; display:flex; gap:6px; align-items:center; margin-top:6px;">
             <input id="slrConfChk" type="checkbox"> Show confidence
           </label>
           <div id="slrLegend" style="margin-top:6px; font-size:12px; opacity:.9;">Loading legend…</div>
         `;
     
         L.DomEvent.disableClickPropagation(box);
         L.DomEvent.on(box, 'mousewheel', L.DomEvent.stopPropagation);
     
         const sel = box.querySelector('#slrFeet');
         const rng = box.querySelector('#slrOpacity');
         const chk = box.querySelector('#slrConfChk');
         const leg = box.querySelector('#slrLegend');
     
         const refreshLegend = async () => { leg.innerHTML = await buildNoaaLegend(currentFeet); };
     
         // Initialize default layer on map
         slr.addTo(map);
         refreshLegend();
     
         sel.addEventListener('change', async (e) => {
           const newFeet = e.target.value.includes('.') ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
           // swap SLR layer
           const wasOn = map.hasLayer(slr);
           if (wasOn) map.removeLayer(slr);
           if (typeof layerControl !== 'undefined') {
             try { layerControl.removeLayer(slr); } catch(_) {}
           }
           currentFeet = newFeet;
           slr = slrLayer(currentFeet, { opacity: parseFloat(rng.value) });
           if (wasOn) slr.addTo(map);
           if (typeof layerControl !== 'undefined') {
             layerControl.addOverlay(slr, `NOAA SLR ${currentFeet} ft (depth)`);
           }
           // swap confidence layer if shown
           if (chk.checked) {
             if (slrConf && map.hasLayer(slrConf)) map.removeLayer(slrConf);
             slrConf = confLayer(currentFeet, { opacity: 0.6 }); slrConf.addTo(map);
           }
           refreshLegend();
         });
     
         rng.addEventListener('input', (e) => {
           const v = parseFloat(e.target.value);
           slr.setOpacity(v);
           slr.bringToFront?.();
         });
     
         chk.addEventListener('change', (e) => {
           const on = e.target.checked;
           if (on) {
             slrConf = confLayer(currentFeet, { opacity: 0.6 });
             slrConf.addTo(map);
             slrConf.bringToFront?.();
             if (typeof layerControl !== 'undefined') layerControl.addOverlay(slrConf, `SLR Confidence ${currentFeet} ft`);
           } else if (slrConf) {
             if (map.hasLayer(slrConf)) map.removeLayer(slrConf);
             if (typeof layerControl !== 'undefined') try { layerControl.removeLayer(slrConf); } catch(_) {}
             slrConf = null;
           }
         });
     
         return box;
       }
     });
     map.addControl(new SlrControl());



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

