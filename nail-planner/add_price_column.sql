-- Add 'price' column to appointments table if it doesn't exist
alter table appointments 
add column if not exists price numeric default 0;
