-- AlterTable
ALTER TABLE `invitationscreen` ADD COLUMN `fragments` JSON NULL,
    ADD COLUMN `layoutType` VARCHAR(20) NOT NULL DEFAULT 'single',
    MODIFY `content` JSON NULL;
