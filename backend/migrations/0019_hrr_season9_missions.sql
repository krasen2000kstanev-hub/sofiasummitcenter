-- HR:Rush Season 9: close every other season, open Season 9 and publish the spreadsheet missions.
-- The spreadsheet wins: any Season 9 mission already in the platform is archived (not deleted).
UPDATE hrr_seasons SET status='archived' WHERE id<>'hrr_season_9' AND status='active';
INSERT INTO hrr_seasons (id,slug,name,status,created_at) VALUES ('hrr_season_9','season-9','Сезон 9','active',datetime('now'))
  ON CONFLICT(id) DO UPDATE SET status='active',name='Сезон 9';
UPDATE hrr_missions SET status='archived' WHERE season_id='hrr_season_9' AND status<>'archived';

INSERT INTO hrr_missions (id,season_id,mentor_user_id,mission_number,title,description,category,points,deadline,start_date,end_date,scope,status,created_at) VALUES
  ('hrr_mission_s9_00','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='tsvetelin@pleggi.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),0,'Кариерно изложение „Среща между младите и бизнеса“','Всеки участник носи 5 т. на екипа, а всеки предварително заявен и регистриран гост носи още 3 т. Доказателство: снимка с Цецо и сверено присъствие.

Точки: 5 т./участник + 3 т./доведен гост

Линк: https://razviise.bg/business-seminars/#apply

Бележка: Събитието е от 13:00 до 17:00 ч. на 10.11.2026 г.','general',5,'2026-11-10','2026-11-06','2026-11-10','individual','active','2026-11-07T00:00:00.000Z'),
  ('hrr_mission_s9_01','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='tsvetelin@pleggi.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),1,'Създай своя Pleggi профил','Създай Pleggi профил и публикувай линк към него в коментар под мисията.

Точки: 1 т. на участник

Бележка: Индивидуална мисия.','general',1,'2026-11-10','2026-11-07','2026-11-10','individual','active','2026-11-07T00:00:01.000Z'),
  ('hrr_mission_s9_02','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='tsvetelin@pleggi.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),2,'Покажи своя LinkedIn профил','Публикувай линк към попълнен LinkedIn профил в коментар под мисията.

Точки: 1 т. на участник

Бележка: Индивидуална мисия.','general',1,'2026-11-11','2026-11-08','2026-11-11','individual','active','2026-11-07T00:00:02.000Z'),
  ('hrr_mission_s9_03','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='v.dimitrova.hr@gmail.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),3,'Влез в обувките на кандидата','Подготви и изпрати персонализирано съобщение до подходящ кандидат след консултация с ментора. Доказателство: текст/извадка без ненужни лични данни и кратко обяснение за избрания подход.

Точки: 5 т.

Бележка: Преди изпращане се консултирай с Вики.','general',5,'2026-11-17','2026-11-09','2026-11-17','team','active','2026-11-07T00:00:03.000Z'),
  ('hrr_mission_s9_04','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='krasen.k.stanev@gmail.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),4,'Визия на пост с снимка на участник за участие в HR: Rush for Practice','Изпращаш лична снимка на…. Красен. Публикувай за участието си във Facebook, LinkedIn и Instagram; представи трите линка или екранни снимки.

Точки: 3 т.

Бележка: Не използвай име/лого на компания без разрешение.','general',3,'2026-11-15','2026-11-09','2026-11-15','team','active','2026-11-07T00:00:04.000Z'),
  ('hrr_mission_s9_05','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='info@emanueltonev.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),5,'LinkedIn преобразяване с Lutrify','Направи Profile Audit в Lutrify, прегледай препоръките и подобри поне 3 релевантни секции. Представи резултат от одита, кратко описание на промените и линк към LinkedIn.

Точки: 2 т. на участник (макс. 4)

Линк: https://lutrify.com/

Бележка: Индивидуална мисия. Не се изисква платен одит.','general',2,'2026-11-14','2026-11-11','2026-11-14','individual','active','2026-11-07T00:00:05.000Z'),
  ('hrr_mission_s9_06','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='iliyana.georgieva.ig@gmail.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),6,'Запознай се с конкуренцията','Организирай среща с друг състезателен екип. Представи обща снимка и две неща, които си научил.

Точки: 2 т. на участник (макс. 4)

