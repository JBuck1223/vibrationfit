-- Seed music_catalog with VibrationFit's 34 published songs
-- Run after uploading assets to S3: site-assets/music/{slug}/audio.wav + artwork.jpg
-- CDN: https://media.vibrationfit.com/site-assets/music/{slug}/...

-- Christmas songs
INSERT INTO music_catalog (title, artist, album, track_number, genre, tags, artwork_url, preview_url, sort_order) VALUES
('A Childlike Christmas', 'VibrationFit', 'High Vibe Christmas', 1, 'Holiday', '{}', 'https://media.vibrationfit.com/site-assets/music/a-childlike-christmas/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/a-childlike-christmas/audio.wav', 1),
('Believe In The Magic of Christmas', 'VibrationFit', 'High Vibe Christmas', 2, 'Holiday', '{}', 'https://media.vibrationfit.com/site-assets/music/believe-in-the-magic-of-christmas/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/believe-in-the-magic-of-christmas/audio.wav', 2),
('Feel Good This Christmas', 'VibrationFit', 'High Vibe Christmas', 3, 'Holiday', '{}', 'https://media.vibrationfit.com/site-assets/music/feel-good-this-christmas/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/feel-good-this-christmas/audio.wav', 3),
('High Vibe Christmas', 'VibrationFit', 'High Vibe Christmas', 4, 'Holiday', '{}', 'https://media.vibrationfit.com/site-assets/music/high-vibe-christmas/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/high-vibe-christmas/audio.wav', 4),
('This Christmas Dance', 'VibrationFit', 'High Vibe Christmas', 5, 'Holiday', '{}', 'https://media.vibrationfit.com/site-assets/music/this-christmas-dance/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/this-christmas-dance/audio.wav', 5),
('Turn It Up This Christmas', 'VibrationFit', 'High Vibe Christmas', 6, 'Holiday', '{}', 'https://media.vibrationfit.com/site-assets/music/turn-it-up-this-christmas/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/turn-it-up-this-christmas/audio.wav', 6);

-- Originals (non-Christmas) - sorted alphabetically, you can reorder / assign albums later
INSERT INTO music_catalog (title, artist, genre, tags, artwork_url, preview_url, sort_order) VALUES
('Allow It In', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/allow-it-in/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/allow-it-in/audio.wav', 10),
('Avalanches of Abundance', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/avalanches-of-abundance/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/avalanches-of-abundance/audio.wav', 11),
('Best Day Ever', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/best-day-ever/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/best-day-ever/audio.wav', 12),
('BIG Feelings', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/big-feelings/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/big-feelings/audio.wav', 13),
('Breath Like Water', 'VibrationFit', 'Wellness', '{}', 'https://media.vibrationfit.com/site-assets/music/breath-like-water/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/breath-like-water/audio.wav', 14),
('Every Cell', 'VibrationFit', 'Wellness', '{}', 'https://media.vibrationfit.com/site-assets/music/every-cell/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/every-cell/audio.wav', 15),
('Every Piece of Me', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/every-piece-of-me/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/every-piece-of-me/audio.wav', 16),
('Everything Always Works Out For Me', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/everything-always-works-out-for-me/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/everything-always-works-out-for-me/audio.wav', 17),
('Home In Me', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/home-in-me/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/home-in-me/audio.wav', 18),
('I''ll Wait for Magic', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/ill-wait-for-magic/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/ill-wait-for-magic/audio.wav', 19),
('Mirror Maze', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/mirror-maze/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/mirror-maze/audio.wav', 20),
('Model of the World', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/model-of-the-world/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/model-of-the-world/audio.wav', 21),
('Moments Make the Miles', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/moments-make-the-miles/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/moments-make-the-miles/audio.wav', 22),
('Music the Powerful Soul-ution', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/music-the-powerful-soul-ution/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/music-the-powerful-soul-ution/audio.wav', 23),
('My Shelter', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/my-shelter/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/my-shelter/audio.wav', 24),
('Power in Now', 'VibrationFit', 'Wellness', '{}', 'https://media.vibrationfit.com/site-assets/music/power-in-now/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/power-in-now/audio.wav', 25),
('Right On Time', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/right-on-time/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/right-on-time/audio.wav', 26),
('Rise to Well-Being', 'VibrationFit', 'Wellness', '{}', 'https://media.vibrationfit.com/site-assets/music/rise-to-well-being/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/rise-to-well-being/audio.wav', 27),
('Speak It Into Being', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/speak-it-into-being/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/speak-it-into-being/audio.wav', 28),
('The Guidance Within', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/the-guidance-within/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/the-guidance-within/audio.wav', 29),
('The Life I Choose', 'VibrationFit', 'Inspirational', '{spirituality}', 'https://media.vibrationfit.com/site-assets/music/the-life-i-choose/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/the-life-i-choose/audio.wav', 30),
('The Next Right Thing', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/the-next-right-thing/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/the-next-right-thing/audio.wav', 31),
('They Chose Me', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/they-chose-me/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/they-chose-me/audio.wav', 32),
('To Know Me Through Me', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/to-know-me-through-me/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/to-know-me-through-me/audio.wav', 33),
('Vibrational Fitness', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/vibrational-fitness/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/vibrational-fitness/audio.wav', 34),
('Vibrational Universe', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/vibrational-universe/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/vibrational-universe/audio.wav', 35),
('Wake Up Creator', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/wake-up-creator/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/wake-up-creator/audio.wav', 36),
('Wildflower Wishes', 'VibrationFit', 'Inspirational', '{}', 'https://media.vibrationfit.com/site-assets/music/wildflower-wishes/artwork.jpg', 'https://media.vibrationfit.com/site-assets/music/wildflower-wishes/audio.wav', 37);
