-- CreateTable
CREATE TABLE `BirthdayPeople` (
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `partyDate` DATETIME(3) NOT NULL,
    `ubication` VARCHAR(191) NOT NULL,
    `dressCode` VARCHAR(191) NOT NULL,
    `extraInfo` VARCHAR(191) NULL,

    PRIMARY KEY (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guest` (
    `token` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `confirmated` BOOLEAN NOT NULL DEFAULT false,
    `birthdayUsername` VARCHAR(191) NOT NULL,

    INDEX `Guest_birthdayUsername_idx`(`birthdayUsername`),
    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Guest` ADD CONSTRAINT `Guest_birthdayUsername_fkey` FOREIGN KEY (`birthdayUsername`) REFERENCES `BirthdayPeople`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
