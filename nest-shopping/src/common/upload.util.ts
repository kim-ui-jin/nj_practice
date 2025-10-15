import { extname } from "path";

export function filenameFactory(req, file, cb) {
    const allowedExts = ['.png', '.jpg', '.jpeg', '.gif'];
    const ext = extname(file.originalname).toLowerCase();

    if (!allowedExts.includes(ext)) {
        return cb(new Error('허용되지 않은 파일 확장자입니다.'));
    }

    // 타임스탬프-난수,확장자
    const filename = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;

    return cb(null, filename);
}

export function imageFileFilter(req, file, cb) {
    const allowedExts = ['.png', '.jpg', '.jpeg', '.gif'];
    const allowedMimes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];

    const ext = extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (!allowedExts.includes(ext) || !allowedMimes.includes(mime)) {
        return cb(new Error('이미지 파일(.png, .jpg, .jpeg, .gif)만 업로드 가능합니다.'));
    }

    return cb(null, true);
}