const mongoose = require('mongoose');
const productModel = require('./models/product-model');
const axios = require('axios');

mongoose.connect("mongodb://127.0.0.1:27017/scatch")
    .then(() => console.log("Connected to DB for Synced Indian Seeding"))
    .catch(err => console.log(err));

// Defined categories with STRICT keywords for better image matching
const indianFashion = [
    { name: 'Pure Silk Saree', keywords: 'saree,indian,silk' },
    { name: 'Designer Saree', keywords: 'saree,traditional,fashion' },
    { name: 'Royal Sherwani', keywords: 'sherwani,groom,indian' },
    { name: 'Wedding Sherwani', keywords: 'sherwani,wedding,royal' },
    { name: 'Cotton Kurta', keywords: 'kurta,men,indian,ethnic' },
    { name: 'Designer Kurti', keywords: 'kurti,women,indian,ethnic' },
    { name: 'Bridal Lehenga', keywords: 'lehenga,indian,bridal' },
    { name: 'Anarkali Suit', keywords: 'anarkali,suit,ethnic' },
    { name: 'Formal Suit', keywords: 'men,suit,formal,corporate' },
    { name: 'Nehru Jacket', keywords: 'nehru,jacket,indian' }
];

const brands = ['BANGER Elite', 'Heritage Silk', 'Royal Utsav', 'Desi Grace', 'Vedic Fashion'];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchUniqueImage(index) {
    // Switching to broader but relevant keywords to GUARANTEE human fashion images
    const sources = [
        `https://loremflickr.com/800/1000/fashion,model,asia?lock=${index + 100}`,
        `https://loremflickr.com/800/1000/clothing,model,ethnic?lock=${index + 500}`,
        `https://loremflickr.com/800/1000/fashion,asia?lock=${index + 900}`
    ];

    for (let url of sources) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
            const buffer = Buffer.from(response.data);
            if (buffer.length > 50000) return buffer;
        } catch (e) {
            console.log(`Source failed: ${url}`);
        }
    }
    
    // Final fallback to guaranteed human pics
    const res = await axios.get(`https://picsum.photos/seed/${index}/800/1000`, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}

async function seedSyncedProducts() {
    console.log("CLEANING DB AND STARTING SYNCED INDIAN SEEDING...");
    await productModel.deleteMany({});
    
    for (let i = 0; i < 100; i++) {
        const item = indianFashion[i % indianFashion.length];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const gender = (item.name.toLowerCase().includes('kurta') || item.name.toLowerCase().includes('sherwani') || item.name.toLowerCase().includes('jacket') || item.name.toLowerCase().includes('formal')) ? 'Men' : 'Women';

        const image = await fetchUniqueImage(i);
        await sleep(1000); // 1 second delay

        await productModel.create({
            image,
            name: `${brand} ${item.name}`,
            price: Math.floor(Math.random() * 9000) + 1800,
            discount: Math.floor(Math.random() * 600) + 200,
            bgcolor: '#ffffff',
            panelcolor: '#2563eb',
            textcolor: '#000000',
            category: item.name.split(' ').pop(), // Takes Saree, Kurta, etc.
            gender: gender,
            quantity: Math.floor(Math.random() * 40) + 10,
            description: `Premium ${item.name} by ${brand}. High-quality fabric with authentic Indian craftsmanship. Perfect for ${gender === 'Men' ? 'Gents' : 'Ladies'}.`,
            sizes: ['M', 'L', 'XL', 'XXL']
        });

        console.log(`[${i+1}/100] Synced: ${brand} ${item.name} (${gender})`);
    }

    console.log("DONE! 100 Synced Indian Products Added.");
    process.exit();
}

seedSyncedProducts();
