const { dbManager, sql } = require('../config/database');

const menuData = {
    categories: [
        { name: 'Soups', displayOrder: 1 },
        { name: 'Chinese Starters', displayOrder: 2 },
        { name: 'Choice of Noodles', displayOrder: 3 },
        { name: 'Choice of Fried Rice', displayOrder: 4 },
        { name: 'Indian Gravies & Breads', displayOrder: 5 },
        { name: 'Chaat', displayOrder: 6 },
        { name: 'Pizzas', displayOrder: 7 },
        { name: 'Sandwiches', displayOrder: 8 },
        { name: 'Frankies', displayOrder: 9 },
        { name: 'Mocktails', displayOrder: 10 },
        { name: 'Make ur Own', displayOrder: 11 },
        { name: 'Choice of Plain Scoop', displayOrder: 12 },
        { name: 'Beverages', displayOrder: 13 },
        { name: 'Single Sundaes', displayOrder: 14 },
        { name: 'Tripple Sundaes', displayOrder: 15 },
        { name: 'Kids Sundaes', displayOrder: 16 }
    ],
    items: [
        // Soups
        { category: 'Soups', name: 'TOMATO SOUP', regularPrice: 100, jainPrice: null, prepTime: 10 },
        { category: 'Soups', name: 'HOT & SOUR SOUP', regularPrice: 100, jainPrice: null, prepTime: 10 },
        { category: 'Soups', name: 'MANCHOW SOUP', regularPrice: 100, jainPrice: null, prepTime: 10 },
        { category: 'Soups', name: 'SWEET CORN SOUP', regularPrice: 100, jainPrice: null, prepTime: 10 },

        // Chinese Starters
        { category: 'Chinese Starters', name: 'VEG MANCHURIAN (Dry / Wet)', regularPrice: 190, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'SPRING ROLL', regularPrice: 190, jainPrice: null, prepTime: 15 },
        { category: 'Chinese Starters', name: 'CRISPY VEGETABLE', regularPrice: 200, jainPrice: null, prepTime: 18 },
        { category: 'Chinese Starters', name: 'DRAGON VEG', regularPrice: 210, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'SIZZLING MANCHURIAN', regularPrice: 220, jainPrice: null, prepTime: 25 },
        { category: 'Chinese Starters', name: 'CRISPY BABY CORN', regularPrice: 240, jainPrice: null, prepTime: 18 },
        { category: 'Chinese Starters', name: 'CHILLI BABY CORN (Dry / Wet)', regularPrice: 240, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'BABYCORN MANCHURIAN (Dry / Wet)', regularPrice: 240, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'MUSHROOM MANCHURIAN (Dry / Wet)', regularPrice: 250, jainPrice: null, prepTime: 22 },
        { category: 'Chinese Starters', name: 'CHILLI MUSHROOM (Dry / Wet)', regularPrice: 250, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'MUSHROOM 65', regularPrice: 250, jainPrice: null, prepTime: 18 },
        { category: 'Chinese Starters', name: 'CRISPY MUSHROOM', regularPrice: 250, jainPrice: null, prepTime: 18 },
        { category: 'Chinese Starters', name: 'GARLIC MUSHROOM', regularPrice: 250, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'SCHEZWAN PANEER (Dry / Wet)', regularPrice: 260, jainPrice: null, prepTime: 22 },
        { category: 'Chinese Starters', name: 'CRISPY PANEER', regularPrice: 260, jainPrice: null, prepTime: 18 },
        { category: 'Chinese Starters', name: 'PANEER 65', regularPrice: 260, jainPrice: null, prepTime: 18 },
        { category: 'Chinese Starters', name: 'HONGKONG PANEER', regularPrice: 260, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'CHILLI PANEER (Dry / Wet)', regularPrice: 260, jainPrice: null, prepTime: 20 },
        { category: 'Chinese Starters', name: 'PANEER MANCHURIA (Dry / Wet)', regularPrice: 260, jainPrice: null, prepTime: 22 },
        { category: 'Chinese Starters', name: 'APOLLO PANEER', regularPrice: 270, jainPrice: null, prepTime: 22 },
        { category: 'Chinese Starters', name: 'IRAYANI PANEER', regularPrice: 270, jainPrice: null, prepTime: 22 },
        { category: 'Chinese Starters', name: 'PANEER MAJESTIC', regularPrice: 280, jainPrice: null, prepTime: 25 },

        // Choice of Noodles
        { category: 'Choice of Noodles', name: 'VEG SOFT NOODLES', regularPrice: 180, jainPrice: null, prepTime: 15 },
        { category: 'Choice of Noodles', name: 'HONG KONG NOODLES', regularPrice: 200, jainPrice: null, prepTime: 18 },
        { category: 'Choice of Noodles', name: 'CHILLI GARLIC NOODLES', regularPrice: 200, jainPrice: null, prepTime: 18 },
        { category: 'Choice of Noodles', name: 'SCHEZWAN NOODLES', regularPrice: 200, jainPrice: null, prepTime: 18 },
        { category: 'Choice of Noodles', name: 'MANCHURIAN NOODLES', regularPrice: 210, jainPrice: null, prepTime: 20 },
        { category: 'Choice of Noodles', name: 'SINGAPORE NOODLES', regularPrice: 210, jainPrice: null, prepTime: 20 },
        { category: 'Choice of Noodles', name: 'MUSHROOM NOODLES', regularPrice: 220, jainPrice: null, prepTime: 20 },
        { category: 'Choice of Noodles', name: 'AMERICAN CHOP SUEY', regularPrice: 220, jainPrice: null, prepTime: 22 },
        { category: 'Choice of Noodles', name: 'POT NOODLES', regularPrice: 230, jainPrice: null, prepTime: 25 },
        { category: 'Choice of Noodles', name: 'VEG TREAT SPECIAL NOODLES', regularPrice: 240, jainPrice: null, prepTime: 25 },

        // Choice of Fried Rice
        { category: 'Choice of Fried Rice', name: 'VEG FRIED RICE', regularPrice: 200, jainPrice: null, prepTime: 15 },
        { category: 'Choice of Fried Rice', name: 'PUDINA RICE', regularPrice: 210, jainPrice: null, prepTime: 18 },
        { category: 'Choice of Fried Rice', name: 'JERA RICE', regularPrice: 210, jainPrice: null, prepTime: 18 },
        { category: 'Choice of Fried Rice', name: 'CORN FRIED RICE', regularPrice: 220, jainPrice: null, prepTime: 18 },
        { category: 'Choice of Fried Rice', name: 'HONG KONG FRIED RICE', regularPrice: 230, jainPrice: null, prepTime: 20 },
        { category: 'Choice of Fried Rice', name: 'SCHEZWAN FRIED RICE', regularPrice: 230, jainPrice: null, prepTime: 20 },
        { category: 'Choice of Fried Rice', name: 'BURNT GARLIC FRIED RICE', regularPrice: 240, jainPrice: null, prepTime: 20 },
        { category: 'Choice of Fried Rice', name: 'MANCHURIAN RICE', regularPrice: 240, jainPrice: null, prepTime: 22 },
        { category: 'Choice of Fried Rice', name: 'SINGAPORE FRIED RICE', regularPrice: 250, jainPrice: null, prepTime: 22 },
        { category: 'Choice of Fried Rice', name: 'MUSHROOM FRIED RICE', regularPrice: 250, jainPrice: null, prepTime: 20 },
        { category: 'Choice of Fried Rice', name: 'POT RICE', regularPrice: 270, jainPrice: null, prepTime: 25 },
        { category: 'Choice of Fried Rice', name: 'VEG TREAT SPECIAL RICE', regularPrice: 270, jainPrice: null, prepTime: 25 },

        // Indian Gravies & Breads
        { category: 'Indian Gravies & Breads', name: 'MIX VEG CURRY', regularPrice: 180, jainPrice: null, prepTime: 20 },
        { category: 'Indian Gravies & Breads', name: 'TOMATO CASHEW CURRY', regularPrice: 190, jainPrice: null, prepTime: 22 },
        { category: 'Indian Gravies & Breads', name: 'KADAI VEGETABLE', regularPrice: 190, jainPrice: null, prepTime: 20 },
        { category: 'Indian Gravies & Breads', name: 'PANEER BUTTER MASALA', regularPrice: 200, jainPrice: null, prepTime: 22 },
        { category: 'Indian Gravies & Breads', name: 'METHI CHAMAN', regularPrice: 200, jainPrice: null, prepTime: 20 },
        { category: 'Indian Gravies & Breads', name: 'MUSHROOM MASALA', regularPrice: 200, jainPrice: null, prepTime: 20 },
        { category: 'Indian Gravies & Breads', name: 'PANEER CASHEW', regularPrice: 210, jainPrice: null, prepTime: 22 },
        { category: 'Indian Gravies & Breads', name: 'KADAI PANEER', regularPrice: 210, jainPrice: null, prepTime: 22 },
        { category: 'Indian Gravies & Breads', name: 'PHULKA', regularPrice: 25, jainPrice: null, prepTime: 5 },
        { category: 'Indian Gravies & Breads', name: 'BUTTER PHULKA', regularPrice: 35, jainPrice: null, prepTime: 5 },

        // Chaat
        { category: 'Chaat', name: 'PANIPURI', regularPrice: 70, jainPrice: 80, prepTime: 8, isJainAvailable: true },
        { category: 'Chaat', name: 'BHEL PURI', regularPrice: 50, jainPrice: 50, prepTime: 8, isJainAvailable: true },
        { category: 'Chaat', name: 'ANDHRA BHEL', regularPrice: 50, jainPrice: 50, prepTime: 8, isJainAvailable: true },
        { category: 'Chaat', name: 'SEV PURI', regularPrice: 50, jainPrice: 50, prepTime: 8, isJainAvailable: true },
        { category: 'Chaat', name: 'PANI PURI', regularPrice: 50, jainPrice: 50, prepTime: 8, isJainAvailable: true },
        { category: 'Chaat', name: 'MASALA PAV', regularPrice: 60, jainPrice: 60, prepTime: 10, isJainAvailable: true },
        { category: 'Chaat', name: 'VADA PAV', regularPrice: 65, jainPrice: null, prepTime: 10 },
        { category: 'Chaat', name: 'CUTLET RAGADA', regularPrice: 70, jainPrice: null, prepTime: 12 },
        { category: 'Chaat', name: 'SAMOSA RAGADA', regularPrice: 70, jainPrice: 70, prepTime: 12, isJainAvailable: true },
        { category: 'Chaat', name: 'PAPDI RAGADA', regularPrice: 70, jainPrice: 70, prepTime: 10, isJainAvailable: true },
        { category: 'Chaat', name: 'CUT MIRCHI RAGADA', regularPrice: 70, jainPrice: 70, prepTime: 12, isJainAvailable: true },
        { category: 'Chaat', name: 'DAHI PURI', regularPrice: 100, jainPrice: 100, prepTime: 10, isJainAvailable: true },
        { category: 'Chaat', name: 'DAHI PAPDI', regularPrice: 100, jainPrice: 100, prepTime: 10, isJainAvailable: true },
        { category: 'Chaat', name: 'CHINESE BHEL', regularPrice: 100, jainPrice: 100, prepTime: 12, isJainAvailable: true },
        { category: 'Chaat', name: 'PALAK CHAAT', regularPrice: 120, jainPrice: null, prepTime: 15 },
        { category: 'Chaat', name: 'PAV BHAJI', regularPrice: 140, jainPrice: null, prepTime: 15 },
        { category: 'Chaat', name: 'SPECIAL PAV BHAJI', regularPrice: 140, jainPrice: null, prepTime: 18 },
        { category: 'Chaat', name: 'PANEER PAV BHAJI', regularPrice: 150, jainPrice: null, prepTime: 18 },
        { category: 'Chaat', name: 'CHEESE PAV BHAJI', regularPrice: 150, jainPrice: null, prepTime: 18 },
        { category: 'Chaat', name: 'MASALA PAV BHAJI', regularPrice: 160, jainPrice: null, prepTime: 20 },
        { category: 'Chaat', name: 'PAV BHAJI FONDUE', regularPrice: 180, jainPrice: null, prepTime: 22 },

        // Pizzas
        { category: 'Pizzas', name: 'CHEESY CHEESE PIZZA', regularPrice: 150, jainPrice: 150, prepTime: 20, isJainAvailable: true },
        { category: 'Pizzas', name: 'TOMATO CHEESE PIZZA', regularPrice: 150, jainPrice: 150, prepTime: 20, isJainAvailable: true },
        { category: 'Pizzas', name: 'ONION CAPSICUM CHEESE PIZZA', regularPrice: 150, jainPrice: 150, prepTime: 22, isJainAvailable: true },
        { category: 'Pizzas', name: 'VEG. MARGHERITA PIZZA', regularPrice: 160, jainPrice: 165, prepTime: 22, isJainAvailable: true },
        { category: 'Pizzas', name: 'BABY CORN PIZZA', regularPrice: 160, jainPrice: 165, prepTime: 22, isJainAvailable: true },
        { category: 'Pizzas', name: 'VEG. BABE Q PIZZA', regularPrice: 170, jainPrice: 175, prepTime: 25, isJainAvailable: true },
        { category: 'Pizzas', name: 'CORN CHEESE PIZZA', regularPrice: 170, jainPrice: 170, prepTime: 22, isJainAvailable: true },
        { category: 'Pizzas', name: 'MEXICAN CHEESE PIZZA', regularPrice: 180, jainPrice: 180, prepTime: 25, isJainAvailable: true },
        { category: 'Pizzas', name: 'MUSHROOM CHEESE PIZZA', regularPrice: 185, jainPrice: null, prepTime: 25 },
        { category: 'Pizzas', name: 'PANEER CHEESE PIZZA', regularPrice: 190, jainPrice: 195, prepTime: 25, isJainAvailable: true },
        { category: 'Pizzas', name: 'TEMPTATIONS SPECIAL PIZZA', regularPrice: 200, jainPrice: 205, prepTime: 28, isJainAvailable: true },
        { category: 'Pizzas', name: 'EXTRA CHEESE & EXTRA EACH TOPPINGS', regularPrice: 30, jainPrice: null, prepTime: 5 },

        // Sandwiches
        { category: 'Sandwiches', name: 'VEG. BURGER', regularPrice: 70, jainPrice: null, prepTime: 12 },
        { category: 'Sandwiches', name: 'VEG. CHEESE BURGER', regularPrice: 80, jainPrice: null, prepTime: 15 },
        { category: 'Sandwiches', name: 'FRENCH FRIES', regularPrice: 80, jainPrice: null, prepTime: 10 },
        { category: 'Sandwiches', name: 'PLAIN CHEESE GRILLED SANDWICH', regularPrice: 60, jainPrice: 60, prepTime: 10, isJainAvailable: true },
        { category: 'Sandwiches', name: 'VEG. GRILLED SANDWICH', regularPrice: 60, jainPrice: 60, prepTime: 12, isJainAvailable: true },
        { category: 'Sandwiches', name: 'VEG. CHEESE GRILLED SANDWICH', regularPrice: 70, jainPrice: 70, prepTime: 12, isJainAvailable: true },
        { category: 'Sandwiches', name: 'ALOO GRILLED SANDWICH', regularPrice: 70, jainPrice: 70, prepTime: 12, isJainAvailable: true },
        { category: 'Sandwiches', name: 'ALOO CHEESE GRILLED SANDWICH', regularPrice: 80, jainPrice: 80, prepTime: 15, isJainAvailable: true },
        { category: 'Sandwiches', name: 'MEXICAN GRILLED SANDWICH', regularPrice: 80, jainPrice: 80, prepTime: 15, isJainAvailable: true },
        { category: 'Sandwiches', name: 'MEXICAN CHEESE GRILLED SANDWICH', regularPrice: 90, jainPrice: 90, prepTime: 15, isJainAvailable: true },
        { category: 'Sandwiches', name: 'PANEER GRILLED SANDWICH', regularPrice: 90, jainPrice: 90, prepTime: 15, isJainAvailable: true },
        { category: 'Sandwiches', name: 'PANEER CHEESE GRILLED SANDWICH', regularPrice: 100, jainPrice: 100, prepTime: 18, isJainAvailable: true },

        // Frankies
        { category: 'Frankies', name: 'SPRING ROLL FRANKIE', regularPrice: 75, jainPrice: 75, prepTime: 12, isJainAvailable: true },
        { category: 'Frankies', name: 'SPRING ROLL CHEESEE FRANKIE', regularPrice: 85, jainPrice: 85, prepTime: 15, isJainAvailable: true },
        { category: 'Frankies', name: 'PANEER FRANKIE', regularPrice: 90, jainPrice: 90, prepTime: 15, isJainAvailable: true },
        { category: 'Frankies', name: 'PANEER CHEESEE FRANKIE', regularPrice: 100, jainPrice: 100, prepTime: 18, isJainAvailable: true },

        // Mocktails
        { category: 'Mocktails', name: 'AMAZONE', regularPrice: 120, jainPrice: null, prepTime: 5 },
        { category: 'Mocktails', name: 'HANGOVER', regularPrice: 120, jainPrice: null, prepTime: 5 },
        { category: 'Mocktails', name: 'ORANGE FIZZ', regularPrice: 120, jainPrice: null, prepTime: 5 },
        { category: 'Mocktails', name: 'BLUE COLADA SODA', regularPrice: 120, jainPrice: null, prepTime: 5 },
        { category: 'Mocktails', name: 'COOL BUDDY', regularPrice: 120, jainPrice: null, prepTime: 5 },
        { category: 'Mocktails', name: 'EXOTIC SUNSET', regularPrice: 125, jainPrice: null, prepTime: 8 },
        { category: 'Mocktails', name: 'TRIPLE BLUE', regularPrice: 125, jainPrice: null, prepTime: 8 },
        { category: 'Mocktails', name: 'GREEN APPLE MIST', regularPrice: 125, jainPrice: null, prepTime: 8 },

        // Make ur Own
        { category: 'Make ur Own', name: 'AS U LIKE SINGLE SUNDAE', regularPrice: 130, jainPrice: null, prepTime: 10 },
        { category: 'Make ur Own', name: 'AS U LIKE DOUBLE SUNDAE', regularPrice: 200, jainPrice: null, prepTime: 12 },
        { category: 'Make ur Own', name: 'AS U LIKE TRIPPLE SUNDAE', regularPrice: 270, jainPrice: null, prepTime: 15 },
        { category: 'Make ur Own', name: 'AS U LIKE MILK SHAKE', regularPrice: 180, jainPrice: null, prepTime: 8 },

        // Choice of Plain Scoop
        { category: 'Choice of Plain Scoop', name: 'VANILLA', regularPrice: 70, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'STRAWBERRY', regularPrice: 70, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'CHOCOLATE', regularPrice: 70, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'BUTTER SCOTCH', regularPrice: 75, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'CHOCO CHIPS', regularPrice: 75, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'GREEN PISTA', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'FRESH MANGO', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'FRUIT NINJA', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'PINA CHIKKY', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'CHOCO ROCO', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'CARAMEL NUTS', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'ANJEER BADAM', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'BLACK CURRENT', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'BELGIUM DARK CHOCOLATE', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'DRY FRUIT TEMPTATION', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'HONEY MOON DELIGHT', regularPrice: 80, jainPrice: null, prepTime: 3 },
        { category: 'Choice of Plain Scoop', name: 'MIX SCOOP (Any 2 Scoops)', regularPrice: 80, jainPrice: null, prepTime: 5 },
        { category: 'Choice of Plain Scoop', name: 'SPECIAL FLAVOUR', regularPrice: 85, jainPrice: null, prepTime: 3 },

        // Beverages
        { category: 'Beverages', name: 'MASALA COKE', regularPrice: 70, jainPrice: null, prepTime: 3 },
        { category: 'Beverages', name: 'FRESH LIME SODA(SWEET/SALT)', regularPrice: 80, jainPrice: null, prepTime: 5 },
        { category: 'Beverages', name: 'SOFT DRINK (250ML)', regularPrice: 40, jainPrice: null, prepTime: 1 },
        { category: 'Beverages', name: 'WATER BOTTLE (500ML)', regularPrice: 20, jainPrice: null, prepTime: 1 },
        { category: 'Beverages', name: 'WATER BOTTLE (1L)', regularPrice: 35, jainPrice: null, prepTime: 1 },

        // Single Sundaes
        { category: 'Single Sundaes', name: 'FRUIT OF FUN', regularPrice: 95, jainPrice: null, prepTime: 8 },
        { category: 'Single Sundaes', name: 'MERRY BERRY', regularPrice: 95, jainPrice: null, prepTime: 8 },
        { category: 'Single Sundaes', name: 'YOURS BUTTERLY', regularPrice: 100, jainPrice: null, prepTime: 10 },
        { category: 'Single Sundaes', name: 'CRISPY CHOCO SUNDAE', regularPrice: 100, jainPrice: null, prepTime: 10 },
        { category: 'Single Sundaes', name: 'CHOCOLATE DREAM', regularPrice: 105, jainPrice: null, prepTime: 10 },
        { category: 'Single Sundaes', name: 'LAVENDER HILLS', regularPrice: 105, jainPrice: null, prepTime: 10 },
        { category: 'Single Sundaes', name: 'SUNSET GLOW', regularPrice: 105, jainPrice: null, prepTime: 10 },
        { category: 'Single Sundaes', name: 'PINEAPLLE BREEZE', regularPrice: 105, jainPrice: null, prepTime: 10 },
        { category: 'Single Sundaes', name: 'GREEN MOON', regularPrice: 105, jainPrice: null, prepTime: 10 },
        { category: 'Single Sundaes', name: 'CRUNCHY FLOAT', regularPrice: 110, jainPrice: null, prepTime: 12 },
        { category: 'Single Sundaes', name: 'NUTTY NAUGHTY SUNDAE', regularPrice: 115, jainPrice: null, prepTime: 12 },
        { category: 'Single Sundaes', name: 'DARK TEMPTATION', regularPrice: 115, jainPrice: null, prepTime: 12 },
        { category: 'Single Sundaes', name: 'RAINBOW TEMPTATION', regularPrice: 120, jainPrice: null, prepTime: 15 },

        // Tripple Sundaes
        { category: 'Tripple Sundaes', name: 'TITANIC', regularPrice: 180, jainPrice: null, prepTime: 15 },
        { category: 'Tripple Sundaes', name: 'LOVER\'S DELIGHTS', regularPrice: 180, jainPrice: null, prepTime: 15 },
        { category: 'Tripple Sundaes', name: 'ONE TOWN TWO TOWN', regularPrice: 185, jainPrice: null, prepTime: 18 },
        { category: 'Tripple Sundaes', name: 'TAN-TANA-TAN', regularPrice: 185, jainPrice: null, prepTime: 18 },
        { category: 'Tripple Sundaes', name: 'HAT-TRICK', regularPrice: 190, jainPrice: null, prepTime: 18 },
        { category: 'Tripple Sundaes', name: 'ONE SHOT 3 BIRDS', regularPrice: 190, jainPrice: null, prepTime: 18 },
        { category: 'Tripple Sundaes', name: 'DARK DEVIL', regularPrice: 200, jainPrice: null, prepTime: 20 },
        { category: 'Tripple Sundaes', name: 'WORLD\'S BEST CHOCOLATE', regularPrice: 215, jainPrice: null, prepTime: 22 },

        // Kids Sundaes
        { category: 'Kids Sundaes', name: 'JACK N JELLY', regularPrice: 100, jainPrice: null, prepTime: 8 },
        { category: 'Kids Sundaes', name: 'UMBRELLA BOY', regularPrice: 100, jainPrice: null, prepTime: 8 },
        { category: 'Kids Sundaes', name: 'POKE MOM SUNDAE', regularPrice: 100, jainPrice: null, prepTime: 8 },
        { category: 'Kids Sundaes', name: 'GOLDEN RIBBON', regularPrice: 100, jainPrice: null, prepTime: 8 }
    ]
};

