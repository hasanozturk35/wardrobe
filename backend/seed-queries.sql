-- CLEANING PREVIOUS PRODUCTS / GARMENTS CASCADE
TRUNCATE TABLE "GarmentItem" CASCADE;
TRUNCATE TABLE "ItemPhoto" CASCADE;

-- ALTER SEQUENCE IF IDENTITY EXISTS (Optional safety)
-- ALTER SEQUENCE "GarmentItem_id_seq" RESTART WITH 1;

-- 10 EXPLICIT PREMIUM ITEMS FOR LUXURY DISCOVERY / WARDROBE
INSERT INTO "GarmentItem" (id, "wardrobeId", category, brand, colors, seasons, pinned, "createdAt", "updatedAt")
VALUES 
('item-001', (SELECT id FROM "Wardrobe" LIMIT 1), 'Üst Giyim', 'Saint Laurent', ARRAY['Siyah'], ARRAY['Sonbahar', 'Kış'], false, NOW(), NOW()),
('item-002', (SELECT id FROM "Wardrobe" LIMIT 1), 'Dış Giyim', 'Prada', ARRAY['Camel'], ARRAY['Kış', 'İlkbahar'], false, NOW(), NOW()),
('item-003', (SELECT id FROM "Wardrobe" LIMIT 1), 'Alt Giyim', 'Loro Piana', ARRAY['Bej'], ARRAY['İlkbahar', 'Yaz'], false, NOW(), NOW()),
('item-004', (SELECT id FROM "Wardrobe" LIMIT 1), 'Elbise', 'Balmain', ARRAY['Kırmızı'], ARRAY['Yaz', 'İlkbahar'], false, NOW(), NOW()),
('item-005', (SELECT id FROM "Wardrobe" LIMIT 1), 'Üst Giyim', 'Gucci', ARRAY['Beyaz'], ARRAY['Yaz', 'Sonbahar'], false, NOW(), NOW()),
('item-006', (SELECT id FROM "Wardrobe" LIMIT 1), 'Alt Giyim', 'Tom Ford', ARRAY['Siyah'], ARRAY['Sonbahar', 'Kış'], false, NOW(), NOW()),
('item-007', (SELECT id FROM "Wardrobe" LIMIT 1), 'Dış Giyim', 'Burberry', ARRAY['Bal'], ARRAY['İlkbahar', 'Sonbahar'], false, NOW(), NOW()),
('item-008', (SELECT id FROM "Wardrobe" LIMIT 1), 'Ayakkabı', 'Hermès', ARRAY['Kahverengi'], ARRAY['Yaz', 'Sonbahar'], false, NOW(), NOW()),
('item-009', (SELECT id FROM "Wardrobe" LIMIT 1), 'Elbise', 'Chanel', ARRAY['Lacivert'], ARRAY['Yaz', 'İlkbahar'], false, NOW(), NOW()),
('item-010', (SELECT id FROM "Wardrobe" LIMIT 1), 'Üst Giyim', 'Dior', ARRAY['Mavi'], ARRAY['İlkbahar', 'Sonbahar'], false, NOW(), NOW());

INSERT INTO "ItemPhoto" (id, "garmentItemId", url, "isCover", "createdAt")
VALUES
('photo-001', 'item-001', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80&fashion-top', true, NOW()),
('photo-002', 'item-002', 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=800&q=80&fashion-jacket', true, NOW()),
('photo-003', 'item-003', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80&fashion-jeans', true, NOW()),
('photo-004', 'item-004', 'https://images.unsplash.com/photo-1595777707802-51b40f018e50?w=800&q=80&fashion-dress', true, NOW()),
('photo-005', 'item-005', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80&fashion-tshirt', true, NOW()),
('photo-006', 'item-006', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&fashion-pants', true, NOW()),
('photo-007', 'item-007', 'https://images.unsplash.com/photo-1551778147-ce2e7e1d7d7f?w=800&q=80&fashion-trench', true, NOW()),
('photo-008', 'item-008', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80&fashion-sneaker', true, NOW()),
('photo-009', 'item-009', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&fashion-dress', true, NOW()),
('photo-010', 'item-010', 'https://images.unsplash.com/photo-1596815064285-b539041dd1e7?w=800&q=80&fashion-shirt', true, NOW());
