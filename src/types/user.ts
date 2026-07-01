export type TerraRunUser = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  homeCity: string;
  totalDistanceMeters: number;
  territoryCount: number;
  rank: number;
  level?: number;
  xp?: number;
  totalRuns?: number;
  gender?: string;
  dob?: string;
  age?: number;
  address?: string;
  phoneNumber?: string;
  yatraColor?: string;
};
