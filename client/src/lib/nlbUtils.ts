/**
 * Utility functions for NLB (National Library Board) resources
 */

/**
 * Generate NLB OneSearch URL for a waypoint
 * @param waypointName - The name of the waypoint (e.g., "chinatown complex")
 * @param searchType - Type of search (image, audio, video, etc.)
 * @returns The complete NLB OneSearch URL
 */
export function generateNLBSearchUrl(
  waypointName: string,
  searchType: 'image' | 'audio' | 'video' | 'all' = 'image'
): string {
  if (!waypointName || waypointName.trim() === '') {
    console.error('generateNLBSearchUrl: waypointName is empty or undefined');
    return '#';
  }

  // Convert waypoint name to URL-safe query parameter
  // e.g., "Chinatown Complex" -> "chinatown+complex"
  const query = waypointName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '+'); // Replace spaces with +

  if (!query) {
    console.error('generateNLBSearchUrl: query is empty after processing:', waypointName);
    return '#';
  }

  const baseUrl = 'https://www.nlb.gov.sg/main/onesearch/result';

  // Build URL manually to avoid URLSearchParams encoding issues
  const url = `${baseUrl}?q=${query}&type=${searchType}&page=1&nlonline=true`;

  console.log('Generated URL:', url);
  return url;
}

/**
 * Generate NLB resource link with custom search terms
 * @param searchTerms - Custom search terms (can include multiple words)
 * @param searchType - Type of search
 * @returns The complete NLB OneSearch URL
 */
export function generateNLBCustomUrl(
  searchTerms: string,
  searchType: 'image' | 'audio' | 'video' | 'all' = 'image'
): string {
  if (!searchTerms || searchTerms.trim() === '') {
    console.error('generateNLBCustomUrl: searchTerms is empty or undefined');
    return '#';
  }

  const query = searchTerms
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '+');

  if (!query) {
    console.error('generateNLBCustomUrl: query is empty after processing:', searchTerms);
    return '#';
  }

  const baseUrl = 'https://www.nlb.gov.sg/main/onesearch/result';

  // Build URL manually to avoid URLSearchParams encoding issues
  const url = `${baseUrl}?q=${query}&type=${searchType}&page=1&nlonline=true`;

  return url;
}

/**
 * Get NLB resource type label
 */
export function getNLBResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    photograph: 'View Collection',
    image: 'View Collection',
    audio: 'Listen Now',
    video: 'Watch Now',
    document: 'Read More',
    map: 'Explore',
    all: 'View Resources'
  };

  return labels[type] || 'View Resource';
}
