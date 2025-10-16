import { BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { diskStorage } from "multer";
import { extname } from "path";

export const thumbnailMulterOptions = {
    storage: diskStorage({
        destination: 'uploads/products/thumbnails',
        filename: (req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase();
            cb(null, `${Date.now()}-${randomUUID()}${ext}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const mime = file.mimetype.toLowerCase();
        const allowed = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) &&
            ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(mime);
        return allowed ? cb(null, true) : cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}

export const imagesMulterOptions = {
    storage: diskStorage({
        destination: 'uploads/products/images',
        filename: (req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase();
            cb(null, `${Date.now()}-${randomUUID()}${ext}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const mime = file.mimetype.toLowerCase();
        const allowed = ['.png', '.jpg', '.jpeg', '.gif'].includes(ext) &&
            ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(mime);
        return allowed ? cb(null, true) : cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
}


// export function filenameFactory(req, file, cb) {
//     const allowedExts = ['.png', '.jpg', '.jpeg', '.gif'];
//     const ext = extname(file.originalname).toLowerCase();

//     if (!allowedExts.includes(ext)) {
//         return cb(new Error('허용되지 않은 파일 확장자입니다.'));
//     }

//     // 타임스탬프-난수,확장자
//     const filename = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;

//     return cb(null, filename);
// }

// export function imageFileFilter(req, file, cb) {
//     const allowedExts = ['.png', '.jpg', '.jpeg', '.gif'];
//     const allowedMimes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];

//     const ext = extname(file.originalname).toLowerCase();
//     const mime = file.mimetype.toLowerCase();

//     if (!allowedExts.includes(ext) || !allowedMimes.includes(mime)) {
//         return cb(new Error('이미지 파일(.png, .jpg, .jpeg, .gif)만 업로드 가능합니다.'));
//     }

//     return cb(null, true);
// }