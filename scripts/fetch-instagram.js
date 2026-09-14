#!/usr/bin/env node
// Busca os posts mais recentes via Instagram Graph API (API com Login do Instagram,
// host graph.instagram.com) e salva em data/instagram-feed.json.
//
// Variáveis de ambiente esperadas:
//   INSTAGRAM_ACCESS_TOKEN  (obrigatória) - long-lived access token
//   INSTAGRAM_USER_ID       (opcional)    - IG user id; se omitida, usa "me"
//   INSTAGRAM_MEDIA_LIMIT   (opcional)    - quantidade de posts (padrão: 12)

const fs = require('fs');
const path = require('path');

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID || 'me';
const LIMIT = process.env.INSTAGRAM_MEDIA_LIMIT || '12';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'instagram-feed.json');

const FIELDS = [
  'id',
  'caption',
  'media_type',
  'media_product_type',
  'media_url',
  'permalink',
  'thumbnail_url',
  'timestamp',
].join(',');

async function fetchInstagramMedia() {
  if (!ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN não está definido.');
  }

  const url = `https://graph.instagram.com/${USER_ID}/media?fields=${FIELDS}&limit=${LIMIT}&access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok || body.error) {
    const message = body.error ? body.error.message : `HTTP ${response.status}`;
    throw new Error(`Instagram Graph API retornou erro: ${message}`);
  }

  return body.data || [];
}

async function main() {
  const posts = await fetchInstagramMedia();

  const payload = {
    updated_at: new Date().toISOString(),
    posts: posts.map((post) => ({
      id: post.id,
      caption: post.caption || '',
      media_type: post.media_type,
      media_product_type: post.media_product_type || null,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url || post.media_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
    })),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n');

  console.log(`Salvo ${payload.posts.length} posts em ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Falha ao buscar feed do Instagram:', err.message);
  process.exit(1);
});
