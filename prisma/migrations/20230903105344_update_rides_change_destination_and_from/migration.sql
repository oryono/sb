/*
  Warnings:

  - You are about to drop the column `latitute` on the `rides` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `rides` table. All the data in the column will be lost.
  - Added the required column `from` to the `rides` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `rides` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `rides` DROP COLUMN `latitute`,
    DROP COLUMN `longitude`,
    ADD COLUMN `from` VARCHAR(191) NOT NULL,
    ADD COLUMN `to` VARCHAR(191) NOT NULL;
