-- CreateTable
CREATE TABLE `PartysGallery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(255) NOT NULL,
    `fileType` VARCHAR(50) NOT NULL,
    `s3Key` VARCHAR(512) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `birthdayUsername` VARCHAR(191) NOT NULL,
    `guestToken` VARCHAR(191) NOT NULL,

    INDEX `PartysGallery_birthdayUsername_idx`(`birthdayUsername`),
    INDEX `PartysGallery_guestToken_idx`(`guestToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PartysGallery` ADD CONSTRAINT `PartysGallery_birthdayUsername_fkey` FOREIGN KEY (`birthdayUsername`) REFERENCES `BirthdayPeople`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
