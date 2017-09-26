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

		const bounds: L.LatLngBounds = (this as any)._tileCoordsToBounds(xyz);
		const size = this.getTileSize();

		canvas.width = size.x;
		canvas.height = size.y;

		const sw = bounds.getSouthWest();
		const ne = bounds.getNorthEast();
		const bbox = new BBox(sw.lat, sw.lng, ne.lat, ne.lng);

		new Promise((resolve: (layerFeatures: LayerFeaturesPromise) => void) =>
			resolve(this.layer.getLayerFeatures(bbox, size.x, size.y))
		).then((features: LayerFeatures) =>
			this.renderer.render(canvas, features, bbox, size.x, size.y, xyz.z)
		).then(() =>
			cb(null, canvas)
		);

		return(canvas);
	}

}
