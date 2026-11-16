-- One mentor had two accounts: the seeded one and the one he actually signs in with.
-- Move missions, inbox, comments and sessions to the signed-in account, so he sees every submission in one place.
-- Sign-ins with the other address are mapped by HRR_EMAIL_ALIASES (hrr-auth.js); the old row stays, but can no longer match a sign-in.
UPDATE hrr_missions SET mentor_user_id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea'
  WHERE mentor_user_id='hrr_user_bootstrap_emanuel' AND EXISTS (SELECT 1 FROM hrr_users WHERE id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea');
UPDATE hrr_notifications SET user_id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea'
  WHERE user_id='hrr_user_bootstrap_emanuel' AND EXISTS (SELECT 1 FROM hrr_users WHERE id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea');
UPDATE hrr_submission_comments SET user_id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea'
  WHERE user_id='hrr_user_bootstrap_emanuel' AND EXISTS (SELECT 1 FROM hrr_users WHERE id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea');
UPDATE hrr_sessions SET user_id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea'
  WHERE user_id='hrr_user_bootstrap_emanuel' AND EXISTS (SELECT 1 FROM hrr_users WHERE id='hrr_user_9fec7047-2bf3-4d5f-8968-dac7ca2abeea');
UPDATE hrr_users SET cognito_sub='merged_' || id WHERE id='hrr_user_bootstrap_emanuel';
