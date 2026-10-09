UPDATE hrr_mentor_allowlist SET active=0
WHERE email NOT IN (
  'tsvetelin@pleggi.com','cnikolov95@gmail.com',
  'krasen2000.k.stanev@gmail.com','krasen.k.stanev@gmail.com',
  'yoanna.p.mihova@gmail.com','iliyana.georgieva.ig@gmail.com',
  'v.dimitrova.hr@gmail.com','info@emanueltonev.com','darinnaahr@gmail.com',
  'desi.d.kehayova@gmail.com','ivelina.v.valchanova@gmail.com','hristo@pleggi.com',
  'kitipovroman@gmail.com','artusoestel2909@gmail.com','kamelia.ignatova@gmail.com',
  'branislav.p.panov@gmail.com'
);

INSERT INTO hrr_mentor_allowlist (email, role, active, created_at) VALUES
  ('tsvetelin@pleggi.com', 'admin', 1, datetime('now')),
  ('cnikolov95@gmail.com', 'admin', 1, datetime('now')),
  ('krasen2000.k.stanev@gmail.com', 'admin', 1, datetime('now')),
  ('krasen.k.stanev@gmail.com', 'admin', 1, datetime('now')),
  ('yoanna.p.mihova@gmail.com', 'mentor', 1, datetime('now')),
  ('iliyana.georgieva.ig@gmail.com', 'mentor', 1, datetime('now')),
  ('v.dimitrova.hr@gmail.com', 'mentor', 1, datetime('now')),
  ('info@emanueltonev.com', 'mentor', 1, datetime('now')),
  ('darinnaahr@gmail.com', 'mentor', 1, datetime('now')),
  ('desi.d.kehayova@gmail.com', 'mentor', 1, datetime('now')),
  ('ivelina.v.valchanova@gmail.com', 'mentor', 1, datetime('now')),
  ('hristo@pleggi.com', 'mentor', 1, datetime('now')),
  ('kitipovroman@gmail.com', 'mentor', 1, datetime('now')),
  ('artusoestel2909@gmail.com', 'mentor', 1, datetime('now')),
  ('kamelia.ignatova@gmail.com', 'mentor', 1, datetime('now')),
  ('branislav.p.panov@gmail.com', 'mentor', 1, datetime('now'))
ON CONFLICT(email) DO UPDATE SET role=excluded.role, active=1;
