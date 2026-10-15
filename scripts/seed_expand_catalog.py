import uuid
from pymongo import MongoClient

ALL_CITIES = ["Hyderabad", "Bangalore", "Mumbai", "Delhi", "Pune"]

NEW_UNIQUE_PRODUCTS = [
    # =========================================================================
    # APPLIANCES: Water Purifiers (Add 3 to bring total to 6)
    # =========================================================================
    {
        "rental_name": "Kent Grand Plus RO + UV + UF + TDS Controller Purifier",
        "category_id": "Appliances",
        "sub_category": "Water Purifiers",
        "monthly_price": 499,
        "daily_price": 20,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&q=80&w=600",
        "description": "Multi-stage purification with in-tank UV disinfection, 9L storage capacity, and Mineral ROTM technology."
    },
    {
        "rental_name": "Aquaguard Marvel NXT Copper RO + UV + MTDS Purifier",
        "category_id": "Appliances",
        "sub_category": "Water Purifiers",
        "monthly_price": 529,
        "daily_price": 21,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=600",
        "description": "Infuses active copper and zinc ions into drinking water with smart LED service indicators and compact design."
    },
    {
        "rental_name": "Urban Company Native M2 IoT Smart RO Water Purifier",
        "category_id": "Appliances",
        "sub_category": "Water Purifiers",
        "monthly_price": 599,
        "daily_price": 24,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&q=80&w=600",
        "description": "Needs no service for 2 years with smart app integration, real-time TDS tracking, and rapid 10-stage filtration."
    },

    # =========================================================================
    # APPLIANCES: Air Conditioners (Add 2 to bring total to 6)
    # =========================================================================
    {
        "rental_name": "Voltas 1.5 Ton 5-Star Inverter Split AC (Copper, PM 2.5 Filter)",
        "category_id": "Appliances",
        "sub_category": "Air Conditioners",
        "monthly_price": 1299,
        "daily_price": 52,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600",
        "description": "Superdry mode with stabilizer-free operation down to 100V and high ambient cooling up to 52 degrees Celsius."
    },
    {
        "rental_name": "LG 1.5 Ton AI Convertible 6-in-1 Dual Inverter Split AC",
        "category_id": "Appliances",
        "sub_category": "Air Conditioners",
        "monthly_price": 1399,
        "daily_price": 56,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1614631446501-abcf76949eca?auto=format&fit=crop&q=80&w=600",
        "description": "AI Dual Inverter with 4-way swing, anti-virus protection filter, and ultra-quiet 21dB operation."
    },

    # =========================================================================
    # APPLIANCES: Air Purifiers (Add 4 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Philips Series 1000i Smart Air Purifier (HEPA NanoProtect)",
        "category_id": "Appliances",
        "sub_category": "Air Purifiers",
        "monthly_price": 499,
        "daily_price": 20,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=600",
        "description": "Removes 99.97% airborne pollutants down to 0.003 microns with AeraSense numerical air quality display."
    },
    {
        "rental_name": "Mi Smart Air Purifier 4 with True HEPA & OLED Touch Display",
        "category_id": "Appliances",
        "sub_category": "Air Purifiers",
        "monthly_price": 449,
        "daily_price": 18,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1590483736622-39da8677b494?auto=format&fit=crop&q=80&w=600",
        "description": "High CADR of 400m3/h with negative air ionization and Alexa/Google Home voice assistant integration."
    },
    {
        "rental_name": "Dyson Purifier Hot+Cool Air Purifier HP07",
        "category_id": "Appliances",
        "sub_category": "Air Purifiers",
        "monthly_price": 1499,
        "daily_price": 60,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600",
        "description": "Whole-room Air Multiplier purification with built-in heater and personal cooling fan. Fully sealed HEPA H13 standard."
    },
    {
        "rental_name": "Coway Airmega 150 Professional True HEPA Air Purifier",
        "category_id": "Appliances",
        "sub_category": "Air Purifiers",
        "monthly_price": 479,
        "daily_price": 19,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=600",
        "description": "Patented Green Anti-Flu True HEPA filter trapping viruses, pollen, bacteria, and pet dander with washable pre-filter."
    },

    # =========================================================================
    # APPLIANCES: Dishwashers (Add 4 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Bosch 13 Place Settings Free-Standing Dishwasher (Serie 2)",
        "category_id": "Appliances",
        "sub_category": "Dishwashers",
        "monthly_price": 1099,
        "daily_price": 44,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1585827365298-639556fa39f3?auto=format&fit=crop&q=80&w=600",
        "description": "Intensive Kadhai 70C program specifically engineered for greasy Indian cookware, masalas, and pressure cookers."
    },
    {
        "rental_name": "LG 14 Place Settings Wi-Fi TrueSteam QuadWash Dishwasher",
        "category_id": "Appliances",
        "sub_category": "Dishwashers",
        "monthly_price": 1299,
        "daily_price": 52,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1585827365298-639556fa39f3?auto=format&fit=crop&q=80&w=600",
        "description": "Four spray arms with multi-directional rotation and TrueSteam high-temperature sanitization to eliminate water spots."
    },
    {
        "rental_name": "Voltas Beko 8 Place Settings Table Top Dishwasher",
        "category_id": "Appliances",
        "sub_category": "Dishwashers",
        "monthly_price": 699,
        "daily_price": 28,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1585827365298-639556fa39f3?auto=format&fit=crop&q=80&w=600",
        "description": "Compact tabletop form factor ideal for 2-3 member nuclear households. Features 6 wash programs and glassware protection."
    },
    {
        "rental_name": "IFB 16 Place Settings Inverter Front Load Dishwasher (Neptune SX1)",
        "category_id": "Appliances",
        "sub_category": "Dishwashers",
        "monthly_price": 1199,
        "daily_price": 48,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1585827365298-639556fa39f3?auto=format&fit=crop&q=80&w=600",
        "description": "Triple arm 360-degree spray system with hot air drying and dedicated upper cutlery basket."
    },

    # =========================================================================
    # APPLIANCES: Vacuum Cleaners (Add 3 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Dyson V8 Absolute Cordless Stick Vacuum Cleaner",
        "category_id": "Appliances",
        "sub_category": "Vacuum Cleaners",
        "monthly_price": 799,
        "daily_price": 32,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=600",
        "description": "Powerful fade-free 115AW cyclone suction with de-tangling Motorbar cleaner head and 40-minute run time."
    },
    {
        "rental_name": "Eureka Forbes Quick Clean DX Dry Vacuum Cleaner (1200W)",
        "category_id": "Appliances",
        "sub_category": "Vacuum Cleaners",
        "monthly_price": 299,
        "daily_price": 12,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=600",
        "description": "High suction deep-cleaning canisters with dust bag full indicator and 3 swivel wheels for easy mobility."
    },
    {
        "rental_name": "Dreame D9 Max Gen 2 Robot Vacuum and Mop with LiDAR Navigation",
        "category_id": "Appliances",
        "sub_category": "Vacuum Cleaners",
        "monthly_price": 699,
        "daily_price": 28,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=600",
        "description": "6000Pa extreme suction with automated multi-floor smart mapping, carpet boost, and remote app scheduling."
    },

    # =========================================================================
    # APPLIANCES: Microwaves (Add 3 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "LG 32L Charcoal Convection Microwave Oven with Diet Fry",
        "category_id": "Appliances",
        "sub_category": "Microwaves",
        "monthly_price": 499,
        "daily_price": 20,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600",
        "description": "Charcoal lighting heater with motorized rotisserie for authentic tandoori and zero-oil healthy frying."
    },
    {
        "rental_name": "Samsung 28L Slim Fry Convection Microwave Oven (Ceramic Enamel)",
        "category_id": "Appliances",
        "sub_category": "Microwaves",
        "monthly_price": 449,
        "daily_price": 18,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1585338447937-7052fcb35c08?auto=format&fit=crop&q=80&w=600",
        "description": "99.9% anti-bacterial scratch-resistant ceramic enamel cavity with dough-proof and curd-maker modes."
    },
    {
        "rental_name": "IFB 30L Convection Microwave Oven (30BRC2 Multi-Stage)",
        "category_id": "Appliances",
        "sub_category": "Microwaves",
        "monthly_price": 479,
        "daily_price": 19,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600",
        "description": "Over 101 standard cooking menus with express cooking, keep warm function, and child safety lock."
    },

    # =========================================================================
    # BEDROOM: Beds (Add 2 to bring total to 6)
    # =========================================================================
    {
        "rental_name": "Sheesham Wood King Size Bed with Box Storage",
        "category_id": "Bedroom",
        "sub_category": "Beds",
        "monthly_price": 1199,
        "daily_price": 48,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&q=80&w=600",
        "description": "Handcrafted Indian Sheesham solid wood frame with warm honey finish and 4-compartment storage."
    },
    {
        "rental_name": "Modern Minimalist Single Bed with Under-Bed Drawers",
        "category_id": "Bedroom",
        "sub_category": "Beds",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600",
        "description": "Sturdy engineered pine wood single frame with two rolling underbed drawers, ideal for compact studio apartments."
    },

    # =========================================================================
    # BEDROOM: Bedside Tables (Add 4 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Solid Teak Wood 2-Drawer Bedside Nightstand",
        "category_id": "Bedroom",
        "sub_category": "Bedside Tables",
        "monthly_price": 189,
        "daily_price": 8,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=600",
        "description": "Compact bedside nightstand with brass metal handles and smooth-glide wooden drawer slides."
    },
    {
        "rental_name": "Nordic White & Oak Bedside Table with Open Shelf",
        "category_id": "Bedroom",
        "sub_category": "Bedside Tables",
        "monthly_price": 169,
        "daily_price": 7,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=600",
        "description": "Scandinavian minimalist nightstand featuring an open magazine cubby and soft-close drawer."
    },
    {
        "rental_name": "Industrial Bedside Table with Metal Frame and USB Port",
        "category_id": "Bedroom",
        "sub_category": "Bedside Tables",
        "monthly_price": 219,
        "daily_price": 9,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=600",
        "description": "Matte black powder-coated steel frame with rustic reclaimed wood top and integrated dual phone charging ports."
    },
    {
        "rental_name": "Curved Mid-Century Walnut Nightstand with Fluted Drawer",
        "category_id": "Bedroom",
        "sub_category": "Bedside Tables",
        "monthly_price": 239,
        "daily_price": 10,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=600",
        "description": "Retro fluted wood drawer face with curved corners and tapered conical legs in rich walnut stain."
    },

    # =========================================================================
    # BEDROOM: Dressing Tables (Add 4 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Contemporary Dressing Table with LED Hollywood Vanity Mirror",
        "category_id": "Bedroom",
        "sub_category": "Dressing Tables",
        "monthly_price": 499,
        "daily_price": 20,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600",
        "description": "Large illuminated vanity mirror with 3 touch color temperatures, jewelry organizer dividers, and matching stool."
    },
    {
        "rental_name": "Engineered Wood Compact Dresser with Full-Length Mirror",
        "category_id": "Bedroom",
        "sub_category": "Dressing Tables",
        "monthly_price": 389,
        "daily_price": 16,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600",
        "description": "Tall sliding full-length mirror revealing concealed shelving for perfumes, cosmetics, and accessories."
    },
    {
        "rental_name": "Solid Wood Mid-Century Dressing Table with Oval Mirror",
        "category_id": "Bedroom",
        "sub_category": "Dressing Tables",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600",
        "description": "Elegant walnut silhouette with tilted rotatable oval glass mirror and dual velvet-lined cosmetics drawers."
    },
    {
        "rental_name": "Floating Wall-Mounted Vanity Table with Fold-Down Desk",
        "category_id": "Bedroom",
        "sub_category": "Dressing Tables",
        "monthly_price": 319,
        "daily_price": 13,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600",
        "description": "Zero-footprint floating vanity with internal organizers that flips down into a compact bedroom laptop desk."
    },

    # =========================================================================
    # BEDROOM: Mattresses (Add 3 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Wakefit Orthopedic Memory Foam King Mattress (8-Inch)",
        "category_id": "Bedroom",
        "sub_category": "Mattresses",
        "monthly_price": 499,
        "daily_price": 20,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600",
        "description": "Cooling gel-infused memory foam adapts to spinal contours with pressure relief and breathable fabric cover."
    },
    {
        "rental_name": "Sleepwell Pocket Spring Queen Mattress with Euro Top (8-Inch)",
        "category_id": "Bedroom",
        "sub_category": "Mattresses",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600",
        "description": "Zero motion transfer with individually encased pocket springs and plush quilted Euro top cushioning."
    },
    {
        "rental_name": "Natural Latex & Coir Eco-Friendly Single Mattress (6-Inch)",
        "category_id": "Bedroom",
        "sub_category": "Mattresses",
        "monthly_price": 319,
        "daily_price": 13,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=600",
        "description": "100% natural organic latex paired with rubberized coconut coir for firm ergonomic orthotic spine alignment."
    },

    # =========================================================================
    # BEDROOM: Wardrobe & Organizer (Add 4 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "3-Door Engineered Wood Wardrobe with Mirror and Drawers",
        "category_id": "Bedroom",
        "sub_category": "Wardrobe & Organizer",
        "monthly_price": 699,
        "daily_price": 28,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&q=80&w=600",
        "description": "Generous hanging space with 6 adjustable shelves, full-length dressing mirror, and dual lockable drawers."
    },
    {
        "rental_name": "2-Door Sliding Wardrobe with Frosted Glass Panels",
        "category_id": "Bedroom",
        "sub_category": "Wardrobe & Organizer",
        "monthly_price": 649,
        "daily_price": 26,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&q=80&w=600",
        "description": "Smooth aluminum track sliding doors designed specifically for bedrooms with limited walkway clearance."
    },
    {
        "rental_name": "Modular Open Concept Clothes Rack & Wardrobe Organizer",
        "category_id": "Bedroom",
        "sub_category": "Wardrobe & Organizer",
        "monthly_price": 289,
        "daily_price": 12,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&q=80&w=600",
        "description": "Heavy duty metal frame with wooden shoe racks, dual coat rods, and fabric laundry bin."
    },
    {
        "rental_name": "4-Door Master Bedroom Wardrobe with Overhead Lofts",
        "category_id": "Bedroom",
        "sub_category": "Wardrobe & Organizer",
        "monthly_price": 999,
        "daily_price": 40,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&q=80&w=600",
        "description": "Maximum floor-to-ceiling storage capacity with integrated top storage lofts for seasonal luggage and blankets."
    },

    # =========================================================================
    # LIVING ROOM: Center Tables (Add 3 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Marble-Top Round Nesting Coffee Tables (Set of 2)",
        "category_id": "Living Room",
        "sub_category": "Center Tables",
        "monthly_price": 349,
        "daily_price": 14,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=600",
        "description": "Faux Carrara marble top with brushed brass gold frame nesting duo that slides together to save space."
    },
    {
        "rental_name": "Solid Sheesham Wood Coffee Table with 4 Cushioned Stools",
        "category_id": "Living Room",
        "sub_category": "Center Tables",
        "monthly_price": 429,
        "daily_price": 17,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=600",
        "description": "Smart living room table featuring 4 upholstered nesting stools that tuck neatly underneath."
    },
    {
        "rental_name": "Modern Industrial Glass Top Center Table with Lower Magazine Shelf",
        "category_id": "Living Room",
        "sub_category": "Center Tables",
        "monthly_price": 279,
        "daily_price": 11,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=600",
        "description": "Tempered shatter-resistant glass surface with powder-coated black iron frame and rustic wood lower shelf."
    },

    # =========================================================================
    # LIVING ROOM: Study Tables (Add 4 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Electric Motorized Height Adjustable Standing Desk (48x24)",
        "category_id": "Living Room",
        "sub_category": "Study Tables",
        "monthly_price": 699,
        "daily_price": 28,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600",
        "description": "Dual motor height adjustment from 72cm to 120cm with 4 memory presets, anti-collision sensor, and cable tray."
    },
    {
        "rental_name": "Compact Study Desk with Bookshelf Hutch and Pin Board",
        "category_id": "Living Room",
        "sub_category": "Study Tables",
        "monthly_price": 389,
        "daily_price": 16,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600",
        "description": "Vertical storage study unit with upper open bookshelves, cork pin-up board for reminders, and smooth keyboard tray."
    },
    {
        "rental_name": "L-Shaped Corner Computer Workstation Desk",
        "category_id": "Living Room",
        "sub_category": "Study Tables",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600",
        "description": "Expansive corner surface accommodating dual 27-inch monitors, laptop dock, printer, and paperwork with ease."
    },
    {
        "rental_name": "Foldable Space-Saving Wall-Mounted Drop Leaf Desk",
        "category_id": "Living Room",
        "sub_category": "Study Tables",
        "monthly_price": 249,
        "daily_price": 10,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600",
        "description": "Folds flat against the wall when not in use with integrated internal stationery pigeonholes."
    },

    # =========================================================================
    # DINING ROOM: Tables & Sets (Add 3 to bring total to 5)
    # =========================================================================
    {
        "rental_name": "Extendable 6-Seater Solid Sheesham Wood Dining Set",
        "category_id": "Dining Room",
        "sub_category": "Tables",
        "monthly_price": 1099,
        "daily_price": 44,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=600",
        "description": "Smooth butterfly extension mechanism expanding from 4-seater to 6-seater with 6 high-back cushioned chairs."
    },
    {
        "rental_name": "Modern Round Glass Dining Table with 4 Velvet Chairs",
        "category_id": "Dining Room",
        "sub_category": "Tables",
        "monthly_price": 899,
        "daily_price": 36,
        "tag": "Trending",
        "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=600",
        "description": "Beveled tempered glass tabletop on cross-geometric gold legs accompanied by midnight blue velvet dining chairs."
    },
    {
        "rental_name": "Bistro 2-Seater Breakfast Dining Table Set",
        "category_id": "Dining Room",
        "sub_category": "Tables",
        "monthly_price": 449,
        "daily_price": 18,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=600",
        "description": "Intimate dining table with 2 curved wooden bentwood chairs, perfect for apartment balconies and kitchen nooks."
    },

    # =========================================================================
    # ENTERTAINMENT / ELECTRONICS: Projectors & Audio (Add 4 to bring to 5+)
    # =========================================================================
    {
        "rental_name": "XGIMI Halo+ Portable 1080P FHD Smart LED Projector",
        "category_id": "Entertainment",
        "sub_category": "Projectors",
        "monthly_price": 1199,
        "daily_price": 48,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600",
        "description": "900 ANSI Lumens with built-in Harman Kardon audio, auto keystone correction, and 2.5-hour cordless battery life."
    },
    {
        "rental_name": "BenQ 4K HDR Home Theater Cinema Projector (TK700STi)",
        "category_id": "Entertainment",
        "sub_category": "Projectors",
        "monthly_price": 1899,
        "daily_price": 76,
        "tag": "Premium",
        "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600",
        "description": "True 4K UHD 8.3 million pixels with 16ms low input lag for sports and gaming up to 200-inch projection."
    },
    {
        "rental_name": "Sony HT-S20R 5.1ch Dolby Digital Soundbar with Subwoofer",
        "category_id": "Entertainment",
        "sub_category": "Soundbars & Audio",
        "monthly_price": 549,
        "daily_price": 22,
        "tag": "Best Seller",
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600",
        "description": "400W total output with wired rear surround speakers and external subwoofer for genuine cinema surround audio."
    },
    {
        "rental_name": "JBL Cinema SB271 2.1 Channel Soundbar with Wireless Subwoofer",
        "category_id": "Entertainment",
        "sub_category": "Soundbars & Audio",
        "monthly_price": 429,
        "daily_price": 17,
        "tag": "Popular",
        "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600",
        "description": "220W ultra-deep bass with dedicated voice clarity button and HDMI ARC single-cable TV connection."
    }
]

