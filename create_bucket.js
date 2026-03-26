const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://vrfebojxpyfrertujgye.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZmVib2p4cHlmcmVydHVqZ3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzEwODYsImV4cCI6MjA4ODIwNzA4Nn0.8LbYssgSAj19rgmCCAOw8Nu4Ogcn16yIYYdBrge2Ftg"
);

async function test() {
  console.log('Attempting to create "products" bucket...');
  const { data, error } = await supabase.storage.createBucket('products', { public: true });
  if (error) {
    console.error('FAILED to create bucket:', error.message);
  } else {
    console.log('SUCCESS: Bucket "products" created!', data);
  }
}

test();
