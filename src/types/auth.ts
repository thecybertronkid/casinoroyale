export interface UserRestrictions {
  isBanned: boolean;
  canClaimRelief: boolean;
  restrictedGames: string[];
  maxBetLimit: number | null;
  adminNotes?: string;
}

export interface UserProfile extends UserRestrictions {
  id: string;
  email: string;
  name: string;
  picture: string;
  joinedAt: number;
  lastSeenAt?: number;
}

export interface AdminUserData {
  profile: UserProfile;
  balance: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  totalBets: number;
  biggestWin: number;
  highestMultiplier: number;
  updatedAt: string;
}
