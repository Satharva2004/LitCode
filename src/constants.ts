const config = require('./config.production');

export const GITHUB_CLIENT_ID = config.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = config.GITHUB_CLIENT_SECRET;
export const GITHUB_REDIRECT_URI = config.GITHUB_REDIRECT_URI;
export const LITCODE_API_BASE_URL = config.LITCODE_API_BASE_URL || '';
