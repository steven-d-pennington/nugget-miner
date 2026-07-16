import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nugget',
    short_name: 'Nugget',
    description: 'Capture spoken ideas and organize them into useful, editable records.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF8F2',
    theme_color: '#FBF8F2',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    icons: [
      { src: '/icons/nugget.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/nugget.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