Бележка: Без споделяне на лични данни на кандидати.','general',2,'2026-11-27','2026-11-13','2026-11-27','individual','active','2026-11-07T00:00:06.000Z'),
  ('hrr_mission_s9_07','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='branislav.p.panov@gmail.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),7,'Спортът събира конкурентите','Организирай една спортна активност с други екипи. Публикувай LinkedIn пост с обща снимка и собствен текст без AI; тагни състезанието, Цецо, Бранко и участващите екипи.

Точки: 1 т./друг екип (макс. 5)

Бележка: Една активност за целия сезон.','general',1,'2027-01-05','2026-11-13','2027-01-05','team','active','2026-11-07T00:00:07.000Z'),
  ('hrr_mission_s9_09','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='tsvetelin@pleggi.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),9,'Първите ти 5 кандидати в Pleggi','Открий 5 реално заинтересовани и подходящи кандидати за възложената позиция.. Отчитай ги в таблицата.

Точки: 3 бонус т./кандидат (макс. 15)

Бележка: Бонус точките са отделно от основните точки за кандидатите.','general',3,'2026-11-23','2026-11-16','2026-11-23','team','active','2026-11-07T00:00:09.000Z'),
  ('hrr_mission_s9_10','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='yoanna.p.mihova@gmail.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),10,'Ловци на таланти','Намери 3 подходящи LinkedIn профила за позиция от състезанието. В таблицата запиши № на мисията и линковете; потвърди интереса към възможността.

Точки: 6 т. при 3 профила; под 3 = 0 т.

Линк: https://docs.google.com/document/d/1eG0LJvoX_gTEPfh4HuR_oXzYtwMWo36zj3zMwp8h_T8/edit?usp=sharing

Бележка: Предложение от Йоанна; срок до 29.11, 23:59 ч.','general',6,'2026-11-29','2026-11-18','2026-11-29','team','active','2026-11-07T00:00:10.000Z'),
  ('hrr_mission_s9_11','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='krasen.k.stanev@gmail.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),11,'Създай видеообява','Създай кратко видео за възложената позиция и го публикувай в социална мрежа по избор с таг на HR: Rush for Practice. Представи линк.

Точки: 5 т.

Бележка: Консултация с Красен; използвай име и лого на работодателя само след разрешение.','general',5,'2026-12-07','2026-11-20','2026-12-07','team','active','2026-11-07T00:00:11.000Z'),
  ('hrr_mission_s9_12','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='tsvetelin@pleggi.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),12,'12 кандидати за други компании','Намери кандидати, от който и да е канал за други позиции, а не твоята.

Точки: 4 = 5 т.; 8 = 10 т.; 12 = 20 т.

Бележка: Междинни прагове; не се сумират (20 т. максимум).','general',5,'2027-01-05','2026-12-01','2027-01-05','team','active','2026-11-07T00:00:12.000Z'),
  ('hrr_mission_s9_13','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='krasen.k.stanev@gmail.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),13,'HR меме предизвикателство','Публикувай едно оригинално HR меме за подбора или състезанието.

Точки: 5 т. само за победителя

Бележка: Една творба на екип.','general',5,'2026-12-07','2026-12-03','2026-12-07','team','active','2026-11-07T00:00:13.000Z'),
  ('hrr_mission_s9_14','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='info@emanueltonev.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),14,'Уебинар с Емануел Тонев','Посети безплатния уебинар; Емо потвърждава присъствието.

Точки: 3 т. на участник

Бележка: Датата на уебинара трябва да бъде потвърдена.','general',3,'','','','individual','active','2026-11-07T00:00:14.000Z'),
  ('hrr_mission_s9_15','hrr_season_9',COALESCE((SELECT id FROM hrr_users WHERE email='tsvetelin@pleggi.com'),(SELECT id FROM hrr_users WHERE role='admin' ORDER BY created_at LIMIT 1)),15,'Финален HR отчет','Подготви отчет до 1 страница: най-резултатните 3 канала, резултати, трудности, научени уроци и какво би променил.

Точки: 8 т.

Бележка: Допълнителна нова мисия за одобрение.','general',8,'2027-01-05','2026-12-31','2027-01-05','team','active','2026-11-07T00:00:15.000Z');
