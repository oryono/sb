-- DropForeignKey
ALTER TABLE `rides` DROP FOREIGN KEY `rides_driver_id_fkey`;

-- DropForeignKey
ALTER TABLE `rides` DROP FOREIGN KEY `rides_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `rides` ADD CONSTRAINT `rides_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rides` ADD CONSTRAINT `rides_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
