export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}
