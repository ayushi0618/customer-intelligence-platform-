/**
 * Realistic Synthetic Data Generator
 * Multi-Channel Customer Behaviour & Marketing Intelligence System
 *
 * Implements deterministic pseudo-random generation with behavioral personas:
 * 1. High-Value Loyalists
 * 2. At-Risk Customers
 * 3. New Engaged Customers
 * 4. Low-Engagement / Casual Browsers
 */

const bcrypt = require('bcryptjs');

// Mulberry32 deterministic PRNG
function createPrng(seed = 42) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDataset(options = {}) {
  const seed = options.seed || 42;
  const scale = options.scale || 1.0; // 1.0 = full scale (10,000 customers)
  const random = createPrng(seed);

  const numCustomers = Math.max(100, Math.round(10000 * scale));
  console.log(`Generating synthetic dataset with seed=${seed}, scale=${scale}, customers=${numCustomers}...`);

  // Helper generators
  const pick = (arr) => arr[Math.floor(random() * arr.length)];
  const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
  const randFloat = (min, max) => parseFloat((random() * (max - min) + min).toFixed(2));
  
  // Date range: 730 days prior to baseline (Sept 2026)
  const baseDate = new Date('2026-09-25T12:00:00Z');
  const addDays = (d, days) => new Date(d.getTime() + days * 86400000);
  const randomDateBetween = (start, end) => new Date(start.getTime() + random() * (end.getTime() - start.getTime()));

  // 1. Roles
  const roles = [
    { id: 1, name: 'Admin', description: 'Full system administrative access' },
    { id: 2, name: 'Marketing Manager', description: 'Campaign and customer recommendation management' },
    { id: 3, name: 'Data Analyst', description: 'Deep analytical and machine learning model operations' },
    { id: 4, name: 'Executive', description: 'Read-only business intelligence and high-level KPIs' }
  ];

  // 2. Default Seed Users
  const salt = bcrypt.genSaltSync(10);
  const users = [
    { id: 1, username: 'admin', email: 'admin@analytics.enterprise.com', password_hash: bcrypt.hashSync('Admin123!', salt), first_name: 'Arthur', last_name: 'Pendleton', is_active: 1 },
    { id: 2, username: 'marketing', email: 'marketing@analytics.enterprise.com', password_hash: bcrypt.hashSync('Marketing123!', salt), first_name: 'Morgana', last_name: 'Vance', is_active: 1 },
    { id: 3, username: 'analyst', email: 'analyst@analytics.enterprise.com', password_hash: bcrypt.hashSync('Analyst123!', salt), first_name: 'Alan', last_name: 'Turing', is_active: 1 },
    { id: 4, username: 'executive', email: 'executive@analytics.enterprise.com', password_hash: bcrypt.hashSync('Executive123!', salt), first_name: 'Eleanor', last_name: 'Roosevelt', is_active: 1 }
  ];

  const userRoles = [
    { user_id: 1, role_id: 1 },
    { user_id: 2, role_id: 2 },
    { user_id: 3, role_id: 3 },
    { user_id: 4, role_id: 4 }
  ];

  // 3. Product Categories
  const productCategories = [
    { id: 1, name: 'Consumer Electronics', slug: 'electronics', description: 'Smartphones, audio, computing & accessories' },
    { id: 2, name: 'Apparel & Footwear', slug: 'apparel', description: 'Designer clothing, activewear, and shoes' },
    { id: 3, name: 'Home & Living', slug: 'home-living', description: 'Smart furniture, kitchenware & decor' },
    { id: 4, name: 'Beauty & Wellness', slug: 'beauty-wellness', description: 'Skincare, wellness products and cosmetics' },
    { id: 5, name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Fitness equipment, apparel and gear' },
    { id: 6, name: 'Books & Media', slug: 'books-media', description: 'Best-selling print, audio and e-books' },
    { id: 7, name: 'Gourmet Groceries', slug: 'groceries', description: 'Organic snacks, coffee and artisan goods' },
    { id: 8, name: 'Toys & Gaming', slug: 'toys-gaming', description: 'Consoles, tabletop games and collectibles' }
  ];

  // 4. Products (120 items)
  const products = [];
  const categoryNames = {
    1: ['Noise-Cancelling Headphones', '4K Smart Monitor', 'Mechanical Keyboard', 'Wireless Charger Pad', 'USB-C Docking Hub', 'Smartwatch Pro', 'Bluetooth Soundbar', 'HD Webcam 1080p', 'Ergonomic Mouse', 'True Wireless Earbuds', 'Portable Power Bank', 'Smart Home Speaker', 'Action Camera 4K', 'E-Reader Glow', 'Fitness Tracker'],
    2: ['Merino Wool Crewneck', 'Waterproof Trail Jacket', 'Performance Running Shoes', 'Slim Fit Chinos', 'Breathable Yoga Pants', 'Denim Denim Jacket', 'Classic Oxford Shirt', 'Thermal Base Layer', 'Cotton Polo Shirt', 'Lightweight Windbreaker', 'Everyday Sneaker', 'Fleece Zip Hoodie', 'Linen Casual Pants', 'Wool Trench Coat', 'Athletic Crew Socks'],
    3: ['Ceramic Pour-Over Coffee Set', 'Cast Iron Skillet 12in', 'Ergonomic Desk Chair', 'Egyptian Cotton Sheets', 'Bamboo Cutting Board', 'Scented Soy Candle', 'Air Purifier HEPA', 'Memory Foam Pillow', 'Stainless Steel Knife Set', 'Dimmable LED Desk Lamp', 'Smart Thermostat', 'Velvet Throw Blanket', 'Minimalist Wall Clock', 'Robotic Vacuum Cleaner', 'Ceramic Dinnerware Set'],
    4: ['Hydrating Hyaluronic Serum', 'Botanical Facial Cleanser', 'SPF 50 Mineral Sunscreen', 'Vitamin C Brightening Cream', 'Organic Argan Hair Oil', 'Exfoliating Body Scrub', 'Calming Night Moisturizer', 'Anti-Aging Eye Cream', 'Charcoal Clay Mask', 'Rosewater Hydration Mist', 'Silk Lip Treatment', 'Essential Oil Diffuser Set', 'Beard Grooming Kit', 'Nourishing Hand Balm', 'Herbal Bath Salts'],
    5: ['Adjustable Dumbbell Pair', 'Non-Slip Yoga Mat', 'Stainless Water Bottle 32oz', 'Camping Dome Tent 4P', 'Trekking Poles Carbon', 'Cycling Helmet Aero', 'Resistance Bands Set', 'Hydration Running Vest', 'Sleeping Bag 20F', 'Compact Camp Stove', 'GPS Bike Computer', 'Gym Duffel Bag Waterproof', 'Jump Rope Speed Cable', 'Foam Roller Deep Tissue', 'Inflatable Stand-Up Paddleboard'],
    6: ['Data Science from Scratch', 'Designing Data-Intensive Apps', 'The Psychology of Money', 'Atomic Habits Hardcover', 'Clean Code Handbook', 'System Design Interview', 'The Lean Startup Guide', 'Deep Learning Illustrated', 'Thinking, Fast and Slow', 'Zero to One', 'The Art of Computer Programming', 'Continuous Delivery Book', 'Product Strategy Playbook', 'Kubernetes Up & Running', 'AI Superpowers Edition'],
    7: ['Single-Origin Ethiopian Coffee', 'Organic Matcha Powder 100g', 'Artisan Dark Chocolate 85%', 'Raw Manuka Honey MGO 400', 'Cold-Pressed Extra Virgin Olive Oil', 'Gourmet Sea Salt Trio', 'Organic Chia Seeds 1lb', 'Loose Leaf Jasmine Green Tea', 'Smoked Almonds & Truffle', 'Aged Balsamic Vinegar 12yr', 'Gluten-Free Granola Clusters', 'Maple Syrup Grade A Amber', 'Spicy Chipotle Hot Sauce', 'Whole Vanilla Beans Madagascar', 'Artisan Sourdough Crackers'],
    8: ['Strategy Board Game Deluxe', 'Cyberpunk RPG Dice Set', 'RC Drone with Camera', 'Mechanical Puzzle Box', 'Retro Arcade Mini Console', 'Collectible Vinyl Figure', 'Building Bricks Architecture', 'Card Game Expansion Pack', 'Handheld Gaming Console', 'Robotics Starter Kit', 'Fantasy Miniature Painter Set', 'Speed Cube 3x3 Magnetic', 'Space Shuttle Model Kit', 'VR Headset Carrying Case', 'Wireless Controller Elite']
  };

  let prodId = 1;
  for (const cat of productCategories) {
    const names = categoryNames[cat.id];
    for (const name of names) {
      const cost = randFloat(10, 150);
      const markup = randFloat(1.3, 2.5);
      const price = parseFloat((cost * markup).toFixed(2));
      products.push({
        id: prodId,
        category_id: cat.id,
        sku: `SKU-${cat.slug.toUpperCase().slice(0, 4)}-${String(prodId).padStart(4, '0')}`,
        name: name,
        description: `Premium ${name} designed for top performance and reliability.`,
        price: price,
        cost: cost,
        stock_quantity: randInt(25, 400),
        is_active: 1
      });
      prodId++;
    }
  }

  // 5. Campaigns (25 realistic multi-channel campaigns)
  const campaignDefs = [
    { code: 'CAMP-GGL-SEARCH-CORE', name: 'Google Ads: Core Brand & High Intent Search', channel: 'GOOGLE_SEARCH', audience: 'In-Market Searchers', budget: 15000 },
    { code: 'CAMP-FB-PROMO-SPRING', name: 'Facebook Ads: Spring Collection Launch', channel: 'FACEBOOK_ADS', audience: 'Lookalike Purchasers', budget: 12500 },
    { code: 'CAMP-IG-INFLUENCER-SUMMER', name: 'Instagram Ads: Summer Lifestyle Showcase', channel: 'INSTAGRAM_ADS', audience: 'Gen Z & Millennial Shoppers', budget: 18000 },
    { code: 'CAMP-EML-WINBACK-Q1', name: 'Email Marketing: Win-Back Inactive Shoppers', channel: 'EMAIL', audience: 'Dormant Customers (60+ days)', budget: 3500 },
    { code: 'CAMP-SMS-FLASH-WEEKEND', name: 'SMS Alerts: 48-Hour Weekend Flash Sale', channel: 'SMS', audience: 'SMS Opt-In VIPs', budget: 4500 },
    { code: 'CAMP-AFF-TECH-REVIEWS', name: 'Affiliate: Tech Reviewers & Blogs', channel: 'AFFILIATE', audience: 'Tech Enthusiasts', budget: 9000 },
    { code: 'CAMP-TT-VIRAL-FITNESS', name: 'TikTok Ads: Fitness & Activewear Trend', channel: 'TIKTOK', audience: 'Young Fitness Enthusiasts', budget: 14000 },
    { code: 'CAMP-GGL-SHOPPING-ELEC', name: 'Google Shopping: High Margin Electronics', channel: 'GOOGLE_SEARCH', audience: 'Comparison Shoppers', budget: 16000 },
    { code: 'CAMP-FB-RETARGET-CART', name: 'Facebook Dynamic Retargeting: Abandoned Cart', channel: 'FACEBOOK_ADS', audience: 'Cart Abandoners (7 Days)', budget: 8500 },
    { code: 'CAMP-IG-BEAUTY-ROUTINE', name: 'Instagram Stories: 5-Step Skincare Routine', channel: 'INSTAGRAM_ADS', audience: 'Skincare Interests', budget: 11000 },
    { code: 'CAMP-EML-LOYALTY-VIP', name: 'Email Exclusive: VIP Early Access Private Sale', channel: 'EMAIL', audience: 'Champions & High Spenders', budget: 3000 },
    { code: 'CAMP-SMS-NEW-PRODUCT', name: 'SMS Drop: Limited Edition Drop Release', channel: 'SMS', audience: 'Engaged SMS Subscribers', budget: 4000 },
    { code: 'CAMP-AFF-LIFESTYLE-BLOGS', name: 'Affiliate: Home Living & Decor Curation', channel: 'AFFILIATE', audience: 'Home Decor Shoppers', budget: 7500 },
    { code: 'CAMP-TT-UNBOXING-GADGETS', name: 'TikTok Creator Unboxing: Smart Home Tech', channel: 'TIKTOK', audience: 'Tech Early Adopters', budget: 13000 },
    { code: 'CAMP-GGL-COMPETITOR-CONQ', name: 'Google Search: Competitor Keyword Conquesting', channel: 'GOOGLE_SEARCH', audience: 'Competitor Switchers', budget: 12000 },
    { code: 'CAMP-FB-HOLIDAY-BLOWOUT', name: 'Facebook Ads: Annual Cyber Holiday Sale', channel: 'FACEBOOK_ADS', audience: 'All Retargeted Audiences', budget: 22000 },
    { code: 'CAMP-IG-YOGA-WELLNESS', name: 'Instagram Carousel: Mindfulness & Yoga Gear', channel: 'INSTAGRAM_ADS', audience: 'Health & Wellness Interests', budget: 9500 },
    { code: 'CAMP-EML-CROSS-SELL', name: 'Email Automated: Post-Purchase Recommended Add-ons', channel: 'EMAIL', audience: 'Recent 1st-Time Buyers', budget: 2800 },
    { code: 'CAMP-SMS-RESTOCK-NOTICE', name: 'SMS Alert: Back in Stock High Demand Items', channel: 'SMS', audience: 'Waitlist Subscribers', budget: 3200 },
    { code: 'CAMP-AFF-CASHBACK-PORTALS', name: 'Affiliate: Top Cash Back & Rewards Partners', channel: 'AFFILIATE', audience: 'Deal Seekers', budget: 10500 },
    { code: 'CAMP-TT-RECIPE-CHALLENGE', name: 'TikTok: Gourmet Pantry Artisan Challenge', channel: 'TIKTOK', audience: 'Foodies & Cooking Enthusiasts', budget: 8000 },
    { code: 'CAMP-GGL-BRAND-PROTECT', name: 'Google Search: Brand Term Defensive Bidding', channel: 'GOOGLE_SEARCH', audience: 'Direct Brand Searchers', budget: 7000 },
    { code: 'CAMP-FB-LOOKALIKE-TOP5', name: 'Facebook Ads: Top 5% CLV Lookalikes', channel: 'FACEBOOK_ADS', audience: 'High Value Lookalikes', budget: 17500 },
    { code: 'CAMP-EML-MONTHLY-DIGEST', name: 'Email Newsletter: Monthly Product Round-up', channel: 'EMAIL', audience: 'All Active Email Subscribers', budget: 2000 },
    { code: 'CAMP-IG-REELS-OUTFITS', name: 'Instagram Reels: 7 Days of Fall Outfits', channel: 'INSTAGRAM_ADS', audience: 'Fashion & Style Community', budget: 12000 }
  ];

  const campaigns = campaignDefs.map((c, idx) => {
    const startDate = addDays(baseDate, -randInt(180, 700));
    const endDate = addDays(startDate, randInt(45, 180));
    return {
      id: idx + 1,
      code: c.code,
      name: c.name,
      channel: c.channel,
      target_audience: c.audience,
      budget: c.budget,
      actual_spend: randFloat(c.budget * 0.85, c.budget * 1.15),
      start_date: startDate,
      end_date: endDate > baseDate ? null : endDate,
      status: endDate > baseDate ? 'ACTIVE' : 'COMPLETED'
    };
  });

  // 6. Customers with Correlated Personas
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen', 'Stephen', 'Anna', 'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma', 'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine', 'Frank', 'Debra', 'Alexander', 'Rachel', 'Raymond', 'Catherine', 'Patrick', 'Carolyn', 'Jack', 'Janet', 'Dennis', 'Ruth', 'Jerry', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'];
  const cities = [
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'Phoenix', state: 'AZ', zip: '85001' },
    { city: 'Philadelphia', state: 'PA', zip: '19101' },
    { city: 'San Antonio', state: 'TX', zip: '78201' },
    { city: 'San Diego', state: 'CA', zip: '92101' },
    { city: 'Dallas', state: 'TX', zip: '75201' },
    { city: 'Austin', state: 'TX', zip: '78701' },
    { city: 'Seattle', state: 'WA', zip: '98101' },
    { city: 'Denver', state: 'CO', zip: '80201' },
    { city: 'Boston', state: 'MA', zip: '02101' },
    { city: 'Atlanta', state: 'GA', zip: '30301' },
    { city: 'Miami', state: 'FL', zip: '33101' }
  ];
  const acqChannels = ['Organic Search', 'Google Ads', 'Facebook Ads', 'Instagram Ads', 'Referral', 'Email Campaign', 'Direct Traffic', 'TikTok Ads'];
  const genders = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'UNDISCLOSED'];

  const customers = [];
  const customerAddresses = [];
  const customerPreferences = [];

  // Personas distribution:
  // 1: High-Value Loyalist (20%) -> 8-20 orders, high AOV ($120-$350), recent order < 30 days, high web/mobile activity, low churn
  // 2: At-Risk Customer (25%) -> 3-8 orders, long inactivity (90-250 days), declining web activity, high churn
  // 3: New Engaged Customer (25%) -> registered < 60 days, 1-3 orders, recent orders, active web/campaign clicks
  // 4: Low-Engagement / Casual Browser (30%) -> 1-2 orders or 0, low AOV, high cart abandon, low email open
  const personaTypes = ['HIGH_VALUE', 'AT_RISK', 'NEW_ENGAGED', 'LOW_ENGAGEMENT'];

  for (let i = 1; i <= numCustomers; i++) {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    const loc = pick(cities);
    const gender = pick(genders);
    const pRoll = random();
    let persona;
    if (pRoll < 0.20) persona = 'HIGH_VALUE';
    else if (pRoll < 0.45) persona = 'AT_RISK';
    else if (pRoll < 0.70) persona = 'NEW_ENGAGED';
    else persona = 'LOW_ENGAGEMENT';

    let regDate;
    if (persona === 'NEW_ENGAGED') {
      regDate = addDays(baseDate, -randInt(5, 60));
    } else if (persona === 'HIGH_VALUE') {
      regDate = addDays(baseDate, -randInt(180, 700));
    } else {
      regDate = addDays(baseDate, -randInt(100, 700));
    }

    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@example.com`;
    const acq = pick(acqChannels);
    const prefChannel = persona === 'HIGH_VALUE' ? pick(['Website', 'Mobile App']) : pick(['Website', 'Mobile App', 'Email']);
    const status = persona === 'AT_RISK' ? (random() < 0.4 ? 'DORMANT' : 'ACTIVE') : 'ACTIVE';

    customers.push({
      id: i,
      first_name: fn,
      last_name: ln,
      email: email,
      phone: `+1-555-${randInt(100, 999)}-${randInt(1000, 9999)}`,
      gender: gender,
      date_of_birth: new Date(1960 + randInt(0, 42), randInt(0, 11), randInt(1, 28)),
      city: loc.city,
      state: loc.state,
      country: 'United States',
      postal_code: loc.zip,
      acquisition_channel: acq,
      preferred_channel: prefChannel,
      status: status,
      registration_date: regDate,
      persona: persona // for generator logic
    });

    customerAddresses.push({
      id: i,
      customer_id: i,
      address_type: 'SHIPPING',
      street: `${randInt(100, 9999)} Main Street Apt ${randInt(1, 40)}`,
      city: loc.city,
      state: loc.state,
      country: 'United States',
      postal_code: loc.zip,
      is_default: 1
    });

    const prefCats = [pick(productCategories).name];
    if (random() < 0.5) prefCats.push(pick(productCategories).name);
    customerPreferences.push({
      customer_id: i,
      email_opt_in: persona === 'LOW_ENGAGEMENT' ? (random() < 0.4 ? 1 : 0) : 1,
      sms_opt_in: persona === 'HIGH_VALUE' ? (random() < 0.8 ? 1 : 0) : (random() < 0.3 ? 1 : 0),
      push_opt_in: prefChannel === 'Mobile App' ? 1 : 0,
      preferred_language: 'en-US',
      interest_categories: JSON.stringify(prefCats)
    });
  }

  // 7. Orders & Transactions
  const orders = [];
  const orderItems = [];
  const payments = [];
  let orderId = 1;
  let orderItemId = 1;
  let paymentId = 1;

  for (const c of customers) {
    let numOrders = 0;
    let minDaysAgo = 1;
    let maxDaysAgo = 700;

    if (c.persona === 'HIGH_VALUE') {
      numOrders = randInt(6, 18);
      minDaysAgo = randInt(2, 35); // recent!
      maxDaysAgo = Math.min(650, Math.floor((baseDate - c.registration_date) / 86400000));
    } else if (c.persona === 'AT_RISK') {
      numOrders = randInt(3, 7);
      minDaysAgo = randInt(75, 280); // inactive lately!
      maxDaysAgo = Math.min(680, Math.floor((baseDate - c.registration_date) / 86400000));
    } else if (c.persona === 'NEW_ENGAGED') {
      numOrders = randInt(1, 3);
      minDaysAgo = randInt(1, 30);
      maxDaysAgo = Math.floor((baseDate - c.registration_date) / 86400000);
    } else { // LOW_ENGAGEMENT
      numOrders = random() < 0.5 ? 1 : (random() < 0.3 ? 2 : 0);
      minDaysAgo = randInt(30, 360);
      maxDaysAgo = Math.min(600, Math.floor((baseDate - c.registration_date) / 86400000));
    }

    if (maxDaysAgo < minDaysAgo) maxDaysAgo = minDaysAgo + 10;

    const orderDates = [];
    for (let o = 0; o < numOrders; o++) {
      const daysAgo = randInt(minDaysAgo, maxDaysAgo);
      orderDates.push(addDays(baseDate, -daysAgo));
    }
    orderDates.sort((a, b) => a - b); // chronological

    for (let o = 0; o < numOrders; o++) {
      const oDate = orderDates[o];
      const channel = c.preferred_channel === 'Mobile App' && random() < 0.7 ? 'MOBILE_APP' : 'WEB';
      const orderNum = `ORD-${oDate.getFullYear()}-${String(orderId).padStart(7, '0')}`;

      // Pick 1 to 4 items
      const numItems = c.persona === 'HIGH_VALUE' ? randInt(2, 5) : randInt(1, 2);
      let subtotal = 0;
      const currentOrderItems = [];

      for (let it = 0; it < numItems; it++) {
        const prod = pick(products);
        const qty = randInt(1, 2);
        const unitPrice = prod.price;
        const lineTotal = parseFloat((qty * unitPrice).toFixed(2));
        subtotal += lineTotal;

        currentOrderItems.push({
          id: orderItemId++,
          order_id: orderId,
          product_id: prod.id,
          quantity: qty,
          unit_price: unitPrice,
          total_price: lineTotal
        });
      }

      subtotal = parseFloat(subtotal.toFixed(2));
      const discount = (c.persona === 'AT_RISK' || random() < 0.2) ? parseFloat((subtotal * 0.10).toFixed(2)) : 0.00;
      const tax = parseFloat(((subtotal - discount) * 0.08).toFixed(2));
      const shipping = subtotal > 100 ? 0.00 : 9.99;
      const totalAmount = parseFloat((subtotal - discount + tax + shipping).toFixed(2));

      const linkedCampaign = pick(campaigns);
      orders.push({
        id: orderId,
        order_number: orderNum,
        customer_id: c.id,
        order_date: oDate,
        status: 'DELIVERED',
        channel: channel,
        subtotal: subtotal,
        discount_amount: discount,
        tax_amount: tax,
        shipping_amount: shipping,
        total_amount: totalAmount,
        utm_campaign: linkedCampaign.code,
        utm_source: linkedCampaign.channel.toLowerCase(),
        utm_medium: 'cpc'
      });

      for (const item of currentOrderItems) {
        orderItems.push(item);
      }

      payments.push({
        id: paymentId++,
        order_id: orderId,
        payment_method: pick(['CREDIT_CARD', 'APPLE_PAY', 'PAYPAL']),
        status: 'CAPTURED',
        amount: totalAmount,
        transaction_reference: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        payment_date: oDate
      });

      orderId++;
    }
  }

  // 8. Digital Behaviour (Sessions & Events)
  const websiteSessions = [];
  const websiteEvents = [];
  const mobileEvents = [];
  let sessionId = 1;
  let webEventId = 1;
  let mobEventId = 1;

  for (const c of customers) {
    const sessionCount = c.persona === 'HIGH_VALUE' ? randInt(12, 28) : (c.persona === 'AT_RISK' ? randInt(4, 10) : randInt(2, 7));
    for (let s = 0; s < sessionCount; s++) {
      const sDate = addDays(c.registration_date, randInt(1, Math.max(10, Math.floor((baseDate - c.registration_date) / 86400000))));
      const sessionUuid = `sess-${sessionId}-${Math.random().toString(36).substring(2, 8)}`;
      const trafficSource = pick(['GoogleAds', 'Direct', 'Organic', 'Facebook', 'Instagram', 'Email']);
      const device = c.preferred_channel === 'Mobile App' ? (random() < 0.6 ? 'MOBILE' : 'DESKTOP') : (random() < 0.7 ? 'DESKTOP' : 'MOBILE');

      websiteSessions.push({
        id: sessionId,
        session_uuid: sessionUuid,
        customer_id: c.id,
        device_type: device,
        browser: device === 'DESKTOP' ? 'Chrome' : 'Mobile Safari',
        operating_system: device === 'DESKTOP' ? 'Windows' : 'iOS',
        traffic_source: trafficSource,
        landing_page: pick(['/home', '/category/electronics', '/category/apparel', '/sale/spring', '/product/featured']),
        started_at: sDate,
        ended_at: new Date(sDate.getTime() + randInt(60, 1800) * 1000),
        page_views_count: randInt(2, 9)
      });

      // Session Event Flow (Funnel steps)
      // Step 1: Page View
      websiteEvents.push({
        id: webEventId++,
        session_id: sessionId,
        customer_id: c.id,
        event_type: 'PAGE_VIEW',
        product_id: null,
        page_url: '/home',
        event_metadata: JSON.stringify({ referrer: trafficSource }),
        created_at: sDate
      });

      // Step 2: Product View (65% proceed)
      if (random() < 0.65) {
        const prod = pick(products);
        const pvDate = new Date(sDate.getTime() + randInt(10, 60) * 1000);
        websiteEvents.push({
          id: webEventId++,
          session_id: sessionId,
          customer_id: c.id,
          event_type: 'PRODUCT_VIEW',
          product_id: prod.id,
          page_url: `/product/${prod.sku}`,
          event_metadata: JSON.stringify({ price: prod.price, category: prod.category_id }),
          created_at: pvDate
        });

        // Step 3: Add to Cart (35% proceed)
        if (random() < 0.35) {
          const atcDate = new Date(pvDate.getTime() + randInt(20, 120) * 1000);
          websiteEvents.push({
            id: webEventId++,
            session_id: sessionId,
            customer_id: c.id,
            event_type: 'ADD_TO_CART',
            product_id: prod.id,
            page_url: `/product/${prod.sku}`,
            event_metadata: JSON.stringify({ quantity: 1, price: prod.price }),
            created_at: atcDate
          });

          // Step 4: Checkout Start (55% proceed)
          if (random() < 0.55) {
            const chkDate = new Date(atcDate.getTime() + randInt(30, 180) * 1000);
            websiteEvents.push({
              id: webEventId++,
              session_id: sessionId,
              customer_id: c.id,
              event_type: 'CHECKOUT_START',
              product_id: null,
              page_url: '/checkout',
              event_metadata: JSON.stringify({ step: 1, method: 'standard' }),
              created_at: chkDate
            });

            // Step 5: Purchase (55% proceed)
            if (random() < 0.55) {
              const purDate = new Date(chkDate.getTime() + randInt(30, 120) * 1000);
              websiteEvents.push({
                id: webEventId++,
                session_id: sessionId,
                customer_id: c.id,
                event_type: 'PURCHASE',
                product_id: prod.id,
                page_url: '/checkout/success',
                event_metadata: JSON.stringify({ total: prod.price }),
                created_at: purDate
              });
            }
          }
        }
      }

      sessionId++;
    }

    // Mobile telemetry if preferred channel is Mobile App or high value
    if (c.preferred_channel === 'Mobile App' || c.persona === 'HIGH_VALUE') {
      const mobCount = randInt(4, 15);
      for (let m = 0; m < mobCount; m++) {
        const mDate = addDays(c.registration_date, randInt(1, Math.max(10, Math.floor((baseDate - c.registration_date) / 86400000))));
        mobileEvents.push({
          id: mobEventId++,
          customer_id: c.id,
          app_version: '2.4.1',
          os_version: 'iOS 17.5',
          device_model: 'iPhone 15 Pro',
          event_name: pick(['APP_OPEN', 'SCREEN_VIEW', 'PUSH_OPEN', 'PRODUCT_CLICK']),
          screen_name: pick(['HomeFeed', 'ProductDetail', 'CartScreen', 'ProfileView']),
          event_metadata: JSON.stringify({ session_duration_sec: randInt(15, 450) }),
          created_at: mDate
        });
      }
    }
  }

  // 9. Marketing Impressions, Clicks & Direct Messages
  const campaignImpressions = [];
  const campaignInteractions = [];
  const emailEvents = [];
  const smsEvents = [];
  let impId = 1;
  let intId = 1;
  let emailId = 1;
  let smsId = 1;

  for (const c of customers) {
    const impCount = randInt(3, 12);
    for (let im = 0; im < impCount; im++) {
      const camp = pick(campaigns);
      const impDate = addDays(c.registration_date, randInt(-20, Math.max(10, Math.floor((baseDate - c.registration_date) / 86400000))));
      campaignImpressions.push({
        id: impId++,
        campaign_id: camp.id,
        customer_id: c.id,
        impression_date: impDate,
        placement: pick(['Feed Ad', 'Stories', 'Search Top Position', 'Display Banner']),
        cost: randFloat(0.05, 0.45)
      });

      // Clicks / interactions correlated with persona
      const clickProb = c.persona === 'HIGH_VALUE' ? 0.35 : (c.persona === 'NEW_ENGAGED' ? 0.25 : 0.08);
      if (random() < clickProb) {
        campaignInteractions.push({
          id: intId++,
          campaign_id: camp.id,
          customer_id: c.id,
          interaction_type: pick(['AD_CLICK', 'LINK_CLICK', 'CTA_CLICK']),
          interaction_date: new Date(impDate.getTime() + randInt(5, 300) * 1000),
          cost: randFloat(0.85, 3.20)
        });
      }
    }

    // Email Events
    const emailCount = randInt(2, 8);
    for (let e = 0; e < emailCount; e++) {
      const eDate = addDays(c.registration_date, randInt(5, Math.max(10, Math.floor((baseDate - c.registration_date) / 86400000))));
      const isOpen = (c.persona === 'HIGH_VALUE' || c.persona === 'NEW_ENGAGED') ? (random() < 0.65) : (random() < 0.20);
      emailEvents.push({
        id: emailId++,
        campaign_id: pick(campaigns).id,
        customer_id: c.id,
        event_type: isOpen ? (random() < 0.4 ? 'CLICKED' : 'OPENED') : 'DELIVERED',
        subject: pick(['Exclusive 20% Off Inside', 'New Arrivals You Will Love', 'Your Weekly Personalized Recommendations', 'Limited Time Flash Sale']),
        created_at: eDate
      });
    }

    // SMS Events
    if (random() < 0.45) {
      const smsDate = addDays(c.registration_date, randInt(10, Math.max(15, Math.floor((baseDate - c.registration_date) / 86400000))));
      smsEvents.push({
        id: smsId++,
        campaign_id: pick(campaigns).id,
        customer_id: c.id,
        event_type: random() < 0.25 ? 'CLICKED' : 'DELIVERED',
        created_at: smsDate
      });
    }
  }

  // 10. Support Tickets & Feedback
  const supportTickets = [];
  const feedbackList = [];
  let ticketId = 1;
  let feedbackId = 1;

  for (const c of customers) {
    // 25% of customers have support tickets
    if (random() < 0.25) {
      const tDate = addDays(c.registration_date, randInt(10, Math.max(20, Math.floor((baseDate - c.registration_date) / 86400000))));
      const isResolved = random() < 0.85;
      const cat = pick(['SHIPPING', 'BILLING', 'PRODUCT_DEFECT', 'RETURN_EXCHANGE', 'GENERAL_INQUIRY']);
      const csat = isResolved ? randInt(3, 5) : randInt(1, 3);

      supportTickets.push({
        id: ticketId,
        ticket_number: `TICK-${tDate.getFullYear()}-${String(ticketId).padStart(6, '0')}`,
        customer_id: c.id,
        category: cat,
        priority: pick(['LOW', 'MEDIUM', 'HIGH']),
        status: isResolved ? 'RESOLVED' : 'OPEN',
        subject: `${cat.replace('_', ' ')} inquiry regarding recent experience`,
        opened_at: tDate,
        resolved_at: isResolved ? addDays(tDate, randInt(1, 4)) : null,
        satisfaction_score: isResolved ? csat : null
      });
      ticketId++;
    }

    // 20% of customers leave feedback/NPS
    if (random() < 0.20) {
      const fDate = addDays(c.registration_date, randInt(15, Math.max(25, Math.floor((baseDate - c.registration_date) / 86400000))));
      const rating = c.persona === 'HIGH_VALUE' ? randInt(4, 5) : (c.persona === 'AT_RISK' ? randInt(1, 3) : randInt(3, 5));
      const nps = rating === 5 ? randInt(9, 10) : (rating === 4 ? randInt(7, 8) : randInt(2, 6));

      feedbackList.push({
        id: feedbackId++,
        customer_id: c.id,
        order_id: null,
        rating: rating,
        nps_score: nps,
        comments: rating >= 4 ? 'Great quality and fast delivery. Very satisfied.' : 'Shipping took longer than expected and packaging was damaged.',
        submitted_at: fDate
      });
    }
  }

  console.log(`Generated entities:
  - Roles: ${roles.length}
  - Users: ${users.length}
  - Categories: ${productCategories.length}
  - Products: ${products.length}
  - Campaigns: ${campaigns.length}
  - Customers: ${customers.length}
  - Orders: ${orders.length}
  - Order Items: ${orderItems.length}
  - Payments: ${payments.length}
  - Website Sessions: ${websiteSessions.length}
  - Website Events: ${websiteEvents.length}
  - Mobile Events: ${mobileEvents.length}
  - Campaign Impressions: ${campaignImpressions.length}
  - Campaign Interactions: ${campaignInteractions.length}
  - Email Events: ${emailEvents.length}
  - SMS Events: ${smsEvents.length}
  - Support Tickets: ${supportTickets.length}
  - Feedback: ${feedbackList.length}`);

  return {
    roles,
    users,
    userRoles,
    productCategories,
    products,
    campaigns,
    customers,
    customerAddresses,
    customerPreferences,
    orders,
    orderItems,
    payments,
    websiteSessions,
    websiteEvents,
    mobileEvents,
    campaignImpressions,
    campaignInteractions,
    emailEvents,
    smsEvents,
    supportTickets,
    feedback: feedbackList
  };
}

module.exports = { generateDataset, createPrng };
