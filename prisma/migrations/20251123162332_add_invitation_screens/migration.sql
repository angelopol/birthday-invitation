-- CreateTable
CREATE TABLE `InvitationScreen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `birthdayUsername` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `backgroundType` VARCHAR(20) NOT NULL,
    `backgroundImageUrl` VARCHAR(512) NULL,
    `backgroundColor` VARCHAR(20) NULL,
    `content` JSON NOT NULL,

    INDEX `InvitationScreen_birthdayUsername_idx`(`birthdayUsername`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InvitationScreen` ADD CONSTRAINT `InvitationScreen_birthdayUsername_fkey` FOREIGN KEY (`birthdayUsername`) REFERENCES `BirthdayPeople`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
