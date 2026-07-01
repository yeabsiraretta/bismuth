/**
 * Storyteller Suite — Map system types.
 */

export type MapMode = 'image' | 'osm';

export interface StoryMap {
  id: string;
  storyId: string;
  name: string;
  mode: MapMode;
  imagePath?: string;
  imageWidth?: number;
  imageHeight?: number;
  center: { lat: number; lng: number };
  zoom: number;
  parentMapId?: string;
  markers: MapMarker[];
  portals: MapPortal[];
}

export interface MapMarker {
  id: string;
  entityId: string;
  entityType: string;
  label: string;
  lat: number;
  lng: number;
  icon?: string;
  color?: string;
  description?: string;
}

export interface MapPortal {
  id: string;
  label: string;
  lat: number;
  lng: number;
  targetMapId: string;
}

export interface MapBreadcrumb {
  mapId: string;
  mapName: string;
}
