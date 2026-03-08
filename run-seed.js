fetch('http://localhost:3000/api/admin/seed-products')
    .then(res => res.json())
    .then(data => console.log('Seed Response:', data))
    .catch(err => console.error('Seed Error:', err));
