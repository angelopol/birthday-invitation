-- Add columns to persist global background settings
ALTER TABLE `BirthdayPeople`
  ADD COLUMN `globalBackgroundMode` VARCHAR(20) NULL,
  ADD COLUMN `globalBackgroundImageUrl` VARCHAR(512) NULL;
