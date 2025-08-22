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

		
	 // ---- NOAA SLR (single overlay entry + dynamic content) ----

     let confOpacity = 0.6;      // separate opacity for uncertainty
     let confGrayscale = true;   // set false if you ever want the original colors
     
     function applyConfFilters() {
       if (!confTile || !confTile.getContainer) return;
       const el = confTile.getContainer();
       if (!el) return;
       el.style.filter = confGrayscale ? 'grayscale(100%)' : '';
     }
     
     function rebuildSlrTiles() {
       const tag = feetToTag(slrFeet);
       slrGroup.clearLayers();
     
       // depth
       slrTile = L.tileLayer(slrUrl(tag), { maxZoom: 16, opacity: slrOpacity,
         attribution: 'NOAA OCM Sea Level Rise (screening)' }).addTo(slrGroup);
     
       // uncertainty
       if (showConf) {
         confTile = L.tileLayer(confUrl(tag), { maxZoom: 16, opacity: confOpacity,
           attribution: 'NOAA OCM SLR Mapping Confidence' }).addTo(slrGroup);
         confTile.on('load', applyConfFilters); // when tiles first arrive
         // also try immediately in case tiles are cached:
         setTimeout(applyConfFilters, 0);
       } else {
         confTile = null;
       }
     
       slrTile.bringToFront?.(); confTile?.bringToFront?.();
     }

	 // Utility: normalize to 0.5ft steps and convert to service tag
	 function feetToTag(feet) {
	   const n = Math.max(0, Math.min(10, Math.round(feet * 2) / 2)); // clamp 0–10, round to .5
	   return (n % 1 === 0) ? String(n) : n.toFixed(1).replace('.', '_'); // 3 -> "3", 0.5 -> "0_5"
	 }
	 function slrUrl(feetTag) {
	   return `https://www.coast.noaa.gov/arcgis/rest/services/dc_slr/slr_${feetTag}ft/MapServer/tile/{z}/{y}/{x}`;
	 }
	 function confUrl(feetTag) {
	   return `https://www.coast.noaa.gov/arcgis/rest/services/dc_slr/conf_${feetTag}ft/MapServer/tile/{z}/{y}/{x}`;
	 }

	 // Dynamic overlay is a LayerGroup; it stays constant in the Layer Control.
	 const slrGroup = L.layerGroup();

	 // Register ONE overlay in your existing control:
	 if (typeof layerControl !== 'undefined') {
	   layerControl.addOverlay(slrGroup, 'Sea Level Rise (NOAA)');
	 }

	 // State
	 let slrFeet = 3;              // current feet
	 let slrOpacity = 0.9;         // current depth opacity
	 let showConf = false;         // uncertainty toggle
	 let slrTile = null;           // current depth tile
	 let confTile = null;          // current conf tile

	 function rebuildSlrTiles() {
	   const tag = feetToTag(slrFeet);
	   // clear old children
	   slrGroup.clearLayers();

	   // depth tile
	   slrTile = L.tileLayer(slrUrl(tag), {
	 	maxZoom: 16,
	 	opacity: slrOpacity,
	 	attribution: 'NOAA OCM Sea Level Rise (screening)'
	   }).addTo(slrGroup);

	   // optional confidence tile
	   if (showConf) {
	 	confTile = L.tileLayer(confUrl(tag), {
	 	  maxZoom: 16,
	 	  opacity: 0.6,
	 	  attribution: 'NOAA OCM SLR Mapping Confidence'
	 	}).addTo(slrGroup);
	   } else {
	 	confTile = null;
	   }

	   // keep on top
	   slrTile.bringToFront?.();
	   confTile?.bringToFront?.();
	 }

	 // Legends
	 async function legendHtmlFor(serviceName) {
	   const url = `https://www.coast.noaa.gov/arcgis/rest/services/dc_slr/${serviceName}/MapServer/legend?f=pjson`;
	   try {
	 	const res = await fetch(url, { credentials: 'omit' });
	 	const json = await res.json();
	 	const layers = json.layers || [];
	 	const legends = layers.flatMap(l => l.legend || []);
	 	return legends.map(it => `
	 	  <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
	 		<img src="data:${it.contentType};base64,${it.imageData}" width="${it.width}" height="${it.height}" alt="">
	 		<span style="font-size:12px;">${it.label || ''}</span>
	 	  </div>`).join('') || '<em style="font-size:12px;">No legend</em>';
	   } catch {
	 	return '<em style="font-size:12px;">Legend unavailable</em>';
	   }
	 }
	 async function refreshLegends(box) {
	   const tag = feetToTag(slrFeet);
	   const depthHtml = await legendHtmlFor(`slr_${tag}ft`);
	   box.querySelector('#slrLegend').innerHTML = depthHtml;

	   const confBox = box.querySelector('#confLegendWrap');
	   if (showConf) {
	 	confBox.style.display = '';
	 	confBox.querySelector('#confLegend').innerHTML =
	 	  await legendHtmlFor(`conf_${tag}ft`);
	   } else {
	 	confBox.style.display = 'none';
	   }
	 }

	 // UI control (appears only when overlay is on)
	 const SlrControl = L.Control.extend({
	   options: { position: 'topright' },
	   onAdd: function() {
	 	const box = L.DomUtil.create('div', 'leaflet-bar slr-ui');
	 	box.style.padding = '8px';
	 	box.style.background = 'white';
	 	box.style.minWidth = '220px';
	 	box.style.display = 'none'; // hidden until overlay is enabled

	 	// depth slider uses 0..20 steps = 0..10 ft in 0.5 ft increments
	 	const stepFromFeet = f => Math.round(f * 2);
	 	const feetFromStep = s => (Number(s) / 2);

	 	box.innerHTML = `
	 	  <div style="font-weight:600; margin-bottom:6px;">Sea Level Rise</div>
	 	  <div style="display:flex; justify-content:space-between; align-items:center;">
	 		<label style="font-size:12px;">Depth (ft above MHHW)</label>
	 		<div id="slrFeetLabel" style="font-size:12px; font-weight:600;">${slrFeet.toFixed(1).replace(/\.0$/, '')} ft</div>
	 	  </div>
	 	  <input id="slrFeetRange" type="range" min="0" max="20" step="1"
	 			 value="${stepFromFeet(slrFeet)}" style="width:100%; margin:4px 0 8px 0;">

	 	  <label style="font-size:12px;">Opacity</label>
	 	  <input id="slrOpacityRange" type="range" min="0" max="1" step="0.05"
	 			 value="${slrOpacity}" style="width:100%; margin:2px 0 6px 0;">

          <label style="font-size:12px; display:flex; gap:6px; align-items:center; margin-top:4px;">
            <input id="slrConfChk" type="checkbox"> Show uncertainty
          </label>
          
          <div id="confControls" style="display:none; margin:6px 0 0 0;">
            <label style="font-size:12px;">Uncertainty opacity</label>
            <input id="confOpacityRange" type="range" min="0" max="1" step="0.05"
                   value="0.6" style="width:100%; margin-top:2px;">
          </div>
          
          <div style="margin-top:8px;">
            <div style="font-size:12px; opacity:.85;">Depth legend</div>
            <div id="slrLegend" style="margin-top:4px;"></div>
          </div>
          
	 	  <div id="confLegendWrap" style="margin-top:8px; display:none;">
	 		<div style="font-size:12px; opacity:.85;">Uncertainty legend</div>
	 		<div id="confLegend" style="margin-top:4px;"></div>
	 	  </div>

	 	`;

	 	// stop map interactions on UI
	 	L.DomEvent.disableClickPropagation(box);
	 	L.DomEvent.on(box, 'mousewheel', L.DomEvent.stopPropagation);

	 	// wire controls
	 	const feetRange = box.querySelector('#slrFeetRange');
	 	const feetLabel = box.querySelector('#slrFeetLabel');
	 	const opRange = box.querySelector('#slrOpacityRange');
	 	const confChk = box.querySelector('#slrConfChk');
		const confWrap = box.querySelector('#confControls');
		const confRange = box.querySelector('#confOpacityRange');

	 	feetRange.addEventListener('input', async e => {
	 	  slrFeet = feetFromStep(e.target.value);
	 	  feetLabel.textContent = `${slrFeet.toFixed(1).replace(/\.0$/, '')} ft`;
	 	  if (map.hasLayer(slrGroup)) {
	 		rebuildSlrTiles();
	 		refreshLegends(box);
	 	  }
	 	});

	 	opRange.addEventListener('input', e => {
	 	  slrOpacity = parseFloat(e.target.value);
	 	  if (slrTile) slrTile.setOpacity(slrOpacity);
	 	});

		confChk.addEventListener('change', async e => {
		  showConf = !!e.target.checked;
		  confWrap.style.display = showConf ? '' : 'none';
		  if (map.hasLayer(slrGroup)) {
			rebuildSlrTiles();
			this.refreshLegends();
		  }
		});

		confRange.addEventListener('input', e => {
		  confOpacity = parseFloat(e.target.value);
		  if (confTile) confTile.setOpacity(confOpacity);
		});

	 	// expose helpers for show/hide + refresh
	 	this._box = box;
	 	this.refreshLegends = () => refreshLegends(box);
	 	this.show = () => { box.style.display = ''; };
	 	this.hide = () => { box.style.display = 'none'; };

	 	return box;
	   }
	 });
	 const slrControl = new SlrControl().addTo(map);

	 // When the overlay is toggled in the Layers control, show/hide the UI and build tiles.
	 map.on('overlayadd', e => {
	   if (e.layer === slrGroup) {
	 	slrControl.show();
	 	rebuildSlrTiles();
	 	slrControl.refreshLegends();
	   }
	 });
	 map.on('overlayremove', e => {
	   if (e.layer === slrGroup) {
	 	slrControl.hide();
	 	slrGroup.clearLayers();
	   }
	 });



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

