const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://vrfebojxpyfrertujgye.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZmVib2p4cHlmcmVydHVqZ3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzEwODYsImV4cCI6MjA4ODIwNzA4Nn0.8LbYssgSAj19rgmCCAOw8Nu4Ogcn16yIYYdBrge2Ftg"
);

async function test() {
  console.log('Testing Supabase Storage...');
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Available Buckets:', data.map(b => b.name));

  const hasProducts = data.some(b => b.name === 'products');
  if (!hasProducts) {
    console.log('ALERT: "products" bucket is MISSING.');
  } else {
    console.log('SUCCESS: "products" bucket exists.');
  }
}

test();
