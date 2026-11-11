CREATE TABLE IF NOT EXISTS poll_votes (
  dataset TEXT NOT NULL CHECK (dataset IN ('live','test')),
  question_id TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  PRIMARY KEY(dataset, question_id, voter_hash)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS poll_counts (
  dataset TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  votes INTEGER NOT NULL CHECK (votes >= 0),
  PRIMARY KEY(dataset, question_id, answer_id)
) WITHOUT ROWID;
CREATE TRIGGER IF NOT EXISTS poll_insert AFTER INSERT ON poll_votes BEGIN
  INSERT INTO poll_counts VALUES(NEW.dataset, NEW.question_id, NEW.answer_id, 1)
  ON CONFLICT(dataset,question_id,answer_id) DO UPDATE SET votes=votes+1;
END;
CREATE TRIGGER IF NOT EXISTS poll_update AFTER UPDATE OF answer_id ON poll_votes
WHEN OLD.answer_id != NEW.answer_id BEGIN
  UPDATE poll_counts SET votes=votes-1 WHERE dataset=OLD.dataset AND question_id=OLD.question_id AND answer_id=OLD.answer_id;
  INSERT INTO poll_counts VALUES(NEW.dataset, NEW.question_id, NEW.answer_id, 1)
  ON CONFLICT(dataset,question_id,answer_id) DO UPDATE SET votes=votes+1;
END;
