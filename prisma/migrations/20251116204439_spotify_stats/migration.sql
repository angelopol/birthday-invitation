-- AlterTable
ALTER TABLE `guest` ADD COLUMN `avatarUrl` VARCHAR(512) NULL,
    ADD COLUMN `nickname` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `partytrack` ADD COLUMN `comment` VARCHAR(280) NULL;

-- CreateTable
CREATE TABLE `PartyTrackVote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trackId` INTEGER NOT NULL,
    `guestToken` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartyTrackVote_guestToken_idx`(`guestToken`),
    UNIQUE INDEX `PartyTrackVote_trackId_guestToken_key`(`trackId`, `guestToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PartysGallery` ADD CONSTRAINT `PartysGallery_guestToken_fkey` FOREIGN KEY (`guestToken`) REFERENCES `Guest`(`token`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartyTrack` ADD CONSTRAINT `PartyTrack_guestToken_fkey` FOREIGN KEY (`guestToken`) REFERENCES `Guest`(`token`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartyTrackVote` ADD CONSTRAINT `PartyTrackVote_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `PartyTrack`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartyTrackVote` ADD CONSTRAINT `PartyTrackVote_guestToken_fkey` FOREIGN KEY (`guestToken`) REFERENCES `Guest`(`token`) ON DELETE RESTRICT ON UPDATE CASCADE;
