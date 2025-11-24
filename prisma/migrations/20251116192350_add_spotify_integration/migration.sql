-- AlterTable
ALTER TABLE `BirthdayPeople` ADD COLUMN `spotifyAccessToken` TEXT NULL,
    ADD COLUMN `spotifyPlaylistId` VARCHAR(191) NULL,
    ADD COLUMN `spotifyRefreshToken` TEXT NULL,
    ADD COLUMN `spotifyTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `spotifyUserId` VARCHAR(191) NULL;