async function insertMenuData() {
    try {
        console.log('🔄 Connecting to database...');
        await dbManager.connect();
        const pool = dbManager.getPool();
        console.log('✅ Connected to database');

        // Clear existing data
        console.log('🗑️ Clearing existing menu data...');
        await pool.request().query`DELETE FROM OrderItems WHERE OrderItemID > 0`;
        await pool.request().query`DELETE FROM KitchenQueue WHERE QueueID > 0`;
        await pool.request().query`DELETE FROM MenuItems WHERE ItemID > 0`;
        await pool.request().query`DELETE FROM Categories WHERE CategoryID > 0`;

        // Reset identity seeds
        await pool.request().query`DBCC CHECKIDENT ('Categories', RESEED, 0)`;
        await pool.request().query`DBCC CHECKIDENT ('MenuItems', RESEED, 0)`;

        // Insert categories
        console.log('📂 Inserting categories...');
        const categoryMap = new Map();

        for (const category of menuData.categories) {
            const categoryName = category.name.toLowerCase();
            const result = await pool.request().query`
                INSERT INTO Categories (CategoryName, DisplayOrder, IsActive)
                OUTPUT INSERTED.CategoryID
                VALUES (${categoryName}, ${category.displayOrder}, 1)
            `;
            categoryMap.set(categoryName, result.recordset[0].CategoryID);
            console.log(`   ✓ Added category: ${category.name} (ID: ${result.recordset[0].CategoryID})`);
        }

        // Insert menu items
        console.log('🍽️ Inserting menu items...');
        let itemCount = 0;

        for (const item of menuData.items) {
            const categoryId = categoryMap.get(item.category.toLowerCase());
            if (!categoryId) {
                console.log(`   ❌ Category not found: ${item.category}`);
                continue;
            }

            const imagePath = `images/menu/${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;

            await pool.request().query`
                INSERT INTO MenuItems (
                    CategoryID, ItemName, RegularPrice, JainPrice,
                    ImagePath, PreparationTime, IsAvailable,
                    IsVegetarian, IsJainAvailable, DisplayOrder
                ) VALUES (
                    ${categoryId}, ${item.name}, ${item.regularPrice}, ${item.jainPrice || null},
                    ${imagePath}, ${item.prepTime}, 1,
                    1, ${item.isJainAvailable || false}, ${itemCount + 1}
                )
            `;

            itemCount++;
            if (itemCount % 10 === 0) {
                console.log(`   ✓ Inserted ${itemCount} items...`);
            }
        }

        console.log(`✅ Successfully inserted ${itemCount} menu items`);

        // Display summary
        const categoryCount = await pool.request().query`SELECT COUNT(*) as count FROM Categories`;
        const itemCountResult = await pool.request().query`SELECT COUNT(*) as count FROM MenuItems`;

        console.log('\n📊 Database Summary:');
        console.log(`   Categories: ${categoryCount.recordset[0].count}`);
        console.log(`   Menu Items: ${itemCountResult.recordset[0].count}`);
        console.log('   ✅ Menu data insertion completed successfully!');

    } catch (error) {
        console.error('❌ Error inserting menu data:', error);
        throw error;
    } finally {
        await dbManager.disconnect();
    }
}

// Run the script
if (require.main === module) {
    insertMenuData()
        .then(() => {
            console.log('🎉 Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { insertMenuData };