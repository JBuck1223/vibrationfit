-- Seed 10 actualized Vision Transformation items onto the vision boards
-- of vanessa@vibrationfit.com and jordan@vibrationfit.com.
-- These mirror the homepage "Vision Transformations" carousel.

DO $$
DECLARE
  v_vanessa_id uuid;
  v_jordan_id uuid;
  v_base text := 'https://media.vibrationfit.com/site-assets/proof-wall/';
BEGIN
  -- Look up user IDs by email
  SELECT id INTO v_vanessa_id FROM auth.users WHERE email = 'vanessa@vibrationfit.com';
  SELECT id INTO v_jordan_id FROM auth.users WHERE email = 'jordan@vibrationfit.com';

  IF v_vanessa_id IS NULL THEN
    RAISE NOTICE 'User vanessa@vibrationfit.com not found – skipping';
  END IF;
  IF v_jordan_id IS NULL THEN
    RAISE NOTICE 'User jordan@vibrationfit.com not found – skipping';
  END IF;

  -- Helper: insert for both users, skip if that user was not found.
  -- We guard against duplicates by checking name + user_id before inserting.

  -- 1. $1M Actualized
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = '$1M Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      '$1M Actualized',
      'From $4.87 in the bank and over $100K in debt to our first $1,000,000 in our own business from home.',
      v_base || 'gross-profit-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'gross-profit-actualized.jpg',
      E'We experienced an amazingly awful day that changed our lives forever. We had just gotten married and were living in Japan. We woke up one morning and had no milk, no eggs, no bread, and no money. Our available capital that day was $4.87 (not even enough money to pay the ATM fee). And at the time we owed over $100,000 in debt: student loans, car loans, a dirt bike loan, home improvement loans, family loans, and infinite credit card debt.\n\nBut this day was when everything changed vibrationally for us. We could no longer afford to play the vibrational hokey pokey. This is when we decided to fully commit the Vibration Fit Conscious Creation System. We started a new business doing what we loved and added a pretend $1,000,000 bill to our vision board. And boy are we glad we did!\n\nWe went from no money in the bank and over 6 figures in debt to completely debt free with 6 figures in the bank. We made our first $1,000,000 in our own business from home. We achieved time, location, financial and inner freedom.\n\nOur lives were forever changed!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = '$1M Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      '$1M Actualized',
      'From $4.87 in the bank and over $100K in debt to our first $1,000,000 in our own business from home.',
      v_base || 'gross-profit-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'gross-profit-actualized.jpg',
      E'We experienced an amazingly awful day that changed our lives forever. We had just gotten married and were living in Japan. We woke up one morning and had no milk, no eggs, no bread, and no money. Our available capital that day was $4.87 (not even enough money to pay the ATM fee). And at the time we owed over $100,000 in debt: student loans, car loans, a dirt bike loan, home improvement loans, family loans, and infinite credit card debt.\n\nBut this day was when everything changed vibrationally for us. We could no longer afford to play the vibrational hokey pokey. This is when we decided to fully commit the Vibration Fit Conscious Creation System. We started a new business doing what we loved and added a pretend $1,000,000 bill to our vision board. And boy are we glad we did!\n\nWe went from no money in the bank and over 6 figures in debt to completely debt free with 6 figures in the bank. We made our first $1,000,000 in our own business from home. We achieved time, location, financial and inner freedom.\n\nOur lives were forever changed!'
    );
  END IF;

  -- 2. Exact Italy Destination Actualized (without any planning)
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Exact Italy Destination Actualized (without any planning)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Exact Italy Destination Actualized (without any planning)',
      'We ended up at the exact location from our vision board photo on the Amalfi Coast without any planning.',
      v_base || 'italy-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'italy-actualized.jpg',
      E'You can''t make this stuff up...\n\nSo here we are in Amalfi, sitting at dinner on Day 2 talking about how surreal it is that we''re in Italy marking off another place from our vision board. Jordan pulls up the exact photo from our vision board and we wonder where it was taken. We knew it was somewhere along the Amalfi Coast, but little did we know when we got here that the Amalfi coast is actually 34 miles long and spans across many towns. Jordan asks our waiter if he knows where our vision board photo was taken and he says, "That''s Atrani. Only one minute north of Amalfi."\n\nIt turned out that we had driven right through Atrani on our way to Ravello earlier that day. And that we were only staying about 12 minutes away the whole time!\n\nSo on Day 3, a bright, beautiful, sunny day, we started the morning off by driving straight to Atrani to get our very own photo in the exact same location as the one we''ve been staring at and dreaming about from our vision board for years!\n\nThe first photo is proof of us there, the second one is the photo from our vision board!\n\nThis vision stuff truly works... we are constantly surprised and delighted by the Universe! We are across the world and somehow line up with the exact right places, people, and circumstances to experience the place we''ve had on our vision board for years. With no planning ahead of time... Now that''s manifestation at its best!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Exact Italy Destination Actualized (without any planning)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Exact Italy Destination Actualized (without any planning)',
      'We ended up at the exact location from our vision board photo on the Amalfi Coast without any planning.',
      v_base || 'italy-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'italy-actualized.jpg',
      E'You can''t make this stuff up...\n\nSo here we are in Amalfi, sitting at dinner on Day 2 talking about how surreal it is that we''re in Italy marking off another place from our vision board. Jordan pulls up the exact photo from our vision board and we wonder where it was taken. We knew it was somewhere along the Amalfi Coast, but little did we know when we got here that the Amalfi coast is actually 34 miles long and spans across many towns. Jordan asks our waiter if he knows where our vision board photo was taken and he says, "That''s Atrani. Only one minute north of Amalfi."\n\nIt turned out that we had driven right through Atrani on our way to Ravello earlier that day. And that we were only staying about 12 minutes away the whole time!\n\nSo on Day 3, a bright, beautiful, sunny day, we started the morning off by driving straight to Atrani to get our very own photo in the exact same location as the one we''ve been staring at and dreaming about from our vision board for years!\n\nThe first photo is proof of us there, the second one is the photo from our vision board!\n\nThis vision stuff truly works... we are constantly surprised and delighted by the Universe! We are across the world and somehow line up with the exact right places, people, and circumstances to experience the place we''ve had on our vision board for years. With no planning ahead of time... Now that''s manifestation at its best!'
    );
  END IF;

  -- 3. Dream Home Actualized
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Dream Home Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Dream Home Actualized',
      'From a tiny apartment in Japan to our dream home near the beach - exactly as we envisioned it.',
      v_base || 'house-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'house-actualized.jpg',
      E'We were recently married, living in a tiny apartment in Japan (for what was ultimately a failed business venture), thousands of miles from America when we put this picture of a home in Florida on our vision board.\n\nWe had no idea where we ultimately wanted to live, but knew we wanted to be near the beach. As more clarity filled in on what kind of home we wanted, I (Vanessa) wrote a detailed letter to the Universe about what our home would look and feel like.\n\nJordan found my letter I wrote to the Universe after we moved into our home, thinking I had written a gratitude letter for our house because it described every room and space in detail- then he looked at the date I wrote it - 2 years before we bought our home!\n\nLooking back at the letter and the picture we had on our vision board of our home gives us goose bumps! Everything we envisioned and dreamed about in a home actualized (in the destination of our dreams)- and even better than we imagined!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Dream Home Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Dream Home Actualized',
      'From a tiny apartment in Japan to our dream home near the beach - exactly as we envisioned it.',
      v_base || 'house-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'house-actualized.jpg',
      E'We were recently married, living in a tiny apartment in Japan (for what was ultimately a failed business venture), thousands of miles from America when we put this picture of a home in Florida on our vision board.\n\nWe had no idea where we ultimately wanted to live, but knew we wanted to be near the beach. As more clarity filled in on what kind of home we wanted, I (Vanessa) wrote a detailed letter to the Universe about what our home would look and feel like.\n\nJordan found my letter I wrote to the Universe after we moved into our home, thinking I had written a gratitude letter for our house because it described every room and space in detail- then he looked at the date I wrote it - 2 years before we bought our home!\n\nLooking back at the letter and the picture we had on our vision board of our home gives us goose bumps! Everything we envisioned and dreamed about in a home actualized (in the destination of our dreams)- and even better than we imagined!'
    );
  END IF;

  -- 4. Paid CASH for our Minivan
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Paid CASH for our Minivan'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Paid CASH for our Minivan',
      'Paid cash for a brand new 2022 White Honda Odyssey Elite after having it on our vision board for 7 years.',
      v_base || 'van-board-1.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'van-actualized-2.jpg',
      E'March 23, 2022: The day we paid CASH for a brand new 2022 White Honda Odyssey Elite mini van! The same one that has been on our vision board for 7 years and on Jordan''s for over a decade! Today is the day it came to fruition.\n\nWhen Oliver was born we knew we needed something bigger for our family of 3. One day while driving to Oliver''s 3 month checkup, we saw a 2011 blue Honda Odyssey with 160,000 miles on the side of the road. We test drove it and the For Sale signs on the doors flew off while we were driving down the road. We took that as a sign (literally) that it was ours. So we paid cash for it and drove it to over 200,000 miles. Sadly, we had to put a lot of money into it to keep it running. It was perfect for what we needed at the time, and fit into our financial situation. Recently though, our mechanic had been driving it more than us.\n\nWe finally decided the other day after we got our old van out of the shop once again, and that dang engine light came on, that it was time for an upgrade... to something new that we actually felt safe driving our kids around in, and that was more in alignment with where we are now.\n\nWe called a few Honda dealerships and finally found one in the exact exterior and interior color we wanted. It wasn''t even showing in their system, but they saw that it was on an incoming delivery. We put a deposit on the new van, went out to drive the old van, and noticed the check engine light went off. It was as if it came on just long enough one last time for us to actually make the decision to go for it on a new car. And that new car was waiting for us!\n\nWe are so grateful for all the miles we had in our old van, and can''t wait for all the memories to come rolling down the road in our vision board car.'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Paid CASH for our Minivan'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Paid CASH for our Minivan',
      'Paid cash for a brand new 2022 White Honda Odyssey Elite after having it on our vision board for 7 years.',
      v_base || 'van-board-1.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'van-actualized-2.jpg',
      E'March 23, 2022: The day we paid CASH for a brand new 2022 White Honda Odyssey Elite mini van! The same one that has been on our vision board for 7 years and on Jordan''s for over a decade! Today is the day it came to fruition.\n\nWhen Oliver was born we knew we needed something bigger for our family of 3. One day while driving to Oliver''s 3 month checkup, we saw a 2011 blue Honda Odyssey with 160,000 miles on the side of the road. We test drove it and the For Sale signs on the doors flew off while we were driving down the road. We took that as a sign (literally) that it was ours. So we paid cash for it and drove it to over 200,000 miles. Sadly, we had to put a lot of money into it to keep it running. It was perfect for what we needed at the time, and fit into our financial situation. Recently though, our mechanic had been driving it more than us.\n\nWe finally decided the other day after we got our old van out of the shop once again, and that dang engine light came on, that it was time for an upgrade... to something new that we actually felt safe driving our kids around in, and that was more in alignment with where we are now.\n\nWe called a few Honda dealerships and finally found one in the exact exterior and interior color we wanted. It wasn''t even showing in their system, but they saw that it was on an incoming delivery. We put a deposit on the new van, went out to drive the old van, and noticed the check engine light went off. It was as if it came on just long enough one last time for us to actually make the decision to go for it on a new car. And that new car was waiting for us!\n\nWe are so grateful for all the miles we had in our old van, and can''t wait for all the memories to come rolling down the road in our vision board car.'
    );
  END IF;

  -- 5. Dream Wedding Actualized
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Dream Wedding Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Dream Wedding Actualized',
      'Our destination beach wedding in Cabo matched our vision board photo almost exactly.',
      v_base || 'beach-wedding-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'beach-wedding-actualized.jpg',
      E'We knew we were getting married right away when we met. We were engaged within 6 months of meeting, so naturally we had started dreaming about what kind of wedding we wanted.\n\nWe both love the beach, so we talked and dreamed about having a destination wedding at a beach somewhere in the world. We put a random beach wedding photo on our vision board that we found on the internet, and went on with our life.\n\nOne thing led to another - I bought a book online called "Destination Weddings" and within that book was a beautiful resort in Cabo, Mexico. We connected with an amazing travel agent online who had booked many similar group trips and she was able to get our group of 40 people an amazing deal for our destination wedding.\n\nWhen we look back now it is mind-blowing how exact our actual wedding matched our vision board wedding photo! They may have both even been taken in the exact same spot in Cabo, Mexico!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Dream Wedding Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Dream Wedding Actualized',
      'Our destination beach wedding in Cabo matched our vision board photo almost exactly.',
      v_base || 'beach-wedding-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'beach-wedding-actualized.jpg',
      E'We knew we were getting married right away when we met. We were engaged within 6 months of meeting, so naturally we had started dreaming about what kind of wedding we wanted.\n\nWe both love the beach, so we talked and dreamed about having a destination wedding at a beach somewhere in the world. We put a random beach wedding photo on our vision board that we found on the internet, and went on with our life.\n\nOne thing led to another - I bought a book online called "Destination Weddings" and within that book was a beautiful resort in Cabo, Mexico. We connected with an amazing travel agent online who had booked many similar group trips and she was able to get our group of 40 people an amazing deal for our destination wedding.\n\nWhen we look back now it is mind-blowing how exact our actual wedding matched our vision board wedding photo! They may have both even been taken in the exact same spot in Cabo, Mexico!'
    );
  END IF;

  -- 6. Japan Actualized
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Japan Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Japan Actualized',
      'Sponsored to live in a luxurious apartment in Osaka, Japan for over a year after putting it on our vision board.',
      v_base || 'japan-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'japan-friends.jpg',
      E'Our work at the time was expanding into Japan, and we really wanted to go spearhead the market. We had no money, but we had a dream so we did the most powerful thing we knew to do - added Japan to our vision document and vision board!\n\nOne day, we get a call from the owners of the company saying they are picking three couples from the company to sponsor in Japan and we are one of them - they paid for us to live in a luxurious business apartment in Osaka and paid us an extra stipend to offset the expenses while living there - for over a year!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Japan Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Japan Actualized',
      'Sponsored to live in a luxurious apartment in Osaka, Japan for over a year after putting it on our vision board.',
      v_base || 'japan-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'japan-friends.jpg',
      E'Our work at the time was expanding into Japan, and we really wanted to go spearhead the market. We had no money, but we had a dream so we did the most powerful thing we knew to do - added Japan to our vision document and vision board!\n\nOne day, we get a call from the owners of the company saying they are picking three couples from the company to sponsor in Japan and we are one of them - they paid for us to live in a luxurious business apartment in Osaka and paid us an extra stipend to offset the expenses while living there - for over a year!'
    );
  END IF;

  -- 7. Australia Actualized (for a whole month!)
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Australia Actualized (for a whole month!)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Australia Actualized (for a whole month!)',
      'Drove the entire East coast of Australia from Sydney to Mackay in a month - flights paid for with credit card points.',
      v_base || 'australia-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'australia-actualized.jpg',
      E'We had always dreamed of visiting Australia and had it in our vision document and vision board. We were pregnant with our first child, and were free to work from wherever there was internet, so for Christmas, instead of getting gifts for each other, we decided to go on an adventure/babymoon.\n\nWe applied for an American Airlines credit card and received enough points to buy our tickets to Australia for free. We had a friend from college who married an Aussie and they were thrilled to host us at their home close to Sydney. We rented a car and drove all the way up the East coast from Sydney to Mackay in a month. We had the most magical time!!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Australia Actualized (for a whole month!)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Australia Actualized (for a whole month!)',
      'Drove the entire East coast of Australia from Sydney to Mackay in a month - flights paid for with credit card points.',
      v_base || 'australia-vision.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'australia-actualized.jpg',
      E'We had always dreamed of visiting Australia and had it in our vision document and vision board. We were pregnant with our first child, and were free to work from wherever there was internet, so for Christmas, instead of getting gifts for each other, we decided to go on an adventure/babymoon.\n\nWe applied for an American Airlines credit card and received enough points to buy our tickets to Australia for free. We had a friend from college who married an Aussie and they were thrilled to host us at their home close to Sydney. We rented a car and drove all the way up the East coast from Sydney to Mackay in a month. We had the most magical time!!'
    );
  END IF;

  -- 8. Fit Couple Actualized
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Fit Couple Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Fit Couple Actualized',
      'Lost 30 pounds before a cruise by committing to fitness and healthy eating.',
      v_base || 'fit-couple-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'fit-3-actualized.jpg',
      E'I (Jordan) gained 30 pounds after we had our second child. I was in denial for a while about the extra weight I was holding, but finally got into harmony with wanting a better body. Vanessa and I booked a cruise and I honed in on getting fit before we set sail. We did P90X, went to the gym, and ate healthy. When it was time to board the cruise ship, I had lost the 30 pounds!!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Fit Couple Actualized'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Fit Couple Actualized',
      'Lost 30 pounds before a cruise by committing to fitness and healthy eating.',
      v_base || 'fit-couple-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'fit-3-actualized.jpg',
      E'I (Jordan) gained 30 pounds after we had our second child. I was in denial for a while about the extra weight I was holding, but finally got into harmony with wanting a better body. Vanessa and I booked a cruise and I honed in on getting fit before we set sail. We did P90X, went to the gym, and ate healthy. When it was time to board the cruise ship, I had lost the 30 pounds!!'
    );
  END IF;

  -- 9. Gifted Family a Mountain Chalet Vacation (in Aspen, CO)
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Gifted Family a Mountain Chalet Vacation (in Aspen, CO)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Gifted Family a Mountain Chalet Vacation (in Aspen, CO)',
      'Rented a chalet on 40 acres near Aspen to celebrate family milestones together.',
      v_base || 'mountain-lodge-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'mountain-lodge-actualized.jpg',
      E'More vision board items have been marked off the list:\n\nRent a chalet in the mountains\n\nTreat our family\n\nWe celebrated my father in law''s 75th birthday and my step-mom''s retirement together in a chalet on 40 acres near Aspen, Colorado. It was so dreamy! We spent most of the time playing Scrabble indoors, taking in the views from the hot tub (mountains by day, stars by night - even some shooting stars!), watching the deer graze around the property, going to the hot springs, going skiing, eating amazing home-cooked food, playing in the snow, and sledding on one of the hills on the property.\n\nI may have worn my pajamas more than regular clothes and no makeup for the week we were there. It was a wonderful celebration for the family and reset for everyone.\n\nMy favorite part of the mountains and snow is the peace and silence. It''s so quiet and serene up there that time seems to slow down and appreciation speeds up. The mountains will always hold a special place in our hearts, as will this trip.'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Gifted Family a Mountain Chalet Vacation (in Aspen, CO)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Gifted Family a Mountain Chalet Vacation (in Aspen, CO)',
      'Rented a chalet on 40 acres near Aspen to celebrate family milestones together.',
      v_base || 'mountain-lodge-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'mountain-lodge-actualized.jpg',
      E'More vision board items have been marked off the list:\n\nRent a chalet in the mountains\n\nTreat our family\n\nWe celebrated my father in law''s 75th birthday and my step-mom''s retirement together in a chalet on 40 acres near Aspen, Colorado. It was so dreamy! We spent most of the time playing Scrabble indoors, taking in the views from the hot tub (mountains by day, stars by night - even some shooting stars!), watching the deer graze around the property, going to the hot springs, going skiing, eating amazing home-cooked food, playing in the snow, and sledding on one of the hills on the property.\n\nI may have worn my pajamas more than regular clothes and no makeup for the week we were there. It was a wonderful celebration for the family and reset for everyone.\n\nMy favorite part of the mountains and snow is the peace and silence. It''s so quiet and serene up there that time seems to slow down and appreciation speeds up. The mountains will always hold a special place in our hearts, as will this trip.'
    );
  END IF;

  -- 10. Breville Coffee Maker Actualized (as a gift!)
  IF v_vanessa_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_vanessa_id AND name = 'Breville Coffee Maker Actualized (as a gift!)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_vanessa_id,
      'Breville Coffee Maker Actualized (as a gift!)',
      'Received a nearly $2,000 Breville coffee machine as a baby shower gift - even better than the one on our vision board.',
      v_base || 'breville-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'breville-actualized.jpg',
      E'We had this expensive coffee machine on our vision board and in our vision document. In our document we wrote about how amazing it feels to wake up and enjoy a luxurious cup of coffee in the comfort of our own home, and that it tastes even better than Starbucks! The thing was that it never felt like the right time to drop over $400 on a coffee machine.\n\nThen our baby shower came. There was one gift that was very large. We opened it and inside was a much more expensive model of the coffee machine we had put on our vision board! The one our friends gave us was nearly $2,000 and came with all the fancy features!! And we had never even told anyone about wanting this coffee machine. Talk about the Universe delivering something even better!!'
    );
  END IF;

  IF v_jordan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vision_board_items WHERE user_id = v_jordan_id AND name = 'Breville Coffee Maker Actualized (as a gift!)'
  ) THEN
    INSERT INTO public.vision_board_items (user_id, name, description, image_url, status, categories, actualized_at, actualized_image_url, actualization_story)
    VALUES (
      v_jordan_id,
      'Breville Coffee Maker Actualized (as a gift!)',
      'Received a nearly $2,000 Breville coffee machine as a baby shower gift - even better than the one on our vision board.',
      v_base || 'breville-active.jpg',
      'actualized',
      '{}',
      now(),
      v_base || 'breville-actualized.jpg',
      E'We had this expensive coffee machine on our vision board and in our vision document. In our document we wrote about how amazing it feels to wake up and enjoy a luxurious cup of coffee in the comfort of our own home, and that it tastes even better than Starbucks! The thing was that it never felt like the right time to drop over $400 on a coffee machine.\n\nThen our baby shower came. There was one gift that was very large. We opened it and inside was a much more expensive model of the coffee machine we had put on our vision board! The one our friends gave us was nearly $2,000 and came with all the fancy features!! And we had never even told anyone about wanting this coffee machine. Talk about the Universe delivering something even better!!'
    );
  END IF;

END $$;
