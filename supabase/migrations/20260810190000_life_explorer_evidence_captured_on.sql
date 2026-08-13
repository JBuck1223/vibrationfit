-- When the learning actually happened — editable, since parents often upload
-- evidence on a different day than the activity.
alter table le_learning_evidence add column if not exists captured_on date default current_date;
update le_learning_evidence set captured_on = created_at::date where captured_on is null;

comment on column le_learning_evidence.captured_on is
  'Date the activity/evidence actually happened (parent-editable). created_at remains the upload timestamp.';
