// Public sign-in settings: Google directly, no AWS. Own Google client, separate from Team Hub.
window.HRR_AUTH_CONFIG = {
  apiBase: 'https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev',
  googleClientId: '1091736019816-1g6nrbnmaj30tg18vvpfho441tahttdi.apps.googleusercontent.com',
  redirectUri: `${window.location.origin}${window.location.pathname}`
};
