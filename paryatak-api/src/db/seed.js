/**
 * Paryatak Database Seed
 * Seeds: States, Categories, Destinations, NearbyServices
 * Run: npm run db:seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STATES = [
    { name: 'Rajasthan', slug: 'rajasthan', region: 'North', capital: 'Jaipur', language: 'Hindi', description: 'The Land of Kings, known for magnificent forts, palaces, and the Thar Desert.', imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800' },
    { name: 'Kerala', slug: 'kerala', region: 'South', capital: 'Thiruvananthapuram', language: 'Malayalam', description: "God's Own Country — backwaters, beaches, hill stations, and rich culture.", imageUrl: 'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800' },
    { name: 'Himachal Pradesh', slug: 'himachal-pradesh', region: 'North', capital: 'Shimla', language: 'Hindi', description: 'A mountain paradise with snow-capped peaks, valleys, and adventure sports.', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
    { name: 'Goa', slug: 'goa', region: 'West', capital: 'Panaji', language: 'Konkani', description: 'India\'s smallest state, famous for sun-kissed beaches and Portuguese heritage.', imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800' },
    { name: 'Uttar Pradesh', slug: 'uttar-pradesh', region: 'North', capital: 'Lucknow', language: 'Hindi', description: 'Home to the Taj Mahal and countless UNESCO World Heritage Sites.', imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800' },
    { name: 'Tamil Nadu', slug: 'tamil-nadu', region: 'South', capital: 'Chennai', language: 'Tamil', description: 'The cradle of Dravidian civilization with magnificent temples and coastal beauty.', imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800' },
    { name: 'Jammu & Kashmir', slug: 'jammu-kashmir', region: 'North', capital: 'Srinagar', language: 'Kashmiri', description: 'Paradise on Earth — valleys, Dal Lake, and the majestic Himalayas.', imageUrl: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800' },
    { name: 'Maharashtra', slug: 'maharashtra', region: 'West', capital: 'Mumbai', language: 'Marathi', description: 'From Mumbai\'s energy to the Ajanta-Ellora caves and Konkan coast.', imageUrl: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800' },
    { name: 'West Bengal', slug: 'west-bengal', region: 'East', capital: 'Kolkata', language: 'Bengali', description: 'Cultural capital of India with rich literature, art, and Darjeeling tea gardens.', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
    { name: 'Gujarat', slug: 'gujarat', region: 'West', capital: 'Gandhinagar', language: 'Gujarati', description: 'Land of the Rann of Kutch, vibrant festivals, and Gir National Park.', imageUrl: 'https://images.unsplash.com/photo-1616487701797-de0a79aaee91?w=800' },
    { name: 'Uttarakhand', slug: 'uttarakhand', region: 'North', capital: 'Dehradun', language: 'Hindi', description: 'Devbhumi — Land of Gods with Char Dham, Valley of Flowers, and Jim Corbett.', imageUrl: 'https://images.unsplash.com/photo-1609766418204-9b6d6b5e8b11?w=800' },
    { name: 'Karnataka', slug: 'karnataka', region: 'South', capital: 'Bengaluru', language: 'Kannada', description: 'From Hampi\'s ruins to Coorg\'s coffee estates and coastal Mangalore.', imageUrl: 'https://images.unsplash.com/photo-1592550516667-e8ae3a0e4e4a?w=800' },
];

const CATEGORIES = [
    { name: 'Historical', slug: 'historical', icon: '🏛️', color: '#D4A017', description: 'Ancient monuments, forts, palaces, and archaeological sites.' },
    { name: 'Religious', slug: 'religious', icon: '🛕', color: '#FF6B35', description: 'Temples, mosques, churches, and sacred pilgrimage sites.' },
    { name: 'Adventure', slug: 'adventure', icon: '🧗', color: '#2ECC71', description: 'Trekking, rafting, paragliding, and extreme sports destinations.' },
    { name: 'Nature', slug: 'nature', icon: '🌿', color: '#27AE60', description: 'Gardens, valleys, forests, and scenic natural landscapes.' },
    { name: 'Wildlife', slug: 'wildlife', icon: '🐯', color: '#E67E22', description: 'National parks, sanctuaries, and wildlife reserves.' },
    { name: 'Beaches', slug: 'beaches', icon: '🏖️', color: '#3498DB', description: 'Coastal destinations with stunning beaches and water activities.' },
    { name: 'Hill Stations', slug: 'hill-stations', icon: '⛰️', color: '#9B59B6', description: 'Cool mountain retreats and scenic hill towns.' },
];

const DESTINATIONS = [
    // Rajasthan
    { name: 'Jaipur — Pink City', slug: 'jaipur-pink-city', stateName: 'Rajasthan', categoryName: 'Historical', city: 'Jaipur', latitude: 26.9124, longitude: 75.7873, shortDesc: 'The Pink City of majestic forts and vibrant bazaars', description: 'Jaipur, the Pink City, is the capital of Rajasthan and a jewel of the Golden Triangle. Home to the magnificent Hawa Mahal, Amber Fort, City Palace, and Jantar Mantar. The city is famous for its stunning Rajput-era architecture, colorful bazaars filled with handicrafts, gems, and textiles.', entryFee: 'Amber Fort: ₹100 (Indians), ₹500 (Foreigners)', timings: 'Amber Fort: 8 AM – 6 PM', bestTime: 'October to March', duration: '2-3 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800' },
    { name: 'Jodhpur — Blue City', slug: 'jodhpur-blue-city', stateName: 'Rajasthan', categoryName: 'Historical', city: 'Jodhpur', latitude: 26.2389, longitude: 73.0243, shortDesc: 'Imposing Mehrangarh Fort and blue-washed old city', description: 'Jodhpur, the Blue City, is dominated by the imposing Mehrangarh Fort perched 400 feet above. The old city is famous for its blue-painted houses, winding lanes, spice markets, and the stunning Umaid Bhawan Palace.', entryFee: 'Mehrangarh Fort: ₹100 (Indians), ₹600 (Foreigners)', timings: '9 AM – 5:30 PM', bestTime: 'October to March', duration: '1-2 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1524230507669-5ff97d8f47d7?w=800' },
    { name: 'Jaisalmer Fort', slug: 'jaisalmer-fort', stateName: 'Rajasthan', categoryName: 'Historical', city: 'Jaisalmer', latitude: 26.9157, longitude: 70.9083, shortDesc: 'The Golden Fort rising from the Thar Desert', description: 'The Golden City of Jaisalmer, with its UNESCO-listed Jaisalmer Fort rising dramatically from the Thar Desert, is a living fort with shops, hotels, and temples inside its massive sandstone walls.', entryFee: '₹100 (Indians), ₹250 (Foreigners)', timings: '8 AM – 6 PM', bestTime: 'October to February', duration: '2-3 days', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=800' },
    
    // Kerala
    { name: 'Alleppey Backwaters', slug: 'alleppey-backwaters', stateName: 'Kerala', categoryName: 'Nature', city: 'Alleppey', latitude: 9.4981, longitude: 76.3388, shortDesc: 'Venice of the East — serene houseboat cruises', description: 'Alappuzha (Alleppey), known as the Venice of the East, is famous for its network of canals, backwaters, beaches, and lagoons. Houseboat cruises through the backwaters offer an unforgettable Kerala experience.', entryFee: 'Houseboat: ₹8,000-15,000 per day', timings: 'Year-round', bestTime: 'October to March', duration: '1-2 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800' },
    { name: 'Munnar Tea Gardens', slug: 'munnar-tea-gardens', stateName: 'Kerala', categoryName: 'Hill Stations', city: 'Munnar', latitude: 10.0889, longitude: 77.0595, shortDesc: 'Lush green tea plantations and misty mountains', description: 'Munnar is a hill station in the Western Ghats known for its rolling hills of tea plantations, spectacular scenery, and cool climate. The Eravikulam National Park here is home to the endangered Nilgiri Tahr.', entryFee: 'Eravikulam NP: ₹130 (Indians)', timings: '7 AM – 4 PM', bestTime: 'September to May', duration: '2-3 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1580968816543-0b9ad1f67c15?w=800' },
    { name: 'Varkala Beach', slug: 'varkala-beach', stateName: 'Kerala', categoryName: 'Beaches', city: 'Varkala', latitude: 8.7379, longitude: 76.7163, shortDesc: 'Dramatic cliffs overlooking the Arabian Sea', description: 'Varkala is a unique beach destination where dramatic red cliffs plunge directly into the sea. The cliff-top promenade is lined with restaurants, Ayurvedic spas, and yoga centers, making it a spiritual and relaxing retreat.', entryFee: 'Free', timings: 'Year-round', bestTime: 'November to February', duration: '2-3 days', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800' },

    // Himachal Pradesh
    { name: 'Manali Valley', slug: 'manali-valley', stateName: 'Himachal Pradesh', categoryName: 'Adventure', city: 'Manali', latitude: 32.2396, longitude: 77.1887, shortDesc: 'Gateway to the Himalayas and adventure capital', description: 'Manali is a high-altitude Himalayan resort town known for adventure sports like skiing, paragliding, and trekking. The Rohtang Pass, Solang Valley, and Beas River offer spectacular natural beauty.', entryFee: 'Rohtang Pass permit: ₹550 per vehicle', timings: 'Year-round (some areas close in winter)', bestTime: 'March to June, Sept-Nov', duration: '3-5 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
    { name: 'Dharamshala & McLeod Ganj', slug: 'dharamshala-mcleod-ganj', stateName: 'Himachal Pradesh', categoryName: 'Religious', city: 'Dharamshala', latitude: 32.2190, longitude: 76.3234, shortDesc: 'Little Lhasa — home of the Dalai Lama', description: 'Dharamshala, and its upper suburb McLeod Ganj, is the residence of the Dalai Lama and Tibetan government-in-exile. Known for its Tibetan culture, monasteries, cafes, and stunning mountain views.', entryFee: 'Free', timings: 'Year-round', bestTime: 'March to June, Sept-Dec', duration: '2-3 days', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1563804951710-24c76c552568?w=800' },
    { name: 'Spiti Valley', slug: 'spiti-valley', stateName: 'Himachal Pradesh', categoryName: 'Adventure', city: 'Kaza', latitude: 32.2260, longitude: 78.0738, shortDesc: 'A cold desert mountain valley beyond the great Himalayas', description: 'Spiti Valley is a cold desert mountain valley located in the Himalayas. Known for Key Monastery, Chandratal Lake, and some of the world\'s highest villages. An off-the-beaten-path destination for serious adventurers.', entryFee: 'Inner Line Permit required for some areas', timings: 'June to September', bestTime: 'June to September', duration: '5-7 days', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=800' },

    // Goa
    { name: 'Baga & Calangute Beach', slug: 'baga-calangute-beach', stateName: 'Goa', categoryName: 'Beaches', city: 'North Goa', latitude: 15.5524, longitude: 73.7517, shortDesc: 'Goa\'s most popular stretch of golden beach', description: 'Baga and Calangute form Goa\'s most popular beach stretch, buzzing with shacks, water sports, nightlife, and markets. Perfect for first-time visitors seeking the classic Goa experience.', entryFee: 'Free', timings: 'Year-round', bestTime: 'November to February', duration: '3-5 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800' },
    { name: 'Old Goa Churches', slug: 'old-goa-churches', stateName: 'Goa', categoryName: 'Historical', city: 'Old Goa', latitude: 15.5009, longitude: 73.9116, shortDesc: 'UNESCO-listed Portuguese baroque churches', description: 'Old Goa is a UNESCO World Heritage Site with magnificent Portuguese-era churches including the Basilica of Bom Jesus (holding Saint Francis Xavier\'s remains) and Se Cathedral.', entryFee: 'Free', timings: '9 AM – 6:30 PM', bestTime: 'November to March', duration: 'Half day', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800' },

    // Uttar Pradesh
    { name: 'Taj Mahal', slug: 'taj-mahal', stateName: 'Uttar Pradesh', categoryName: 'Historical', city: 'Agra', latitude: 27.1751, longitude: 78.0421, shortDesc: 'The iconic white marble mausoleum, a wonder of the world', description: 'The Taj Mahal, built by Mughal Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal, is one of the Seven Wonders of the World. This stunning white marble mausoleum is a UNESCO World Heritage Site.', entryFee: '₹50 (Indians), ₹1,100 (Foreigners)', timings: 'Sunrise to Sunset (Closed Fridays)', bestTime: 'October to March', duration: '3-4 hours', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800' },
    { name: 'Varanasi Ghats', slug: 'varanasi-ghats', stateName: 'Uttar Pradesh', categoryName: 'Religious', city: 'Varanasi', latitude: 25.3176, longitude: 82.9739, shortDesc: 'The spiritual capital of India on the banks of the Ganges', description: 'Varanasi is one of the world\'s oldest living cities and the spiritual capital of India. The Ganga Aarti at Dashashwamedh Ghat is a mesmerizing ritual of fire, chanting, and devotion performed every evening.', entryFee: 'Free', timings: 'Year-round, Aarti at sunset', bestTime: 'October to March', duration: '2-3 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800' },

    // Jammu & Kashmir
    { name: 'Dal Lake, Srinagar', slug: 'dal-lake-srinagar', stateName: 'Jammu & Kashmir', categoryName: 'Nature', city: 'Srinagar', latitude: 34.0836, longitude: 74.7973, shortDesc: 'The Jewel in the Crown — floating gardens and houseboats', description: 'Dal Lake in Srinagar is often called the Jewel in the Crown of Kashmir. Famous for its floating gardens, ornate houseboats, shikaras (wooden boats), and the stunning reflection of the surrounding mountains.', entryFee: 'Shikara ride: ₹100/hour', timings: 'Year-round', bestTime: 'April to October', duration: '2-3 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800' },
    { name: 'Gulmarg Ski Resort', slug: 'gulmarg-ski-resort', stateName: 'Jammu & Kashmir', categoryName: 'Adventure', city: 'Gulmarg', latitude: 34.0494, longitude: 74.3805, shortDesc: 'Asia\'s premier ski destination with breathtaking views', description: 'Gulmarg is Asia\'s premier ski resort, set amidst lush green meadows surrounded by the Pir Panjal mountain range. In winter, it transforms into a snowy paradise, while summer offers golf and trekking.', entryFee: 'Gondola: ₹800 (Phase 1 + 2)', timings: 'Year-round', bestTime: 'Dec-Feb (skiing), May-Sep (summer)', duration: '2-3 days', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800' },

    // Maharashtra
    { name: 'Ajanta & Ellora Caves', slug: 'ajanta-ellora-caves', stateName: 'Maharashtra', categoryName: 'Historical', city: 'Aurangabad', latitude: 20.5519, longitude: 75.7033, shortDesc: 'UNESCO ancient rock-cut cave temples and monasteries', description: 'The Ajanta and Ellora Caves are two of India\'s most spectacular UNESCO World Heritage Sites. Ajanta features ancient Buddhist cave paintings, while Ellora showcases Hindu, Buddhist, and Jain rock-cut temples.', entryFee: 'Ajanta: ₹40 (Indians), ₹600 (Foreigners)', timings: '9 AM – 5:30 PM (closed Mondays)', bestTime: 'November to March', duration: '2 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },

    // West Bengal
    { name: 'Darjeeling Tea Gardens', slug: 'darjeeling-tea-gardens', stateName: 'West Bengal', categoryName: 'Hill Stations', city: 'Darjeeling', latitude: 27.0360, longitude: 88.2627, shortDesc: 'Queen of Hill Stations with Himalayan views and tea estates', description: 'Darjeeling is a charming hill station famous for its tea plantations, the UNESCO-listed Darjeeling Himalayan Railway (Toy Train), and magnificent views of Kanchenjunga, the world\'s third highest peak.', entryFee: 'Tiger Hill sunrise: ₹100', timings: 'Year-round', bestTime: 'March to May, September to November', duration: '3-4 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1562979314-bee7453e911c?w=800' },

    // Uttarakhand
    { name: 'Rishikesh — Yoga Capital', slug: 'rishikesh-yoga-capital', stateName: 'Uttarakhand', categoryName: 'Religious', city: 'Rishikesh', latitude: 30.0869, longitude: 78.2676, shortDesc: 'The Yoga Capital of the World on the Ganges', description: 'Rishikesh is the gateway to the Himalayas and the Yoga Capital of the World. Set on the banks of the sacred Ganges, it offers yoga ashrams, white-water rafting, bungee jumping, and the nightly Ganga Aarti at Triveni Ghat.', entryFee: 'Most ashrams: Free', timings: 'Year-round', bestTime: 'February to November', duration: '3-5 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800' },
    { name: 'Jim Corbett National Park', slug: 'jim-corbett-national-park', stateName: 'Uttarakhand', categoryName: 'Wildlife', city: 'Ramnagar', latitude: 29.5300, longitude: 78.7747, shortDesc: 'India\'s oldest national park and Bengal tiger haven', description: 'Jim Corbett National Park is India\'s oldest and most prestigious national park, established in 1936. Home to Bengal tigers, elephants, leopards, and over 600 bird species. Jeep safaris offer thrilling wildlife encounters.', entryFee: '₹200-2,500 depending on zone', timings: 'November to June', bestTime: 'November to June', duration: '2-3 days', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800' },

    // Karnataka
    { name: 'Hampi Ruins', slug: 'hampi-ruins', stateName: 'Karnataka', categoryName: 'Historical', city: 'Hampi', latitude: 15.3350, longitude: 76.4601, shortDesc: 'UNESCO ruins of the Vijayanagara Empire', description: 'Hampi is a UNESCO World Heritage Site and the ruins of the Vijayanagara Empire, one of the greatest medieval Hindu kingdoms. The surreal landscape of giant boulders, temples, and royal structures is unlike anywhere else.', entryFee: '₹40 (Indians), ₹600 (Foreigners)', timings: '6 AM – 6 PM', bestTime: 'October to March', duration: '2-3 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1592550516667-e8ae3a0e4e4a?w=800' },
    { name: 'Coorg Coffee Estates', slug: 'coorg-coffee-estates', stateName: 'Karnataka', categoryName: 'Nature', city: 'Coorg', latitude: 12.3375, longitude: 75.8069, shortDesc: 'Scotland of India — misty coffee plantations and waterfalls', description: 'Coorg (Kodagu) is the Scotland of India, known for its lush coffee and spice plantations, misty hills, cascading waterfalls, and unique Kodava culture. Abbey Falls and Raja\'s Seat are must-visits.', entryFee: 'Free (most areas)', timings: 'Year-round', bestTime: 'October to March', duration: '3-4 days', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800' },

    // Gujarat
    { name: 'Rann of Kutch', slug: 'rann-of-kutch', stateName: 'Gujarat', categoryName: 'Nature', city: 'Bhuj', latitude: 23.7337, longitude: 69.8597, shortDesc: 'The world\'s largest salt desert under a full moon', description: 'The Rann of Kutch is the world\'s largest salt desert, offering a surreal landscape of white salt flats stretching to the horizon. The Rann Utsav festival (Nov-Feb) transforms this landscape into a vibrant cultural celebration.', entryFee: 'Rann Utsav package: ₹1,500+', timings: 'October to March', bestTime: 'November to February', duration: '2-3 days', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1616487701797-de0a79aaee91?w=800' },
];

const NEARBY_SERVICES = [
    { name: 'AIIMS Delhi', type: 'HOSPITAL', latitude: 28.5672, longitude: 77.2100, city: 'New Delhi', state: 'Delhi', address: 'Sri Aurobindo Marg, Ansari Nagar', phone: '011-26588500' },
    { name: 'Safdarjung Hospital', type: 'HOSPITAL', latitude: 28.5685, longitude: 77.2067, city: 'New Delhi', state: 'Delhi', address: 'Sri Aurobindo Marg', phone: '011-26730000' },
    { name: 'Parliament Street Police Station', type: 'POLICE', latitude: 28.6236, longitude: 77.2129, city: 'New Delhi', state: 'Delhi', address: 'Parliament St, New Delhi', phone: '011-23362828' },
    { name: 'Connaught Place Police Station', type: 'POLICE', latitude: 28.6328, longitude: 77.2195, city: 'New Delhi', state: 'Delhi', address: 'CP, New Delhi', phone: '011-23741100' },
    { name: 'Tourism Help Center — Jaipur Airport', type: 'TOURIST_HELP', latitude: 26.8242, longitude: 75.8122, city: 'Jaipur', state: 'Rajasthan', address: 'Jaipur International Airport', phone: '0141-2550623' },
    { name: 'Government Hospital Munnar', type: 'HOSPITAL', latitude: 10.0630, longitude: 77.0735, city: 'Munnar', state: 'Kerala', address: 'Munnar Town, Kerala', phone: '04865-230224' },
    { name: 'Tourist Police — Agra', type: 'POLICE', latitude: 27.1764, longitude: 78.0081, city: 'Agra', state: 'Uttar Pradesh', address: 'Near Taj Mahal, Agra', phone: '0562-2421204' },
    { name: 'Goa Medical College', type: 'HOSPITAL', latitude: 15.4700, longitude: 73.8278, city: 'Panaji', state: 'Goa', address: 'NH-66, Bambolim, Goa', phone: '0832-2458727' },
];

const seedDatabase = async () => {
    console.log('🌱 Starting database seed...\n');
    const results = {};

    // States
    console.log('📍 Seeding states...');
    results.states = 0;
    for (const s of STATES) {
        await prisma.state.upsert({ where: { slug: s.slug }, create: s, update: s });
        results.states++;
    }
    console.log(`   ✅ ${results.states} states seeded`);

    // Categories
    console.log('🏷️  Seeding categories...');
    results.categories = 0;
    for (const c of CATEGORIES) {
        await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: c });
        results.categories++;
    }
    console.log(`   ✅ ${results.categories} categories seeded`);

    // Destinations
    console.log('🗺️  Seeding destinations...');
    results.destinations = 0;
    for (const d of DESTINATIONS) {
        const state = await prisma.state.findUnique({ where: { name: d.stateName } });
        const category = await prisma.category.findUnique({ where: { name: d.categoryName } });
        if (!state || !category) { console.warn(`   ⚠️  Skipping ${d.name}: state/category not found`); continue; }
        const { stateName, categoryName, imageUrl, ...rest } = d;
        const dest = await prisma.destination.upsert({
            where: { slug: d.slug },
            create: { ...rest, stateId: state.id, categoryId: category.id },
            update: { ...rest, stateId: state.id, categoryId: category.id },
        });
        // Primary image
        if (imageUrl) {
            const existing = await prisma.destinationImage.findFirst({ where: { destinationId: dest.id, isPrimary: true } });
            if (!existing) {
                await prisma.destinationImage.create({ data: { destinationId: dest.id, url: imageUrl, isPrimary: true, caption: d.name } });
            }
        }
        results.destinations++;
    }
    console.log(`   ✅ ${results.destinations} destinations seeded`);

    // Nearby Services
    console.log('🚨 Seeding nearby services...');
    results.services = 0;
    for (const s of NEARBY_SERVICES) {
        await prisma.nearbyService.create({ data: s }).catch(() => {});
        results.services++;
    }
    console.log(`   ✅ ${results.services} nearby services seeded`);

    console.log('\n🎉 Database seed completed successfully!');
    return results;
};

// Run if called directly
if (require.main === module) {
    seedDatabase()
        .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
        .finally(() => prisma.$disconnect());
}

module.exports = { seedDatabase };
