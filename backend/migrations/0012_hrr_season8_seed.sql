-- HR:Rush Season 8 bootstrap data.
-- Join codes are intentionally only stored as SHA-256 hashes.

INSERT OR IGNORE INTO hrr_mentor_allowlist (email,role,active,created_at) VALUES
  ('krasen.k.stanev@gmail.com','admin',1,datetime('now')),
  ('tsvetelin@pleggi.com','admin',1,datetime('now')),
  ('info@emanueltonev.com','mentor',1,datetime('now')),
  ('todor.marinov1906@gmail.com','mentor',1,datetime('now')),
  ('yoanna.p.mihova@gmail.com','mentor',1,datetime('now')),
  ('kitipovrom@yahoo.com','mentor',1,datetime('now')),
  ('kamelia.ignatova@gmail.com','mentor',1,datetime('now')),
  ('branislav.p.panov@gmail.com','mentor',1,datetime('now')),
  ('iliyana.georgieva.ig@gmail.com','mentor',1,datetime('now')),
  ('v.dimitrova.hr@gmail.com','mentor',1,datetime('now')),
  ('darinnaahr@gmail.com','mentor',1,datetime('now'));

INSERT OR IGNORE INTO hrr_users (id,cognito_sub,email,display_name,role,created_at,updated_at) VALUES
  ('hrr_user_bootstrap_krasen','bootstrap:krasen.k.stanev@gmail.com','krasen.k.stanev@gmail.com','Красен Станев','admin',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_tsvetelin','bootstrap:tsvetelin@pleggi.com','tsvetelin@pleggi.com','Цветелин Николов','admin',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_emanuel','bootstrap:info@emanueltonev.com','info@emanueltonev.com','Емануел Тонев','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_todor','bootstrap:todor.marinov1906@gmail.com','todor.marinov1906@gmail.com','Тодор Маринов','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_yoanna','bootstrap:yoanna.p.mihova@gmail.com','yoanna.p.mihova@gmail.com','Йоанна Михова','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_roman','bootstrap:kitipovrom@yahoo.com','kitipovrom@yahoo.com','Роман Китипов','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_kamelia','bootstrap:kamelia.ignatova@gmail.com','kamelia.ignatova@gmail.com','Камелия А. Игнатова','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_branislav','bootstrap:branislav.p.panov@gmail.com','branislav.p.panov@gmail.com','Бранислав Панов','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_iliyana','bootstrap:iliyana.georgieva.ig@gmail.com','iliyana.georgieva.ig@gmail.com','Илияна Георгиева','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_viktoria','bootstrap:v.dimitrova.hr@gmail.com','v.dimitrova.hr@gmail.com','Виктория Димитрова','mentor',datetime('now'),datetime('now')),
  ('hrr_user_bootstrap_darina','bootstrap:darinnaahr@gmail.com','darinnaahr@gmail.com','Дарина Христова','mentor',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO hrr_teams (id,season_id,name,university,city,join_code_hash,created_at) VALUES
  ('hrr_team_01','hrr_season_8','Екип 1','Университет по застраховане и финанси (УЗФ)','София','37ef9ed0fbc3339a585afabf5851bd7a2fb20ac2c64a7de62d7e91679fcd35d7',datetime('now')),
  ('hrr_team_02','hrr_season_8','Екип 2','Нов български университет','София','a92faea452e9ddda869af29675c35cd20e9fd163ecd11f5f00bb1f4c4c4ba84c',datetime('now')),
  ('hrr_team_03','hrr_season_8','Екип 3','Софийски университет „Свети Климент Охридски“','София','33c7504a8f158cc24dbe82336051680bae155ce9fb9a9381fe47ccef5310ef16',datetime('now')),
  ('hrr_team_04','hrr_season_8','Екип 4','Нов български университет','София','4c07a6e923f94bf0549980ca4788d85d1276bf35b19798ad3d526ec6909d21db',datetime('now')),
  ('hrr_team_05','hrr_season_8','Екип 5','Нов български университет','София','8f82de09057706fabe3420b284c20f637c38e56fc88be25d3fe6a1b9954eedfc',datetime('now')),
  ('hrr_team_06','hrr_season_8','Екип 6','Нов български университет','София','65327edcdd0fb41ca82d7a98a10cfe1bc854e9d31def87e9f7678fcf062c4c50',datetime('now')),
  ('hrr_team_07','hrr_season_8','Екип 7','Университет по библиотекознание и информационни технологии (УниБИТ)','София','e9f2d565d7469085a56349aa7b39c01ff4973d2dacd30e8741201c5c29efffbb',datetime('now')),
  ('hrr_team_08','hrr_season_8','Екип 8','Нов български университет','София','c4fc4b620aaeb6688808a490bf14b20aa7bad012c4ca51ded941070f8366153c',datetime('now')),
  ('hrr_team_09','hrr_season_8','Екип 9','Нов български университет','София','dceb2881c34bb03076fa9212f74f9570a5c4c1864b96f6b9cfd298a469e66fba',datetime('now')),
  ('hrr_team_10','hrr_season_8','Екип 10','Нов български университет','София','7eb75b25e2bb2e7c745c515f662a8a242d0440cc2bd920c5007b9db32ac222a6',datetime('now')),
  ('hrr_team_11','hrr_season_8','Екип 11','Университетът за национално и световно стопанство (УНСС)','София','1c41b854263e0ae29b29d6a9d6f7ad22de2bc5c7deab94c710b42bb7c7f2cfb4',datetime('now')),
  ('hrr_team_12','hrr_season_8','Екип 12','Университетът за национално и световно стопанство (УНСС)','София','c6226ed0fec3863cc99277107b92bd48ad2b8437d1d399964ce09af53509ba56',datetime('now')),
  ('hrr_team_13','hrr_season_8','Екип 13','Нов български университет','София','09833093817d3f72e9ca3e4f24226f4948026982726462a25bdb0a75d5bc0be2',datetime('now')),
  ('hrr_team_14','hrr_season_8','Екип 14','Нов български университет','София','03030f30c8bdc399f02a379c1fca1b717d0cf64352163e78f35edfa9a547cd5f',datetime('now')),
  ('hrr_team_15','hrr_season_8','Екип 15','Университетът за национално и световно стопанство (УНСС)','София','e46c468e3f3bbef9c5863074663bb0720196eaee886a0bb44c517ac4664b4ea6',datetime('now')),
  ('hrr_team_16','hrr_season_8','Екип 16','Нов български университет','София','3119d5bc1f11e3e7578416c6ad58715369fc6edb1154e0f3128ed3ffb5f69dc6',datetime('now')),
  ('hrr_team_17','hrr_season_8','Екип 17','Нов български университет','София','3103681ebd87c9f2a9aa23e89ce312e092c541019686a479d94fd31b2d56a861',datetime('now'));

INSERT OR IGNORE INTO hrr_missions (id,season_id,mentor_user_id,title,description,category,points,deadline,scope,status,created_at) VALUES
  ('hrr_mission_01','hrr_season_8','hrr_user_bootstrap_krasen','Стартъп изложението в УниБИТ на 13.11 от 10:00ч.','Качи снимка с тагване и доказателство.','events',5,'само на датата','team','active',datetime('now')),
  ('hrr_mission_02','hrr_season_8','hrr_user_bootstrap_krasen','Pleggi профил','Профилът се качва в коментар на мисията.','profile',1,'3 дни','individual','active',datetime('now')),
  ('hrr_mission_03','hrr_season_8','hrr_user_bootstrap_krasen','LinkedIn профил','Профилът се качва в коментар на мисията.','profile',1,'3 дни','individual','active',datetime('now')),
  ('hrr_mission_04','hrr_season_8','hrr_user_bootstrap_krasen','Публикация HR:Rush for Practice','Публикувай във Facebook, LinkedIn и Instagram.','content',3,'10 дни','team','active',datetime('now')),
  ('hrr_mission_05','hrr_season_8','hrr_user_bootstrap_krasen','Влез в обувките/ Подготовка за среща','Изпрати профил на кандидат по имейл или лично съобщение.','training',5,'','individual','active',datetime('now')),
  ('hrr_mission_06','hrr_season_8','hrr_user_bootstrap_krasen','Таблица на всичко','Създай и изпрати таблицата.','content',20,'','team','active',datetime('now')),
  ('hrr_mission_07','hrr_season_8','hrr_user_bootstrap_krasen','Безплатен уебинар - Емануел Тонев','Присъствай на уебинара.','training',3,'само на датата','individual','active',datetime('now')),
  ('hrr_mission_08','hrr_season_8','hrr_user_bootstrap_krasen','Среща с екипите - конкуренти','Изпълни условията за среща с конкурентен екип.','events',4,'10 дни','team','active',datetime('now')),
  ('hrr_mission_09','hrr_season_8','hrr_user_bootstrap_krasen','Намери 5 кандидата по позицията в Pleggi','Намери пет подходящи кандидати за позицията.','high-impact',50,'5 дни','team','active',datetime('now')),
  ('hrr_mission_10','hrr_season_8','hrr_user_bootstrap_krasen','Меме','Създай меме за HR:Rush.','content',5,'3 дни','team','active',datetime('now')),
  ('hrr_mission_11','hrr_season_8','hrr_user_bootstrap_krasen','Направи видео, с което да кандидатсват хората за позицията ви.','Публикувай видео в социална мрежа и тагни HR:Rush for Practice.','content',5,'7 дни','team','active',datetime('now')),
  ('hrr_mission_12','hrr_season_8','hrr_user_bootstrap_krasen','Направи 12 асистенции / намерени кандидати за всяка друга комапния (освен твоята)','Намери кандидати за други компании.','high-impact',20,'5 дни','team','active',datetime('now')),
  ('hrr_mission_13','hrr_season_8','hrr_user_bootstrap_krasen','Посети една лекция/ упражнение в университета и продавай позиция','Качи снимка с тагване и доказателство.','events',5,'10 дни','individual','active',datetime('now')),
  ('hrr_mission_14','hrr_season_8','hrr_user_bootstrap_krasen','“Откривател на позиции”','Открий подходяща позиция.','fast',0,'','individual','active',datetime('now')),
  ('hrr_mission_15','hrr_season_8','hrr_user_bootstrap_krasen','Интервюта с ментори','Проведи интервюта с ментори и сподели наученото.','training',8,'','individual','active',datetime('now')),
  ('hrr_mission_16','hrr_season_8','hrr_user_bootstrap_krasen','Живо обучение за презентиращи','Участвай в живото обучение.','training',5,'','team','active',datetime('now'));
