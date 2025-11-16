-- CreateTable
CREATE TABLE `PartyTrack` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `birthdayUsername` VARCHAR(191) NOT NULL,
    `guestToken` VARCHAR(191) NULL,
    `spotifyTrackId` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `artist` VARCHAR(255) NOT NULL,
    `album` VARCHAR(255) NULL,
    `coverUrl` VARCHAR(512) NULL,
    `previewUrl` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PartyTrack_birthdayUsername_idx`(`birthdayUsername`),
    INDEX `PartyTrack_guestToken_idx`(`guestToken`),
    UNIQUE INDEX `PartyTrack_birthdayUsername_spotifyTrackId_key`(`birthdayUsername`, `spotifyTrackId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PartyTrack` ADD CONSTRAINT `PartyTrack_birthdayUsername_fkey` FOREIGN KEY (`birthdayUsername`) REFERENCES `BirthdayPeople`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
