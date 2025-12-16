import { BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { diskStorage, memoryStorage } from "multer";
import { extname } from "path";

// export const thumbnailMulterOptions = {
//     storage: diskStorage({
//         destination: 'uploads/products/thumbnails',
//         filename: (req, file, cb) => {
//             const ext = extname(file.originalname).toLowerCase();
//             cb(null, `${Date.now()}-${randomUUID()}${ext}`);
//         }
//     }),
//     fileFilter: (req, file, cb) => {
//         const ext = extname(file.originalname).toLowerCase();
//         const mime = file.mimetype.toLowerCase();
//         const allowed = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) &&
//             ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(mime);
//         return allowed ? cb(null, true) : cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
//     },
//     limits: { fileSize: 5 * 1024 * 1024, files: 1 },
// }

export const thumbnailMulterOptions = {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const mime = file.mimetype.toLowerCase();
        const allowed = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) &&
            ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(mime);
        return allowed ? cb(null, true) : cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}

// export const imagesMulterOptions = {
//     storage: diskStorage({
//         destination: 'uploads/products/images',
//         filename: (req, file, cb) => {
//             const ext = extname(file.originalname).toLowerCase();
//             cb(null, `${Date.now()}-${randomUUID()}${ext}`);
//         }
//     }),
//     fileFilter: (req, file, cb) => {
//         const ext = extname(file.originalname).toLowerCase();
//         const mime = file.mimetype.toLowerCase();
//         const allowed = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) &&
//             ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(mime);
//         return allowed ? cb(null, true) : cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
//     },
//     limits: { fileSize: 5 * 1024 * 1024, files: 10 },
// }

export const imagesMulterOptions = {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const mime = file.mimetype.toLowerCase();
        const allowed = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) &&
            ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(mime);
        return allowed ? cb(null, true) : cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
}