def seed_new_catalog():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['rentora_db']
    print(f"Connecting to MongoDB rentora_db. Existing appliances: {db.appliances.count_documents({})}")

    inserted = 0
    updated = 0

    for p in NEW_UNIQUE_PRODUCTS:
        m_price = p["monthly_price"]
        doc = {
            "rental_name": p["rental_name"],
            "category_id": p["category_id"],
            "sub_category": p.get("sub_category", p["category_id"]),
            "daily_price": p["daily_price"],
            "monthly_price": m_price,
            "pricing": {
                "3": m_price,
                "6": int(m_price * 0.9),
                "12": int(m_price * 0.8)
            },
            "security_deposit": int(m_price * 1.5),
            "available_cities": ALL_CITIES,
            "description": p["description"],
            "image_url": p["image_url"],
            "tag": p.get("tag", "Best Seller"),
            "stock_quantity": 10
        }

        existing = db.appliances.find_one({"rental_name": p["rental_name"]})
        if existing:
            db.appliances.update_one({"_id": existing["_id"]}, {"$set": doc})
            updated += 1
        else:
            doc["_id"] = str(uuid.uuid4())
            doc["appliance_id"] = str(uuid.uuid4())
            db.appliances.insert_one(doc)
            inserted += 1

    # Ensure all appliances have available_cities: ALL_CITIES
    db.appliances.update_many({}, {"$set": {"available_cities": ALL_CITIES}})

    print(f"[SUCCESS] Expanded catalog: {inserted} new unique products inserted, {updated} updated.")
    print(f"Total active catalog size in MongoDB: {db.appliances.count_documents({})}")

if __name__ == "__main__":
    seed_new_catalog()
