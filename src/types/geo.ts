export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type TerritoryCell = {
  h3Index: string;
  ownerId: string | null;
  score: number;
  center: Coordinates;
};
