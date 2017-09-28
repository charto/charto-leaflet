import * as L from 'leaflet';

import { BBox, Layer, LayerFeatures, LayerFeaturesPromise } from 'charto-model';
import { CanvasRenderer } from 'charto-render';

export interface PointZ extends L.Point {
	z: number;
}

export class CanvasLayer extends L.GridLayer {

	constructor(public layer: Layer, public renderer: CanvasRenderer) {
		super();
	}

	createTile(xyz: PointZ, cb: (err: any, canvas: HTMLCanvasElement) => void) {
		const canvas = L.DomUtil.create('canvas', 'leaflet-tile leaflet-tile-loaded') as HTMLCanvasElement;
		const size = this.getTileSize();

		canvas.width = size.x;
		canvas.height = size.y;

		const map: L.Map = (this as any)._map;
		const margin = 8;

		const x = xyz.x * size.x;
		const y = xyz.y * size.y;
		const zoom = xyz.z;

		new Promise((resolve: (layerFeatures: LayerFeaturesPromise) => void) => {
			// Get bounding box in world coordinates for the tile,
			// surrounded by a margin measured in pixels to handle symbols
			// overlapping this tile but centered within neighbor tile edges.
			const sw = map.unproject(new L.Point(x - margin, y + size.y + margin), zoom);
			const ne = map.unproject(new L.Point(x + size.x + margin, y - margin), zoom);
			const bbox = new BBox(sw.lat, sw.lng, ne.lat, ne.lng);

			// Fetch features inside the bounding box from the model layer.
			resolve(this.layer.getLayerFeatures(bbox, size.x, size.y))
		}).then((features: LayerFeatures) => {
			// Get tile bounding box in world coordinates.
			const sw = map.unproject(new L.Point(x, y + size.y), zoom);
			const ne = map.unproject(new L.Point(x + size.x, y), zoom);
			const bbox = new BBox(sw.lat, sw.lng, ne.lat, ne.lng);

			return(this.renderer.render(canvas, features, bbox, size.x, size.y, zoom));
		}).catch(
			// Ignore errors in tile rendering for now.
			// TODO: Maybe draw a warning watermark?
			() => {}
		).then(() =>
			cb(null, canvas)
		);

		return(canvas);
	}

}
